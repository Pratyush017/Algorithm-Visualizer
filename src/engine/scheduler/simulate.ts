import {
  GanttSegment,
  PCB,
  Process,
  ProcessMetrics,
  SchedulerOptions,
  SchedulingAlgorithm,
  SimulationResponse,
  TickSnapshot,
} from "./types";
import { validateSchedulerInput } from "./validate";

export function compareProcessId(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function breakTie(a: PCB, b: PCB): number {
  if (a.ArrivalTime !== b.ArrivalTime) {
    return a.ArrivalTime - b.ArrivalTime;
  }
  return compareProcessId(a.ProcessID, b.ProcessID);
}

export function simulate(
  processes: Process[],
  algorithm: SchedulingAlgorithm,
  options?: SchedulerOptions
): SimulationResponse {
  const validationError = validateSchedulerInput(processes, algorithm, options);
  if (validationError) {
    return {
      success: false,
      error: validationError.message,
      code: validationError.code,
    };
  }

  const agingInterval = options?.agingInterval;
  const quantum = options?.quantum ?? 1;
  const priorityPreemptive = options?.priorityPreemptive ?? false;

  function comparePriority(a: PCB, b: PCB): number {
    const pA = a.currentPriority ?? a.Priority ?? 0;
    const pB = b.currentPriority ?? b.Priority ?? 0;

    if (pA !== pB) {
      return pA - pB; // Lower number = higher priority
    }
    return breakTie(a, b);
  }

  const pcbs: PCB[] = processes.map((p) => ({
    ProcessID: p.ProcessID,
    ArrivalTime: p.ArrivalTime,
    BurstTime: p.BurstTime,
    Priority: p.Priority ?? 0,
    RemainingTime: p.BurstTime,
    State: "New",
    currentPriority: p.Priority ?? 0,
    readyWaitTicks: 0,
  }));

  const segments: GanttSegment[] = [];
  const snapshots: TickSnapshot[] = [];
  const totalProcesses = pcbs.length;
  let terminatedCount = 0;

  // Round Robin specific state
  const rrReadyQueue: PCB[] = [];
  let rrRunningPCB: PCB | null = null;
  let rrQuantumTicks = 0;

  // Non-preemptive running process
  let nonPreemptiveRunningPCB: PCB | null = null;

  // Preemptive running process
  let activeRunningPCB: PCB | null = null;

  let currentTick = 0;
  const maxSimulationTicks = 1_000_000;

  while (terminatedCount < totalProcesses && currentTick < maxSimulationTicks) {
    // 1. Admit arriving processes at currentTick
    const arriving = pcbs
      .filter((p) => p.State === "New" && p.ArrivalTime === currentTick)
      .sort(breakTie);

    for (const p of arriving) {
      p.State = "Ready";
      p.readyWaitTicks = 0;
      if (algorithm === "ROUND_ROBIN") {
        rrReadyQueue.push(p);
      }
    }

    let executingPCB: PCB | null = null;

    if (algorithm === "ROUND_ROBIN") {
      // Check quantum expiry for previously running job
      if (rrRunningPCB !== null && rrQuantumTicks === quantum) {
        rrRunningPCB.State = "Ready";
        rrReadyQueue.push(rrRunningPCB);
        rrRunningPCB = null;
        rrQuantumTicks = 0;
      }

      if (rrRunningPCB === null && rrReadyQueue.length > 0) {
        rrRunningPCB = rrReadyQueue.shift()!;
        rrRunningPCB.State = "Running";
        rrQuantumTicks = 0;
      }

      executingPCB = rrRunningPCB;
    } else if (algorithm === "SJF_NONPREEMPTIVE") {
      if (nonPreemptiveRunningPCB === null) {
        const ready = pcbs.filter((p) => p.State === "Ready");
        if (ready.length > 0) {
          ready.sort((a, b) => {
            if (a.BurstTime !== b.BurstTime) {
              return a.BurstTime - b.BurstTime;
            }
            return breakTie(a, b);
          });
          nonPreemptiveRunningPCB = ready[0];
          nonPreemptiveRunningPCB.State = "Running";
        }
      }
      executingPCB = nonPreemptiveRunningPCB;
    } else if (algorithm === "SJF_PREEMPTIVE") {
      const candidates = pcbs.filter(
        (p) => (p.State === "Ready" || p.State === "Running") && p.RemainingTime > 0
      );

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (a.RemainingTime !== b.RemainingTime) {
            return a.RemainingTime - b.RemainingTime;
          }
          return breakTie(a, b);
        });

        const best = candidates[0];
        if (activeRunningPCB !== null && activeRunningPCB !== best) {
          if (activeRunningPCB.RemainingTime > 0) {
            activeRunningPCB.State = "Ready";
          }
        }
        best.State = "Running";
        activeRunningPCB = best;
        executingPCB = best;
      } else {
        activeRunningPCB = null;
        executingPCB = null;
      }
    } else if (algorithm === "PRIORITY") {
      if (priorityPreemptive) {
        const candidates = pcbs.filter(
          (p) => (p.State === "Ready" || p.State === "Running") && p.RemainingTime > 0
        );

        if (candidates.length > 0) {
          candidates.sort(comparePriority);
          const best = candidates[0];
          if (activeRunningPCB !== null && activeRunningPCB !== best) {
            if (activeRunningPCB.RemainingTime > 0) {
              activeRunningPCB.State = "Ready";
            }
          }
          best.State = "Running";
          activeRunningPCB = best;
          executingPCB = best;
        } else {
          activeRunningPCB = null;
          executingPCB = null;
        }
      } else {
        if (nonPreemptiveRunningPCB === null) {
          const ready = pcbs.filter((p) => p.State === "Ready");
          if (ready.length > 0) {
            ready.sort(comparePriority);
            nonPreemptiveRunningPCB = ready[0];
            nonPreemptiveRunningPCB.State = "Running";
          }
        }
        executingPCB = nonPreemptiveRunningPCB;
      }
    }

    // 2. Emit per-tick snapshot at start of tick
    const remainingTimes: Record<string, number> = {};
    for (const p of pcbs) {
      remainingTimes[p.ProcessID] = p.RemainingTime;
    }

    let readyQueueIds: string[] = [];
    if (algorithm === "ROUND_ROBIN") {
      readyQueueIds = rrReadyQueue.map((p) => p.ProcessID);
    } else if (algorithm === "SJF_NONPREEMPTIVE") {
      readyQueueIds = pcbs
        .filter((p) => p.State === "Ready")
        .sort((a, b) => (a.BurstTime !== b.BurstTime ? a.BurstTime - b.BurstTime : breakTie(a, b)))
        .map((p) => p.ProcessID);
    } else if (algorithm === "SJF_PREEMPTIVE") {
      readyQueueIds = pcbs
        .filter((p) => p.State === "Ready")
        .sort((a, b) =>
          a.RemainingTime !== b.RemainingTime ? a.RemainingTime - b.RemainingTime : breakTie(a, b)
        )
        .map((p) => p.ProcessID);
    } else if (algorithm === "PRIORITY") {
      readyQueueIds = pcbs
        .filter((p) => p.State === "Ready")
        .sort(comparePriority)
        .map((p) => p.ProcessID);
    }

    snapshots.push({
      tick: currentTick,
      readyQueue: readyQueueIds,
      runningProcess: executingPCB ? executingPCB.ProcessID : null,
      remainingTimes,
      processes: pcbs.map((p) => ({
        ProcessID: p.ProcessID,
        RemainingTime: p.RemainingTime,
        State: p.State,
        Priority: p.Priority,
        currentPriority: p.currentPriority,
      })),
    });

    // 3. Record in Gantt chart (merge consecutive ticks of the same process)
    const tickProcessId = executingPCB ? executingPCB.ProcessID : null;
    if (segments.length === 0) {
      segments.push({
        processId: tickProcessId,
        start: currentTick,
        end: currentTick + 1,
      });
    } else {
      const last = segments[segments.length - 1];
      if (last.processId === tickProcessId) {
        last.end = currentTick + 1;
      } else {
        segments.push({
          processId: tickProcessId,
          start: currentTick,
          end: currentTick + 1,
        });
      }
    }

    // 4. Run 1 tick on executing process
    if (executingPCB) {
      executingPCB.RemainingTime -= 1;
      if (algorithm === "ROUND_ROBIN") {
        rrQuantumTicks += 1;
      }
    }

    // 5. Update waiting and apply aging to Ready processes
    for (const p of pcbs) {
      if (p.State === "Ready") {
        p.readyWaitTicks = (p.readyWaitTicks ?? 0) + 1;
        if (
          algorithm === "PRIORITY" &&
          agingInterval !== undefined &&
          agingInterval >= 1 &&
          p.readyWaitTicks % agingInterval === 0
        ) {
          p.currentPriority = (p.currentPriority ?? p.Priority ?? 0) - 1;
        }
      }
    }

    // 6. Handle process completion at currentTick + 1
    const nextTick = currentTick + 1;

    if (algorithm === "ROUND_ROBIN") {
      if (rrRunningPCB && rrRunningPCB.RemainingTime === 0) {
        rrRunningPCB.State = "Terminated";
        rrRunningPCB.CompletionTime = nextTick;
        terminatedCount += 1;
        rrRunningPCB = null;
        rrQuantumTicks = 0;
      }
    } else if (algorithm === "SJF_NONPREEMPTIVE") {
      if (nonPreemptiveRunningPCB && nonPreemptiveRunningPCB.RemainingTime === 0) {
        nonPreemptiveRunningPCB.State = "Terminated";
        nonPreemptiveRunningPCB.CompletionTime = nextTick;
        terminatedCount += 1;
        nonPreemptiveRunningPCB = null;
      }
    } else if (algorithm === "SJF_PREEMPTIVE") {
      if (activeRunningPCB && activeRunningPCB.RemainingTime === 0) {
        activeRunningPCB.State = "Terminated";
        activeRunningPCB.CompletionTime = nextTick;
        terminatedCount += 1;
        activeRunningPCB = null;
      }
    } else if (algorithm === "PRIORITY") {
      if (priorityPreemptive) {
        if (activeRunningPCB && activeRunningPCB.RemainingTime === 0) {
          activeRunningPCB.State = "Terminated";
          activeRunningPCB.CompletionTime = nextTick;
          terminatedCount += 1;
          activeRunningPCB = null;
        }
      } else {
        if (nonPreemptiveRunningPCB && nonPreemptiveRunningPCB.RemainingTime === 0) {
          nonPreemptiveRunningPCB.State = "Terminated";
          nonPreemptiveRunningPCB.CompletionTime = nextTick;
          terminatedCount += 1;
          nonPreemptiveRunningPCB = null;
        }
      }
    }

    currentTick = nextTick;
  }

  // 7. Compute per-process metrics
  const perProcessMetrics: ProcessMetrics[] = processes.map((p) => {
    const pcb = pcbs.find((x) => x.ProcessID === p.ProcessID)!;
    const completionTime = pcb.CompletionTime ?? 0;
    const turnaroundTime = completionTime - p.ArrivalTime;
    const waitingTime = turnaroundTime - p.BurstTime;

    return {
      ProcessID: p.ProcessID,
      ArrivalTime: p.ArrivalTime,
      BurstTime: p.BurstTime,
      CompletionTime: completionTime,
      TurnaroundTime: turnaroundTime,
      WaitingTime: waitingTime,
    };
  });

  const totalWaiting = perProcessMetrics.reduce((sum, m) => sum + m.WaitingTime, 0);
  const totalTurnaround = perProcessMetrics.reduce((sum, m) => sum + m.TurnaroundTime, 0);
  const averageWaitingTime = perProcessMetrics.length > 0 ? totalWaiting / perProcessMetrics.length : 0;
  const averageTurnaroundTime =
    perProcessMetrics.length > 0 ? totalTurnaround / perProcessMetrics.length : 0;

  const totalSimulationTime =
    segments.length > 0 ? segments[segments.length - 1].end : 0;
  const throughput =
    totalSimulationTime > 0 ? processes.length / totalSimulationTime : 0;

  return {
    success: true,
    segments,
    perProcessMetrics,
    metrics: perProcessMetrics,
    averageWaitingTime,
    averageTurnaroundTime,
    throughput,
    snapshots,
  };
}
