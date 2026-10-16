import {
  Process,
  SchedulerError,
  SchedulerOptions,
  SchedulingAlgorithm,
} from "./types";

export function validateSchedulerInput(
  processes: Process[],
  algorithm: SchedulingAlgorithm,
  options?: SchedulerOptions
): SchedulerError | null {
  if (!processes || processes.length === 0) {
    return {
      code: "EMPTY_PROCESS_LIST",
      message: "At least one process must be provided for simulation.",
    };
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i];

    if (!p.ProcessID || typeof p.ProcessID !== "string" || p.ProcessID.trim() === "") {
      return {
        code: "INVALID_PROCESS_ID",
        message: `Process at index ${i} has an invalid or empty ProcessID.`,
      };
    }

    const trimmedId = p.ProcessID.trim();
    if (seenIds.has(trimmedId)) {
      return {
        code: "DUPLICATE_PROCESS_ID",
        message: `Duplicate ProcessID detected: "${trimmedId}". Process IDs must be unique.`,
      };
    }
    seenIds.add(trimmedId);

    if (
      p.ArrivalTime === undefined ||
      p.ArrivalTime === null ||
      typeof p.ArrivalTime !== "number" ||
      !Number.isInteger(p.ArrivalTime) ||
      p.ArrivalTime < 0
    ) {
      return {
        code: "INVALID_ARRIVAL_TIME",
        message: `Process "${p.ProcessID}" has invalid ArrivalTime (${p.ArrivalTime}). ArrivalTime must be an integer >= 0.`,
      };
    }

    if (
      p.BurstTime === undefined ||
      p.BurstTime === null ||
      typeof p.BurstTime !== "number" ||
      !Number.isInteger(p.BurstTime) ||
      p.BurstTime < 1
    ) {
      return {
        code: "INVALID_BURST_TIME",
        message: `Process "${p.ProcessID}" has invalid BurstTime (${p.BurstTime}). BurstTime must be an integer >= 1.`,
      };
    }

    if (p.Priority !== undefined && p.Priority !== null) {
      if (typeof p.Priority !== "number" || !Number.isInteger(p.Priority) || p.Priority < 0) {
        return {
          code: "INVALID_PRIORITY",
          message: `Process "${p.ProcessID}" has invalid Priority (${p.Priority}). Priority must be a non-negative integer.`,
        };
      }
    }
  }

  const validAlgorithms: SchedulingAlgorithm[] = [
    "SJF_NONPREEMPTIVE",
    "SJF_PREEMPTIVE",
    "ROUND_ROBIN",
    "PRIORITY",
  ];

  if (!validAlgorithms.includes(algorithm)) {
    return {
      code: "INVALID_ALGORITHM",
      message: `Unsupported scheduling algorithm: "${algorithm}".`,
    };
  }

  if (algorithm === "ROUND_ROBIN") {
    const quantum = options?.quantum;
    if (
      quantum === undefined ||
      quantum === null ||
      typeof quantum !== "number" ||
      !Number.isInteger(quantum) ||
      quantum < 1
    ) {
      return {
        code: "INVALID_QUANTUM",
        message: `Round Robin scheduling requires options.quantum to be an integer >= 1. Received: ${quantum}.`,
      };
    }
  }

  if (algorithm === "PRIORITY" && options?.agingInterval !== undefined && options?.agingInterval !== null) {
    const aging = options.agingInterval;
    if (typeof aging !== "number" || !Number.isInteger(aging) || aging < 1) {
      return {
        code: "INVALID_AGING_INTERVAL",
        message: `options.agingInterval must be an integer >= 1. Received: ${aging}.`,
      };
    }
  }

  return null;
}
