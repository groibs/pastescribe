import type { SVGAttributes } from "react";

/**
 * Logomark do PasteScribe — documentos sobrepostos, inspirado em
 * copiar/colar (docs/PASTESCRIBE_BRIEFING.md). Recriado como SVG
 * inline a partir do conceito do logo do Stitch — não é o arquivo
 * original (raster, hotlinked de um CDN do Google que não controlamos;
 * ver docs/DESIGN_SYSTEM.md).
 */
export function Logomark(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect
        x="4"
        y="6"
        width="12"
        height="15"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M8.5 6V5.25C8.5 4.56 9.06 4 9.75 4H10.25C10.94 4 11.5 4.56 11.5 5.25V6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="8.5"
        y="9.5"
        width="12"
        height="15"
        rx="2.5"
        fill="var(--color-surface-container-lowest, #fff)"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}
