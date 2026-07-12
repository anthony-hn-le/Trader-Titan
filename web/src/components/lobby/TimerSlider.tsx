"use client";

import { Slider } from "@/components/ui/slider";
import { useConfigStore, type AnswerTimerSeconds } from "@/stores/configStore";

const STEPS: AnswerTimerSeconds[] = [5, 10, 15, 20, 25, 30];

export function TimerSlider() {
  const answerTimerSeconds = useConfigStore((s) => s.answerTimerSeconds);
  const setAnswerTimerSeconds = useConfigStore((s) => s.setAnswerTimerSeconds);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">Answer timer</span>
        <span className="text-sm text-muted-foreground">{answerTimerSeconds}s per decision</span>
      </div>
      <Slider
        min={5}
        max={30}
        step={5}
        value={[answerTimerSeconds]}
        onValueChange={(value) => {
          const seconds = Array.isArray(value) ? value[0] : value;
          const clamped = STEPS.reduce((closest, step) =>
            Math.abs(step - seconds) < Math.abs(closest - seconds) ? step : closest,
          );
          setAnswerTimerSeconds(clamped);
        }}
      />
      <p className="text-xs text-muted-foreground">
        How long you get to bid a spread, quote a market, or make a trade decision before a default is auto-submitted.
      </p>
    </div>
  );
}
