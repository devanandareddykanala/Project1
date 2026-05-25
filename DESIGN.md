# Velvyn Apartmily — Design Brief

**Tone:** Premium Indian tech product. Futuristic, clean, purposeful. Bold green + crisp white = distinctive identity.

## Palette (OKLCH)

| Token | Light | Dark | Purpose |
|---|---|---|---|
| Primary | 0.18 0.09 145 | 0.80 0.24 135 | Deep forest green (light) / Neon green (dark) |
| Accent | 0.80 0.24 135 | 0.80 0.24 135 | Electric neon green — CTAs, highlights, active states |
| Background | 0.99 0.01 60 | 0.10 0.06 145 | Crisp white (light) / Deep forest (dark) |
| Foreground | 0.10 0.06 145 | 0.96 0.01 60 | Dark green (light) / White (dark) |
| Border | 0.92 0.02 145 | 0.26 0.06 145 | Soft green border — subtle hierarchy |
| Destructive | 0.55 0.24 22 | 0.65 0.21 22 | Red — errors, danger |

## Typography

| Layer | Font | Usage |
|---|---|---|
| Display | Lora (serif) | Headings, brand moments |
| Body | GeneralSans (sans) | All body text, UI labels |
| Mono | JetBrainsMono | Code, wallet UTR, transaction IDs |

## Structural Zones

| Zone | Light Mode | Dark Mode (Primary) |
|---|---|---|
| Header/Nav | White bg, green text/icons | Dark forest bg, neon green accent |
| Card | White bg, soft border | Dark forest bg, soft green border |
| Footer | Soft green bg | Darker green bg |
| Interactive CTA | Forest green text | Neon green text |
| Hover state | Subtle green tint | Neon green glow |

## Differentiation

- **Mode icons**: Apartment (building/circuit), Family (shield/wellness), Watchman (gate/eye) — visual identity for each mode
- **Accent glow**: Neon green accent on hover/active states creates premium tech feel
- **Green hierarchy**: Light mode uses dark green for depth; dark mode uses neon green for vibrancy
- **Crisp surfaces**: White cards on light mode, forest cards on dark mode — no greys, pure intentional color

## Spacing & Rhythm

- 0.625rem base radius (matches :root --radius)
- 1.5rem sections, 1rem components
- Density increases in watchman mode (icon-only buttons, compact lists)

## Component Patterns

- Buttons: Green primary, neon accent on hover, white text
- Cards: Bordered, white/dark green bg, soft shadow-subtle
- Inputs: Border-focused, neon green ring on focus
- Tabs: Accent underline (neon green active), border separator
- Modals: Dark overlay, card surface

## Motion

- Transition smooth (0.3s ease) for all interactive elements
- SOS pulse: Red pulsing ring (destructive color)
- Status board updates: instant (no transition for real-time state)

## Constraints

- No gradients except subtle accent gradients in hero moments
- No opacity-only shadows — always intentional depth
- Neon green sparing use — only CTAs, hover states, highlights
- Watchman mode: larger touch targets, max 10 tap zones per screen
- Dark mode default (Indian user preference for reduced eye strain)

## Signature Detail

**Mode toggle icons** — distinctly Indian premium tech aesthetic. Each mode has a unique icon (building, shield, gate) in both light and dark mode, reinforcing the three-world structure of Velvyn Apartmily.
