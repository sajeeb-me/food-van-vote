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
    bg: "#ffffff",
    surface: "#ffffff",
    surface2: "#f8fafc",

    // ── Borders ───────────────────────────────
    border: "#e5e7eb",

    // ── Brand / Accent ────────────────────────
    primary: "#111827",
    primaryDim: "#374151",

    // ── Text ──────────────────────────────────
    textBase: "#111827",
    textMuted: "#6b7280",

    // ── Status ────────────────────────────────
    success: "#16a34a",
    danger: "#dc2626",
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