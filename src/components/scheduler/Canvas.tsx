"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GanttSegment, Process, ProcessMetrics, TickSnapshot } from "@/engine/scheduler";
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
  perProcessMetrics?: ProcessMetrics[];
  isCompleted?: boolean;
}

function CpuSlotProcess({
  runningProcessId,
  duration,
  isReducedMotion,
}: {
  runningProcessId: string | null;
  duration: number;
  isReducedMotion: boolean;
}) {
  const [items, setItems] = useState<
    Array<{ id: string | null; status: "active" | "exiting"; key: number }>
  >([{ id: runningProcessId, status: "active", key: 0 }]);
  const counterRef = useRef(0);
  const lastPidRef = useRef(runningProcessId);

  useEffect(() => {
    if (isReducedMotion) {
      lastPidRef.current = runningProcessId;
      setItems([
        { id: runningProcessId, status: "active", key: ++counterRef.current },
      ]);
      return;
    }

    if (lastPidRef.current === runningProcessId) return;
    lastPidRef.current = runningProcessId;

    const newKey = ++counterRef.current;
    setItems((prev) => [
      ...prev.map((it) => ({ ...it, status: "exiting" as const })),
      { id: runningProcessId, status: "active" as const, key: newKey },
    ]);

    const timer = setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.key === newKey));
    }, duration);

    return () => clearTimeout(timer);
  }, [runningProcessId, duration, isReducedMotion]);

  return (
    <div
      id="cpu-process-slot"
      role="region"
      aria-label={runningProcessId ? `Running: ${runningProcessId}` : "CPU Idle"}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
    >
      {items.map((item) => {
        const isExiting = item.status === "exiting";
        return (
          <span
            key={item.key}
            aria-hidden={isExiting ? "true" : "false"}
            onAnimationEnd={() => {
              if (isExiting) {
                setItems((prev) => prev.filter((it) => it.key !== item.key));
              }
            }}
            className={`absolute text-[16px] font-semibold tabular-nums ${
              item.id ? "text-accent" : "text-ink-muted"
            }`}
            style={{
              animation: isReducedMotion
                ? "none"
                : isExiting
                ? `cpuSlideOut ${duration}ms ease-out forwards`
                : `cpuSlideIn ${duration}ms ease-out forwards`,
            }}
          >
            {item.id ?? "Idle"}
          </span>
        );
      })}
    </div>
  );
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
  perProcessMetrics = [],
  isCompleted = false,
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
              className="w-12 h-12 shrink-0 border border-dashed border-hairline bg-[#F4F4F0] relative overflow-hidden flex items-center justify-center font-medium text-[14px] tabular-nums"
            >
              {pid ? (
                <div
                  key={pid}
                  className="absolute inset-0 bg-[#B9C3D6] text-ink font-medium text-[14px] tabular-nums flex items-center justify-center"
                  style={{
                    animation: isReducedMotion
                      ? "none"
                      : `tokenEnter ${elementDuration}ms ease-out forwards`,
                    transitionDuration: `${elementDuration}ms`,
                    transitionProperty: "background-color, transform, opacity",
                    transitionTimingFunction: "ease-out",
                  }}
                >
                  {pid}
                </div>
              ) : (
                <span className="text-ink-muted">—</span>
              )}
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

            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
              <CpuSlotProcess
                runningProcessId={runningProcessId}
                duration={elementDuration}
                isReducedMotion={isReducedMotion}
              />
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
                    id="gantt-playhead"
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
            {isCompleted ? " (simulation completed)" : ""}
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
              const metric = perProcessMetrics.find((m) => m.ProcessID === p.ProcessID);

              // Remaining time ratio: 1.0 (at full burst) down to 0.0 (when finished)
              // Remaining-time bars shrink continuously during execution, not in jumps (DESIGN.md line 133).
              const remainingRatio =
                isSimulationRun && p.BurstTime > 0
                  ? Math.max(0, Math.min(1, remaining / p.BurstTime))
                  : 1;
              const remainingPercent = remainingRatio * 100;

              // Color determination per DESIGN.md:
              // Running: #2E3A59
              // Ready: #B9C3D6
              // Finished: #9A9A94
              // Blocked: #D4D4CE
              let stateBg = "bg-accent";
              if (state === "Ready") {
                stateBg = "bg-[#B9C3D6]";
              } else if (state === "Running") {
                stateBg = "bg-[#2E3A59]";
              } else if (state === "Terminated") {
                stateBg = "bg-[#9A9A94]";
              }

              return (
                <div
                  key={p.ProcessID}
                  data-testid={`process-row-${p.ProcessID}`}
                  data-process-id={p.ProcessID}
                  data-state={state}
                  data-remaining-time={remaining}
                  data-burst-time={p.BurstTime}
                  data-waiting-time={metric?.WaitingTime ?? ""}
                  data-turnaround-time={metric?.TurnaroundTime ?? ""}
                  data-completion-time={metric?.CompletionTime ?? ""}
                  className="flex items-center gap-3 h-8"
                >
                  {/* PID Label */}
                  <div className="w-14 h-full border border-hairline bg-surface flex items-center justify-center text-[14px] font-medium text-ink tabular-nums shrink-0">
                    {p.ProcessID}
                  </div>

                  {/* Process Remaining-Time Bar Track */}
                  <div className="flex-1 h-full border border-hairline bg-[#F4F4F0] relative overflow-hidden flex items-center px-3 justify-between">
                    {isSimulationRun ? (
                      <>
                        {/* Remaining Time Fill Bar (shrinks from 100% to 0%) */}
                        <div
                          className={`absolute top-0 bottom-0 left-0 ${stateBg} transition-all`}
                          style={{
                            width: `${remainingPercent}%`,
                            transitionDuration: `${elementDuration}ms`,
                            transitionProperty: "width, background-color",
                            transitionTimingFunction: "ease-out",
                          }}
                        />

                        {/* Foreground Text */}
                        <div className="relative z-10 text-[14px] font-medium tabular-nums flex items-center justify-between w-full">
                          {state === "Terminated" ? (
                            <>
                              <span className="text-[#9A9A94] font-semibold">Finished</span>
                              <span className="text-ink-muted">
                                Wait: {metric?.WaitingTime ?? 0} ticks · Turnaround: {metric?.TurnaroundTime ?? 0} ticks
                              </span>
                            </>
                          ) : (
                            <>
                              <span
                                className={
                                  remainingPercent > 35 && stateBg === "bg-[#2E3A59]"
                                    ? "text-white"
                                    : "text-ink"
                                }
                              >
                                {state === "Running" ? "Running" : state === "Ready" ? "Ready" : "New"}
                              </span>
                              <span
                                className={
                                  remainingPercent > 80 && stateBg === "bg-[#2E3A59]"
                                    ? "text-white"
                                    : "text-ink-muted"
                                }
                              >
                                Rem: {remaining} / {p.BurstTime}
                              </span>
                            </>
                          )}
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
