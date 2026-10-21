import { Matrix } from "./types";

/**
 * Computes Need = Max - Allocation element-wise.
 * Returns a new matrix without mutating inputs.
 */
export function computeNeed(allocation: Matrix, max: Matrix): Matrix {
  return max.map((row, i) =>
    row.map((maxVal, j) => maxVal - (allocation[i]?.[j] ?? 0))
  );
}
