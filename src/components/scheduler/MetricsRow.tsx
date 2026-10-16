"use client";

import { formatMetric } from "./helpers";

interface MetricsRowProps {
  isCompleted: boolean;
  throughput: number | null | undefined;
  averageWaitingTime: number | null | undefined;
  averageTurnaroundTime: number | null | undefined;
}

export function MetricsRow({
  isCompleted,
  throughput,
  averageWaitingTime,
  averageTurnaroundTime,
}: MetricsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-6 select-none">
      {/* Throughput */}
      <div className="border border-hairline bg-surface p-4 flex flex-col justify-between">
        <div className="text-[14px] font-medium text-ink-muted">Throughput</div>
        <div className="text-[20px] font-semibold text-ink mt-2 tabular-nums">
          {isCompleted ? `${formatMetric(throughput)} proc/tick` : "—"}
        </div>
      </div>

      {/* Avg. waiting time */}
      <div className="border border-hairline bg-surface p-4 flex flex-col justify-between">
        <div className="text-[14px] font-medium text-ink-muted">Avg. waiting time</div>
        <div className="text-[20px] font-semibold text-ink mt-2 tabular-nums">
          {isCompleted ? `${formatMetric(averageWaitingTime)} ticks` : "—"}
        </div>
      </div>

      {/* Avg. turnaround time */}
      <div className="border border-hairline bg-surface p-4 flex flex-col justify-between">
        <div className="text-[14px] font-medium text-ink-muted">Avg. turnaround time</div>
        <div className="text-[20px] font-semibold text-ink mt-2 tabular-nums">
          {isCompleted ? `${formatMetric(averageTurnaroundTime)} ticks` : "—"}
        </div>
      </div>
    </div>
  );
}
