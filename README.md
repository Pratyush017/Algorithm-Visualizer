# Interactive OS Resource Contention Sandbox & Scheduling Analyzer

A deterministic, interactive simulation and performance analyzer for operating system CPU scheduling algorithms and resource allocation deadlock avoidance. Built with Next.js App Router, TypeScript, and Tailwind CSS. The simulation engines are pure functions with zero React, DOM, backend, database, or external AI inference dependencies.

---

## Features

- **CPU Process Scheduling**:
  - Configurable workloads (Process ID, Arrival Time, Burst Time, Priority).
  - Deterministic tick-based execution engine with natural tie-breaking (earliest arrival, lowest process ID).
  - Responsive visual Gantt chart with interactive tick scrubber and play/pause timeline inspection.
  - Comprehensive KPI results: Throughput, Average Turnaround Time, and Average Waiting Time.
  - Cell-level inline validation with helpful error indicators.

- **Banker's Deadlock Avoidance**:
  - Multidimensional matrices (1 to 10 processes, 1 to 8 resource types).
  - Real-time cell editing for **Allocation** and **Max Demand**, with an **Available** vector.
  - Read-only auto-computed **Need Matrix** ($Need = Max - Allocation$).
  - Step-by-step vector comparison trace showing $Need \le Work$ evaluation and $Work \leftarrow Work + Allocation$ release.
  - Safety status banner providing safe execution sequence or blocking deadlocked processes.
  - Adheres strictly to **Deadlock Avoidance** principles (not detection).

- **JSON Import & Export**:
  - Download and upload full workload configurations for both CPU scheduling and Banker's matrices.
  - Comprehensive schema and value range validation on import with informative error messaging.

---

## Supported Algorithms

### CPU Scheduling (`src/engine/scheduler`)
1. **Shortest Job First (SJF) Non-Preemptive**:
   - Selects the ready process with the shortest CPU burst time; once scheduled, runs to completion without preemption.
2. **Shortest Remaining Time First (SRTF / Preemptive SJF)**:
   - Preemptive variant of SJF where newly arriving processes with shorter remaining burst times immediately preempt the running job.
3. **Round Robin (RR)**:
   - Time-sliced cyclic scheduling governed by a user-defined positive integer time quantum.
4. **Priority Scheduling (with Aging)**:
   - Prioritizes jobs with lower numeric priority values. Applies a deterministic aging interval to increment priorities of waiting processes and eliminate starvation.

### Deadlock Avoidance (`src/engine/banker`)
- **Dijkstra's Banker's Safety Algorithm**:
  - Evaluates system state safety by searching for an ordering in which every process can satisfy its maximum demand ($Need \le Work$), terminate, and release allocated resources.
  - Deterministic tie-breaking by lowest process index when multiple processes can complete.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
npm install
```

### Running Locally
To launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port reported in the console) to access the application.

### Building for Production
```bash
npm run build
npm run start
```

---

## Running Tests & Quality Verification

All simulation logic is verified with 100% deterministic Vitest test suites:

```bash
# Run unit tests
npm run test

# Run ESLint linter
npm run lint

# Compile production build
npm run build
```

---

## Architecture

- `src/engine/`: Pure TypeScript engines (`scheduler/` and `banker/`). Strictly zero React, DOM, or browser imports.
- `src/engine/__tests__/`: Unit tests for engines, tie-breaking rules, benchmark sets, and JSON IO schemas.
- `src/components/`: Modular React components (`scheduler/`, `banker/`, `common/`).
- `src/app/`: Next.js App Router pages:
  - `/`: Dashboard and sandbox overview.
  - `/scheduling`: CPU scheduling analyzer.
  - `/deadlock`: Banker's deadlock avoidance sandbox.
