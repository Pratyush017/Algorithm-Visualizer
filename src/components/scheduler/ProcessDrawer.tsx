"use client";

import { useEffect, useState } from "react";
import { Process, SchedulingAlgorithm } from "@/engine/scheduler";
import { ProcessDraftRow } from "./types";
import { validateAllDraftRows } from "./helpers";

interface ProcessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (processes: Process[]) => void;
  initialProcesses: Process[];
  algorithm: SchedulingAlgorithm | "";
}

function ProcessDrawerContent({
  onClose,
  onApply,
  initialProcesses,
  algorithm,
}: Omit<ProcessDrawerProps, "isOpen">) {
  const isPriority = algorithm === "PRIORITY";

  // Initialize draft rows directly from initialProcesses
  const [rows, setRows] = useState<ProcessDraftRow[]>(() => {
    if (initialProcesses.length === 0) return [];
    return initialProcesses.map((p, idx) => ({
      id: `row-${idx}-${p.ProcessID}`,
      ProcessID: p.ProcessID,
      ArrivalTime: p.ArrivalTime.toString(),
      BurstTime: p.BurstTime.toString(),
      Priority: p.Priority !== undefined ? p.Priority.toString() : "0",
    }));
  });

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const { hasErrors, rowErrors } = validateAllDraftRows(rows, isPriority);

  const handleAddProcess = () => {
    const nextIdx = rows.length + 1;
    const newRow: ProcessDraftRow = {
      id: `row-${Date.now()}-${nextIdx}`,
      ProcessID: `P${nextIdx}`,
      ArrivalTime: "0",
      BurstTime: "",
      Priority: "1",
    };
    setRows((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateField = (
    id: string,
    field: keyof ProcessDraftRow,
    value: string
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleApply = () => {
    if (hasErrors || rows.length === 0) return;

    const parsedProcesses: Process[] = rows.map((r) => ({
      ProcessID: r.ProcessID.trim(),
      ArrivalTime: parseInt(r.ArrivalTime, 10),
      BurstTime: parseInt(r.BurstTime, 10),
      Priority: isPriority ? parseInt(r.Priority, 10) : undefined,
    }));

    onApply(parsedProcesses);
    onClose();
  };

  return (
    <>
      {/* Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-[#FAFAF7]/80 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 w-[420px] bg-app-bg border-l border-hairline z-50 flex flex-col justify-between select-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Top Header */}
        <div className="h-14 px-6 border-b border-hairline flex items-center justify-between shrink-0 bg-surface">
          <h2
            id="drawer-title"
            className="text-[20px] font-semibold text-ink"
          >
            Processes
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close process editor"
            className="w-8 h-8 flex items-center justify-center text-ink hover:bg-[#F4F4F0] cursor-pointer text-[20px] font-medium leading-none"
          >
            ×
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {rows.length === 0 ? (
            <div className="text-[14px] text-ink-muted py-8 text-center border border-dashed border-hairline bg-surface">
              No processes added yet. Click &ldquo;+ Add process&rdquo; below.
            </div>
          ) : (
            <div className="border border-hairline bg-surface overflow-x-auto">
              <table className="w-full border-collapse text-left" id="process-table">
                <thead>
                  <tr className="border-b border-hairline bg-app-bg">
                    <th className="py-2 px-3 text-[14px] font-medium text-ink-muted text-left">
                      ProcessID
                    </th>
                    <th className="py-2 px-3 text-[14px] font-medium text-ink-muted text-right">
                      Arrival
                    </th>
                    <th className="py-2 px-3 text-[14px] font-medium text-ink-muted text-right">
                      Burst
                    </th>
                    {isPriority && (
                      <th className="py-2 px-3 text-[14px] font-medium text-ink-muted text-right">
                        Priority
                      </th>
                    )}
                    <th className="py-2 px-2 text-[14px] font-medium text-ink-muted text-center w-8">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {rows.map((row) => {
                    const err = rowErrors[row.id];
                    return (
                      <tr key={row.id} className="hover:bg-app-bg/50">
                        {/* ProcessID */}
                        <td className="py-2.5 px-3 align-top">
                          <input
                            type="text"
                            value={row.ProcessID}
                            placeholder="P1"
                            onChange={(e) =>
                              handleUpdateField(row.id, "ProcessID", e.target.value)
                            }
                            className={`w-16 bg-transparent border-b text-[14px] font-medium text-ink tabular-nums focus:outline-none focus:border-accent ${
                              err?.idError
                                ? "border-accent"
                                : "border-hairline"
                            }`}
                          />
                          {err?.idError && (
                            <div className="text-[14px] text-accent mt-0.5 whitespace-nowrap">
                              {err.idError}
                            </div>
                          )}
                        </td>

                        {/* Arrival */}
                        <td className="py-2.5 px-3 align-top text-right">
                          <input
                            type="number"
                            min={0}
                            value={row.ArrivalTime}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateField(row.id, "ArrivalTime", e.target.value)
                            }
                            className={`w-14 text-right bg-transparent border-b text-[14px] text-ink tabular-nums focus:outline-none focus:border-accent ${
                              err?.arrivalError
                                ? "border-accent"
                                : "border-hairline"
                            }`}
                          />
                          {err?.arrivalError && (
                            <div className="text-[14px] text-accent mt-0.5 whitespace-nowrap">
                              {err.arrivalError}
                            </div>
                          )}
                        </td>

                        {/* Burst */}
                        <td className="py-2.5 px-3 align-top text-right">
                          <input
                            type="number"
                            min={1}
                            value={row.BurstTime}
                            placeholder="1"
                            onChange={(e) =>
                              handleUpdateField(row.id, "BurstTime", e.target.value)
                            }
                            className={`w-14 text-right bg-transparent border-b text-[14px] text-ink tabular-nums focus:outline-none focus:border-accent ${
                              err?.burstError
                                ? "border-accent"
                                : "border-hairline"
                            }`}
                          />
                          {err?.burstError && (
                            <div className="text-[14px] text-accent mt-0.5 whitespace-nowrap">
                              {err.burstError}
                            </div>
                          )}
                        </td>

                        {/* Priority */}
                        {isPriority && (
                          <td className="py-2.5 px-3 align-top text-right">
                            <input
                              type="number"
                              min={0}
                              value={row.Priority}
                              placeholder="1"
                              onChange={(e) =>
                                handleUpdateField(row.id, "Priority", e.target.value)
                              }
                              className={`w-14 text-right bg-transparent border-b text-[14px] text-ink tabular-nums focus:outline-none focus:border-accent ${
                                err?.priorityError
                                  ? "border-accent"
                                  : "border-hairline"
                              }`}
                            />
                            {err?.priorityError && (
                              <div className="text-[14px] text-accent mt-0.5 whitespace-nowrap">
                                {err.priorityError}
                              </div>
                            )}
                          </td>
                        )}

                        {/* Delete Action */}
                        <td className="py-2.5 px-2 align-top text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            aria-label={`Delete process ${row.ProcessID}`}
                            className="text-ink-muted hover:text-ink text-[16px] leading-none cursor-pointer"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Process Button */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              id="btn-add-process"
              onClick={handleAddProcess}
              className="text-[14px] font-medium text-accent hover:underline cursor-pointer"
            >
              + Add process
            </button>
            {isPriority && (
              <span className="text-[14px] text-ink-muted">
                Lower value = higher priority
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-hairline bg-surface flex items-center justify-end gap-4 shrink-0">
          <button
            type="button"
            id="cancel-btn"
            onClick={onClose}
            className="text-[14px] font-medium text-ink-muted hover:text-ink px-4 py-2 border border-hairline bg-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="apply-btn"
            onClick={handleApply}
            disabled={hasErrors || rows.length === 0}
            className={`text-[14px] font-medium px-6 py-2 transition-colors cursor-pointer ${
              hasErrors || rows.length === 0
                ? "bg-hairline text-ink-muted cursor-not-allowed"
                : "bg-accent text-white hover:bg-accent-hover"
            }`}
          >
            Apply
          </button>
        </div>
      </aside>
    </>
  );
}

export function ProcessDrawer(props: ProcessDrawerProps) {
  if (!props.isOpen) return null;
  return <ProcessDrawerContent {...props} />;
}
