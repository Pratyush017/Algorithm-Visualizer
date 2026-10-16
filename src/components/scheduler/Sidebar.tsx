"use client";

import { SchedulingAlgorithm } from "@/engine/scheduler";

interface SidebarProps {
  algorithm: SchedulingAlgorithm | "";
  onAlgorithmChange: (algo: SchedulingAlgorithm | "") => void;
  quantum: number;
  onQuantumChange: (q: number) => void;
  agingInterval: number;
  onAgingIntervalChange: (a: number) => void;
  onOpenDrawer: () => void;
  processesCount: number;
}

export function Sidebar({
  algorithm,
  onAlgorithmChange,
  quantum,
  onQuantumChange,
  agingInterval,
  onAgingIntervalChange,
  onOpenDrawer,
  processesCount,
}: SidebarProps) {
  return (
    <aside
      className="w-[240px] shrink-0 border-r border-hairline bg-app-bg p-4 flex flex-col justify-between select-none"
      aria-label="Scheduler Sidebar"
    >
      <div className="flex flex-col gap-6">
        {/* Algorithm Select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="algo-select"
            className="text-[14px] font-medium text-ink-muted"
          >
            Algorithm
          </label>
          <div className="relative">
            <select
              id="algo-select"
              value={algorithm}
              onChange={(e) =>
                onAlgorithmChange(e.target.value as SchedulingAlgorithm | "")
              }
              className="w-full h-9 bg-surface border border-hairline px-3 text-[14px] text-ink focus:outline-none focus:border-accent appearance-none cursor-pointer"
            >
              <option value="">Select algorithm...</option>
              <option value="SJF_NONPREEMPTIVE">SJF (non-preemptive)</option>
              <option value="SJF_PREEMPTIVE">SRTF (preemptive SJF)</option>
              <option value="ROUND_ROBIN">Round Robin</option>
              <option value="PRIORITY">Priority</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-2.5 text-ink-muted text-[14px]">
              ▼
            </div>
          </div>
        </div>

        {/* Quantum (Round Robin only) */}
        {algorithm === "ROUND_ROBIN" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="quantum-input"
                className="text-[14px] font-medium text-ink-muted"
              >
                Quantum
              </label>
              <span className="text-[14px] text-ink-muted tabular-nums">ticks</span>
            </div>
            <input
              id="quantum-input"
              type="number"
              min={1}
              value={quantum}
              onChange={(e) => onQuantumChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full h-9 bg-surface border border-hairline px-3 text-[14px] text-ink focus:outline-none focus:border-accent tabular-nums"
            />
          </div>
        )}

        {/* Aging Interval (Priority only) */}
        {algorithm === "PRIORITY" && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="aging-input"
                className="text-[14px] font-medium text-ink-muted"
              >
                Aging interval
              </label>
              <span className="text-[14px] text-ink-muted tabular-nums">ticks</span>
            </div>
            <input
              id="aging-input"
              type="number"
              min={1}
              value={agingInterval}
              onChange={(e) =>
                onAgingIntervalChange(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-full h-9 bg-surface border border-hairline px-3 text-[14px] text-ink focus:outline-none focus:border-accent tabular-nums"
            />
          </div>
        )}

        {/* Process Edit Action */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-medium text-ink-muted">
            Processes
          </label>
          <button
            type="button"
            id="edit-processes-btn"
            onClick={onOpenDrawer}
            className="w-full h-9 bg-surface border border-hairline text-[14px] font-medium text-ink hover:border-accent transition-colors flex items-center justify-center cursor-pointer"
          >
            Edit processes
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-hairline pt-3">
        <div className="text-[14px] text-ink-muted tabular-nums">
          {processesCount === 0
            ? "No processes configured"
            : `${processesCount} ${processesCount === 1 ? "process" : "processes"} loaded`}
        </div>
      </div>
    </aside>
  );
}
