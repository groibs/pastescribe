---
name: Lumina Lexicon
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#434655'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#5654a8'
  on-secondary: '#ffffff'
  secondary-container: '#a7a5ff'
  on-secondary-container: '#393689'
  tertiary: '#3e3fcc'
  on-tertiary: '#ffffff'
  tertiary-container: '#585be6'
  on-tertiary-container: '#f1eeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100563'
  on-secondary-fixed-variant: '#3e3c8f'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  timestamp:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  margin: 32px
  max-width: 1440px
---

## Brand & Style
The design system is rooted in a **Minimalist Corporate** aesthetic, optimized for high-density information processing and cognitive clarity. The brand personality is efficient, reliable, and intelligent, aiming to evoke a sense of professional mastery over complex audio data.

The visual language focuses on extreme functionalism: heavy use of whitespace to separate structural elements from editorial content, a restricted color palette to prevent visual fatigue during long transcription sessions, and sharp, precise execution of UI components. The system avoids unnecessary decorative flourishes, ensuring that the user's focus remains entirely on the accuracy and flow of the transcribed text.

## Colors
The palette is engineered for a high-tech SaaS environment. 
- **Primary (Electric Blue):** Used strictly for high-priority actions, progress indicators, and active states. It provides a vibrant signal of "work in progress" or "completion."
- **Secondary (Deep Indigo):** Reserved for navigation backgrounds, sidebar headers, and deep structural grounding. It establishes the "professional" weight of the platform.
- **Tertiary (Indigo Wash):** Used for subtle accents, hover states on secondary buttons, and icon backgrounds.
- **Neutral (Slate Grays):** A multi-step scale of grays used for text hierarchy, borders, and empty states. 

Surface colors should prioritize a "Paper" feel (#FCFCFD) for the main transcription area to reduce eye strain, while the surrounding chrome uses cooler slate tones.

## Typography
This design system utilizes **Inter** as the primary typeface for its exceptional legibility and neutral, modern character. For technical data—specifically timestamps, confidence scores, and code-like snippets—**JetBrains Mono** is employed to provide a clear visual distinction between editorial content and system metadata.

Line heights are generous in the body levels to facilitate easy reading of long-form transcripts. Headlines use tighter tracking to maintain a "locked-in" professional feel.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The main application dashboard utilizes a 12-column grid on desktop, but the "Transcription Editor" view is constrained to a max-width of 1440px to prevent excessively long line lengths that hinder readability.

- **Desktop (1280px+):** 12 columns, 24px gutters, 32px margins.
- **Tablet (768px-1279px):** 8 columns, 16px gutters, 24px margins. Sidebar collapses into a rail.
- **Mobile (<767px):** 4 columns, 16px gutters, 16px margins.

Vertical rhythm is strictly managed in 4px increments. Components like the video preview player and the text editor should maintain a 2:3 ratio or stay pinned to the viewport height to ensure the "Timeline" is always visible.

## Elevation & Depth
Depth is conveyed through **Low-contrast Outlines** and subtle tonal layering rather than heavy shadows. This maintains the "Clean/High-Tech" feel.

- **Level 0 (Background):** The primary canvas color (Slate 50).
- **Level 1 (Cards/Panels):** Pure white background with a 1px border in Slate 200. No shadow.
- **Level 2 (Dropdowns/Modals):** Pure white background with a 1px border in Slate 200 and a soft, highly diffused ambient shadow (0px 8px 24px rgba(0,0,0,0.04)).
- **Active State:** Elements being interacted with (like a currently playing transcript block) receive a subtle background tint of Primary 50 to pull them forward visually without using elevation.

## Shapes
The shape language is **Soft (0.25rem)**. This provides a precision-engineered look that feels modern but more approachable than sharp 90-degree corners. 

Buttons and input fields use the 0.25rem standard. "Pill" shapes are reserved exclusively for status indicators (e.g., "Processing," "Done") and platform-specific chips (YouTube, TikTok) to make them instantly recognizable as distinct, non-interactive or specialized metadata.

## Components
- **Transcription Text Blocks:** Each block consists of a Timestamp (JetBrains Mono), a Speaker Label (Inter Bold), and the Editable Text. Hovering over a block reveals a "Play from here" icon and a "Copy link to timestamp" button.
- **Input Fields:** Use a 1px Slate 300 border. On focus, the border transitions to Electric Blue with a 2px outer glow of the same color at 10% opacity.
- **Progress Indicators:** Linear bars for "Upload" or "Transcription" status. Use the Electric Blue primary color. For long processes, include a "Time remaining" estimate in `label-mono` style.
- **Platform Chips:** Icons for YouTube, TikTok, and Instagram should be monochromatic (Slate 600) until hovered, at which point they adopt their brand-specific color. This maintains the professional neutrality of the dashboard.
- **Primary Buttons:** Solid Electric Blue with white text. No gradients.
- **Secondary Buttons:** White background with 1px Slate 300 border; text in Indigo.
- **The "Timeline" Component:** A horizontal scrubber at the bottom of the screen. The waveform should be rendered in Slate 300, with the "played" portion in Electric Blue.