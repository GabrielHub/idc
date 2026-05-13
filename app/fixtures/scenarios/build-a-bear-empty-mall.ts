import type { DateScenario } from "../../domain/game";

export const buildABearEmptyMall: DateScenario = {
  id: "build-a-bear-empty-mall",
  title: "Build A Bear, Empty Haunted Mall",
  card: {
    summary:
      "An empty mall at half-speed music. One store has its grate up. The pair builds a bear together. At the end of the booking, the bear blinks and takes one step. The bear is real and goes home.",
    tags: ["haunted", "domestic", "cosmic"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    idealFor: [
      "members who can build a small thing with a partner and not run it",
      "members who can name a thing together without making it a debate",
      "members who can put care into a being that will exist after the date",
    ],
    badFor: [
      "members who use the build as a debate about taste",
      "members who treat a heart pocket line as a love letter to themselves",
      "members who name the bear at the partner instead of at the bear",
    ],
  },
  publicBrief: {
    location: "Store 1102, the Build A Bear at the empty haunted mall, after-hours booking",
    premise:
      "Cupid booked the only open store in the mall. The pair builds a bear together. At the end of the booking, the bear comes to life and takes one step.",
    whatBothCharactersKnow:
      "The mall is empty. The store is automated. The body hooks, the stuffing machine, the heart pocket tray, the voice box phrase menu, and the dress rack run themselves. Cupid's intake form notarizes that the entity will exist after the booking and will leave the mall with the pair. The bear does not speak when it animates. It acts once.",
    openingSituation:
      "Both members are at the entrance to the store. The grate is up. The store music is at half speed. The intake form is on the counter under a small lamp. The other stores in the mall have their grates down.",
  },
  director: {
    tone: "the empty mall at half-speed music, the soft hum of the store fluorescents, the slight echo of two voices in an otherwise empty corridor, the smell of new fabric",
    rules: [
      "Anchor the date to the store. The pair does not wander the mall.",
      "Treat the store as automated. There is no staff. The bear does not speak.",
      "Use the build as a shared act, not a contest.",
      "Allow refusal. Either member may decline a step (heart note, voice box, name) and the build continues.",
    ],
    events: [
      {
        id: "build-a-bear-empty-mall-event-1",
        title: "Intake form",
        kind: "reveal",
        event: "The intake form sits on the counter.",
        characterVisibleText:
          "An intake form sits under a small lamp on the counter. The form has two signature lines and one clause that reads: this entity will exist after the booking and will leave with you. A pen rests in a holder beside it. The mall corridor outside the store is quiet.",
        directorInstruction:
          "Use the small form to surface intent drawn from existing context. Either may sign first, ask the partner to read, or set the pen down. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "build-a-bear-empty-mall-event-2",
        title: "Body hooks",
        kind: "ambient",
        event: "The bear bodies hang on hooks at the back wall.",
        characterVisibleText:
          "The back wall holds a row of unstuffed bear bodies on hooks. The bodies are in small sizes only. The colors are honey, cream, charcoal, and one rose. The hooks are at chest height. The conveyor belt to the stuffing machine is on at low speed.",
        directorInstruction:
          "Allow the small choice without forcing it. The pair does not need to choose at the same beat.",
      },
      {
        id: "build-a-bear-empty-mall-event-3",
        title: "Heart pocket",
        kind: "provocation",
        event: "The heart pocket tray opens at the build station.",
        characterVisibleText:
          "The heart pocket tray at the build station opens. The tray has a small slot for a written line and a small fabric heart. A printed card in the tray reads: the line is sewn in. The pen is the one from the counter.",
        directorInstruction:
          "Push for a real choice on the heart pocket. Either may write a line, leave it blank, or pass the pen across. The line cannot be unsewn. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "build-a-bear-empty-mall-event-4",
        title: "Voice box menu",
        kind: "reveal",
        event: "The voice box phrase menu lights up.",
        characterVisibleText:
          "A small screen at the build station lights up with a list of voice box phrases. The phrases include a soft hello, a goodnight, a small song, a chime, and a row that reads silent. The silent row is at the top. The screen does not require a selection.",
        directorInstruction:
          "Use the small choice to surface taste drawn from existing context. Either may pick a phrase or pick silent. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "build-a-bear-empty-mall-event-5",
        title: "Stuffing pace",
        kind: "ambient",
        event: "The stuffing machine runs at the right pace.",
        characterVisibleText:
          "The stuffing machine at the back of the store runs at a quiet pace. The body on the line moves a half inch at a time. The stuffing nozzle is on a soft pedal at the side. The dress rack is two steps further on.",
        directorInstruction:
          "Allow the small mechanical work. The pair does not need to narrate the machine.",
      },
      {
        id: "build-a-bear-empty-mall-event-6",
        title: "Dress rack",
        kind: "reveal",
        event: "The dress rack offers a small set of outfits.",
        characterVisibleText:
          "The dress rack holds a small set: a chef's apron, a librarian cardigan, a small leather jacket, a sleep shirt, and one labeled house clothes. Each outfit is sized for the body the pair chose. A small card on the rack reads pick one or none.",
        directorInstruction:
          "Use the small outfit choice to surface taste drawn from existing context. Either may pick, decline, or hand the rack to the partner. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "build-a-bear-empty-mall-event-7",
        title: "Mall music",
        kind: "ambient",
        event: "The mall music stays at half speed.",
        characterVisibleText:
          "The mall music plays through the store at half speed. The current track is a soft instrumental. The store's own speaker plays a quieter loop under it. The corridor outside the store has not changed.",
        directorInstruction:
          "Allow the ambient soundtrack. The pair does not need to comment on the music.",
      },
      {
        id: "build-a-bear-empty-mall-event-8",
        title: "Naming card",
        kind: "provocation",
        event: "A naming card slides out of the counter slot.",
        characterVisibleText:
          "A naming card slides out of the counter slot. The card has one line for a name and two small signature lines under it. A small note at the bottom reads: the name is the name. The pen is at the counter.",
        directorInstruction:
          "Push for a real choice on the name. Either may name, ask the partner to name, or sign the name without writing it. The name is final. Do not voice any background person or cue as a continuing speaker.",
      },
      {
        id: "build-a-bear-empty-mall-event-9",
        title: "Eyes open",
        kind: "provocation",
        event: "The bear opens its eyes and takes one step.",
        characterVisibleText:
          "The bear sits on the counter. The eyes click into place. A soft chime sounds. The bear opens its eyes, takes one step off the counter onto a small shelf, and waits. The store fluorescents flicker once and settle.",
        directorInstruction:
          "Push for a clean exit from the store with the bear. The pair carries it out together or one takes it. The bear does not speak. The bear is not voiced as a continuing speaker.",
      },
    ],
    earlyEndTriggers: [
      "A member uses the heart pocket line to corner the partner.",
      "A member uses the naming card to score a point.",
    ],
    repeatBehavior:
      "If repeated, the store remembers the prior build. The same body color is on the hook by default. The voice box menu has the prior pick at the top of the list.",
  },
  judgeRubric: {
    successSignals: [
      "The pair builds a small being together and treats it as real.",
      "A member writes a heart pocket line that is for the bear, not at the partner.",
    ],
    failureSignals: [
      "A member turns the dress rack into a referendum on taste.",
      "The pair names the bear at each other instead of at the bear.",
    ],
    statFocus: ["chemistry", "trust", "relationshipHealth"],
  },
};
