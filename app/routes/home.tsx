import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { CupidShell } from "../components/cupid-shell";
import { SfxProvider } from "../components/sfx-provider";
import { SplashScreen } from "../components/splash-screen";

type ShellPhase = "splash" | "operations";

const SHELL_PHASE_STORAGE_KEY = "idc.cupid.shell.phase";

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
            <SplashScreen onPunchIn={() => setShellPhase("operations")} />
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
