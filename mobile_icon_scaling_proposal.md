# Mobile Icon Scaling Proposal

With the change to a standard responsive viewport (`<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">`), the desktop UI now properly respects the device boundaries, preventing scrolling below the taskbar via the `100dvh` CSS rules.

Because the viewport is no longer locked to a wide 1024px virtual desktop, all elements naturally scale relative to the smaller device screen. **For now, the desktop icons are remaining at their original pixel sizes (48x48) because they were explicitly requested to be kept as-is.**

### Proposed Future Changes for Icons

If the icons feel too large or disproportionate on smaller screens under the new responsive layout, consider the following CSS adjustments:

1. **Media Queries:** Use `@media (max-width: 768px)` to target mobile devices specifically and reduce the icon dimensions.

   ```css
   @media (max-width: 768px) {
     .desktop-icon {
       width: 64px;
     }
     .desktop-icon img {
       width: 36px;
       height: 36px;
       min-width: 36px;
       min-height: 36px;
     }
     .desktop-icon span {
       font-size: 10px;
     }
   }
   ```

2. **Relative Sizing (rem/vw):** Transition the desktop icon widths and text to relative units, or clamp scaling properties so they slightly reduce in size on tighter viewports.

3. **Flex Layout:** The `#desktop-icons` container wraps via `flex-wrap: wrap;` and `max-height: calc(100dvh - 50px)`. If smaller icons are used, ensure the gap scaling works smoothly in the grid so items don't overlap.
