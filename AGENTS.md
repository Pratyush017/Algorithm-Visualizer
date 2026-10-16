# Project: Interactive OS Resource Contention Sandbox & Scheduling Analyzer

## Stack
- Next.js (App Router) + TypeScript (strict mode)
- Tailwind CSS for styling
- Vitest for unit tests
- Deployed on Vercel. No database, no backend, no auth, no AI inference.

## Hard rules
- The simulation engines are pure TypeScript functions with no React, DOM, or
  browser imports. They must be deterministic: same input, same output.
- Engine code lives in `src/engine/`. UI code lives in `src/components/` and `src/app/`.
- Never put simulation logic inside React components.
- Every engine function has unit tests in `src/engine/__tests__/`.
- Do not add features outside the current phase. If something seems missing,
  note it in a TODO list and do not implement it.
- Do not add dependencies without asking me first, except those named in the phase.
- Before finishing a task, run `npm run lint`, `npm run test`, and `npm run build`.
  Report the results. Do not claim success if any of them fail.

## Scheduling rules
- Virtual clock starts at t=0 and advances by one tick per step.
- Tie-breaking everywhere: earliest ArrivalTime, then lowest ProcessID.
- Preemptive SJF = Shortest Remaining Time First (SRTF). A newly arriving
  shorter job preempts the running one.
- Round Robin uses a fixed user-defined quantum.
- Priority scheduling applies aging to reduce starvation.
- Process states: New, Ready, Running, Waiting, Terminated. Waiting is used
  only if an I/O event exists; otherwise it is never entered.

## Banker's rules
- Need[i][j] = Max[i][j] - Allocation[i][j]. Read-only in the UI.
- Validate before evaluating: no negatives, Allocation <= Max per cell.
- Safety algorithm: Work = Available; repeatedly find an unfinished process
  with Need <= Work (ties: lowest process index), then Work += Allocation[i].
- Output: safe sequence, or "Unsafe: deadlock possible" if no process can finish.
- This is deadlock avoidance, not detection. Use that terminology in the UI.

## Design rules
- Follow `DESIGN.md` for all visual decisions (colors, type, spacing).
- No emoji in the UI. No gradients. No decorative icons unless they carry meaning.

- `design-reference/` contains Stitch exports (HTML, screenshots). They are
  layout and token references only. Do not copy their markup, <script> blocks,
  sample data, labels, or extra screens. Do not import from this folder.
- Where a Stitch screen conflicts with DESIGN.md, DESIGN.md wins.
- Known Stitch defects to avoid: sample data in the Deadlock and CPU backgrounds,
  hardcoded safe sequence, "Priority (Preemptive)" labels, memory and storage
  navigation, status columns, duplicate sidebar transport buttons, and
  JavaScript referencing elements that don't exist in the markup.
