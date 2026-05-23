import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { CosmicWarpOverlay } from "../components/cosmic-warp-overlay";
import { CupidShell } from "../components/cupid-shell";
import { SfxProvider } from "../components/sfx-provider";
import { SplashScreen } from "../components/splash-screen";

type ShellPhase = "splash" | "operations";

const SHELL_PHASE_STORAGE_KEY = "idc.cupid.shell.phase";

// Overlay covers the splash → operations swap so its end state can match the
// lobby's first paint and the handoff stays invisible behind the overlay.
const WARP_SHELL_SWAP_MS = 550;
const WARP_OVERLAY_CLEAR_MS = 1200;

export function meta() {
  return [
    { title: "IDC | Cupid Operations" },
    {
      name: "description",
      content: "A local-first relationship operations dashboard for Cupid.",
    },
  ];
}

export default function Home() {
  const [phase, setPhase] = useState<ShellPhase>("splash");
  const [warping, setWarping] = useState(false);

  useEffect(() => {
    const storedPhase = readStoredShellPhase();

    if (storedPhase === "operations") {
      setPhase("operations");
    }
  }, []);

  function setShellPhase(nextPhase: ShellPhase) {
    setPhase(nextPhase);
    writeShellPhase(nextPhase);
  }

  function handlePunchIn(toLobby: boolean) {
    if (!toLobby) {
      setShellPhase("operations");
      return;
    }
    setWarping(true);
    window.setTimeout(() => setShellPhase("operations"), WARP_SHELL_SWAP_MS);
    window.setTimeout(() => setWarping(false), WARP_OVERLAY_CLEAR_MS);
  }

  return (
    <SfxProvider>
      <AnimatePresence mode="wait" initial={false}>
        {phase === "splash" ? (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <SplashScreen onPunchIn={handlePunchIn} />
          </motion.div>
        ) : (
          <motion.div
            key="operations"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <CupidShell onPunchOut={() => setShellPhase("splash")} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {warping ? <CosmicWarpOverlay key="warp" originX="70%" originY="42%" /> : null}
      </AnimatePresence>
    </SfxProvider>
  );
}

function readStoredShellPhase(): ShellPhase {
  if (typeof window === "undefined") {
    return "splash";
  }

  try {
    return window.sessionStorage.getItem(SHELL_PHASE_STORAGE_KEY) === "operations"
      ? "operations"
      : "splash";
  } catch {
    return "splash";
  }
}

function writeShellPhase(phase: ShellPhase): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(SHELL_PHASE_STORAGE_KEY, phase);
  } catch {
    return;
  }
}
