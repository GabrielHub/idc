#!/usr/bin/env python3
"""Pull an iMessage conversation history into a TSV corpus for voice tuning.

When an IDC member fixture is modeled on a real person (e.g. Derek Halsey's
voice references Derek Lindquist), the voice-tuning pass benefits from
reading how that person actually writes: cadence, length distribution, tic
vocabulary, vowel elongation, laugh-tag placement, slang, question shapes.
This script reads the local Messages chat.db, finds a contact by display
name or handle, decodes both plain `text` and the binary `attributedBody`
(NSArchiver typedstream) where Apple stuffed the body, and writes a
chronological TSV.

WORKFLOW (voice tuning)
    1. Run this script for the contact whose voice you want to mine. By
       default it writes BOTH sides of the conversation. You want both:
       the target person's lines often only make sense as RIFFS on the
       partner's setup (e.g. real Derek's "Bro cmon / Everyone who leaves
       grows elsewhere" is a reply to a sports take from the other side).
       The riff is the line.
    2. Open `thread.tsv` and read full conversational windows, not just
       isolated lines. Look for:
         - Length distribution (median message length, short vs long mix).
         - Multi-bubble cascade triggers (what makes them cluster vs send
           one line).
         - Laugh-tag and vowel-elongation placement.
         - Tic vocabulary and where it fires (warm vs friction vs serious).
         - Question shapes ("X tho?", "Y no?", "Z right?").
         - How they redirect, cool down, or refuse.
    3. Use the findings to inform PROSE, VOICE, and HUMOR in the fixture's
       `voice` block (register, tics, sample banks). Bio, personality,
       dating profile, dealbreakers, secrets, tags belong to the
       character, not the source person. Only let the source's
       PERSONALITY influence the fixture if the user explicitly says so;
       by default, treat the corpus as a SPEECH-PATTERN source, not a
       biography source.
    4. `--summary` produces aggregate stats (length distribution, tic
       counts, elongation hits) without printing message text, useful for
       the audit decisions log without leaking quotes.

USAGE
    Run from the repo root.

    By contact name (looks up local AddressBook for matching first/last/nickname):
        python scripts/voice-tuning/imessage-corpus.py --name "Derek"

    By exact handle (skip the AddressBook lookup):
        python scripts/voice-tuning/imessage-corpus.py --handle "+19496168878"

    Date filter and summary:
        python scripts/voice-tuning/imessage-corpus.py --name "Derek" \\
            --since 2025-01-01 --summary

REQUIREMENTS
    macOS only.

    The terminal running this script must have Full Disk Access. Grant it
    under System Settings -> Privacy & Security -> Full Disk Access; add
    your terminal app (Terminal.app, iTerm, Warp, Ghostty, etc.), quit
    that terminal, and relaunch. Without FDA, sqlite will refuse to open
    chat.db even though its filesystem permissions look readable.

PRIVACY
    Output files contain personal message text from both speakers. The
    default output directory `.claude-tmp/imessage-corpus/<slug>/` is
    gitignored by the repo `.gitignore`. If you override with
    `--output-dir`, you are responsible for keeping the destination out
    of version control. Do not commit `thread.tsv` or `target-only.tsv`.
    The `summary.txt` produced by `--summary` is also personal-adjacent
    (aggregate vocabulary counts) and lives in the same gitignored tree.

    The script never prints message bodies to stdout; only the file
    paths it wrote, the matched handles, and (with --summary) aggregate
    vocabulary counts.

DOES NOT
    Read attachments, voice memos, or images. Skips reactions/tapbacks,
    typing indicators, scheduled messages, and pure-attachment messages
    (text == object replacement char). Does not query iCloud or any
    server; this is a local-only read.
"""

from __future__ import annotations

import argparse
import datetime
import os
import re
import sqlite3
import sys
from collections import Counter
from glob import glob
from pathlib import Path
from typing import Iterable, Optional

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_ROOT = REPO_ROOT / ".claude-tmp" / "imessage-corpus"
CHAT_DB = Path("~/Library/Messages/chat.db").expanduser()
ADDRESSBOOK_GLOBS = [
    "~/Library/Application Support/AddressBook/AddressBook-v22.abcddb",
    "~/Library/Application Support/AddressBook/Sources/*/AddressBook-v22.abcddb",
]

APPLE_EPOCH = datetime.datetime(2001, 1, 1, tzinfo=datetime.timezone.utc)
NSSTRING_TAG = b"\x01\x94\x84\x01+"
OBJECT_REPLACEMENT = "￼"


def cocoa_ns_to_local(ts_ns: int) -> str:
    seconds = ts_ns / 1_000_000_000
    dt = APPLE_EPOCH + datetime.timedelta(seconds=seconds)
    return dt.astimezone().strftime("%Y-%m-%d %H:%M:%S")


def parse_typedstream_length(blob: bytes, idx: int) -> tuple[int, int]:
    first = blob[idx]
    if first == 0x81:
        return int.from_bytes(blob[idx + 1 : idx + 3], "little"), idx + 3
    if first == 0x82:
        return int.from_bytes(blob[idx + 1 : idx + 5], "little"), idx + 5
    return first, idx + 1


def extract_attributed_body_text(blob: Optional[bytes]) -> Optional[str]:
    """Best-effort decode of Messages.attributedBody.

    The blob is an NSArchiver typedstream wrapping NSMutableAttributedString.
    The underlying NSString text appears after the NSString class marker.
    We search for the marker, read the length prefix, and slice the UTF-8
    payload. Returns None if the marker is not found.
    """
    if not blob:
        return None
    pos = blob.find(NSSTRING_TAG)
    if pos < 0:
        return None
    pos += len(NSSTRING_TAG)
    if pos >= len(blob):
        return None
    length, body_start = parse_typedstream_length(blob, pos)
    body = blob[body_start : body_start + length]
    return body.decode("utf-8", errors="replace")


def resolve_addressbook_paths() -> list[Path]:
    paths: list[Path] = []
    for pattern in ADDRESSBOOK_GLOBS:
        for match in glob(os.path.expanduser(pattern)):
            paths.append(Path(match))
    return paths


def find_handles_by_name(name_query: str) -> list[tuple[str, str]]:
    """Search local AddressBook databases for matching contacts.

    Returns a list of (display_name, handle_value) tuples. Handles include
    both phone numbers and email addresses found on the matched contact(s).
    """
    matches: list[tuple[str, str]] = []
    needle = f"%{name_query.lower()}%"
    for db_path in resolve_addressbook_paths():
        try:
            conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        except sqlite3.OperationalError:
            continue
        try:
            cur = conn.cursor()
            cur.execute(
                """
                SELECT Z_PK, COALESCE(ZFIRSTNAME, ''), COALESCE(ZLASTNAME, ''),
                       COALESCE(ZNICKNAME, '')
                FROM ZABCDRECORD
                WHERE LOWER(COALESCE(ZFIRSTNAME, '')) LIKE ?
                   OR LOWER(COALESCE(ZLASTNAME, '')) LIKE ?
                   OR LOWER(COALESCE(ZNICKNAME, '')) LIKE ?
                """,
                (needle, needle, needle),
            )
            for record_pk, first, last, nick in cur.fetchall():
                display = (f"{first} {last}").strip() or nick or "(unnamed)"
                cur2 = conn.cursor()
                cur2.execute(
                    "SELECT ZFULLNUMBER FROM ZABCDPHONENUMBER WHERE ZOWNER=?",
                    (record_pk,),
                )
                for (phone,) in cur2.fetchall():
                    if phone:
                        matches.append((display, phone))
                cur2.execute(
                    "SELECT ZADDRESSNORMALIZED FROM ZABCDEMAILADDRESS WHERE ZOWNER=?",
                    (record_pk,),
                )
                for (email,) in cur2.fetchall():
                    if email:
                        matches.append((display, email))
        finally:
            conn.close()
    return matches


def find_chat_db_handles(handle_value: str) -> list[tuple[int, str, str]]:
    """Find all handle rows in chat.db matching a phone or email value.

    The same person typically has two rows (iMessage + SMS), maybe more for
    secondary email/phone aliases. Returns (rowid, id, service) tuples.
    """
    normalized = handle_value.strip()
    digits_only = re.sub(r"\D", "", normalized)
    conn = sqlite3.connect(f"file:{CHAT_DB}?mode=ro", uri=True)
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT ROWID, id, service
            FROM handle
            WHERE id = ?
               OR id LIKE ?
               OR uncanonicalized_id LIKE ?
            """,
            (normalized, f"%{digits_only}" if digits_only else normalized, f"%{normalized}"),
        )
        return [(rowid, hid, service) for rowid, hid, service in cur.fetchall()]
    finally:
        conn.close()


def query_messages(
    handle_rowids: Iterable[int],
    since: Optional[datetime.datetime],
    until: Optional[datetime.datetime],
) -> list[tuple[int, int, Optional[str], Optional[bytes]]]:
    placeholders = ",".join("?" for _ in handle_rowids)
    params: list[object] = list(handle_rowids)
    clauses = [
        f"handle_id IN ({placeholders})",
        "associated_message_guid IS NULL",
        "item_type = 0",
    ]
    if since is not None:
        clauses.append("date >= ?")
        params.append(int((since - APPLE_EPOCH).total_seconds() * 1_000_000_000))
    if until is not None:
        clauses.append("date < ?")
        params.append(int((until - APPLE_EPOCH).total_seconds() * 1_000_000_000))
    sql = f"""
        SELECT date, is_from_me, text, attributedBody
        FROM message
        WHERE {" AND ".join(clauses)}
        ORDER BY date ASC
    """
    conn = sqlite3.connect(f"file:{CHAT_DB}?mode=ro", uri=True)
    try:
        cur = conn.cursor()
        cur.execute(sql, params)
        return cur.fetchall()
    finally:
        conn.close()


def parse_date_arg(value: str) -> datetime.datetime:
    parsed = datetime.datetime.strptime(value, "%Y-%m-%d")
    return parsed.replace(tzinfo=datetime.timezone.utc)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower()).strip("-")
    return slug or "corpus"


def coerce_handle_selection(
    name: Optional[str], handle: Optional[str]
) -> tuple[str, list[tuple[int, str, str]]]:
    """Resolve --name or --handle to chat.db handle rowids.

    Returns (display_label, chat_db_handle_rows). Raises if ambiguous or
    no match.
    """
    if not name and not handle:
        raise SystemExit("error: pass --name or --handle (see --help)")

    if handle:
        rows = find_chat_db_handles(handle)
        if not rows:
            raise SystemExit(f"error: no chat.db handle matched {handle!r}")
        return handle, rows

    matches = find_handles_by_name(name or "")
    if not matches:
        raise SystemExit(
            f"error: no AddressBook contact matched {name!r}; try --handle directly"
        )
    seen: set[str] = set()
    unique_handles = []
    for display, value in matches:
        if value not in seen:
            seen.add(value)
            unique_handles.append((display, value))

    if len(unique_handles) > 1:
        listing = "\n  ".join(f"{display}: {value}" for display, value in unique_handles)
        raise SystemExit(
            f"error: ambiguous name {name!r}; multiple contact handles found:\n  {listing}\n"
            "rerun with --handle <value> to pick one"
        )

    display, value = unique_handles[0]
    rows = find_chat_db_handles(value)
    if not rows:
        raise SystemExit(
            f"error: contact {display!r} resolved to {value!r}, "
            "but no chat.db handles exist for that value"
        )
    return f"{display} <{value}>", rows


def write_tsv(path: Path, rows: Iterable[tuple[str, str, str]]) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    count = 0
    with path.open("w", encoding="utf-8") as fh:
        for ts, speaker, text in rows:
            normalized = re.sub(r"[\r\n]+", " ↵ ", text).strip()
            if not normalized:
                continue
            fh.write(f"{ts}\t{speaker}\t{normalized}\n")
            count += 1
    return count


def summarize(target_lines: list[str]) -> str:
    if not target_lines:
        return "no target-side messages to summarize"
    lengths = [len(line) for line in target_lines]
    lengths.sort()
    median = lengths[len(lengths) // 2]
    over_40 = sum(1 for n in lengths if n >= 40)
    under_20 = sum(1 for n in lengths if n < 20)
    joined = " ".join(target_lines).lower()
    tokens = ("lol", "lmao", "haha", "bro", "yea", "damn", "tbh", "ngl", "sheesh", "epic", "tn", "rn", "idk")
    token_counts = Counter()
    for token in tokens:
        token_counts[token] = sum(1 for _ in re.finditer(rf"\b{re.escape(token)}\b", joined))
    elongation_hits = len(re.findall(r"\b\w*([a-z])\1{2,}\w*\b", joined))
    lines = [
        f"messages from target: {len(target_lines)}",
        f"length: median {median} chars, "
        f"{under_20} under 20 ({under_20 * 100 // len(lengths)}%), "
        f"{over_40} >= 40 ({over_40 * 100 // len(lengths)}%)",
        "tic vocab counts:",
    ]
    for token, count in sorted(token_counts.items(), key=lambda kv: -kv[1]):
        if count:
            lines.append(f"  {token:<8} {count}")
    lines.append(f"vowel-elongation hits (any word with 3+ same-letter run): {elongation_hits}")
    return "\n".join(lines)


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        prog="imessage-corpus",
        description="Pull iMessage history for one contact into a TSV corpus.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--name", help="contact display name to look up in AddressBook")
    parser.add_argument("--handle", help="exact iMessage handle (phone number or email)")
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="override default output directory (default: .claude-tmp/imessage-corpus/<slug>/)",
    )
    parser.add_argument(
        "--slug",
        help="folder slug under the default output root; ignored if --output-dir is set",
    )
    parser.add_argument("--since", type=parse_date_arg, help="include messages on or after YYYY-MM-DD")
    parser.add_argument("--until", type=parse_date_arg, help="include messages before YYYY-MM-DD")
    parser.add_argument(
        "--target-only",
        action="store_true",
        help="write only the target's messages (default writes both sides chronologically)",
    )
    parser.add_argument(
        "--summary",
        action="store_true",
        help="print aggregate stats for the target side (no message bodies)",
    )
    args = parser.parse_args(argv)

    if not CHAT_DB.exists():
        print(f"error: chat.db not found at {CHAT_DB}", file=sys.stderr)
        return 1

    try:
        label, handle_rows = coerce_handle_selection(args.name, args.handle)
    except SystemExit as exc:
        print(exc, file=sys.stderr)
        return 2

    rowids = [rowid for rowid, _, _ in handle_rows]
    raw = query_messages(rowids, args.since, args.until)

    slug_source = args.slug or args.name or args.handle or "corpus"
    output_dir = args.output_dir or (DEFAULT_OUTPUT_ROOT / slugify(slug_source))
    output_dir.mkdir(parents=True, exist_ok=True)

    thread_rows: list[tuple[str, str, str]] = []
    target_only_rows: list[tuple[str, str, str]] = []
    skipped_empty = 0
    target_lines_for_summary: list[str] = []

    for ts_ns, is_from_me, text, attributed in raw:
        payload = text if text and text.strip() else extract_attributed_body_text(attributed)
        if not payload or not payload.strip() or payload.strip() == OBJECT_REPLACEMENT:
            skipped_empty += 1
            continue
        ts = cocoa_ns_to_local(ts_ns)
        speaker = "me" if is_from_me else "them"
        thread_rows.append((ts, speaker, payload))
        if not is_from_me:
            target_only_rows.append((ts, speaker, payload))
            target_lines_for_summary.append(payload)

    thread_path = output_dir / "thread.tsv"
    target_path = output_dir / "target-only.tsv"

    if not args.target_only:
        written_thread = write_tsv(thread_path, thread_rows)
    else:
        written_thread = 0
    written_target = write_tsv(target_path, target_only_rows)

    print(f"matched: {label}")
    print(f"chat.db handles: " + ", ".join(f"{hid} ({svc})" for _, hid, svc in handle_rows))
    print(f"output: {output_dir}")
    if not args.target_only:
        print(f"  thread.tsv     {written_thread} lines (both speakers, chronological)")
    print(f"  target-only.tsv {written_target} lines (target speaker only)")
    print(f"skipped empty/attachment-only messages: {skipped_empty}")

    if args.summary:
        report = summarize(target_lines_for_summary)
        summary_path = output_dir / "summary.txt"
        summary_path.write_text(report + "\n", encoding="utf-8")
        print()
        print(report)
        print(f"\nwrote {summary_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
