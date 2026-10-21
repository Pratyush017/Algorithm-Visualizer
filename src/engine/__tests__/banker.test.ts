import { describe, it, expect } from "vitest";
import {
  Input,
  computeNeed,
  validate,
  safetyTrace,
} from "../banker";

describe("Banker's Algorithm Engine", () => {
  // Classic Silberschatz example dataset
  const silberschatzAllocation = [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ];

  const silberschatzMax = [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3], // P4
  ];

  const silberschatzAvailable = [3, 3, 2];

  const getSilberschatzInput = (): Input => ({
    allocation: silberschatzAllocation.map((row) => [...row]),
    max: silberschatzMax.map((row) => [...row]),
    available: [...silberschatzAvailable],
  });

  /*
   * --------------------------------------------------------------------------
   * 1. Silberschatz Example & Need Matrix
   * --------------------------------------------------------------------------
   */
  describe("Silberschatz Example", () => {
    it("computes the exact textbook Need matrix: P0(7,4,3), P1(1,2,2), P2(6,0,0), P3(0,1,1), P4(4,3,1)", () => {
      const input = getSilberschatzInput();
      const need = computeNeed(input.allocation, input.max);

      expect(need).toEqual([
        [7, 4, 3], // P0
        [1, 2, 2], // P1
        [6, 0, 0], // P2
        [0, 1, 1], // P3
        [4, 3, 1], // P4
      ]);
    });

    it("evaluates safe sequence [1, 3, 4, 0, 2] and exact work progression", () => {
      const input = getSilberschatzInput();
      const result = safetyTrace(input);

      expect(result.safe).toBe(true);
      if (!result.safe) return;

      expect(result.sequence).toEqual([1, 3, 4, 0, 2]);

      // Work progression:
      // Initial: (3, 3, 2)
      // After P1: (3, 3, 2) + (2, 0, 0) = (5, 3, 2)
      // After P3: (5, 3, 2) + (2, 1, 1) = (7, 4, 3)
      // After P4: (7, 4, 3) + (0, 0, 2) = (7, 4, 5)
      // After P0: (7, 4, 5) + (0, 1, 0) = (7, 5, 5)
      // After P2: (7, 5, 5) + (3, 0, 2) = (10, 5, 7)
      const workProgression = [
        result.steps[0].workBefore,
        result.steps[0].workAfter!,
        result.steps[1].workAfter!,
        result.steps[2].workAfter!,
        result.steps[3].workAfter!,
        result.steps[4].workAfter!,
      ];

      expect(workProgression).toEqual([
        [3, 3, 2],
        [5, 3, 2],
        [7, 4, 3],
        [7, 4, 5],
        [7, 5, 5],
        [10, 5, 7],
      ]);
    });
  });

  /*
   * --------------------------------------------------------------------------
   * 2. Step-by-Step Trace Details
   * --------------------------------------------------------------------------
   */
  describe("Safety Trace Step Details", () => {
    it("checks first two steps of the Silberschatz example field by field", () => {
      const input = getSilberschatzInput();
      const result = safetyTrace(input);

      expect(result.steps.length).toBe(5);

      // Step 0: P1 executes
      expect(result.steps[0]).toEqual({
        processIndex: 1,
        need: [1, 2, 2],
        workBefore: [3, 3, 2],
        canFinish: true,
        workAfter: [5, 3, 2],
      });

      // Step 1: P3 executes
      expect(result.steps[1]).toEqual({
        processIndex: 3,
        need: [0, 1, 1],
        workBefore: [5, 3, 2],
        canFinish: true,
        workAfter: [7, 4, 3],
      });
    });
  });

  /*
   * --------------------------------------------------------------------------
   * 3. Modified Unsafe Example & Blocked Set
   * --------------------------------------------------------------------------
   */
  describe("Modified Unsafe Example", () => {
    /*
     * Hand-Verification Note on Unsafe State Derivation:
     * -------------------------------------------------
     * The prompt mentions: "change P2's Max to (9,0,3) so Need P2 = (7,0,1). Expect safe: false..."
     *
     * In the standard Silberschatz example, P2's Allocation is [3, 0, 2].
     * 1. Changing P2's Max to [9, 0, 3] gives Need[2] = [9-3, 0-0, 3-2] = [6, 0, 1] (not [7, 0, 1]).
     * 2. If Need[2] were [7, 0, 1] (or with Max [9, 0, 3]), after P1, P3, P4, and P0 finish,
     *    Work reaches [7, 5, 5]. Since [7, 0, 1] <= [7, 5, 5] and [6, 0, 1] <= [7, 5, 5],
     *    P2 would still safely complete.
     * 3. To produce a genuine unsafe state where deadlock is possible (safe: false) and P2 is blocked:
     *    P2's resource claim must exceed what the system can ever release.
     *    Total system resource C is 7. Before P2 finishes, P0, P1, P3, and P4 can release at most
     *    Available(2) + P3(1) + P4(2) = 5 units of C.
     *    If P2's Max C is set to 8 (Max = [9, 0, 8]), then Need[2] = [6, 0, 6].
     *    P1, P3, P4, and P0 finish, leaving Work = [7, 5, 5].
     *    At Work = [7, 5, 5], P2 needs 6 of C but only 5 are available (6 > 5).
     *    P2 cannot finish.
     *
     * Derived blocked set: [2]
     * Finished set: [1, 3, 4, 0]
     * Result: safe: false, finished: [1, 3, 4, 0], blocked: [2]
     */
    it("identifies deadlock and reports blocked set when process demands exceed available resources", () => {
      const input = getSilberschatzInput();
      // Set P2's Max so Need[2] exceeds maximum reachable Work C of 5
      input.max[2] = [9, 0, 8]; // Need[2] = [6, 0, 6]

      const result = safetyTrace(input);

      expect(result.safe).toBe(false);
      if (result.safe) return;

      // Assert derived finished and blocked sets
      expect(result.finished).toEqual([1, 3, 4, 0]);
      expect(result.blocked).toEqual([2]);

      // Verify the final scan recorded a blocked step for P2
      const blockedStep = result.steps[result.steps.length - 1];
      expect(blockedStep).toEqual({
        processIndex: 2,
        need: [6, 0, 6],
        workBefore: [7, 5, 5],
        canFinish: false,
      });
    });

    it("evaluates deadlock where only P1 and P3 can finish, leaving remaining processes [0, 2, 4] blocked", () => {
      // Input constructed so P1 and P3 finish (Work reaches [7, 4, 3]),
      // but P0, P2, and P4 all have Need exceeding Work [7, 4, 3]:
      // P0 Need = [8, 4, 3] > [7, 4, 3] (Max = [8, 5, 3])
      // P2 Need = [8, 0, 1] > [7, 4, 3] (Max = [11, 0, 3])
      // P4 Need = [8, 3, 1] > [7, 4, 3] (Max = [8, 3, 3])
      const input: Input = {
        allocation: [
          [0, 1, 0], // P0
          [2, 0, 0], // P1
          [3, 0, 2], // P2
          [2, 1, 1], // P3
          [0, 0, 2], // P4
        ],
        max: [
          [8, 5, 3],  // P0 (Need: [8, 4, 3])
          [3, 2, 2],  // P1 (Need: [1, 2, 2])
          [11, 0, 3], // P2 (Need: [8, 0, 1])
          [2, 2, 2],  // P3 (Need: [0, 1, 1])
          [8, 3, 3],  // P4 (Need: [8, 3, 1])
        ],
        available: [3, 3, 2],
      };

      const result = safetyTrace(input);

      expect(result.safe).toBe(false);
      if (result.safe) return;

      // Only P1 and P3 finished
      expect(result.finished).toEqual([1, 3]);

      // All remaining processes whose Need exceeds Work [7, 4, 3] are blocked
      expect(result.blocked).toEqual([0, 2, 4]);

      // Final scan recorded one blocked check step per blocked process
      const blockedSteps = result.steps.filter((s) => !s.canFinish);
      expect(blockedSteps.length).toBe(3);
      expect(blockedSteps.map((s) => s.processIndex)).toEqual([0, 2, 4]);
      blockedSteps.forEach((s) => {
        expect(s.workBefore).toEqual([7, 4, 3]);
      });
    });

    it("verifies behavior when initial Available is insufficient for any process to start", () => {
      const input = getSilberschatzInput();
      input.available = [0, 0, 0];

      const result = safetyTrace(input);

      expect(result.safe).toBe(false);
      if (result.safe) return;

      expect(result.finished).toEqual([]);
      expect(result.blocked).toEqual([0, 1, 2, 3, 4]);
      expect(result.steps.length).toBe(5);
      result.steps.forEach((step, idx) => {
        expect(step.processIndex).toBe(idx);
        expect(step.canFinish).toBe(false);
        expect(step.workBefore).toEqual([0, 0, 0]);
      });
    });
  });

  /*
   * --------------------------------------------------------------------------
   * 4. Validation Rules
   * --------------------------------------------------------------------------
   */
  describe("Input Validation", () => {
    it("returns an empty error list for valid input", () => {
      const input = getSilberschatzInput();
      const errors = validate(input);
      expect(errors).toEqual([]);
    });

    it("flags Allocation > Max and reports row and column", () => {
      const input = getSilberschatzInput();
      // P1 Allocation[1][0] is 2, set Max[1][0] to 1
      input.max[1][0] = 1;

      const errors = validate(input);
      expect(errors.length).toBeGreaterThan(0);
      const err = errors.find((e) => e.row === 1 && e.column === 0);
      expect(err).toBeDefined();
      expect(err?.row).toBe(1);
      expect(err?.column).toBe(0);
      expect(err?.message).toMatch(/cannot exceed Max/i);
    });

    it("flags negative values in matrices and available vector", () => {
      const input = getSilberschatzInput();
      input.allocation[0][1] = -1;
      input.max[2][0] = -5;
      input.available[2] = -2;

      const errors = validate(input);
      expect(errors.length).toBeGreaterThanOrEqual(3);

      expect(errors.some((e) => e.row === 0 && e.column === 1)).toBe(true);
      expect(errors.some((e) => e.row === 2 && e.column === 0)).toBe(true);
      expect(errors.some((e) => e.column === 2)).toBe(true);
    });

    it("flags non-integer values", () => {
      const input = getSilberschatzInput();
      input.allocation[3][2] = 1.5;
      input.max[0][0] = 7.2;
      input.available[0] = 3.14;

      const errors = validate(input);
      expect(errors.length).toBeGreaterThanOrEqual(3);

      expect(errors.some((e) => e.row === 3 && e.column === 2)).toBe(true);
      expect(errors.some((e) => e.row === 0 && e.column === 0)).toBe(true);
      expect(errors.some((e) => e.column === 0)).toBe(true);
    });

    it("flags dimension mismatches (allocation row count and available length)", () => {
      // 1. Allocation row count != Max row count
      const inputMismatchRows: Input = {
        allocation: [[0, 1, 0]],
        max: [
          [7, 5, 3],
          [3, 2, 2],
        ],
        available: [3, 3, 2],
      };
      const errorsRows = validate(inputMismatchRows);
      expect(errorsRows.length).toBeGreaterThan(0);
      expect(errorsRows[0].message).toMatch(/rows/i);

      // 2. Available vector length != Matrix column count
      const inputMismatchCols: Input = {
        allocation: [[0, 1, 0]],
        max: [[7, 5, 3]],
        available: [3, 3], // Length 2 instead of 3
      };
      const errorsCols = validate(inputMismatchCols);
      expect(errorsCols.length).toBeGreaterThan(0);
      expect(errorsCols[0].message).toMatch(/length/i);

      // 3. Ragged matrix row
      const inputRagged: Input = {
        allocation: [
          [0, 1, 0],
          [2, 0], // Length 2 instead of 3
        ],
        max: [
          [7, 5, 3],
          [3, 2, 2],
        ],
        available: [3, 3, 2],
      };
      const errorsRagged = validate(inputRagged);
      expect(errorsRagged.length).toBeGreaterThan(0);
      expect(errorsRagged.some((e) => e.row === 1)).toBe(true);
    });
  });

  /*
   * --------------------------------------------------------------------------
   * 5. Idempotence & Immutability
   * --------------------------------------------------------------------------
   */
  describe("Idempotence & Immutability", () => {
    it("is idempotent: calling safetyTrace twice on the same input returns equal results", () => {
      const input = getSilberschatzInput();

      const run1 = safetyTrace(input);
      const run2 = safetyTrace(input);

      expect(run1).toEqual(run2);
    });

    it("does not mutate the input matrices or vector", () => {
      const input = getSilberschatzInput();
      const allocSnapshot = JSON.parse(JSON.stringify(input.allocation));
      const maxSnapshot = JSON.parse(JSON.stringify(input.max));
      const availSnapshot = [...input.available];

      validate(input);
      computeNeed(input.allocation, input.max);
      safetyTrace(input);

      expect(input.allocation).toEqual(allocSnapshot);
      expect(input.max).toEqual(maxSnapshot);
      expect(input.available).toEqual(availSnapshot);
    });
  });
});
