# PalmOS Mobile Update Plan

## Goal
Update the PalmOS experience to be "almost full screen" on mobile devices, matching the provided screenshot.

## Thoughts
- **Mobile Firstish**: While PalmOS is originally a handheld experience, the current implementation is wrapped in a desktop-oriented metallic chassis (m505).
- **Responsive Design**: We need to transition from a fixed-size "device" look to a fluid, full-width layout on smaller screens.
- **Simplification**: On mobile, the physical chassis elements (logos, speaker slots, thick bezels) can feel cluttered. The goal is to focus on the functional areas: the Screen, the Graffiti area, and the Hardware buttons.
- **Scaling**: Using CSS `aspect-ratio` and relative units (like `vw` or percentages) will ensure the square screen remains square regardless of the phone's width.

## Implementation Plan
1.  **Style Extraction**: Move inline styles from `PalmFrame.tsx` to `globals.css` to enable cleaner media query overrides.
2.  **Media Queries**:
    - At `max-width: 640px` (standard mobile breakpoint):
        - Change page background to black.
        - Set container width to `100%`.
        - Remove "chassis" decorations (padding, metallic gradients, logos).
        - Scale the screen container to `width: 100%; aspect-ratio: 1/1;`.
        - Scale the Silk and Hardware areas to match the full width.
3.  **Scaling and Full Screen**:
    - Added a full-screen toggle button in the `PalmStatusBar` to allow users to use the entire browser viewport.
    - Implemented CSS `transform: scale(1.1)` on the mobile screen content. This increases the visual size of icons and buttons (improving tap targets and readability) while maintaining the original internal coordinate system and logic.
4.  **Refinement**: Ensure buttons remain touch-friendly and the layout doesn't overflow.
