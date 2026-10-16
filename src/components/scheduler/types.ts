import { Process, SchedulingAlgorithm, SimulationResult } from "@/engine/scheduler";

export interface ProcessDraftRow {
  id: string;
  ProcessID: string;
  ArrivalTime: string;
  BurstTime: string;
  Priority: string;
}

export type PlaySpeed = 0.5 | 1.0 | 2.0 | 4.0;

export interface SchedulerUIState {
  algorithm: SchedulingAlgorithm | "";
  quantum: number;
  agingInterval: number;
  processes: Process[];
  isDrawerOpen: boolean;
  simulation: SimulationResult | null;
  currentStep: number;
  isPlaying: boolean;
  speed: PlaySpeed;
}
