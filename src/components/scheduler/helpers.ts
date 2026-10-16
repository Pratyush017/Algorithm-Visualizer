import { Process, SchedulingAlgorithm } from "@/engine/scheduler";
import { PlaySpeed, ProcessDraftRow } from "./types";

export function isControlsReady(
  algorithm: SchedulingAlgorithm | "",
  processes: Process[],
  quantum: number,
  agingInterval: number
): boolean {
  if (!algorithm || !processes || processes.length === 0) {
    return false;
  }

  const seenIds = new Set<string>();
  for (const p of processes) {
    if (!p.ProcessID || !p.ProcessID.trim() || seenIds.has(p.ProcessID.trim())) {
      return false;
    }
    seenIds.add(p.ProcessID.trim());

    if (
      typeof p.BurstTime !== "number" ||
      isNaN(p.BurstTime) ||
      !Number.isInteger(p.BurstTime) ||
      p.BurstTime < 1
    ) {
      return false;
    }

    if (
      typeof p.ArrivalTime !== "number" ||
      isNaN(p.ArrivalTime) ||
      !Number.isInteger(p.ArrivalTime) ||
      p.ArrivalTime < 0
    ) {
      return false;
    }

    if (algorithm === "PRIORITY" && p.Priority !== undefined) {
      if (
        typeof p.Priority !== "number" ||
        isNaN(p.Priority) ||
        !Number.isInteger(p.Priority) ||
        p.Priority < 0
      ) {
        return false;
      }
    }
  }

  if (algorithm === "ROUND_ROBIN" && (isNaN(quantum) || quantum < 1)) {
    return false;
  }
  if (algorithm === "PRIORITY" && (isNaN(agingInterval) || agingInterval < 1)) {
    return false;
  }
  return true;
}

export interface RowValidationResult {
  burstError?: string;
  arrivalError?: string;
  idError?: string;
  priorityError?: string;
  isValid: boolean;
}

export function validateDraftRow(
  row: ProcessDraftRow,
  isPriority: boolean
): RowValidationResult {
  let burstError: string | undefined;
  let arrivalError: string | undefined;
  let idError: string | undefined;
  let priorityError: string | undefined;

  const trimmedId = row.ProcessID.trim();
  if (!trimmedId) {
    idError = "Process ID is required.";
  }

  const burstNum = Number(row.BurstTime);
  if (!row.BurstTime || isNaN(burstNum) || !Number.isInteger(burstNum) || burstNum < 1) {
    burstError = "Must be 1 or more.";
  }

  const arrivalNum = Number(row.ArrivalTime);
  if (row.ArrivalTime === "" || isNaN(arrivalNum) || !Number.isInteger(arrivalNum) || arrivalNum < 0) {
    arrivalError = "Must be 0 or more.";
  }

  if (isPriority) {
    const prioNum = Number(row.Priority);
    if (row.Priority === "" || isNaN(prioNum) || !Number.isInteger(prioNum) || prioNum < 0) {
      priorityError = "Must be 0 or more.";
    }
  }

  const isValid = !burstError && !arrivalError && !idError && !priorityError;

  return {
    burstError,
    arrivalError,
    idError,
    priorityError,
    isValid,
  };
}

export function validateAllDraftRows(
  rows: ProcessDraftRow[],
  isPriority: boolean
): {
  hasErrors: boolean;
  rowErrors: Record<string, RowValidationResult>;
} {
  const rowErrors: Record<string, RowValidationResult> = {};
  const seenIds = new Set<string>();
  let hasErrors = rows.length === 0;

  for (const row of rows) {
    const res = validateDraftRow(row, isPriority);
    const trimmedId = row.ProcessID.trim();
    if (trimmedId && seenIds.has(trimmedId)) {
      res.idError = "Duplicate Process ID.";
      res.isValid = false;
    }
    if (trimmedId) {
      seenIds.add(trimmedId);
    }
    rowErrors[row.id] = res;
    if (!res.isValid) {
      hasErrors = true;
    }
  }

  return { hasErrors, rowErrors };
}

export function formatMetric(value: number | null | undefined, precision = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "—";
  }
  if (Number.isInteger(value)) {
    return value.toFixed(1);
  }
  const factor = Math.pow(10, precision);
  const rounded = Math.round(value * factor) / factor;
  if (Number.isInteger(rounded)) {
    return rounded.toFixed(1);
  }
  return rounded.toString();
}

export function getScaledDurationMs(baseMs: number, speed: PlaySpeed): number {
  return Math.max(baseMs / speed, baseMs * 0.5);
}
