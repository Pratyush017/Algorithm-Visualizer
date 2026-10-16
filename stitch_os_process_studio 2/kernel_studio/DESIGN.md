---
name: Kernel Studio
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#45464e'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#75777e'
  outline-variant: '#c6c6ce'
  surface-tint: '#525e7f'
  primary: '#182442'
  on-primary: '#ffffff'
  primary-container: '#2e3a59'
  on-primary-container: '#98a4c9'
  inverse-primary: '#bac6ec'
  secondary: '#555f6f'
  on-secondary: '#ffffff'
  secondary-container: '#d9e3f7'
  on-secondary-container: '#5b6575'
  tertiary: '#312300'
  on-tertiary: '#ffffff'
  tertiary-container: '#4a380c'
  on-tertiary-container: '#bca26c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#bac6ec'
  on-primary-fixed: '#0d1a38'
  on-primary-fixed-variant: '#3a4666'
  secondary-fixed: '#d9e3f7'
  secondary-fixed-dim: '#bdc7da'
  on-secondary-fixed: '#121c2a'
  on-secondary-fixed-variant: '#3d4757'
  tertiary-fixed: '#fddfa4'
  tertiary-fixed-dim: '#dfc38b'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#574417'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.015em
  label-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.02em
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system establishes an uncompromising, technical workstation environment designed specifically for operating systems simulation, process lifecycle inspection, memory management tracing, and hardware scheduling. Rather than modeling after generic responsive web pages or prose-heavy documents, the UI operates strictly as an engineered desktop workstation application.

The design movement is **Technical Minimalism and Utilitarian Functionalism**:
- **High-density precision**: Every pixel conveys state, structural relation, or diagnostic metrics. Zero decorative ornamentation, zero gradients, and zero non-functional illustrations.
- **Surgical visual hierarchy**: Contrast is governed by tonal shifts between structured hairline boundaries and deliberate, muted state accents. 
- **Tool-grade affordance**: The mental model mirrors diagnostic consoles, logic analyzers, and system debuggers where stability, spatial consistency, and immediate readability supersede visual novelty.

## Colors

The palette is strictly controlled, anchored by an off-white substrate and deep slate blue accent, eliminating visual noise during complex algorithmic analysis.

### Foundational Colors
- **Canvas Base (`#FAFAF7`)**: The dominant desktop application background, providing low eye-fatigue contrast against dark data tables and timelines.
- **Surface Elevation (`#FFFFFF`)**: Crisp foreground containers, toolbars, and inspector panels.
- **Ink Primary (`#1A1A1A`)**: Maximum readability text, primary values, active thread labels, and key performance indicators.
- **Ink Secondary (`#6B6B6B`)**: Meta-labels, register offsets, unit definitions, and deactivated actions.
- **Hairline Border (`#E5E5E0`)**: 1px structural dividers framing all panels, tabular cells, and layout splits.
- **Accent Primary (`#2E3A59`)**: Muted deep slate blue used for primary execution focus, selected navigation items, and current instruction pointers.

### Process Lifecycle & Engine State Colors
Simulation entities (e.g., processes, threads, memory blocks) must strictly consume semantic state tokens:
- **Running (`#2E3A59`)**: The active execution state. Deep slate blue for high visual prominence on active CPU cores.
- **Ready (`#B9C3D6`)**: Processes waiting in scheduling queues. Muted desaturated slate-tinted neutral.
- **Blocked / Waiting (`#D4D4CE`)**: I/O wait, mutex locks, and interrupted routines. Medium warm-grey.
- **Finished / Terminated (`#9A9A94`)**: Process exit states and reaped threads. Deep structural grey.

## Typography

The typography system relies exclusively on **Inter**, tuned for high density and immediate technical comprehension:
- **Baseline Minimum**: Absolute floor for text rendering is set at 14px (`label-md` and `label-mono`). Micro-typography under 14px is prohibited to ensure instant reading during continuous clock cycle simulations.
- **Section Headers**: Structured at 20px (`headline-md`) with 600 weight to define independent functional zones without excessive vertical push.
- **Data & Numeric Displays**: Utilize tabular figures (`tnum`) across all memory addresses, clock ticks, PIDs, and burst-time calculations to prevent layout jitter during active simulation ticks.
- **Typeface Exclusions**: Serif fonts and display variants are forbidden.

## Layout & Spacing

The viewport implements a non-document, fixed-frame application dock:
- **Application Shell Architecture**:
  - **Left Rail Sidebar**: Fixed `240px` width. Anchored to the viewport height (`100vh`), housing process queues, kernel configurations, and engine controllers.
  - **Global Command Strip**: Fixed `44px` height along the top edge housing simulation controls (Step, Tick, Run, Reset) and clock frequency steppers.
  - **Main Inspection Canvas**: Spans the remainder of the viewport. Divided into discrete orthogonal quadrants via 1px border splits for Gantt timelines, CPU core registers, and memory frame allocation grids.
  - **Right Telemetry Drawer**: Collapsible `320px` inspector for active thread register dumps and page fault diagnostics.
- **Layout Rhythm**: Component paddings rely on tight multiples (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 12px) to maximize visible data payload within the screen real estate.

## Elevation & Depth

This system operates without dropshadows, blurs, or volumetric gradients:
- **Hairline Boundary Tiers**: All separation of space and elevation is communicated exclusively through 1px solid `#E5E5E0` borders. 
- **Z-Index Layering**: Modals and dropdown flyouts rely on a solid `#FFFFFF` surface background bordered by 1px solid `#1A1A1A` rather than box-shadow halos.
- **State Stacking**: Overlays and active core highlights use tonal differentiation:
  - Default Pane: `#FFFFFF`
  - Workspace Canvas Gaps: `#FAFAF7`
  - Inactive / Disabled Canvas Area: `#F2F2ED`
  - Selected / Active Focus Pane: Bounded with a 1px solid `#2E3A59` outline.

## Shapes

The design system enforces a sharp geometric radius (`0px` / Level `0`):
- All panels, action buttons, table rows, process blocks in Gantt charts, memory segments, and form elements feature hard 90-degree corners.
- Sharp geometry guarantees edge alignment across multi-pane layouts and preserves rectangular boundary integrity for grid-based visualizations (e.g., bitwise flags and memory matrices).

## Components

### Buttons & Action Triggers
- **Primary Execution Button**: `#2E3A59` background, `#FFFFFF` text, 0px border-radius, minimum 14px font, padding 8px 16px. Active/hover state transitions to solid black `#1A1A1A`.
- **Secondary / Action Button**: `#FFFFFF` background, 1px solid `#E5E5E0` border, `#1A1A1A` text. Hover changes border to `#1A1A1A`.
- **Control Strip Button**: Square 36px x 36px icon-label toggles for debugger execution (`Step`, `Pause`, `Run`).

### Process State Chips & Badges
- Strict rectangular cells (padding 2px 8px, minimum 14px font weight 500).
- Encoded directly by status tokens:
  - Running: `#2E3A59` fill, `#FFFFFF` text.
  - Ready: `#B9C3D6` fill, `#1A1A1A` text.
  - Blocked: `#D4D4CE` fill, `#1A1A1A` text.
  - Finished: `#9A9A94` fill, `#FFFFFF` text.

### Inputs & Number Steppers
- Height: 36px. Solid `#FFFFFF` background, 1px solid `#E5E5E0` border, text `#1A1A1A` at 14px or 16px.
- Focus State: 1px solid `#2E3A59` (no shadow glow or offset ring).
- Stepper buttons integrated directly into input ends via 1px vertical borders.

### Data Tables & Process Lists
- Striped or bordered layout: Alternate rows remain `#FFFFFF` and `#FAFAF7`.
- Row height: 36px compact, 44px standard. Separated by 1px bottom border `#E5E5E0`.
- Headers: 14px medium, `#6B6B6B` text, `#FAFAF7` background, uppercase tracking.

### Checkboxes & Segmented Switches
- Checkboxes: 16px x 16px square, `#FFFFFF` fill, 1px solid `#E5E5E0`. Checked state: `#2E3A59` solid fill with sharp white crosshair or tick indicator.
- Segmented Radio Switch: Contiguous bordered bar containing rectangular segments. Selected segment receives `#2E3A59` with white text.

### Application Workstations Specific Components
- **Gantt Schedule Bar**: Continuous ribbon composed of adjacent rectangular blocks colored by process state tokens, with a 1px vertical `#1A1A1A` simulation playhead indicator line.
- **Memory Allocation Map**: Block matrix divided by 1px `#E5E5E0` outlines, labeled with 14px hex addresses (`0x0000` to `0xFFFF`).