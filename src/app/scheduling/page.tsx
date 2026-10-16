"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Process, SchedulingAlgorithm, simulate, SimulationResult, TickSnapshot } from "@/engine/scheduler";
import { Sidebar } from "@/components/scheduler/Sidebar";
import { ProcessDrawer } from "@/components/scheduler/ProcessDrawer";
import { Canvas } from "@/components/scheduler/Canvas";
import { TransportBar } from "@/components/scheduler/TransportBar";
import { MetricsRow } from "@/components/scheduler/MetricsRow";
import { PlaySpeed } from "@/components/scheduler/types";
import { isControlsReady } from "@/components/scheduler/helpers";

export default function SchedulingPage() {
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm | "">("");
  const [quantum, setQuantum] = useState<number>(2);
  const [agingInterval, setAgingInterval] = useState<number>(5);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<PlaySpeed>(1.0);

  // Check user preference for reduced motion using useSyncExternalStore
  const isReducedMotion = useSyncExternalStore(
    (callback) => {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      mediaQuery.addEventListener("change", callback);
      return () => mediaQuery.removeEventListener("change", callback);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  // Controls readiness check
  const isReady = useMemo(() => {
    return isControlsReady(algorithm, processes.length, quantum, agingInterval);
  }, [algorithm, processes.length, quantum, agingInterval]);

  // Compute total ticks
  const maxTicks = useMemo(() => {
    if (!simulation || simulation.segments.length === 0) return 0;
    return simulation.segments[simulation.segments.length - 1].end;
  }, [simulation]);

  // Max scrubber step is snapshots.length (final terminal tick)
  const maxStep = useMemo(() => {
    if (!simulation) return 0;
    return simulation.snapshots.length;
  }, [simulation]);

  // Run simulation engine
  const runSimulationEngine = useCallback(
    (
      targetAlgo: SchedulingAlgorithm | "",
      targetProcesses: Process[],
      targetQuantum: number,
      targetAging: number
    ): SimulationResult | null => {
      if (!targetAlgo || targetProcesses.length === 0) {
        setSimulation(null);
        setCurrentStep(0);
        setIsPlaying(false);
        return null;
      }

      if (targetAlgo === "ROUND_ROBIN" && targetQuantum < 1) {
        setSimulation(null);
        setCurrentStep(0);
        setIsPlaying(false);
        return null;
      }

      if (targetAlgo === "PRIORITY" && targetAging < 1) {
        setSimulation(null);
        setCurrentStep(0);
        setIsPlaying(false);
        return null;
      }

      const res = simulate(targetProcesses, targetAlgo, {
        quantum: targetAlgo === "ROUND_ROBIN" ? targetQuantum : undefined,
        agingInterval: targetAlgo === "PRIORITY" ? targetAging : undefined,
      });

      if (res.success) {
        setSimulation(res);
        setCurrentStep(0);
        return res;
      } else {
        setSimulation(null);
        setCurrentStep(0);
        setIsPlaying(false);
        return null;
      }
    },
    []
  );

  // Algorithm change handler
  const handleAlgorithmChange = (newAlgo: SchedulingAlgorithm | "") => {
    setAlgorithm(newAlgo);
    setIsPlaying(false);
    if (newAlgo && processes.length > 0) {
      runSimulationEngine(newAlgo, processes, quantum, agingInterval);
    } else {
      setSimulation(null);
      setCurrentStep(0);
    }
  };

  // Quantum change handler
  const handleQuantumChange = (newQ: number) => {
    setQuantum(newQ);
    if (algorithm === "ROUND_ROBIN" && processes.length > 0 && newQ >= 1) {
      runSimulationEngine(algorithm, processes, newQ, agingInterval);
    }
  };

  // Aging change handler
  const handleAgingChange = (newA: number) => {
    setAgingInterval(newA);
    if (algorithm === "PRIORITY" && processes.length > 0 && newA >= 1) {
      runSimulationEngine(algorithm, processes, quantum, newA);
    }
  };

  // Process Apply handler
  // Per decision 1: Apply only updates processes list, does not run engine.
  const handleApplyProcesses = (newProcesses: Process[]) => {
    setProcesses(newProcesses);
    setSimulation(null);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (!isReady) return;

    // If simulation not yet computed, compute it first
    let activeSim = simulation;
    if (!activeSim && algorithm) {
      activeSim = runSimulationEngine(algorithm, processes, quantum, agingInterval);
    }

    if (!activeSim) return;

    // If currently at end, restart from step 0
    if (currentStep >= activeSim.snapshots.length) {
      setCurrentStep(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying(!isPlaying);
  };

  // Reset
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  // Step back
  const handleStepBack = () => {
    setIsPlaying(false);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Step forward
  const handleStepForward = () => {
    setIsPlaying(false);

    // If simulation not yet run, compute it
    let activeSim = simulation;
    if (!activeSim && algorithm && isReady) {
      activeSim = runSimulationEngine(algorithm, processes, quantum, agingInterval);
      if (!activeSim) return;
    }

    if (activeSim && currentStep < activeSim.snapshots.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Seek
  const handleSeek = (step: number) => {
    setIsPlaying(false);
    setCurrentStep(Math.max(0, Math.min(maxStep, step)));
  };

  // Auto-play timer loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(125, Math.round(500 / speed));
      timerRef.current = setTimeout(() => {
        if (simulation && currentStep < simulation.snapshots.length) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentStep, simulation, speed]);

  // Derive current snapshot and current tick
  const { currentSnapshot, currentTick, isCompleted } = useMemo(() => {
    if (!simulation) {
      return {
        currentSnapshot: null,
        currentTick: 0,
        isCompleted: false,
      };
    }

    if (currentStep < simulation.snapshots.length) {
      const snap = simulation.snapshots[currentStep];
      return {
        currentSnapshot: snap,
        currentTick: snap.tick,
        isCompleted: false,
      };
    }

    // Completed state (step == simulation.snapshots.length)
    const terminalSnap: TickSnapshot = {
      tick: maxTicks,
      readyQueue: [],
      runningProcess: null,
      remainingTimes: Object.fromEntries(processes.map((p) => [p.ProcessID, 0])),
      processes: processes.map((p) => ({
        ProcessID: p.ProcessID,
        RemainingTime: 0,
        State: "Terminated",
        Priority: p.Priority,
      })),
    };

    return {
      currentSnapshot: terminalSnap,
      currentTick: maxTicks,
      isCompleted: true,
    };
  }, [simulation, currentStep, maxTicks, processes]);

  return (
    <div className="flex w-full min-h-[calc(100vh-48px)] bg-app-bg">
      {/* 1. Left Sidebar (240px wide) */}
      <Sidebar
        algorithm={algorithm}
        onAlgorithmChange={handleAlgorithmChange}
        quantum={quantum}
        onQuantumChange={handleQuantumChange}
        agingInterval={agingInterval}
        onAgingIntervalChange={handleAgingChange}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        processesCount={processes.length}
      />

      {/* 2. Main Execution Area */}
      <section className="flex-1 flex flex-col p-6 overflow-x-hidden gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-hairline">
          <div className="flex items-baseline gap-4">
            <h1 className="text-[24px] font-semibold text-ink tracking-tight">
              CPU Scheduling
            </h1>
          </div>

          {/* Clock Display */}
          <div className="flex items-center gap-2 bg-surface border border-hairline px-3 py-1">
            <span className="text-[14px] font-medium text-ink-muted">
              Clock:
            </span>
            <span
              id="clock-vector-display"
              className="text-[14px] font-semibold text-accent tabular-nums"
            >
              t = {currentTick}
            </span>
          </div>
        </div>

        {/* Canvas Area */}
        <Canvas
          processes={processes}
          snapshot={currentSnapshot}
          segments={simulation?.segments ?? []}
          currentTick={currentTick}
          maxTicks={maxTicks}
          isSimulationRun={simulation !== null}
          speed={speed}
          isReducedMotion={isReducedMotion}
        />

        {/* Transport Bar */}
        <TransportBar
          isReady={isReady}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onReset={handleReset}
          onStepBack={handleStepBack}
          onStepForward={handleStepForward}
          currentStep={currentStep}
          maxStep={maxStep}
          onSeek={handleSeek}
          speed={speed}
          onSpeedChange={setSpeed}
        />

        {/* Metrics Row */}
        <MetricsRow
          isCompleted={isCompleted}
          throughput={simulation?.throughput}
          averageWaitingTime={simulation?.averageWaitingTime}
          averageTurnaroundTime={simulation?.averageTurnaroundTime}
        />
      </section>

      {/* Process Drawer (420px) */}
      <ProcessDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onApply={handleApplyProcesses}
        initialProcesses={processes}
        algorithm={algorithm}
      />
    </div>
  );
}
