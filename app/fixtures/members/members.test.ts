import { existsSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type { Member, PortraitAsset } from "../../domain/game";
import { escapeRegex } from "../../services/utils";
import { starterMembers } from "./index";

type MemberNameReference = {
  ownerId: string;
  ownerName: string;
  referencedName: string;
};

type PortraitAssetReference = {
  memberId: string;
  slot: string;
  asset: PortraitAsset;
};

const AVATAR_SRCSET_WIDTHS = [128, 256, 512] as const;
const MEMBER_NAME_ALLOWLIST: ReadonlySet<string> = new Set(["bai-wenshu::Meridian"]);
const KNOWN_HEIGHTS_IN_INCHES: Readonly<Record<string, number>> = {
  "alex-yoon": 73,
  "derek-halsey": 76,
  "gabriel-tan": 69,
  "noah-kim": 69,
  "ryan-doyle": 69,
};

function memberDesignText(member: Member): string {
  return [
    member.bio,
    member.datingProfile,
    member.visualDescription,
    ...member.relationshipNeeds,
    ...member.preferences,
    ...member.dealbreakers,
    ...member.secrets,
    member.voice.register,
    ...member.voice.tics,
    ...member.voice.sampleMessages.opener,
    ...member.voice.sampleMessages.warming,
    ...member.voice.sampleMessages.cooling,
    ...member.voice.sampleMessages.crashingOut,
  ].join("\n");
}

function referencedMemberNames(member: Member, text: string): string[] {
  const references = new Set<string>();

  for (const candidate of starterMembers) {
    if (candidate.id === member.id) {
      continue;
    }

    for (const name of [candidate.name, candidate.firstName]) {
      if (MEMBER_NAME_ALLOWLIST.has(`${member.id}::${name}`)) {
        continue;
      }

      if (containsName(text, name)) {
        references.add(name);
      }
    }
  }

  return [...references].sort((first, second) => first.localeCompare(second));
}

function containsName(text: string, name: string): boolean {
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escapeRegex(name)}($|[^A-Za-z0-9])`);

  return pattern.test(text);
}

describe("member fixtures", () => {
  it("stores canonical character and standee render heights in inches", () => {
    const problems: string[] = [];

    for (const member of starterMembers) {
      if (!Number.isInteger(member.characterHeightInInches)) {
        problems.push(`${member.id} characterHeightInInches is not an integer`);
      }

      if (!Number.isInteger(member.standeeRenderHeightInInches)) {
        problems.push(`${member.id} standeeRenderHeightInInches is not an integer`);
      }

      if (member.characterHeightInInches < 24 || member.characterHeightInInches > 108) {
        problems.push(
          `${member.id} characterHeightInInches ${member.characterHeightInInches} is outside member bounds`,
        );
      }

      if (member.standeeRenderHeightInInches < 48 || member.standeeRenderHeightInInches > 84) {
        problems.push(
          `${member.id} standeeRenderHeightInInches ${member.standeeRenderHeightInInches} is outside lineup bounds`,
        );
      }

      const knownHeight = KNOWN_HEIGHTS_IN_INCHES[member.id];
      if (knownHeight !== undefined && member.standeeRenderHeightInInches !== knownHeight) {
        problems.push(
          `${member.id} standeeRenderHeightInInches ${member.standeeRenderHeightInInches} should be ${knownHeight}`,
        );
      }
    }

    expect(problems).toEqual([]);
  });

  it("points every portrait asset at checked-in source and runtime files", () => {
    const problems: string[] = [];

    for (const member of starterMembers) {
      for (const reference of portraitAssetReferences(member)) {
        const expectedSourcePrefix = `assets-source/portraits/${member.id}/`;
        const expectedCutoutPrefix = `/assets/portraits/${member.id}/`;

        if (!reference.asset.sourcePath.startsWith(expectedSourcePrefix)) {
          problems.push(
            `${reference.memberId} ${reference.slot} uses ${reference.asset.sourcePath}`,
          );
        }

        if (!reference.asset.cutoutPath.startsWith(expectedCutoutPrefix)) {
          problems.push(
            `${reference.memberId} ${reference.slot} uses ${reference.asset.cutoutPath}`,
          );
        }

        assertPathExists(reference.asset.sourcePath, problems);
        assertPathExists(publicAssetPath(reference.asset.cutoutPath), problems);
      }

      for (const width of AVATAR_SRCSET_WIDTHS) {
        const avatarPath = member.portraits.neutral.avatar.cutoutPath.replace(
          /avatar\.png$/u,
          `avatar-${width}.png`,
        );

        assertPathExists(publicAssetPath(avatarPath), problems);
      }
    }

    expect(problems).toEqual([]);
  });

  it("does not point member designs at specific other members", () => {
    const violations: MemberNameReference[] = [];

    for (const member of starterMembers) {
      const text = memberDesignText(member);
      for (const referencedName of referencedMemberNames(member, text)) {
        violations.push({
          ownerId: member.id,
          ownerName: member.name,
          referencedName,
        });
      }
    }

    expect(violations).toEqual([]);
  });
});

function portraitAssetReferences(member: Member): PortraitAssetReference[] {
  const references: PortraitAssetReference[] = [
    {
      memberId: member.id,
      slot: "neutral portrait",
      asset: member.portraits.neutral.portrait,
    },
    {
      memberId: member.id,
      slot: "neutral avatar",
      asset: member.portraits.neutral.avatar,
    },
  ];
  const moods = ["flirty", "confused", "angry"] as const;

  for (const mood of moods) {
    const portrait = member.portraits[mood]?.portrait;

    if (portrait !== undefined) {
      references.push({
        memberId: member.id,
        slot: `${mood} portrait`,
        asset: portrait,
      });
    }
  }

  return references;
}

function publicAssetPath(cutoutPath: string): string {
  return `public/${cutoutPath.replace(/^\/+/u, "")}`;
}

function assertPathExists(path: string, problems: string[]): void {
  const absolutePath = resolve(process.cwd(), path);

  if (!existsSync(absolutePath)) {
    problems.push(`missing ${relative(process.cwd(), absolutePath).replaceAll("\\", "/")}`);
  }
}
