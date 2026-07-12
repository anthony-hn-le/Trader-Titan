"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RulesBlurb } from "@/components/lobby/RulesBlurb";
import { TimerSlider } from "@/components/lobby/TimerSlider";
import { RecentGames } from "@/components/lobby/RecentGames";
import { InstructionsBanner } from "@/components/shared/InstructionsBanner";
import { Footer } from "@/components/shared/Footer";
import { useGameStore } from "@/stores/gameStore";

export default function Home() {
  const router = useRouter();
  const startGame = useGameStore((s) => s.startGame);

  const handleStart = () => {
    startGame();
    router.push("/play");
  };

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <InstructionsBanner />
      <div className="flex flex-1 flex-col items-center">
        <div className="flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
          <RulesBlurb />

          <Card>
            <CardHeader>
              <CardTitle>Game settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <TimerSlider />
              <Button size="lg" onClick={handleStart}>
                Start game
              </Button>
            </CardContent>
          </Card>

          <RecentGames />
        </div>
      </div>
      <Footer />
    </div>
  );
}
