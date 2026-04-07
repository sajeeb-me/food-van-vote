/**
 * theme.ts
 * ─────────────────────────────────────────────
 * ALL app colors live here. Edit this file to
 * retheme the entire app in one place.
 *
 * After changing values, save the file —
 * Next.js hot-reload will pick it up instantly.
 * ─────────────────────────────────────────────
 */

export const theme = {
    // ── Backgrounds ───────────────────────────
    /** Page / outermost background */
    bg: "#0f0d0b",
    /** Card and panel background */
    surface: "#1c1916",
    /** Input, secondary panel background */
    surface2: "#252018",

    // ── Borders ───────────────────────────────
    /** Default border colour */
    border: "#2e2920",

    // ── Brand / Accent ────────────────────────
    /** Primary action colour (buttons, highlights, chart leader) */
    primary: "#f59e0b",
    /** Dimmed / hover variant of the primary colour */
    primaryDim: "#92610a",

    // ── Text ──────────────────────────────────
    /** Primary text */
    textBase: "#faf3e0",
    /** Secondary / placeholder text */
    textMuted: "#7a6e5f",

    // ── Status ────────────────────────────────
    /** Success states */
    success: "#4ade80",
    /** Error / destructive states */
    danger: "#f87171",
} as const;

export type Theme = typeof theme;

/**
 * Generates a <style> block string of CSS custom properties
 * from the theme object. Injected into the root layout so every
 * component can reference var(--primary), var(--bg), etc.
 */
export function buildCssVariables(t: Theme): string {
    return `
    :root {
      --bg:          ${t.bg};
      --surface:     ${t.surface};
      --surface-2:   ${t.surface2};
      --border:      ${t.border};
      --primary:     ${t.primary};
      --primary-dim: ${t.primaryDim};
      --cream:       ${t.textBase};
      --muted:       ${t.textMuted};
      --green:       ${t.success};
      --red:         ${t.danger};

      /* Legacy aliases so existing components keep working */
      --amber:       ${t.primary};
      --amber-dim:   ${t.primaryDim};
    }
  `;
}