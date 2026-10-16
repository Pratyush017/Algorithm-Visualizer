"use client";

import { PlaySpeed } from "./types";

interface TransportBarProps {
  isReady: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  currentStep: number;
  maxStep: number;
  onSeek: (step: number) => void;
  speed: PlaySpeed;
  onSpeedChange: (speed: PlaySpeed) => void;
}

export function TransportBar({
  isReady,
  isPlaying,
  onTogglePlay,
  onReset,
  onStepBack,
  onStepForward,
  currentStep,
  maxStep,
  onSeek,
  speed,
  onSpeedChange,
}: TransportBarProps) {
  const canStepBack = isReady && currentStep > 0;
  const canStepForward = isReady && (maxStep === 0 || currentStep < maxStep);

  return (
    <div
      className="border border-hairline bg-surface p-3 flex items-center justify-between gap-6 select-none"
      aria-label="Simulation Transport"
    >
      {/* Simulation Transport Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reset */}
        <button
          type="button"
          id="btn-reset"
          title="Reset state"
          onClick={onReset}
          disabled={!isReady}
          className={`h-9 px-3 border border-hairline bg-surface text-[14px] font-medium text-ink transition-colors flex items-center justify-center ${
            isReady
              ? "hover:border-accent cursor-pointer"
              : "opacity-40 cursor-not-allowed"
          }`}
        >
          Reset
        </button>

        {/* Step Back */}
        <button
          type="button"
          id="btn-step-back"
          title="Step back"
          onClick={onStepBack}
          disabled={!canStepBack}
          className={`h-9 px-3 border border-hairline bg-surface text-[14px] font-medium text-ink transition-colors flex items-center justify-center ${
            canStepBack
              ? "hover:border-accent cursor-pointer"
              : "opacity-40 cursor-not-allowed"
          }`}
        >
          ◀
        </button>

        {/* Step Forward */}
        <button
          type="button"
          id="btn-step-fwd"
          title="Step forward"
          onClick={onStepForward}
          disabled={!canStepForward}
          className={`h-9 px-3 border border-hairline bg-surface text-[14px] font-medium text-ink transition-colors flex items-center justify-center ${
            canStepForward
              ? "hover:border-accent cursor-pointer"
              : "opacity-40 cursor-not-allowed"
          }`}
        >
          ▶
        </button>

        {/* Play / Pause */}
        <button
          type="button"
          id="play-pause-btn"
          onClick={onTogglePlay}
          disabled={!isReady}
          className={`h-9 px-5 text-[14px] font-medium transition-colors flex items-center gap-2 ${
            isReady
              ? "bg-accent text-white hover:bg-accent-hover cursor-pointer"
              : "bg-hairline text-ink-muted cursor-not-allowed opacity-40"
          }`}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Scrubber Range Slider Control */}
      <div className="flex-1 flex items-center gap-3">
        <span
          id="scrubber-min-label"
          className="text-[14px] text-ink-muted tabular-nums shrink-0"
        >
          t = 0
        </span>
        <div className="relative w-full flex items-center">
          <input
            id="scrubber"
            type="range"
            min={0}
            max={Math.max(1, maxStep)}
            value={currentStep}
            disabled={!isReady || maxStep === 0}
            onChange={(e) => onSeek(parseInt(e.target.value, 10))}
            className={`w-full h-1 bg-hairline appearance-none cursor-pointer accent-accent focus:outline-none ${
              !isReady || maxStep === 0 ? "opacity-40 cursor-not-allowed" : ""
            }`}
          />
        </div>
        <span
          id="scrubber-max-label"
          className="text-[14px] text-ink-muted tabular-nums shrink-0"
        >
          t = {maxStep}
        </span>
      </div>

      {/* Speed Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <label htmlFor="speed-select" className="text-[14px] text-ink-muted">
          Speed
        </label>
        <div className="relative">
          <select
            id="speed-select"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value) as PlaySpeed)}
            className="h-9 bg-surface border border-hairline px-3 pr-7 text-[14px] text-ink tabular-nums focus:outline-none focus:border-accent appearance-none cursor-pointer"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1.0x</option>
            <option value="2">2.0x</option>
            <option value="4">4.0x</option>
          </select>
          <div className="pointer-events-none absolute right-2.5 top-2.5 text-ink-muted text-[12px]">
            ▼
          </div>
        </div>
      </div>
    </div>
  );
}
