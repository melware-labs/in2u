// Íconos de línea al estilo del set del diseño Devyn (Hugeicons, trazo 1.5).
// Dibujados a mano: los SVG originales del Figma no se pueden descargar.
import type { ReactNode } from 'react';

function Svg({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Svg>
    <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z" />
    <path d="M9 16h6" />
  </Svg>
);

export const CalendarIcon = ({ size }: { size?: number }) => (
  <Svg size={size}>
    <path d="M16 2v4M8 2v4M3 9h18" />
    <rect x="3" y="4" width="18" height="18" rx="3" />
    <path d="M10 14.5h.01M14 14.5h.01M10 18h.01M14 18h.01" strokeWidth={2.2} />
  </Svg>
);

export const IdeaIcon = () => (
  <Svg>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.6 10.8c.6.45.9 1.1.9 1.8V16h5.4v-.4c0-.7.3-1.35.9-1.8A6 6 0 0 0 12 3Z" />
  </Svg>
);

export const MoonIcon = () => (
  <Svg>
    <path d="M20.5 14.1A8.5 8.5 0 1 1 9.9 3.5a7 7 0 0 0 10.6 10.6Z" />
  </Svg>
);

export const UserIcon = () => (
  <Svg>
    <circle cx="12" cy="7.5" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const PlusCircleIcon = () => (
  <Svg size={20}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </Svg>
);

export const ClockIcon = () => (
  <Svg size={16}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

export const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <Svg size={16}>
    <path d={dir === 'left' ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
  </Svg>
);

// Dos corazones unidos por un lazo, como el trazo rojo de la portada de Devyn.
const heart = (x: number, y: number, r: number) =>
  `M${x} ${y + r * 1.1}C${x - r * 1.6} ${y} ${x - r * 1.2} ${y - r * 1.2} ${x} ${y - r * 0.5}` +
  `C${x + r * 1.2} ${y - r * 1.2} ${x + r * 1.6} ${y} ${x} ${y + r * 1.1}Z`;

export const HeartsLoop = () => (
  <svg className="hearts-loop" viewBox="0 0 240 150" fill="none" aria-hidden>
    <path
      d="M48 104C30 60 70 10 120 10s92 50 72 94c-14 30-56 42-72 42s-58-12-72-42Z"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
    />
    <path d={heart(48, 92, 20)} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    <path d={heart(192, 92, 20)} stroke="currentColor" strokeWidth={2} strokeLinejoin="round" />
    <path d={heart(120, 76, 14)} fill="currentColor" opacity={0.85} />
  </svg>
);
