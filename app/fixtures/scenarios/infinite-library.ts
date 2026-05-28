import type { DateScenario } from "../../domain/game";

export const infiniteLibrary: DateScenario = {
  id: "infinite-library",
  title: "Infinite Library",
  card: {
    summary:
      "A reading-room carrell where any title fetches itself the moment a member thinks of it. The shelves are not infinite. The patience of the room is.",
    tags: ["cosmic", "low_pressure", "memory"],
    risk: "medium",
    intimacy: "medium",
    chaos: "low",
    cost: 13,
    idealFor: [
      "members who can let a book sit unopened between them",
      "members whose taste does not need to be defended",
      "members who can hand a book to a partner without footnoting it",
    ],
    badFor: [
      "members who use the library as a personality test",
      "members who must finish every book that arrives",
      "members who treat a fetched title as a verdict on the partner",
    ],
  },
  publicBrief: {
    location: "Second-floor carrell, Pleiades Reading Room",
    premise:
      "Cupid booked a private carrell for the afternoon. Books fetch themselves by intent, not catalog. The pair shares one oak table.",
    whatBothCharactersKnow:
      "The room answers thought, not request. Any title can arrive, including titles that have never been written. A brass dish in the middle of the table collects slips no one remembers writing. Books may be opened, slid, closed, or returned. Refusal is allowed. The bell at the front desk is decorative.",
    openingSituation:
      "Both members sit at a long oak table under a green lamp. A brass dish rests at the middle of the table. The first book is already settling itself in front of one of them. The other side of the table is empty.",
  },
  director: {
    tone: "warm green lamplight, dust motes drifting in a long sunbeam from no window, the soft thunk of a book setting itself down, old paper without mustiness",
    flow: "conversation",
    rules: [
      "Anchor the date to the carrell table. The pair does not wander the stacks.",
      "Treat the library as silent infrastructure. There is no librarian to address.",
      "Treat fetched books as real objects. They can be opened, slid, closed, refused, or returned.",
      "Allow refusal as a clean answer. A closed book is information.",
    ],
    events: [
      {
        id: "infinite-library-event-1",
        title: "Cover story",
        kind: "reveal",
        pitch:
          "Settle a slim book in front of one member in the exact taste they would have chosen at twenty. Surfaces a stance on a past self the room can see.",
        beat: "A slim book settles in front of one member. The cover bears the exact taste they would have chosen at twenty. The title is a phrase neither has spoken aloud at this table. The book stays closed.",
        directorBeat:
          "The library handed you something on the nose. Open it, slide it to your partner, turn it face down, or comment on the design. Speak from your current self, not from twenty. Do not voice the book.",
      },
      {
        id: "infinite-library-event-2",
        title: "Side dish",
        kind: "ambient",
        pitch:
          "Collect three slips in the brass dish in one member's own handwriting. Surfaces a small honest peek at private thinking.",
        beat: "Three small paper slips have appeared in the brass dish. Each slip carries one word in one member's own handwriting. Neither remembers writing them.",
        directorBeat:
          "Your thinking has been showing up as paper. Tip the dish into your palm, peek at the slips, hand one to your partner, or close the dish over them.",
      },
      {
        id: "infinite-library-event-3",
        title: "Wrong order",
        kind: "ambient",
        pitch:
          "Land a book neither member thought of at the corner. Surfaces ease with a small intrusion that is not theirs.",
        beat: "A heavy book lands at the corner of the table that neither member thought of. The spine carries the words olive cultivation in temperate climates. The cover has a small ink stain at the bottom.",
        directorBeat:
          "Someone else's thought just landed at your table. Push it aside, open to the index, joke about the next carrell over, or let it be. Stay in your seat. Do not voice the book.",
      },
      {
        id: "infinite-library-event-4",
        title: "Joint card",
        kind: "provocation",
        pitch:
          "Slide a blank library card onto the table with both their names pre-typed. Forces a clean small choice on a joint act.",
        beat: "A blank library card slides itself onto the table between the two members. Both their names are already typed in the two holder lines. A pen rests beside the card.",
        directorBeat:
          "A small joint act is on offer. Sign it, slide it back to the dish, push it under a book, or comment on the holder lines. Make the small choice clearly. Do not voice the card.",
      },
      {
        id: "infinite-library-event-5",
        title: "Next chapter",
        kind: "reveal",
        pitch:
          "Grow a new chapter at the back of one member's book with their own first name as the heading. Surfaces a clean stance on being written.",
        beat: "The book one member has been reading has grown a chapter at the back. The chapter heading is that member's own first name. The pages of the chapter have not been opened.",
        directorBeat:
          "A book just wrote you in. Open the chapter, close the book, hand it to your partner, or sit with it. Do not invent what is inside. Do not voice the book.",
      },
      {
        id: "infinite-library-event-6",
        title: "Same shelf",
        kind: "ambient",
        pitch:
          "Drop a second copy of the same book at the partner's end. Surfaces small joy in arriving somewhere together.",
        beat: "A second copy of the book in front of one member appears at the partner's end of the table. The binding is darker. The two copies are otherwise identical. Neither member moved.",
        directorBeat:
          "You arrived at the same shelf without saying it. Open your copy together, comment on the bindings to your date, slide both into the middle, or leave one closed.",
      },
      {
        id: "infinite-library-event-7",
        title: "Stack rises",
        kind: "provocation",
        pitch:
          "Stack six unrequested books at the table and dim the lamp half a step. Forces a clean clearing call.",
        beat: "The table now holds six books that neither member intended. The lamp dims half a step. The brass dish has gone quiet. The first book is still in front.",
        directorBeat:
          "The room is overproducing on you. Pick the keeper, return the rest, propose a split with your partner, or sit through the dim. Make a clearing call. Do not voice the books or the lamp.",
      },
      {
        id: "infinite-library-event-8",
        title: "Their handwriting",
        kind: "reveal",
        pitch:
          "Offer one slip in the brass dish in the partner's own handwriting. Surfaces a small landing about being thought of.",
        beat: "The brass dish offers a single slip on top of the small stack. The handwriting is the partner's. The word on the slip is short and clean. The slip is warm to the touch.",
        directorBeat:
          "Your partner's thought arrived first. Pick up the slip, slide it to them, comment on the handwriting, or leave it. Speak from what you already know about each other. Do not voice the slip.",
      },
      {
        id: "infinite-library-event-9",
        title: "Chair eases",
        kind: "provocation",
        pitch:
          "Ease one chair back half an inch and dim the lamp another notch. Forces a clean closing line.",
        beat: "The chair on one side of the table eases half an inch back from the table on its own. The lamp dims another notch. The first book is still in front. The room is quieter than it was.",
        directorBeat:
          "The room is offering you an exit. Push the chair back in, stand, comment on the dim to your date, or hand your partner a closing line. Wrap the beat cleanly. Do not voice the chair or the lamp.",
      },
    ],
    earlyEndTriggers: [
      "A member uses a fetched book to interrogate the partner.",
      "A member treats the room as a tour and abandons the table.",
    ],
    repeatBehavior:
      "If repeated, the room remembers which books either of them closed. The brass dish keeps prior slips at the bottom of the dish.",
  },
  judgeRubric: {
    successSignals: [
      "A member hands a book to the partner and lets them have it without footnoting.",
      "The pair lets a fetched book sit unopened between them.",
    ],
    failureSignals: [
      "A member uses a fetched title as a verdict on the partner.",
      "The pair turns the carrell into a quiz on taste.",
    ],
    statFocus: ["chemistry", "trust", "weirdnessTolerance"],
  },
};
