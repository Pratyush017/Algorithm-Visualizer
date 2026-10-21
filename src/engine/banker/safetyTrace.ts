import { Input, SafetyTraceResult, TraceStep } from "./types";
import { computeNeed } from "./computeNeed";

/**
 * Executes Banker's Safety Algorithm and returns a step-by-step trace.
 * Only call on valid input.
 *
 * Algorithm:
 * Work = Available. Repeatedly scan processes in index order for an
 * unfinished process with Need[i] <= Work (element-wise). If found, record a
 * step, set Work += Allocation[i], mark finished, and restart the scan from
 * index 0. If none found, stop.
 * Each step records: processIndex, need (copy), workBefore (copy),
 * canFinish (boolean), workAfter (copy, only when canFinish is true).
 * Also record one step per blocked check on the final scan so the UI can show
 * why processes are blocked.
 * Result: { safe: true, sequence: number[], steps: TraceStep[] } or
 *         { safe: false, finished: number[], blocked: number[], steps: TraceStep[] }.
 * Tie-breaking: lowest process index, which the scan order already gives.
 */
export function safetyTrace(input: Input): SafetyTraceResult {
  const { allocation, max, available } = input;
  const N = allocation.length;
  const M = available.length;

  const work = [...available];
  const need = computeNeed(allocation, max);
  const finished = new Array<boolean>(N).fill(false);
  const sequence: number[] = [];
  const steps: TraceStep[] = [];

  const canFinish = (procIndex: number, currentWork: number[]): boolean => {
    const procNeed = need[procIndex];
    for (let j = 0; j < M; j++) {
      if (procNeed[j] > currentWork[j]) {
        return false;
      }
    }
    return true;
  };

  while (sequence.length < N) {
    let foundInPass = false;

    for (let i = 0; i < N; i++) {
      if (!finished[i] && canFinish(i, work)) {
        const workBefore = [...work];
        for (let j = 0; j < M; j++) {
          work[j] += allocation[i][j];
        }
        const workAfter = [...work];
        finished[i] = true;
        sequence.push(i);

        steps.push({
          processIndex: i,
          need: [...need[i]],
          workBefore,
          canFinish: true,
          workAfter,
        });

        foundInPass = true;
      }
    }

    if (!foundInPass) {
      // Final scan: record one step per blocked check on the final scan
      // so the UI can show why processes are blocked.
      const blocked: number[] = [];
      for (let i = 0; i < N; i++) {
        if (!finished[i]) {
          blocked.push(i);
          steps.push({
            processIndex: i,
            need: [...need[i]],
            workBefore: [...work],
            canFinish: false,
          });
        }
      }

      return {
        safe: false,
        finished: sequence,
        blocked,
        steps,
      };
    }
  }

  return {
    safe: true,
    sequence,
    steps,
  };
}
