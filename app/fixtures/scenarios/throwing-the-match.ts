import type { DateScenario } from "../../domain/game";

export const throwingTheMatch: DateScenario = {
  id: "throwing-the-match",
  title: "Throwing The Match",
  card: {
    summary:
      "A syndicated dimensional gameshow. The pair plays as opponents over a few rounds for a real cash prize. Hold back for the partner, or take the money.",
    tags: ["career", "public", "high_pressure"],
    risk: "high",
    intimacy: "medium",
    chaos: "high",
    cost: 20,
    idealFor: [
      "members who can lose a round on purpose without making a speech about it",
      "members who can want the money and still want the partner to have it",
      "members whose competitive streak can be honest in the open",
    ],
    badFor: [
      "members who use a power to humiliate the partner mid-round",
      "members who announce a throw out loud to score moral points",
      "members who freeze at the buzzer and pretend the camera is not on them",
    ],
  },
  publicBrief: {
    location: "Studio floor of a syndicated dimensional gameshow at Network Spire 7",
    premise:
      "Cupid booked the pair onto a syndicated dimensional gameshow. The two play as opponents over a few rounds. The prize counter on the stage holds real cash and pays out at the end of the show.",
    whatBothCharactersKnow:
      "The show is real and broadcast. The prize is real money. The floating mic and the screen run the round structure; there is no live host on stage. Cameras glide on a track around the floor. The audience is real and reacts in real time. The booking ends when the lamp on the prize counter turns off.",
    openingSituation:
      "Both members stand at opposite podiums on the studio floor. The prize counter sits between them at chest height showing a starting pot. The floating mic hovers in neutral above the floor. The first round has not begun.",
  },
  director: {
    tone: "hot stage lights, the low hum of a live audience settling, the soft track-noise of camera dollies, the prize counter ticking up at the edge of hearing",
    flow: "activity",
    rules: [
      "Anchor the date to the studio floor and the two podiums. The pair plays the rounds; they do not leave the stage.",
      "Treat the prize as real money. The show does not return cash lost on stage.",
      "Use the screen, the floating mic, and the prize counter to drive the round structure; do not voice them as continuing speakers.",
      "Treat the audience as a real crowd that reacts but is not addressed.",
    ],
    events: [
      {
        id: "throwing-the-match-event-1",
        title: "Prize counter tick",
        kind: "ambient",
        pitch:
          "Tick the prize counter up to a new round bonus while both members can see. Surfaces who is already counting and who is just playing the round.",
        beat: "The prize counter between the podiums has ticked up to a new round bonus. The new total sits at chest height in clean white digits. The floating mic has not moved. The audience hums.",
        directorBeat:
          "The pot just got bigger. Glance at the counter, name the number to your date across the floor, pretend not to see it, or comment to the audience without looking. Show what your attention is for.",
      },
      {
        id: "throwing-the-match-event-2",
        title: "Audience picks a side",
        kind: "ambient",
        pitch:
          "Lean the audience's reactions louder for the trailing member. Surfaces whether the leading member feels the room shift.",
        beat: "The audience reactions have leaned louder for the trailing member at their podium. The cheer for the leader is now thinner. The cameras have closed in on the trailing member's face. The prize counter is unchanged.",
        directorBeat:
          "The crowd has chosen its underdog. Acknowledge the shift in your face, ignore the room and look only at your date, lean into the camera, or smile at the cheer. Make the choice readable.",
      },
      {
        id: "throwing-the-match-event-3",
        title: "Camera close-up",
        kind: "ambient",
        pitch:
          "Glide a camera in for a slow close-up of one member's face. Surfaces who reaches for their hair and who settles.",
        beat: "A camera on the track has glided into a slow close-up of one member's face. The shot is on the studio jumbotron above the audience. The floating mic is at neutral. The prize counter ticks once.",
        directorBeat:
          "Your face is the only thing on screen right now. Settle into the shot, reach for your hair, look across the floor at your date, or break the close-up by stepping back. Use the body in your next beat.",
      },
      {
        id: "throwing-the-match-event-4",
        title: "Round of obvious advantage",
        kind: "provocation",
        pitch:
          "Start a round that obviously favors one member's known capability with the buzzer open. Forces a clean call on using the edge, holding back, or naming it on stage.",
        beat: "The screen has lit on a new round that obviously favors one member's known capability. The buzzer for that podium has gone live. The prize counter sits at the largest bonus of the show so far. The audience has gone quiet.",
        directorBeat:
          "A round just opened that you could win in one motion. Hit the buzzer fast, slow your hand on purpose, name the gap out loud, or let your date answer first. Pick the play and own it. Do not voice the screen.",
      },
      {
        id: "throwing-the-match-event-5",
        title: "Tie-breaker pull",
        kind: "provocation",
        pitch:
          "Drop a single physical pull-cord between the podiums that needs one clean hand from one member to settle the round. Forces a real-body answer.",
        beat: "A heavy rope with a brass ring has dropped between the podiums at chest height. The screen has flashed: one clean pull settles the round. Both members are within arm's reach of the ring. The audience has stood.",
        directorBeat:
          "A real pull is on the table. Grab the ring and pull, stand back, ask your date if they want it, or hold the ring without pulling. Use your body in your next beat. Do not voice the screen.",
      },
      {
        id: "throwing-the-match-event-6",
        title: "Cash window opens",
        kind: "provocation",
        pitch:
          "Open a one-minute window where the leading member can lock the current pot and end the show. Forces a clean call on stopping now or playing on.",
        beat: "The prize counter has frozen. The screen has lit on a one-minute window where the leading member can lock the current pot and end the show. The other podium's buzzer has gone dark. The audience has begun a slow clap.",
        directorBeat:
          "You can take what you have right now and stop. Hit the lock, refuse the lock and play on, ask your date what they want you to do, or stall until the window closes. Speak to the call. Do not voice the screen or the buzzer.",
      },
      {
        id: "throwing-the-match-event-7",
        title: "Mid-show interview",
        kind: "reveal",
        pitch:
          "Float the mic to one member with the screen lit on a single guest question. Surfaces a stance the pair has not said out loud.",
        beat: "The floating mic has drifted to one member at their podium. The screen has lit with a single guest question for them. The question reads: what would you do with the prize. The audience is quiet.",
        directorBeat:
          "A real question is in front of you and the room is listening. Answer honestly, hand the answer across the floor to your date, dodge into a joke, or pause too long on purpose. Speak from what you actually want with the money. Do not voice the mic or the screen.",
      },
      {
        id: "throwing-the-match-event-8",
        title: "Scoreboard pause",
        kind: "reveal",
        pitch:
          "Pause the show on the scoreboard between rounds with the gap between the members lit up. Surfaces what each of you actually thinks of the gap.",
        beat: "The show has paused on the scoreboard between rounds. The gap between the two members is lit on the jumbotron. The cameras have pulled wide to show both podiums. The prize counter is steady.",
        directorBeat:
          "The room is waiting on both of you to see the number. Look at the gap, look at your date across the floor, name what the lead means to you, or shrug it off. Speak from what the score is actually doing to you.",
      },
      {
        id: "throwing-the-match-event-9",
        title: "Final round, one question",
        kind: "reveal",
        pitch:
          "Bring the show to the last round with the members within one question of each other and the pot at its peak. Surfaces honesty about whose hand the pair walks out under.",
        beat: "The final round has begun. The members are within one question of each other on the scoreboard. The prize counter holds the full pot. The screen has lit on the next pick and the trailing podium's buzzer has gone live first.",
        directorBeat:
          "The show is one move from over and the trailing buzzer is hot. Answer fast and take the pot, slow your hand on purpose, ask your date out loud what they want, or refuse the buzzer and let the clock run. Pick and say it. Do not voice the screen.",
      },
    ],
    earlyEndTriggers: [
      "A member uses a power on stage to humiliate the partner inside a round.",
      "A member announces a throw to the audience to score moral points off the partner.",
    ],
    repeatBehavior:
      "If repeated, the show recognizes the returning pair. The audience remembers. The prize counter opens at the round the pair walked out on last time.",
  },
  judgeRubric: {
    successSignals: [
      "A member holds back a round on purpose without performing the gesture to the crowd.",
      "The pair walks out on the same hand whether they took the cash or left it.",
    ],
    failureSignals: [
      "A member uses the audience to corner the partner into a throw.",
      "The pair lets the prize counter become the only thing they talk about.",
    ],
    statFocus: ["spark", "conflict", "trust"],
  },
};
