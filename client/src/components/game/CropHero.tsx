'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

const D = '#184030';

type Props = {
  /** The crop icon key sent by the API (illustrationKey). It sits on the hero's belly. */
  iconKey?: string;
  /** True right after a correct answer: power pose and a glowing aura. */
  powered?: boolean;
};

const SPARKLES = [
  { left: '6%', top: '20%', delay: 0 },
  { left: '86%', top: '14%', delay: 0.5 },
  { left: '92%', top: '58%', delay: 1 },
  { left: '2%', top: '62%', delay: 1.5 },
];

// A round crop hero with a cape and a mask. Decorative: the crop name in the question tells the story.
export function CropHero({ iconKey, powered = false }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto grid size-44 place-items-center" aria-hidden="true">
      <motion.div
        className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(144_244_192/0.95),rgb(144_244_192/0)_66%)]"
        animate={{ opacity: powered ? 1 : 0.5, scale: powered ? 1.3 : 1 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 14 }}
      />

      {SPARKLES.map((sp, i) => (
        <motion.svg
          key={i}
          viewBox="-6 -6 12 12"
          className="absolute size-4 text-gold"
          style={{ left: sp.left, top: sp.top }}
          animate={reduce ? undefined : { scale: [0.6, 1.1, 0.6], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: sp.delay }}
        >
          <path
            d="M0-5.500 1.600-1.600 5.500 0 1.600 1.600 0 5.500-1.600 1.600-5.500 0-1.600-1.600Z"
            fill="currentColor"
          />
        </motion.svg>
      ))}

      <motion.div
        className="relative size-full"
        animate={
          powered && !reduce
            ? { scale: [1, 1.14, 1], y: [0, -10, 0], rotate: [0, -4, 4, 0] }
            : { scale: 1, y: 0, rotate: 0 }
        }
        transition={{ duration: 0.7 }}
      >
        <svg viewBox="0 0 160 160" className="absolute inset-0 size-full">
          <g stroke={D} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            {/* cape */}
            <path d="M44 74 24 140Q80 156 136 140L116 74Z" fill="#ef6a5b" />
            {/* arms */}
            {powered ? (
              <>
                <ellipse
                  cx="26"
                  cy="70"
                  rx="9"
                  ry="13"
                  fill="#48b080"
                  transform="rotate(-30 26 70)"
                />
                <ellipse
                  cx="134"
                  cy="70"
                  rx="9"
                  ry="13"
                  fill="#48b080"
                  transform="rotate(30 134 70)"
                />
              </>
            ) : (
              <>
                <ellipse cx="28" cy="102" rx="9" ry="13" fill="#48b080" />
                <ellipse cx="132" cy="102" rx="9" ry="13" fill="#48b080" />
              </>
            )}
            {/* body */}
            <circle cx="80" cy="88" r="46" fill="#48b080" />
            <ellipse cx="80" cy="108" rx="30" ry="24" fill="#a8f0c8" strokeWidth="0" />
            {/* head leaves */}
            <path d="M80 44V30" fill="none" />
            <path d="M80 34C68 34 62 26 62 18c12 0 18 8 18 16Z" fill="#79d39a" />
            <path d="M80 34c12 0 18-8 18-16-12 0-18 8-18 16Z" fill="#5cc48f" />
            {/* mask + eyes */}
            <path d="M42 70Q80 56 118 70L114 92Q80 80 46 92Z" fill={D} />
            <ellipse cx="62" cy="79" rx="9" ry="8" fill="#fff" strokeWidth="0" />
            <ellipse cx="98" cy="79" rx="9" ry="8" fill="#fff" strokeWidth="0" />
            <circle cx="64" cy="80" r="4.500" fill={D} strokeWidth="0" />
            <circle cx="100" cy="80" r="4.500" fill={D} strokeWidth="0" />
            <path
              d={powered ? 'M66 98Q80 112 94 98Z' : 'M69 99Q80 107 91 99'}
              fill={powered ? D : 'none'}
              strokeWidth="3"
            />
          </g>
        </svg>
        {/* the crop on the belly */}
        <div className="absolute left-1/2 top-[66%] grid size-[28%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-deep bg-white shadow-press-soft">
          {iconKey && <Icon name={iconKey} className="size-[72%]" />}
        </div>
      </motion.div>
    </div>
  );
}
