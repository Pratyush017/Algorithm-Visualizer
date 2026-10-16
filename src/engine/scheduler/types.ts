export type ProcessState =
  | "New"
  | "Ready"
  | "Running"
  | "Waiting"
  | "Terminated";

export type SchedulingAlgorithm =
  | "SJF_NONPREEMPTIVE"
  | "SJF_PREEMPTIVE"
  | "ROUND_ROBIN"
  | "PRIORITY";

export interface Process {
  ProcessID: string;
  ArrivalTime: number;
  BurstTime: number;
  Priority?: number;
}

export interface PCB {
  ProcessID: string;
  ArrivalTime: number;
  BurstTime: number;
  Priority?: number;
  RemainingTime: number;
  State: ProcessState;
  CompletionTime?: number;
  WaitingTime?: number;
  TurnaroundTime?: number;
  currentPriority?: number;
  readyWaitTicks?: number;
}

export interface GanttSegment {
  processId: string | null;
  start: number;
  end: number;
}

export interface ProcessMetrics {
  ProcessID: string;
  ArrivalTime: number;
  BurstTime: number;
  CompletionTime: number;
  TurnaroundTime: number;
  WaitingTime: number;
}

export interface ProcessSnapshot {
  ProcessID: string;
  RemainingTime: number;
  State: ProcessState;
  Priority?: number;
  currentPriority?: number;
}

export interface TickSnapshot {
  tick: number;
  readyQueue: string[];
  runningProcess: string | null;
  remainingTimes: Record<string, number>;
  processes: ProcessSnapshot[];
}

export interface SimulationResult {
  segments: GanttSegment[];
  perProcessMetrics: ProcessMetrics[];
  metrics: ProcessMetrics[]; // Convenient alias for perProcessMetrics
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  throughput: number;
  snapshots: TickSnapshot[];
}

export type SchedulerErrorCode =
  | "EMPTY_PROCESS_LIST"
  | "INVALID_PROCESS_ID"
  | "DUPLICATE_PROCESS_ID"
  | "INVALID_BURST_TIME"
  | "INVALID_ARRIVAL_TIME"
  | "INVALID_PRIORITY"
  | "INVALID_ALGORITHM"
  | "INVALID_QUANTUM"
  | "INVALID_AGING_INTERVAL";

export interface SchedulerError {
  code: SchedulerErrorCode;
  message: string;
}

export interface SchedulerOptions {
  quantum?: number;
  agingInterval?: number;
  priorityPreemptive?: boolean;
}

export type SimulationResponse =
  | ({ success: true } & SimulationResult)
  | { success: false; error: string; code: SchedulerErrorCode };
