# DESIGN.md

Visual and interaction rules for the OS Resource Contention Sandbox. AGENTS.md
governs process and code rules; this file governs what the UI looks like and
how it moves. When in doubt, follow this file and ask before deviating.

## Priorities (in order)

1. Smoothness: every state change is animated, and no frame should jump.
2. Motion as explanation: animation carries the meaning of each step.
3. Restraint: minimal chrome, so motion is the most visible thing on screen.

When a choice trades off these, the higher priority wins.

## 1. Scope

Two modules only:
- **CPU Scheduling** (`/scheduling`): SJF non-preemptive, SRTF, Round Robin,
  Priority.
- **Deadlock Avoidance** (`/deadlock`): Banker's algorithm.

Out of scope, do not build or show: memory or paging UI, storage or disk UI,
CPU utilization, temperature, context-switch counts, version tags, user
avatars, system clock displays, and any algorithm not listed above.

## 2. Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| background | #FAFAF7 | App background |
| surface | #FFFFFF | Canvas, panels, inputs |
| ink | #1A1A1A | Primary text, values |
| ink-muted | #6B6B6B | Labels, secondary text |
| hairline | #E5E5E0 | All borders and dividers |
| accent | #2E3A59 | Primary button, focus, playhead |
| accent-hover | #1A1A1A | Primary button hover |

### State colors (used everywhere, same meaning on every screen)
| State | Hex | Meaning |
|---|---|---|
| Running | #2E3A59 | Holds the CPU or is being evaluated |
| Ready | #B9C3D6 | Waiting in a queue, able to run |
| Blocked | #D4D4CE | Cannot proceed (Banker's: need exceeds Work) |
| Finished | #9A9A94 | Completed or safely released |

Blocked and Finished are distinct from each other. Do not use red for errors.

### Typography
- Family: Inter only. No serif, no display faces.
- Sizes: 14px (labels, mono values), 16px (body, inputs), 20px (section
  titles), 24px (page title).
- Weights: 400 body, 500 labels, 600 titles.
- Numeric values (PIDs, ticks, matrix cells) use tabular figures
  (`font-variant-numeric: tabular-nums`).
- Minimum size is 14px. Nothing smaller.

### Spacing
Use only: 4, 8, 16, 24, 32, 48, 64, 96 px.

### Shape and depth
- Sharp corners everywhere (0px radius).
- No shadows, no gradients, no blur.
- Separation comes from 1px hairline borders and background tone.

## 3. Layout

- **Left sidebar:** 240px wide. Holds algorithm selector (CPU) or size
  controls (Banker's) and the "Edit" button that opens a drawer.
- **Canvas:** fills the remaining width. It is the largest element on screen,
  at least 65% of the main area height.
- **Transport bar:** a single slim row directly under the canvas.
- **Metrics row (CPU only):** three values under the transport bar.
- **Drawers:** 420px (processes), 480px (matrices). Open over the canvas with
  the canvas dimmed behind them. Close with an X button or Escape.

Top navigation shows only the two module names.

## 4. Empty states

- No sample data anywhere, including the canvas, drawers, and metrics.
- Metrics show an em dash (—) until a simulation completes.
- The canvas shows labeled empty slots (for example, "Ready queue" with
  empty slots), not example content.
- The safe-sequence strip reads "Not evaluated" until evaluation runs.
- Inputs start blank, with a placeholder hint, never a prefilled value.

## 5. Motion

Motion is the primary way the simulator explains itself. Use it wherever state
changes. Smoothness takes priority over speed: a slightly slower animation that
reads clearly beats a fast one that jumps.

The engine produces discrete steps. The UI interpolates from the previous step
to the current one. The engine never waits on animation, and the same input
always produces the same steps.

### Principles
- Every visible state change is animated. Static swaps are a defect, except
  under reduced motion.
- Animate position, size, and opacity. Avoid animating layout properties that
  cause reflow when possible.
- Interrupts are smooth: if the user steps or scrubs mid-animation, the
  current motion retargets from its current position, never snaps.
- Animations are interruptible and reversible. Step back plays the reverse
  transition, not an instant jump.
- Frames stay at display rate. Use requestAnimationFrame or the animation
  library's scheduler, not setTimeout-driven position updates.

### Durations
- Highlight or focus change: 150ms.
- Element transitions (arrival, growth, shrink, slot moves): 250 to 400ms.
- Token transfer (Banker's allocation returning to Work): 600 to 900ms.
- Scrubber cursor: follows the current step with a 120ms ease, so it never
  lags visibly.
- Speed control scales all durations proportionally, never below 50% of the
  base value.

### Easing
- Arrivals and growth: ease-out.
- Moves between slots: ease-in-out.
- Scrubber and cursor: ease-out with a short follow.
- No bounce, no overshoot, no spring physics unless approved.

### Required motion
- **CPU:**
  - Processes enter the ready queue with a slide and fade on arrival.
  - Queue members glide forward as the head is picked.
  - The CPU slot cross-fades between processes, and the outgoing process
    slides out of the CPU as the incoming one slides in.
  - Gantt segments extend smoothly each tick, with the playhead gliding
    alongside the growing edge.
  - Remaining-time bars shrink continuously during execution, not in jumps.
  - Preemption: the running bar eases to a stop, the queue token for the
    preempted process glides back into the queue, and the new process takes
    the CPU.
  - Finished processes fade to the Finished tone and settle in their row.
- **Banker's:**
  - The Work vector is stacked tokens. Tokens are placed with spacing that
    animates when the count changes.
  - Each evaluation highlights the process row, then draws its Need bars
    against the Work bars as a comparison that resolves to "can finish" or
    "blocked."
  - When a process can finish, its Allocation tokens travel from its row into
    Work along a visible path, with the Work vector recounting as each token
    lands.
  - Blocked rows dim smoothly to the Blocked tone.
  - The safe sequence grows one node at a time, each node sliding in after its
    process finishes.
  - Step back reverses the token transfer, returning tokens to the row.

### Reduced motion
- Respect `prefers-reduced-motion`. When set, replace movement and growth with
  instant changes, keep the highlights and color changes, and keep the step
  counter so state remains readable.
- Reduced motion is a user choice, not a default. The default is full motion.

### Rules
- Each step changes at least one visible element, and that change is animated.
- Test every motion with rapid stepping and scrubbing. Nothing may jump,
  stack, or get stuck.

## 6. Screen specs

### CPU Scheduling
Must contain, and nothing else:
1. Sidebar: algorithm select (four options, no default selected until the user
   chooses one), Quantum field (Round Robin only), Aging interval field
   (Priority only), "Edit processes" button.
2. Header: page title "CPU Scheduling", clock value "t = 0".
3. Canvas, top to bottom:
   - Ready queue: labeled slot row.
   - Execution pipeline: CPU slot on the left, Gantt timeline on the right with
     a playhead.
   - Process rows: one per process, empty bars.
4. Transport bar: Reset, Step back, Step forward, Play/Pause, scrubber, Speed
   select. Scrubber range is set by the trace length, not fixed.
5. Metrics row: Throughput, Avg. waiting time, Avg. turnaround time.

Process drawer (420px): table with ProcessID, Arrival, Burst. The Priority
column appears only when Priority is the selected algorithm. Burst validation
message: "Must be 1 or more." Apply and Cancel buttons.

### Deadlock Avoidance
Must contain, and nothing else:
1. Sidebar: processes count (N) and resource types count (M) steppers, "Edit
   matrices" button, "Show Need" toggle (off by default).
2. Header: page title "Deadlock Avoidance", status "Not evaluated".
3. Canvas, top to bottom:
   - Work vector: one labeled column per resource type, empty token slots.
   - Process rows: one per process, empty allocation and need tracks.
   - Safe sequence strip at the bottom.
4. Transport bar: Reset, Step back, Step forward, Play/Pause, scrubber, Speed
   select.

Matrix drawer (480px): Allocation, Max grids (N by M, blank inputs) and an
Available row (1 by M, blank). Need is computed and read-only, shown only when
"Show Need" is on. Apply and Cancel buttons.

## 7. Forbidden

- Serif fonts, gradients, shadows, rounded corners, icons with no meaning.
- Emoji anywhere in the UI.
- Sample data, example results, or prefilled matrix values.
- Status columns with labels like WAITING, RUNNABLE, SATISFIED that are not
  driven by the engine state.
- Red error text. Errors use the accent color and short text next to the field.
- Duplicate transport controls. One transport bar per screen.
- Algorithm labels outside the four listed above, and "preemptive" applied to
  anything other than SRTF.
