---
name: PasteScribe
colors:
  surface: '#faf8ff'
  surface-dim: '#d5d9f0'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3ff'
  surface-container: '#ebedff'
  surface-container-high: '#e3e7fe'
  surface-container-highest: '#dee1f9'
  on-surface: '#161b2b'
  on-surface-variant: '#444656'
  inverse-surface: '#2b3041'
  inverse-on-surface: '#eff0ff'
  outline: '#747687'
  outline-variant: '#c4c5d8'
  surface-tint: '#214bea'
  primary: '#003adb'
  on-primary: '#ffffff'
  primary-container: '#3157f5'
  on-primary-container: '#e6e8ff'
  inverse-primary: '#b9c3ff'
  secondary: '#5a5e69'
  on-secondary: '#ffffff'
  secondary-container: '#dee2ef'
  on-secondary-container: '#60646f'
  tertiary: '#922f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#bb3e00'
  on-tertiary-container: '#ffe3db'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee1ff'
  primary-fixed-dim: '#b9c3ff'
  on-primary-fixed: '#001258'
  on-primary-fixed-variant: '#0032c2'
  secondary-fixed: '#dee2ef'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#171c25'
  on-secondary-fixed-variant: '#424751'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#faf8ff'
  on-background: '#161b2b'
  surface-variant: '#dee1f9'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system for this product is built on the principles of precision, efficiency, and clarity. It targets professionals—researchers, creators, and developers—who require immediate value without visual friction.

The style is **Modern Corporate**, leaning into high-fidelity minimalism. It utilizes a vast amount of purposeful whitespace to reduce cognitive load while maintaining a technical edge through sharp typography and a structured grid. The emotional response should be one of "effortless power"—the user feels they are using a tool that is objective, fast, and highly reliable. Avoid decorative elements like gradients or heavy textures; the aesthetics are driven by layout, contrast, and alignment.

## Colors
The palette is rooted in a "cool-clean" spectrum. The background and surface colors provide a light, airy environment that makes the **Electric Blue** primary color pop with intentionality.

- **Primary & Interactive:** Use the primary blue for calls-to-action and active states. It represents the "engine" of the transcription service.
- **Hierarchy:** Use `text_strong` for all headlines and critical labels to ensure maximum legibility. `text_secondary` is reserved for metadata, descriptions, and supporting copy.
- **Semantic States:** Use success, warning, and error colors sparingly. They should appear only as functional feedback rather than decorative accents.

## Typography
This design system uses **Inter** exclusively to maintain a systematic, utilitarian feel across all touchpoints.

Tighten the letter spacing on larger headings to create a premium editorial feel. For body text, the default spacing is used to maximize readability. High contrast between weights is critical for scanning dense transcription data.

## Layout & Spacing
The design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile.

A strict 8px spacing scale governs all internal margins and paddings. Align items to the grid strictly; the layout should feel architectural and stable. For transcription views, use a centered fixed-width container around 800px to maintain line-length readability.

## Elevation & Depth
The system relies on **Tonal Layers** and **Low-contrast outlines** rather than heavy shadows.

- **Level 0:** `#F7F8FC`.
- **Level 1:** White `#FFFFFF` with a 1px border of `#DDE2ED`.
- **Level 2:** White `#FFFFFF` with a soft shadow and border.

Avoid floating elements without borders. The border is the primary tool for defining object boundaries.

## Shapes
Buttons and input fields should use 8px radius. Larger components like dashboard cards and video containers should use 16px. Do not use pill buttons except for small icon-only utility triggers.

## Components
- **Buttons:** Primary `#3157F5` with white text. Secondary `#EEF2FF` with blue text.
- **Input Fields:** 1px border `#DDE2ED`; focus in primary blue with a subtle outer ring.
- **Transcription Cards:** White surfaces with a primary accent for active states.
- **Status Chips:** Secondary surfaces with high-contrast text.
- **Video Preview:** 16px corner radius and subtle internal border.
- **Empty States:** Clean monochromatic iconography and direct guidance to paste a link.
