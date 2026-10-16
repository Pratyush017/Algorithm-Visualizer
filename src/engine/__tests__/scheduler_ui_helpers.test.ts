import { describe, expect, it } from "vitest";
import {
  formatMetric,
  getScaledDurationMs,
  isControlsReady,
  validateAllDraftRows,
  validateDraftRow,
} from "../../components/scheduler/helpers";
import { ProcessDraftRow } from "../../components/scheduler/types";

describe("Scheduler UI Helpers", () => {
  describe("isControlsReady", () => {
    const validProcesses = [{ ProcessID: "P1", ArrivalTime: 0, BurstTime: 5 }];

    it("returns false if algorithm is empty or processes list is empty", () => {
      expect(isControlsReady("", validProcesses, 2, 5)).toBe(false);
      expect(isControlsReady("SJF_NONPREEMPTIVE", [], 2, 5)).toBe(false);
    });

    it("stays disabled when any process in the list is invalid", () => {
      const invalidBurst = [{ ProcessID: "P1", ArrivalTime: 0, BurstTime: 0 }];
      expect(isControlsReady("SJF_NONPREEMPTIVE", invalidBurst, 2, 5)).toBe(false);

      const invalidArrival = [{ ProcessID: "P1", ArrivalTime: -1, BurstTime: 3 }];
      expect(isControlsReady("SJF_NONPREEMPTIVE", invalidArrival, 2, 5)).toBe(false);

      const duplicateIds = [
        { ProcessID: "P1", ArrivalTime: 0, BurstTime: 3 },
        { ProcessID: "P1", ArrivalTime: 1, BurstTime: 2 },
      ];
      expect(isControlsReady("SJF_NONPREEMPTIVE", duplicateIds, 2, 5)).toBe(false);
    });

    it("requires quantum >= 1 for Round Robin", () => {
      expect(isControlsReady("ROUND_ROBIN", validProcesses, 0, 5)).toBe(false);
      expect(isControlsReady("ROUND_ROBIN", validProcesses, -1, 5)).toBe(false);
      expect(isControlsReady("ROUND_ROBIN", validProcesses, NaN, 5)).toBe(false);
      expect(isControlsReady("ROUND_ROBIN", validProcesses, 2, 5)).toBe(true);
    });

    it("requires agingInterval >= 1 for Priority", () => {
      expect(isControlsReady("PRIORITY", validProcesses, 2, 0)).toBe(false);
      expect(isControlsReady("PRIORITY", validProcesses, 2, -3)).toBe(false);
      expect(isControlsReady("PRIORITY", validProcesses, 2, 4)).toBe(true);
    });

    it("enables controls for SJF algorithms with valid processes", () => {
      expect(isControlsReady("SJF_NONPREEMPTIVE", validProcesses, 1, 1)).toBe(true);
      expect(isControlsReady("SJF_PREEMPTIVE", validProcesses, 1, 1)).toBe(true);
    });
  });


  describe("validateDraftRow", () => {
    it("flags burst < 1 with exact spec error 'Must be 1 or more.'", () => {
      const row: ProcessDraftRow = {
        id: "1",
        ProcessID: "P1",
        ArrivalTime: "0",
        BurstTime: "0",
        Priority: "1",
      };
      const res = validateDraftRow(row, false);
      expect(res.isValid).toBe(false);
      expect(res.burstError).toBe("Must be 1 or more.");
    });

    it("accepts valid non-priority rows", () => {
      const row: ProcessDraftRow = {
        id: "1",
        ProcessID: "P1",
        ArrivalTime: "0",
        BurstTime: "5",
        Priority: "1",
      };
      const res = validateDraftRow(row, false);
      expect(res.isValid).toBe(true);
      expect(res.burstError).toBeUndefined();
    });

    it("validates priority when isPriority is true", () => {
      const invalidRow: ProcessDraftRow = {
        id: "1",
        ProcessID: "P1",
        ArrivalTime: "0",
        BurstTime: "5",
        Priority: "",
      };
      expect(validateDraftRow(invalidRow, true).isValid).toBe(false);

      const validRow: ProcessDraftRow = {
        id: "1",
        ProcessID: "P1",
        ArrivalTime: "0",
        BurstTime: "5",
        Priority: "2",
      };
      expect(validateDraftRow(validRow, true).isValid).toBe(true);
    });
  });

  describe("validateAllDraftRows", () => {
    it("flags duplicate process IDs", () => {
      const rows: ProcessDraftRow[] = [
        { id: "1", ProcessID: "P1", ArrivalTime: "0", BurstTime: "4", Priority: "1" },
        { id: "2", ProcessID: "P1", ArrivalTime: "1", BurstTime: "2", Priority: "1" },
      ];
      const res = validateAllDraftRows(rows, false);
      expect(res.hasErrors).toBe(true);
      expect(res.rowErrors["2"].idError).toBe("Duplicate Process ID.");
    });
  });

  describe("formatMetric", () => {
    it("returns em dash for null, undefined, or NaN", () => {
      expect(formatMetric(null)).toBe("—");
      expect(formatMetric(undefined)).toBe("—");
      expect(formatMetric(NaN)).toBe("—");
    });

    it("formats numbers accurately with decimal places", () => {
      expect(formatMetric(3)).toBe("3.0");
      expect(formatMetric(7)).toBe("7.0");
      expect(formatMetric(0.25)).toBe("0.25");
      expect(formatMetric(3.25)).toBe("3.25");
      expect(formatMetric(3.66666666)).toBe("3.67");
    });
  });

  describe("getScaledDurationMs", () => {
    it("scales durations inversely with speed but never below 50% base duration", () => {
      expect(getScaledDurationMs(300, 1.0)).toBe(300);
      expect(getScaledDurationMs(300, 0.5)).toBe(600);
      expect(getScaledDurationMs(300, 2.0)).toBe(150);
      // At 4x speed, 300 / 4 = 75, but floor is 50% of 300 = 150
      expect(getScaledDurationMs(300, 4.0)).toBe(150);
    });
  });
});
