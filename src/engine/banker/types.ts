export type Matrix = number[][];
export type Vector = number[];

export interface Input {
  allocation: Matrix;
  max: Matrix;
  available: number[];
}

export interface ValidationError {
  row?: number | null;
  column?: number | null;
  message: string;
}

export interface TraceStep {
  processIndex: number;
  need: number[];
  workBefore: number[];
  canFinish: boolean;
  workAfter?: number[];
}

export type SafetyTraceResult =
  | {
      safe: true;
      sequence: number[];
      steps: TraceStep[];
    }
  | {
      safe: false;
      finished: number[];
      blocked: number[];
      steps: TraceStep[];
    };
