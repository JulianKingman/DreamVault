# Design System Specification: Atmospheric Twilight

## 1. Overview & Creative North Star
**Creative North Star: "The Ethereal Editorial"**

This design system is a departure from the sterile, rigid grids of utility-first frameworks. It is designed to feel like a high-end digital periodical—a space where time slows down. We achieve this by blending the precision of modern UI with the soul of a cinematic twilight.

The aesthetic breaks the "template" look through **intentional asymmetry** and **tonal depth**. Elements do not simply sit on a grid; they float within a gradient atmosphere. By utilizing expansive typography scales and radical corner radii, we create a soft, dreamy interface that prioritizes emotional resonance over raw density.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the transition of light at dusk. We move away from flat "Dark Mode" (pure blacks) into a sophisticated "Twilight Mode" built on deep slates and organic ambers.

### The Palette (Material Design Tokens)
*   **Background / Surface:** `#040e1f` (The foundation of the night).
*   **Primary (Amber):** `#ffb77d` (Desaturated, organic; used for focus, not flash).
*   **Secondary (Slate Blue):** `#909fb5` (The cooling sky).
*   **Tertiary (Warm Glow):** `#ffb148` (Used for rare, high-intent moments).

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To maintain the "Atmospheric" quality, you must never use a 1px solid border to separate content blocks. Boundaries are defined exclusively through:
1.  **Background Shifts:** Placing a `surface-container-low` card on a `surface` background.
2.  **Subtle Tonal Transitions:** Using the gradient flow of the background to naturally group elements.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of frosted glass.
*   **Level 0 (Base):** `surface` (#040e1f)
*   **Level 1 (Sections):** `surface-container-low` (#02132c)
*   **Level 2 (Cards/Modules):** `surface-container` (#001938)
*   **Level 3 (Interactive/Floating):** `surface-bright` (#002c5a)

### The "Glass & Gradient" Rule
For hero elements and primary CTAs, use **Signature Textures**. Instead of flat fills, apply a subtle linear gradient from `primary` (#ffb77d) to `primary-container` (#6e3900) at a 135-degree angle. For floating overlays, use **Glassmorphism**: a semi-transparent `surface-variant` with a 20px backdrop blur to let the "twilight" bleed through.

---

## 3. Typography
The type system is a dialogue between the modern (Plus Jakarta Sans) and the timeless (Noto Serif).

*   **Display & Headline (Noto Serif):** Used for large, expressive moments and editorial excerpts. These should use `display-lg` (3.5rem) with generous letter-spacing to feel expansive.
*   **UI & Body (Plus Jakarta Sans):** A clean, geometric sans-serif that ensures legibility in functional areas. Use `body-lg` (1rem) for standard reading and `label-md` (0.75rem) for metadata.

**Editorial Intent:** Use `headline-lg` for section headers, but offset them slightly to the left or right of the main content column to create an asymmetric, bespoke layout.

---

## 4. Elevation & Depth
In this system, elevation is a feeling, not a drop-shadow.

*   **The Layering Principle:** Depth is achieved by "stacking" tonal tiers. An inner container should always be one step higher or lower in the `surface-container` scale than its parent.
*   **Ambient Shadows:** For floating elements (like modals), use a "Twilight Shadow":
    *   *Blur:* 40px to 60px.
    *   *Opacity:* 6% - 10%.
    *   *Color:* Use a tinted version of `on-surface` (#dae6ff) rather than black to simulate natural atmospheric scattering.
*   **The "Ghost Border" Fallback:** If a container requires more definition for accessibility, use the `outline-variant` (#21487d) at **15% opacity**. This creates a suggestion of a boundary without breaking the soft aesthetic.

---

## 5. Components

### Buttons
*   **Primary:** Radically rounded (`ROUND_FULL` / 9999px). Gradient fill (Primary to Primary-Container). No border.
*   **Secondary:** Ghost style. No background fill. `Ghost Border` (15% opacity `outline-variant`). Text color is `primary`.
*   **Tertiary:** Text only, `label-md` uppercase with 0.05em letter-spacing.

### Cards & Lists
*   **No Dividers:** Forbid the use of horizontal rules. Use vertical whitespace (32px - 48px) or a shift to `surface-container-low` to separate items.
*   **Shape:** All cards must use `xl` (3rem) or `full` corner radius to maintain the dreamy, soft-touch feel.

### Input Fields
*   **Style:** Minimalist "Underline" or "Soft Pill."
*   **Focus State:** The background shifts to `surface-container-high` (#001f43) with a subtle glow from the `primary` color (4px outer glow, 10% opacity).

### Signature Component: The "Ethereal Chip"
Use for categories or tags. A `full` rounded pill with a semi-transparent `secondary-container` (#2e3c4f) background and a `backdrop-filter: blur(10px)`.

---

## 6. Do’s and Don'ts

### Do:
*   **Embrace Whitespace:** Treat "empty" space as a design element.
*   **Use Asymmetry:** Place a large Noto Serif quote off-center to break the "web-template" feel.
*   **Layer Surfaces:** Always ask "can I define this area with a background color shift instead of a line?"

### Don’t:
*   **Don't use pure black:** The darkest color should always be our deep slate (`surface-container-lowest`).
*   **Don't use high-contrast borders:** 100% opaque borders kill the atmospheric depth.
*   **Don't over-use Amber:** The `primary` accent is a sunset spark—if it’s everywhere, the "twilight" effect is lost. Keep it to < 5% of the screen real estate.
*   **Don't use sharp corners:** Even "small" components like checkboxes should have a minimum `sm` (0.5rem) radius.