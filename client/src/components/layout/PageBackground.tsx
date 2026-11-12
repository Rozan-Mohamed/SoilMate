// A calm illustrated field behind every page: faded hills, slow clouds, a few drifting leaves.
// Purely decorative (aria-hidden, no pointer events) and very light so it never competes.
const CLOUDS = [
  { top: '12%', size: 120, duration: 110, delay: -30, opacity: 0.7 },
  { top: '26%', size: 90, duration: 150, delay: -90, opacity: 0.55 },
  { top: '8%', size: 70, duration: 190, delay: -140, opacity: 0.5 },
];

const LEAVES = [
  { left: '8%', top: '38%', duration: 7, delay: 0 },
  { left: '86%', top: '30%', duration: 9, delay: -3 },
  { left: '72%', top: '58%', duration: 8, delay: -5 },
  { left: '20%', top: '62%', duration: 10, delay: -2 },
];

export function PageBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {CLOUDS.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 120 50"
          width={c.size}
          className="bg-cloud absolute left-0"
          style={{
            top: c.top,
            opacity: c.opacity,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <g fill="#ffffff">
            <ellipse cx="35" cy="32" rx="26" ry="14" />
            <ellipse cx="62" cy="24" rx="26" ry="18" />
            <ellipse cx="88" cy="33" rx="24" ry="13" />
          </g>
        </svg>
      ))}

      {LEAVES.map((l, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          width="22"
          className="bg-leaf absolute"
          style={{
            left: l.left,
            top: l.top,
            opacity: 0.35,
            animationDuration: `${l.duration}s`,
            animationDelay: `${l.delay}s`,
          }}
        >
          <path d="M12 2C5 9 5 17 12 22c7-5 7-13 0-20Z" fill="#48b080" />
          <path d="M12 7v13" stroke="#e4f4ec" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ))}

      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-[34vh] w-full"
      >
        <path
          d="M0 170C180 110 340 120 520 160S900 230 1100 170 1340 110 1440 140V320H0Z"
          fill="#dcf3e5"
          opacity="0.85"
        />
        <path
          d="M0 230C200 190 380 215 600 235S1020 260 1220 225 1380 205 1440 215V320H0Z"
          fill="#cfeedb"
          opacity="0.9"
        />
        {/* faint crop rows */}
        <g stroke="#b9e3cb" strokeWidth="2" opacity="0.7" fill="none">
          <path d="M0 262C300 246 700 270 1440 250" />
          <path d="M0 284C300 270 760 292 1440 274" />
          <path d="M0 306C320 294 800 312 1440 298" />
        </g>
      </svg>
    </div>
  );
}
