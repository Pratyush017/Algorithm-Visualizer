"use client";

import { useMemo } from "react";
import { GanttSegment, Process, TickSnapshot } from "@/engine/scheduler";
import { compareProcessId } from "@/engine/scheduler/simulate";
import { PlaySpeed } from "./types";
import { getScaledDurationMs } from "./helpers";

interface CanvasProps {
  processes: Process[];
  snapshot: TickSnapshot | null;
  segments: GanttSegment[];
  currentTick: number;
  maxTicks: number;
  isSimulationRun: boolean;
  speed: PlaySpeed;
  isReducedMotion: boolean;
}

export function Canvas({
  processes,
  snapshot,
  segments,
  currentTick,
  maxTicks,
  isSimulationRun,
  speed,
  isReducedMotion,
}: CanvasProps) {
  // Sort processes by ProcessID order
  const sortedProcesses = useMemo(() => {
    return [...processes].sort((a, b) => compareProcessId(a.ProcessID, b.ProcessID));
  }, [processes]);

  // Animation durations
  const playheadDuration = isReducedMotion ? 0 : getScaledDurationMs(120, speed);
  const elementDuration = isReducedMotion ? 0 : getScaledDurationMs(300, speed);

  // 8 Ready Queue Slots
  const queueSlots = useMemo(() => {
    const q = snapshot?.readyQueue ?? [];
    const slots: (string | null)[] = [];
    for (let i = 0; i < 8; i++) {
      slots.push(q[i] ?? null);
    }
    return slots;
  }, [snapshot?.readyQueue]);

  const runningProcessId = snapshot?.runningProcess ?? null;

  // Compute playhead position percentage
  const playheadPercent =
    maxTicks > 0 ? Math.min(100, Math.max(0, (currentTick / maxTicks) * 100)) : 0;

  // Active Gantt slices up to current tick
  const visibleSegments = useMemo(() => {
    if (!isSimulationRun || maxTicks === 0) return [];
    return segments
      .map((seg) => {
        if (currentTick <= seg.start) return null;
        const actualEnd = Math.min(seg.end, currentTick);
        const widthPercent = ((actualEnd - seg.start) / maxTicks) * 100;
        const leftPercent = (seg.start / maxTicks) * 100;
        return {
          ...seg,
          leftPercent,
          widthPercent,
          actualEnd,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null && s.widthPercent > 0);
  }, [isSimulationRun, maxTicks, segments, currentTick]);

  return (
    <div
      className="flex-1 min-h-[480px] bg-surface border border-hairline p-6 flex flex-col justify-between gap-6 select-none"
      aria-label="Simulation Canvas"
    >
      {/* 1. Ready Queue Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-ink-muted">Ready queue</span>
          <span className="text-[14px] text-ink-muted tabular-nums">8 slots</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {queueSlots.map((pid, idx) => (
            <div
              key={`slot-${idx}`}
              className={`w-12 h-12 shrink-0 border border-dashed flex items-center justify-center font-medium text-[14px] tabular-nums transition-all ${
                pid
                  ? "bg-[#B9C3D6] text-ink border-transparent"
                  : "bg-[#F4F4F0] text-ink-muted border-hairline"
              }`}
              style={{
                transitionDuration: `${elementDuration}ms`,
                transitionProperty: "all",
                transitionTimingFunction: "ease-out",
              }}
            >
              {pid ?? "—"}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Execution Pipeline Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-ink-muted">Execution pipeline</span>
          <span className="text-[14px] text-ink-muted tabular-nums">
            {isSimulationRun ? `0 — ${maxTicks} ticks` : "Empty"}
          </span>
        </div>

        <div className="flex items-stretch gap-4">
          {/* CPU Slot */}
          <div className="w-28 h-24 border border-hairline bg-surface flex flex-col justify-between p-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold text-accent">CPU</span>
              <span
                className={`w-2 h-2 ${
                  runningProcessId ? "bg-accent" : "bg-[#D4D4CE]"
                }`}
              />
            </div>

            <div className="flex-1 flex items-center justify-center">
              <span
                key={runningProcessId ?? "idle"}
                className={`text-[16px] font-semibold tabular-nums transition-opacity ${
                  runningProcessId ? "text-accent" : "text-ink-muted"
                }`}
                style={{
                  transitionDuration: `${elementDuration}ms`,
                }}
              >
                {runningProcessId ?? "Idle"}
              </span>
            </div>

            <div className="text-[14px] text-ink-muted text-right tabular-nums">Core 0</div>
          </div>

          {/* Gantt Timeline */}
          <div className="flex-1 border border-hairline bg-surface flex flex-col justify-between p-2 relative overflow-hidden">
            {/* Timeline Area */}
            <div className="flex-1 flex items-center relative min-h-[44px]">
              {!isSimulationRun ? (
                <div className="w-full h-9 border border-dashed border-hairline bg-[#F4F4F0] flex items-center justify-center text-[14px] text-ink-muted px-4">
                  Pipeline empty — awaiting simulation run
                </div>
              ) : (
                <div className="w-full h-9 border border-hairline bg-[#F4F4F0] relative overflow-hidden flex items-center">
                  {/* Gantt Slices */}
                  {visibleSegments.map((seg, idx) => (
                    <div
                      key={`seg-${idx}-${seg.start}`}
                      className={`absolute top-0 bottom-0 flex items-center justify-center text-[14px] font-semibold tabular-nums transition-all ${
                        seg.processId
                          ? "bg-accent text-white"
                          : "bg-hairline text-ink-muted"
                      }`}
                      style={{
                        left: `${seg.leftPercent}%`,
                        width: `${seg.widthPercent}%`,
                        transitionDuration: `${elementDuration}ms`,
                        transitionProperty: "width, left",
                        transitionTimingFunction: "ease-out",
                      }}
                    >
                      {seg.processId ?? "Idle"}
                    </div>
                  ))}

                  {/* Playhead Vertical Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-accent z-20 pointer-events-none transition-all"
                    style={{
                      left: `${playheadPercent}%`,
                      transitionDuration: `${playheadDuration}ms`,
                      transitionProperty: "left",
                      transitionTimingFunction: "ease-out",
                    }}
                  >
                    <div className="w-2 h-2 -ml-[3px] bg-accent" />
                  </div>
                </div>
              )}
            </div>

            {/* Scale Axis */}
            <div className="h-5 flex items-end justify-between border-t border-hairline pt-1 px-1 text-[14px] text-ink-muted tabular-nums">
              <span>t = 0</span>
              {maxTicks > 2 && (
                <>
                  <span>t = {Math.round(maxTicks / 2)}</span>
                </>
              )}
              <span>t = {maxTicks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Process Rows Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-ink-muted">Processes</span>
          <span className="text-[14px] text-ink-muted tabular-nums">
            {processes.length} {processes.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
          {processes.length === 0 ? (
            <div className="text-[14px] text-ink-muted p-4 border border-dashed border-hairline bg-[#F4F4F0] text-center">
              No processes configured &mdash; click &ldquo;Edit processes&rdquo; to add.
            </div>
          ) : (
            sortedProcesses.map((p) => {
              const processSnap = snapshot?.processes.find(
                (ps) => ps.ProcessID === p.ProcessID
              );
              const remaining =
                snapshot?.remainingTimes[p.ProcessID] ?? p.BurstTime;
              const state = processSnap?.State ?? "New";

              // Completed ratio (0 to 1)
              const completedRatio =
                isSimulationRun && p.BurstTime > 0
                  ? Math.min(1, Math.max(0, (p.BurstTime - remaining) / p.BurstTime))
                  : 0;
              const progressPercent = completedRatio * 100;

              // Color determination per DESIGN.md:
              // Running: #2E3A59
              // Ready: #B9C3D6
              // Finished: #9A9A94
              // Blocked: #D4D4CE (not in CPU)
              let stateBg = "bg-accent";
              if (state === "Terminated") {
                stateBg = "bg-[#9A9A94]";
              } else if (state === "Ready") {
                stateBg = "bg-[#B9C3D6]";
              } else if (state === "Running") {
                stateBg = "bg-[#2E3A59]";
              }

              return (
                <div key={p.ProcessID} className="flex items-center gap-3 h-8">
                  {/* PID Label */}
                  <div className="w-14 h-full border border-hairline bg-surface flex items-center justify-center text-[14px] font-medium text-ink tabular-nums shrink-0">
                    {p.ProcessID}
                  </div>

                  {/* Process Progress Bar Track */}
                  <div className="flex-1 h-full border border-hairline bg-[#F4F4F0] relative overflow-hidden flex items-center px-3 justify-between">
                    {isSimulationRun ? (
                      <>
                        {/* Progress Fill */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 ${stateBg} transition-all`}
                          style={{
                            width: `${progressPercent}%`,
                            transitionDuration: `${elementDuration}ms`,
                            transitionProperty: "width, background-color",
                            transitionTimingFunction: "ease-out",
                          }}
                        />

                        {/* Foreground Text */}
                        <div className="relative z-10 text-[14px] font-medium tabular-nums flex items-center justify-between w-full">
                          <span
                            className={
                              progressPercent > 35 && stateBg === "bg-[#2E3A59]"
                                ? "text-white"
                                : "text-ink"
                            }
                          >
                            {state === "Terminated" ? "Finished" : state}
                          </span>
                          <span
                            className={
                              progressPercent > 80 && stateBg === "bg-[#2E3A59]"
                                ? "text-white"
                                : "text-ink-muted"
                            }
                          >
                            Rem: {remaining} / {p.BurstTime}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[14px] text-ink-muted tabular-nums">
                        Arrival: {p.ArrivalTime}, Burst: {p.BurstTime}
                        {p.Priority !== undefined ? `, Priority: ${p.Priority}` : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
