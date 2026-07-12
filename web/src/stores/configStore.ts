import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AnswerTimerSeconds = 5 | 10 | 15 | 20 | 25 | 30;

interface ConfigState {
  /** Per-decision countdown, 5-30s in 5s steps. */
  answerTimerSeconds: AnswerTimerSeconds;
  setAnswerTimerSeconds: (seconds: AnswerTimerSeconds) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      answerTimerSeconds: 15,
      setAnswerTimerSeconds: (seconds) => set({ answerTimerSeconds: seconds }),
    }),
    {
      name: "trader-titan-config-v1",
      partialize: (state) => ({ answerTimerSeconds: state.answerTimerSeconds }),
    },
  ),
);
