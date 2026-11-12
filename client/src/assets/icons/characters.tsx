// Small friendly characters drawn in a local 24x32 box, reused by the choice icons and the Game 2 score art.
const D = '#184030';
const SKIN = '#f6d2b0';

export function Farmer({ smile = true }: { smile?: boolean }) {
  return (
    <g stroke={D} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* legs */}
      <path d="M9 24v7M15 24v7" fill="none" />
      {/* body */}
      <rect x="6" y="14" width="12" height="11" rx="3.5" fill="#48b080" />
      {/* arms */}
      <path d="M6 17 2 23M18 17l4 6" fill="none" />
      {/* head */}
      <circle cx="12" cy="9" r="5.2" fill={SKIN} />
      {/* straw hat */}
      <ellipse cx="12" cy="5.8" rx="9" ry="2.2" fill="#f5b50a" />
      <path d="M7.200 5.600C7.600 1 16.400 1 16.800 5.600Z" fill="#f5b50a" />
      <circle cx="10" cy="9.500" r="0.7" fill={D} stroke="none" />
      <circle cx="14" cy="9.500" r="0.7" fill={D} stroke="none" />
      {smile && <path d="M10 11.800q2 1.600 4 0" fill="none" strokeWidth="1.2" />}
    </g>
  );
}

export function SatelliteBot({ smile = true }: { smile?: boolean }) {
  return (
    <g stroke={D} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6V1" fill="none" />
      <circle cx="12" cy="1" r="1.200" fill="#f5b50a" />
      {/* solar panels */}
      <rect x="-3" y="9" width="9" height="7" rx="1.200" fill="#5bb6e8" />
      <rect x="18" y="9" width="9" height="7" rx="1.200" fill="#5bb6e8" />
      <path d="M1.500 9v7M24.500 9v7M6 12.500h2M16 12.500h2" fill="none" strokeWidth="1" />
      {/* body */}
      <rect x="6" y="6" width="12" height="13" rx="3.500" fill="#eaf6f1" />
      <circle cx="10" cy="11" r="0.8" fill={D} stroke="none" />
      <circle cx="14" cy="11" r="0.8" fill={D} stroke="none" />
      {smile && <path d="M10 14q2 1.800 4 0" fill="none" strokeWidth="1.200" />}
    </g>
  );
}
