import { Input, ValidationError } from "./types";

/**
 * Validates the Banker's algorithm input.
 * Checks, in this order:
 * 1. Consistent dimensions (allocation and max both N x M, available length M).
 * 2. Every value is an integer >= 0.
 * 3. Allocation[i][j] <= Max[i][j].
 * Return an empty list when valid. Do not throw.
 */
export function validate(input: Input): ValidationError[] {
  const errors: ValidationError[] = [];

  const { allocation, max, available } = input;

  // 1. Consistent dimensions check
  const nAlloc = Array.isArray(allocation) ? allocation.length : 0;
  const nMax = Array.isArray(max) ? max.length : 0;
  const mAvail = Array.isArray(available) ? available.length : 0;

  if (nAlloc === 0 || nMax === 0 || mAvail === 0) {
    if (nAlloc !== nMax) {
      errors.push({
        row: null,
        column: null,
        message: `Allocation has ${nAlloc} rows, but Max has ${nMax} rows.`,
      });
    } else {
      errors.push({
        row: null,
        column: null,
        message: "Matrices and available vector must have at least one row and column.",
      });
    }
    return errors;
  }

  if (nAlloc !== nMax) {
    errors.push({
      row: null,
      column: null,
      message: `Allocation has ${nAlloc} rows, but Max has ${nMax} rows.`,
    });
    return errors;
  }

  const expectedM = mAvail;
  let dimensionMismatch = false;

  for (let i = 0; i < nAlloc; i++) {
    const allocRow = allocation[i];
    const maxRow = max[i];

    if (!Array.isArray(allocRow) || allocRow.length !== expectedM) {
      errors.push({
        row: i,
        column: null,
        message: `Allocation row ${i} has length ${allocRow?.length ?? 0}, expected ${expectedM}.`,
      });
      dimensionMismatch = true;
    }

    if (!Array.isArray(maxRow) || maxRow.length !== expectedM) {
      errors.push({
        row: i,
        column: null,
        message: `Max row ${i} has length ${maxRow?.length ?? 0}, expected ${expectedM}.`,
      });
      dimensionMismatch = true;
    }
  }

  // If dimension check fails, stop here to avoid out-of-bounds indexing in subsequent checks
  if (dimensionMismatch) {
    return errors;
  }

  // 2. Every value is an integer >= 0
  // Check allocation
  for (let i = 0; i < nAlloc; i++) {
    for (let j = 0; j < expectedM; j++) {
      const val = allocation[i][j];
      if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || isNaN(val)) {
        errors.push({
          row: i,
          column: j,
          message: `Allocation[${i}][${j}] must be a non-negative integer, received ${val}.`,
        });
      }
    }
  }

  // Check max
  for (let i = 0; i < nMax; i++) {
    for (let j = 0; j < expectedM; j++) {
      const val = max[i][j];
      if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || isNaN(val)) {
        errors.push({
          row: i,
          column: j,
          message: `Max[${i}][${j}] must be a non-negative integer, received ${val}.`,
        });
      }
    }
  }

  // Check available
  for (let j = 0; j < expectedM; j++) {
    const val = available[j];
    if (typeof val !== "number" || !Number.isInteger(val) || val < 0 || isNaN(val)) {
      errors.push({
        row: null,
        column: j,
        message: `Available[${j}] must be a non-negative integer, received ${val}.`,
      });
    }
  }

  // 3. Allocation[i][j] <= Max[i][j]
  for (let i = 0; i < nAlloc; i++) {
    for (let j = 0; j < expectedM; j++) {
      const a = allocation[i][j];
      const m = max[i][j];
      if (typeof a === "number" && typeof m === "number" && a > m) {
        errors.push({
          row: i,
          column: j,
          message: `Allocation[${i}][${j}] (${a}) cannot exceed Max[${i}][${j}] (${m}).`,
        });
      }
    }
  }

  return errors;
}
