import { describe, expect, it } from "vitest";
import { Process, simulate } from "../scheduler";

describe("CPU Scheduling Engine", () => {
  /*
   * --------------------------------------------------------------------------
   * 1. Shortest Job First (SJF) Non-Preemptive
   *
   * Workload:
   *   P1: Arrival=0, Burst=6
   *   P2: Arrival=1, Burst=2
   *   P3: Arrival=2, Burst=4
   *
   * Hand computation:
   *   t=0: Only P1 is ready. P1 starts and runs to completion (non-preemptive).
   *   t=1: P2 arrives (burst 2).
   *   t=2: P3 arrives (burst 4).
   *   t=6: P1 finishes. Ready: P2 (burst 2), P3 (burst 4).
   *        P2 is chosen (2 < 4). P2 runs t=6 to t=8.
   *   t=8: P2 finishes. Ready: P3 (burst 4). P3 runs t=8 to t=12.
   *   t=12: P3 finishes.
   *
   * Expected Gantt:
   *   [0, 6]: P1
   *   [6, 8]: P2
   *   [8, 12]: P3
   *
   * Expected Metrics:
   *   P1: Completion=6, Turnaround=6, Waiting=0
   *   P2: Completion=8, Turnaround=7, Waiting=5
   *   P3: Completion=12, Turnaround=10, Waiting=6
   *   Avg Waiting = (0 + 5 + 6) / 3 = 11 / 3 ≈ 3.6667
   *   Avg Turnaround = (6 + 7 + 10) / 3 = 23 / 3 ≈ 7.6667
   *   Throughput = 3 / 12 = 0.25
   * --------------------------------------------------------------------------
   */
  it("executes SJF non-preemptive with hand-computed Gantt chart and metrics", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 6 },
      { ProcessID: "P2", ArrivalTime: 1, BurstTime: 2 },
      { ProcessID: "P3", ArrivalTime: 2, BurstTime: 4 },
    ];

    const res = simulate(processes, "SJF_NONPREEMPTIVE");
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.segments).toEqual([
      { processId: "P1", start: 0, end: 6 },
      { processId: "P2", start: 6, end: 8 },
      { processId: "P3", start: 8, end: 12 },
    ]);

    const p1 = res.perProcessMetrics.find((m) => m.ProcessID === "P1")!;
    const p2 = res.perProcessMetrics.find((m) => m.ProcessID === "P2")!;
    const p3 = res.perProcessMetrics.find((m) => m.ProcessID === "P3")!;

    expect(p1.CompletionTime).toBe(6);
    expect(p1.TurnaroundTime).toBe(6);
    expect(p1.WaitingTime).toBe(0);

    expect(p2.CompletionTime).toBe(8);
    expect(p2.TurnaroundTime).toBe(7);
    expect(p2.WaitingTime).toBe(5);

    expect(p3.CompletionTime).toBe(12);
    expect(p3.TurnaroundTime).toBe(10);
    expect(p3.WaitingTime).toBe(6);

    expect(res.averageWaitingTime).toBeCloseTo(11 / 3, 4);
    expect(res.averageTurnaroundTime).toBeCloseTo(23 / 3, 4);
    expect(res.throughput).toBeCloseTo(3 / 12, 4);
  });

  /*
   * --------------------------------------------------------------------------
   * 2. Shortest Remaining Time First (SRTF / SJF Preemptive)
   *
   * Workload:
   *   P1: Arrival=0, Burst=8
   *   P2: Arrival=1, Burst=4
   *   P3: Arrival=2, Burst=9
   *   P4: Arrival=3, Burst=5
   *
   * Hand computation:
   *   t=0: P1 arrives (rem 8). P1 runs [0, 1). P1 rem 7.
   *   t=1: P2 arrives (rem 4). P2 has shorter remaining time than P1 (4 < 7).
   *        P1 preempted. P2 runs [1, 5). P2 finishes at t=5.
   *        (P3 arrives at t=2 rem 9; P4 arrives at t=3 rem 5).
   *   t=5: P2 completes. Ready: P4 (rem 5), P1 (rem 7), P3 (rem 9).
   *        P4 is shortest (5). P4 runs [5, 10). P4 finishes at t=10.
   *   t=10: P4 completes. Ready: P1 (rem 7), P3 (rem 9).
   *         P1 is shortest (7). P1 runs [10, 17). P1 finishes at t=17.
   *   t=17: P1 completes. Ready: P3 (rem 9).
   *         P3 runs [17, 26). P3 finishes at t=26.
   *
   * Expected Gantt:
   *   [0, 1]: P1
   *   [1, 5]: P2
   *   [5, 10]: P4
   *   [10, 17]: P1
   *   [17, 26]: P3
   *
   * Expected Metrics:
   *   P1: Completion=17, Turnaround=17, Waiting=9
   *   P2: Completion=5, Turnaround=4, Waiting=0
   *   P3: Completion=26, Turnaround=24, Waiting=15
   *   P4: Completion=10, Turnaround=7, Waiting=2
   *   Avg Waiting = (9 + 0 + 15 + 2) / 4 = 26 / 4 = 6.5
   *   Avg Turnaround = (17 + 4 + 24 + 7) / 4 = 52 / 4 = 13
   *   Throughput = 4 / 26 ≈ 0.1538
   * --------------------------------------------------------------------------
   */
  it("executes SRTF (SJF Preemptive) with preemption and hand-computed metrics", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 8 },
      { ProcessID: "P2", ArrivalTime: 1, BurstTime: 4 },
      { ProcessID: "P3", ArrivalTime: 2, BurstTime: 9 },
      { ProcessID: "P4", ArrivalTime: 3, BurstTime: 5 },
    ];

    const res = simulate(processes, "SJF_PREEMPTIVE");
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.segments).toEqual([
      { processId: "P1", start: 0, end: 1 },
      { processId: "P2", start: 1, end: 5 },
      { processId: "P4", start: 5, end: 10 },
      { processId: "P1", start: 10, end: 17 },
      { processId: "P3", start: 17, end: 26 },
    ]);

    const p1 = res.perProcessMetrics.find((m) => m.ProcessID === "P1")!;
    const p2 = res.perProcessMetrics.find((m) => m.ProcessID === "P2")!;
    const p3 = res.perProcessMetrics.find((m) => m.ProcessID === "P3")!;
    const p4 = res.perProcessMetrics.find((m) => m.ProcessID === "P4")!;

    expect(p1.CompletionTime).toBe(17);
    expect(p1.TurnaroundTime).toBe(17);
    expect(p1.WaitingTime).toBe(9);

    expect(p2.CompletionTime).toBe(5);
    expect(p2.TurnaroundTime).toBe(4);
    expect(p2.WaitingTime).toBe(0);

    expect(p3.CompletionTime).toBe(26);
    expect(p3.TurnaroundTime).toBe(24);
    expect(p3.WaitingTime).toBe(15);

    expect(p4.CompletionTime).toBe(10);
    expect(p4.TurnaroundTime).toBe(7);
    expect(p4.WaitingTime).toBe(2);

    expect(res.averageWaitingTime).toBe(6.5);
    expect(res.averageTurnaroundTime).toBe(13);
    expect(res.throughput).toBeCloseTo(4 / 26, 4);
  });

  /*
   * --------------------------------------------------------------------------
   * 3. Round Robin with Quantum Expiry and Re-queuing
   *
   * Workload:
   *   P1: Arrival=0, Burst=5
   *   P2: Arrival=1, Burst=3
   *   P3: Arrival=2, Burst=1
   *   Quantum = 2
   *
   * Hand computation:
   *   t=0: P1 arrives. P1 runs [0, 1). P1 rem 4.
   *   t=1: P2 arrives into readyQueue: [P2]. P1 continues [1, 2). P1 rem 3.
   *   t=2: P3 arrives.
   *        P1 quantum expires (2 ticks ran). P3 is admitted first, then P1 re-queued.
   *        readyQueue: [P2, P3, P1].
   *        P2 is dispatched: runs [2, 4). P2 rem 1.
   *   t=4: P2 quantum expires. P2 re-queued.
   *        readyQueue: [P3, P1, P2].
   *        P3 is dispatched: burst 1. Runs [4, 5).
   *   t=5: P3 finishes! Completion=5.
   *        readyQueue: [P1, P2].
   *        P1 is dispatched: runs [5, 7). P1 rem 1.
   *   t=7: P1 quantum expires. P1 re-queued.
   *        readyQueue: [P2, P1].
   *        P2 is dispatched: runs [7, 8).
   *   t=8: P2 finishes! Completion=8.
   *        readyQueue: [P1].
   *        P1 is dispatched: runs [8, 9).
   *   t=9: P1 finishes! Completion=9.
   *
   * Expected Gantt:
   *   [0, 2]: P1
   *   [2, 4]: P2
   *   [4, 5]: P3
   *   [5, 7]: P1
   *   [7, 8]: P2
   *   [8, 9]: P1
   *
   * Expected Metrics:
   *   P1: Completion=9, Turnaround=9, Waiting=4
   *   P2: Completion=8, Turnaround=7, Waiting=4
   *   P3: Completion=5, Turnaround=3, Waiting=2
   *   Avg Waiting = (4 + 4 + 2) / 3 = 10 / 3 ≈ 3.3333
   *   Avg Turnaround = (9 + 7 + 3) / 3 = 19 / 3 ≈ 6.3333
   *   Throughput = 3 / 9 ≈ 0.3333
   * --------------------------------------------------------------------------
   */
  it("executes Round Robin with quantum expiry and correct queue ordering", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 5 },
      { ProcessID: "P2", ArrivalTime: 1, BurstTime: 3 },
      { ProcessID: "P3", ArrivalTime: 2, BurstTime: 1 },
    ];

    const res = simulate(processes, "ROUND_ROBIN", { quantum: 2 });
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.segments).toEqual([
      { processId: "P1", start: 0, end: 2 },
      { processId: "P2", start: 2, end: 4 },
      { processId: "P3", start: 4, end: 5 },
      { processId: "P1", start: 5, end: 7 },
      { processId: "P2", start: 7, end: 8 },
      { processId: "P1", start: 8, end: 9 },
    ]);

    const p1 = res.perProcessMetrics.find((m) => m.ProcessID === "P1")!;
    const p2 = res.perProcessMetrics.find((m) => m.ProcessID === "P2")!;
    const p3 = res.perProcessMetrics.find((m) => m.ProcessID === "P3")!;

    expect(p1.CompletionTime).toBe(9);
    expect(p1.TurnaroundTime).toBe(9);
    expect(p1.WaitingTime).toBe(4);

    expect(p2.CompletionTime).toBe(8);
    expect(p2.TurnaroundTime).toBe(7);
    expect(p2.WaitingTime).toBe(4);

    expect(p3.CompletionTime).toBe(5);
    expect(p3.TurnaroundTime).toBe(3);
    expect(p3.WaitingTime).toBe(2);

    expect(res.averageWaitingTime).toBeCloseTo(10 / 3, 4);
    expect(res.averageTurnaroundTime).toBeCloseTo(19 / 3, 4);
    expect(res.throughput).toBeCloseTo(3 / 9, 4);
  });

  /*
   * --------------------------------------------------------------------------
   * 4. Priority Scheduling with Aging
   *
   * Workload:
   *   P1: Arrival=0, Burst=4, Priority=3
   *   P2: Arrival=0, Burst=3, Priority=1 (highest priority)
   *   P3: Arrival=0, Burst=2, Priority=5 (lowest priority)
   *   AgingInterval = 2
   *
   * Hand computation:
   *   t=0: All processes arrive at t=0.
   *        P2 has priority 1 (highest). P2 runs [0, 3) to completion.
   *        During t=0 to 3:
   *        P1 waits 3 ticks in Ready. At 2 ticks, priority ages from 3 to 2.
   *        P3 waits 3 ticks in Ready. At 2 ticks, priority ages from 5 to 4.
   *   t=3: P2 completes (C=3, TT=3, W=0).
   *        Ready: P1 (aged to 2), P3 (aged to 4).
   *        P1 is chosen (2 < 4). P1 runs [3, 7) to completion.
   *        During t=3 to 7: P3 waits 4 more ticks in Ready (total wait 7).
   *        P3 priority ages at wait=4 (to 3) and wait=6 (to 2).
   *   t=7: P1 completes (C=7, TT=7, W=3).
   *        P3 runs [7, 9) to completion.
   *   t=9: P3 completes (C=9, TT=9, W=7).
   *
   * Expected Gantt:
   *   [0, 3]: P2
   *   [3, 7]: P1
   *   [7, 9]: P3
   * --------------------------------------------------------------------------
   */
  it("executes Priority scheduling with aging preventing starvation", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 4, Priority: 3 },
      { ProcessID: "P2", ArrivalTime: 0, BurstTime: 3, Priority: 1 },
      { ProcessID: "P3", ArrivalTime: 0, BurstTime: 2, Priority: 5 },
    ];

    const res = simulate(processes, "PRIORITY", { agingInterval: 2 });
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.segments).toEqual([
      { processId: "P2", start: 0, end: 3 },
      { processId: "P1", start: 3, end: 7 },
      { processId: "P3", start: 7, end: 9 },
    ]);

    const p2 = res.perProcessMetrics.find((m) => m.ProcessID === "P2")!;
    const p1 = res.perProcessMetrics.find((m) => m.ProcessID === "P1")!;
    const p3 = res.perProcessMetrics.find((m) => m.ProcessID === "P3")!;

    expect(p2.CompletionTime).toBe(3);
    expect(p1.CompletionTime).toBe(7);
    expect(p3.CompletionTime).toBe(9);
  });

  /*
   * --------------------------------------------------------------------------
   * 5. Tie-breaking rules
   * Rule: earliest ArrivalTime, then lowest ProcessID.
   * --------------------------------------------------------------------------
   */
  it("breaks ties by earliest ArrivalTime first, then lowest ProcessID", () => {
    // Both arrive at t=0 with identical burst time (3). P1 vs P2: lowest ProcessID wins.
    const pEqualArrival: Process[] = [
      { ProcessID: "P2", ArrivalTime: 0, BurstTime: 3 },
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 3 },
    ];

    const res1 = simulate(pEqualArrival, "SJF_NONPREEMPTIVE");
    expect(res1.success).toBe(true);
    if (!res1.success) return;

    expect(res1.segments).toEqual([
      { processId: "P1", start: 0, end: 3 },
      { processId: "P2", start: 3, end: 6 },
    ]);

    // Equal burst, but P2 arrived earlier than P1. Earliest arrival wins.
    const pDifferentArrival: Process[] = [
      { ProcessID: "P1", ArrivalTime: 2, BurstTime: 4 },
      { ProcessID: "P2", ArrivalTime: 0, BurstTime: 4 },
    ];

    const res2 = simulate(pDifferentArrival, "SJF_NONPREEMPTIVE");
    expect(res2.success).toBe(true);
    if (!res2.success) return;

    expect(res2.segments).toEqual([
      { processId: "P2", start: 0, end: 4 },
      { processId: "P1", start: 4, end: 8 },
    ]);
  });

  /*
   * --------------------------------------------------------------------------
   * 6. SRTF Preemption when a newly arriving job is shorter
   * --------------------------------------------------------------------------
   */
  it("preempts currently running job in SRTF when a shorter job arrives", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 10 },
      { ProcessID: "P2", ArrivalTime: 2, BurstTime: 1 },
    ];

    const res = simulate(processes, "SJF_PREEMPTIVE");
    expect(res.success).toBe(true);
    if (!res.success) return;

    // P1 runs [0, 2). At t=2, P1 remaining is 8. P2 arrives with burst 1.
    // P2 preempts P1 and runs [2, 3).
    // P1 resumes at t=3 and runs [3, 11).
    expect(res.segments).toEqual([
      { processId: "P1", start: 0, end: 2 },
      { processId: "P2", start: 2, end: 3 },
      { processId: "P1", start: 3, end: 11 },
    ]);
  });

  /*
   * --------------------------------------------------------------------------
   * 7. Idle CPU when no process has arrived
   * --------------------------------------------------------------------------
   */
  it("handles idle CPU intervals when no process has arrived at t=0", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 4, BurstTime: 2 },
    ];

    const res = simulate(processes, "SJF_NONPREEMPTIVE");
    expect(res.success).toBe(true);
    if (!res.success) return;

    // CPU is idle [0, 4), then executes P1 [4, 6)
    expect(res.segments).toEqual([
      { processId: null, start: 0, end: 4 },
      { processId: "P1", start: 4, end: 6 },
    ]);
  });

  /*
   * --------------------------------------------------------------------------
   * 8. Input Validation Errors (typed error, do not throw)
   * --------------------------------------------------------------------------
   */
  describe("Input validation", () => {
    it("returns typed error for empty process list", () => {
      const res = simulate([], "SJF_NONPREEMPTIVE");
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.code).toBe("EMPTY_PROCESS_LIST");
      expect(res.error).toBeDefined();
    });

    it("returns typed error for duplicate ProcessID", () => {
      const processes: Process[] = [
        { ProcessID: "P1", ArrivalTime: 0, BurstTime: 2 },
        { ProcessID: "P1", ArrivalTime: 1, BurstTime: 3 },
      ];
      const res = simulate(processes, "SJF_NONPREEMPTIVE");
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.code).toBe("DUPLICATE_PROCESS_ID");
    });

    it("returns typed error for invalid BurstTime (< 1)", () => {
      const processes: Process[] = [
        { ProcessID: "P1", ArrivalTime: 0, BurstTime: 0 },
      ];
      const res = simulate(processes, "SJF_NONPREEMPTIVE");
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.code).toBe("INVALID_BURST_TIME");
    });

    it("returns typed error for negative ArrivalTime", () => {
      const processes: Process[] = [
        { ProcessID: "P1", ArrivalTime: -1, BurstTime: 4 },
      ];
      const res = simulate(processes, "SJF_NONPREEMPTIVE");
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.code).toBe("INVALID_ARRIVAL_TIME");
    });

    it("returns typed error for Round Robin missing or invalid quantum (< 1)", () => {
      const processes: Process[] = [
        { ProcessID: "P1", ArrivalTime: 0, BurstTime: 3 },
      ];
      const resWithoutOptions = simulate(processes, "ROUND_ROBIN");
      expect(resWithoutOptions.success).toBe(false);
      if (!resWithoutOptions.success) {
        expect(resWithoutOptions.code).toBe("INVALID_QUANTUM");
      }

      const resZeroQuantum = simulate(processes, "ROUND_ROBIN", { quantum: 0 });
      expect(resZeroQuantum.success).toBe(false);
      if (!resZeroQuantum.success) {
        expect(resZeroQuantum.code).toBe("INVALID_QUANTUM");
      }
    });

    it("returns typed error for invalid agingInterval (< 1)", () => {
      const processes: Process[] = [
        { ProcessID: "P1", ArrivalTime: 0, BurstTime: 3, Priority: 1 },
      ];
      const res = simulate(processes, "PRIORITY", { agingInterval: 0 });
      expect(res.success).toBe(false);
      if (res.success) return;
      expect(res.code).toBe("INVALID_AGING_INTERVAL");
    });
  });

  /*
   * --------------------------------------------------------------------------
   * 9. Snapshot sequence matches Gantt chart tick by tick
   * --------------------------------------------------------------------------
   */
  it("emits per-tick snapshots that accurately match the Gantt chart tick by tick", () => {
    const processes: Process[] = [
      { ProcessID: "P1", ArrivalTime: 0, BurstTime: 3 },
      { ProcessID: "P2", ArrivalTime: 1, BurstTime: 1 },
    ];

    const res = simulate(processes, "SJF_PREEMPTIVE");
    expect(res.success).toBe(true);
    if (!res.success) return;

    // Total simulation time = 4 ticks (0 to 4)
    // At t=0: P1 runs [0, 1). P1 rem 2.
    // At t=1: P2 arrives (burst 1 < 2). P2 preempts and runs [1, 2).
    // At t=2: P1 resumes and runs [2, 4).
    expect(res.segments).toEqual([
      { processId: "P1", start: 0, end: 1 },
      { processId: "P2", start: 1, end: 2 },
      { processId: "P1", start: 2, end: 4 },
    ]);

    expect(res.snapshots.length).toBe(4);

    // Verify each tick corresponds directly to the active process in the Gantt segment
    for (let t = 0; t < res.snapshots.length; t++) {
      const snap = res.snapshots[t];
      expect(snap.tick).toBe(t);

      // Find segment covering this tick [t, t+1)
      const matchingSegment = res.segments.find(
        (seg) => seg.start <= t && seg.end >= t + 1
      );
      expect(matchingSegment).toBeDefined();
      expect(snap.runningProcess).toBe(matchingSegment!.processId);
    }

    // Inspect individual snapshot values at tick 0 and tick 1
    const snap0 = res.snapshots[0];
    expect(snap0.runningProcess).toBe("P1");
    expect(snap0.remainingTimes["P1"]).toBe(3);
    expect(snap0.readyQueue).toEqual([]);

    const snap1 = res.snapshots[1];
    // At t=1, P2 arrived (burst 1) < P1 remaining (2). P2 preempts P1.
    expect(snap1.runningProcess).toBe("P2");
    expect(snap1.remainingTimes["P2"]).toBe(1);
    expect(snap1.remainingTimes["P1"]).toBe(2);
    expect(snap1.readyQueue).toContain("P1");
  });
});
