import { describe, expect, it } from "vitest";

import { createSeedGameSave } from "../services/game-seed";
import { CURRENT_SAVE_KEY, LocalGameRepository } from "./local-game-repository";
import { MemorySaveStore } from "./memory-save-store";

describe("LocalGameRepository", () => {
  it("loads same-version saves that still use legacy voice opener samples", async () => {
    const sourceSave = createSeedGameSave(new Date("2026-05-05T12:00:00.000Z"));
    const legacySave = {
      ...sourceSave,
      members: sourceSave.members.map((member) => {
        const {
          greeting: _greeting,
          hingeBits: _hingeBits,
          ...legacySampleMessages
        } = member.voice.sampleMessages;

        return {
          ...member,
          voice: {
            ...member.voice,
            sampleMessages: {
              opener: member.voice.sampleMessages.greeting,
              ...legacySampleMessages,
            },
          },
        };
      }),
    };
    const store = new MemorySaveStore();
    await store.write(CURRENT_SAVE_KEY, JSON.stringify(legacySave));

    const repository = new LocalGameRepository(store, CURRENT_SAVE_KEY, [], {
      writeDebounceMs: 0,
    });
    const loaded = await repository.loadGame();
    const sourceMember = sourceSave.members[0];
    const loadedMember =
      sourceMember === undefined
        ? undefined
        : loaded?.members.find((member) => member.id === sourceMember.id);

    if (sourceMember === undefined || loadedMember === undefined) {
      throw new Error("Expected seed member to load.");
    }

    expect(loadedMember.voice.sampleMessages.greeting).toEqual(
      sourceMember.voice.sampleMessages.greeting,
    );
    expect(loadedMember.voice.sampleMessages.hingeBits).toEqual(
      sourceMember.voice.sampleMessages.hingeBits,
    );
  });
});
