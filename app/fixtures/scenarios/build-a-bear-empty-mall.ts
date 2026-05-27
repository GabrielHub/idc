import type { DateScenario } from "../../domain/game";

export const buildABearEmptyMall: DateScenario = {
  id: "build-a-bear-empty-mall",
  title: "The Bear Is Real",
  card: {
    summary:
      "An empty mall at half-speed music. One store has its grate up. The pair builds a bear together. At the end of the booking, the bear blinks and takes one step. The bear is real and goes home.",
    tags: ["haunted", "domestic", "cosmic"],
    risk: "medium",
    intimacy: "high",
    chaos: "medium",
    cost: 10,
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
    flow: "activity",
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
        pitch:
          "Drop the notarizing intake form on the counter. Forces a stance on signing for a being that will exist after the date.",
        beat: "An intake form sits under a small lamp on the counter. The form has two signature lines and one clause that reads: this entity will exist after the booking and will leave with you. A pen rests in a holder beside it. The mall corridor outside the store is quiet.",
        directorBeat:
          "A contract is in front of you. Sign first, read the clause aloud, ask your date what they think, or set the pen down without signing. Take a stance on bringing something home together. Do not voice the form.",
      },
      {
        id: "build-a-bear-empty-mall-event-2",
        title: "Body hooks",
        kind: "ambient",
        pitch:
          "Line the back wall with bear bodies in honey, cream, charcoal, and one rose. Surfaces taste and who picks first.",
        beat: "The back wall holds a row of unstuffed bear bodies on hooks. The bodies are in small sizes only. The colors are honey, cream, charcoal, and one rose. The hooks are at chest height. The conveyor belt to the stuffing machine is on at low speed.",
        directorBeat:
          "Pick a body or watch your date pick one. Name a color, defer to them, ask which they want, or take the rose because nobody else will. Whatever you do, do not stand silent in front of the rack.",
      },
      {
        id: "build-a-bear-empty-mall-event-3",
        title: "Heart pocket",
        kind: "provocation",
        pitch:
          "Open the heart pocket tray with a slot for a line that gets sewn in permanently. Forces a real choice on what to put inside something you cannot take back.",
        beat: "The heart pocket tray at the build station opens. The tray has a small slot for a written line and a small fabric heart. A printed card in the tray reads: the line is sewn in. The pen is the one from the counter.",
        directorBeat:
          "You have one line that will live inside this thing forever. Write it, leave it blank, hand the pen across, or write something for the bear instead of for your date. Pick and own it. Do not voice the card.",
      },
      {
        id: "build-a-bear-empty-mall-event-4",
        title: "Voice box menu",
        kind: "reveal",
        pitch:
          "Light up the voice box menu with silent at the top of the list. Surfaces taste on whether the bear gets a voice or stays quiet.",
        beat: "A small screen at the build station lights up with a list of voice box phrases. The phrases include a soft hello, a goodnight, a small song, a chime, and a row that reads silent. The silent row is at the top. The screen does not require a selection.",
        directorBeat:
          "Choose what this thing will sound like for the rest of its life. Pick a phrase, choose silent, ask your date which, or scroll past without selecting. State the choice out loud. Do not voice the screen.",
      },
      {
        id: "build-a-bear-empty-mall-event-5",
        title: "Stuffing pace",
        kind: "ambient",
        pitch:
          "Run the stuffing machine at half an inch a beat with the pedal on the side. Surfaces who holds the pedal and who watches.",
        beat: "The stuffing machine at the back of the store runs at a quiet pace. The body on the line moves a half inch at a time. The stuffing nozzle is on a soft pedal at the side. The dress rack is two steps further on.",
        directorBeat:
          "The body is filling slowly between you. Hold the pedal, hand it to your date, watch the body fill, or step away to look at the dress rack. Take a small physical role in the build.",
      },
      {
        id: "build-a-bear-empty-mall-event-6",
        title: "Dress rack",
        kind: "reveal",
        pitch:
          "Stage a small dress rack with a chef apron, librarian cardigan, leather jacket, sleep shirt, and one outfit labeled house clothes. Surfaces taste without forcing a fight.",
        beat: "The dress rack holds a small set: a chef's apron, a librarian cardigan, a small leather jacket, a sleep shirt, and one labeled house clothes. Each outfit is sized for the body the pair chose. A small card on the rack reads pick one or none.",
        directorBeat:
          "Decide what your bear wears or does not wear. Pick one, decline, suggest two combined, or ask your date to pick. Show taste without making it a contest. Do not voice the card.",
      },
      {
        id: "build-a-bear-empty-mall-event-7",
        title: "Mall music",
        kind: "ambient",
        pitch:
          "Pin half-speed mall music through the store at low volume. Surfaces whether either lets the silence carry the moment.",
        beat: "The mall music plays through the store at half speed. The current track is a soft instrumental. The store's own speaker plays a quieter loop under it. The corridor outside the store has not changed.",
        directorBeat:
          "The music is slow and the store is empty. Comment on the tempo, lean closer to your date, hum under it, or let the loop be company. Use the soundscape in your next beat.",
      },
      {
        id: "build-a-bear-empty-mall-event-8",
        title: "Naming card",
        kind: "provocation",
        pitch:
          "Slide a naming card with one line and two signatures out of the counter slot. Forces a clean call on naming or letting the name be the name.",
        beat: "A naming card slides out of the counter slot. The card has one line for a name and two small signature lines under it. A small note at the bottom reads: the name is the name. The pen is at the counter.",
        directorBeat:
          "A name is being asked for and it will not change later. Write a name, ask your date to write, decline and sign anyway, or talk it out loud first. Make the choice clear. Do not voice the card.",
      },
      {
        id: "build-a-bear-empty-mall-event-9",
        title: "Eyes open",
        kind: "provocation",
        pitch:
          "Bring the bear to life with one chime and one step off the counter. Forces a clean exit with a being you now have to carry home.",
        beat: "The bear sits on the counter. The eyes click into place. A soft chime sounds. The bear opens its eyes, takes one step off the counter onto a small shelf, and waits. The store fluorescents flicker once and settle.",
        directorBeat:
          "Something alive is now at your hand. Pick it up, hand it across, ask your date to carry it, or stand and walk out together with it. The bear does not speak; you do. Name what is happening in your next beat.",
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
