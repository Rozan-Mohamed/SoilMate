import type { MascotMood, MascotOutfit } from '@/api/types';
import { en } from '@/strings/en';

const D = '#184030';
const BODY = '#a8f0c8';
const LEAF = '#48b080';
const CAPE = '#ef6a5b';
const GOLD = '#f5b50a';

type Props = {
  outfit?: MascotOutfit;
  mood?: MascotMood;
  className?: string;
  /** A small medical bag in the hand (Game 4 score screen). */
  bag?: boolean;
  /** Hide from screen readers when the mascot is only decoration. */
  decorative?: boolean;
};

const HAPPY_EYES: MascotMood[] = ['cheer', 'holdingTrophy'];

export function Mascot({
  outfit = 'none',
  mood = 'neutral',
  className = 'size-16',
  decorative,
  bag,
}: Props) {
  const cape = outfit === 'cape';
  const upArms = mood === 'cheer' || mood === 'holdingTrophy';
  const happyEyes = HAPPY_EYES.includes(mood);
  const eyeFill = cape ? '#fff' : D;

  const body = (
    <g stroke={D} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {cape && <path d="M30 56 14 104Q60 118 106 104L90 56Z" fill={CAPE} />}

      {/* arms (behind body) */}
      {upArms ? (
        <>
          <ellipse cx="19" cy="62" rx="7" ry="10" fill={BODY} transform="rotate(-25 19 62)" />
          <ellipse cx="101" cy="62" rx="7" ry="10" fill={BODY} transform="rotate(25 101 62)" />
        </>
      ) : mood === 'flying' ? (
        <>
          <ellipse cx="22" cy="68" rx="7" ry="10" fill={BODY} transform="rotate(-40 22 68)" />
          <ellipse cx="100" cy="64" rx="7" ry="10" fill={BODY} transform="rotate(40 100 64)" />
        </>
      ) : (
        <>
          <ellipse cx="20" cy="84" rx="7" ry="10" fill={BODY} />
          <ellipse cx="100" cy="84" rx="7" ry="10" fill={BODY} />
        </>
      )}

      {/* body */}
      <path
        d="M60 38C86 38 98 56 98 80c0 20-16 28-38 28S22 100 22 80c0-24 12-42 38-42Z"
        fill={BODY}
      />

      {outfit === 'raincoat' && (
        <>
          <path d="M26 70Q60 80 94 70c4 26-12 38-34 38S22 96 26 70Z" fill="#ffd54a" />
          <circle cx="60" cy="90" r="2.500" fill={D} />
          <circle cx="60" cy="100" r="2.500" fill={D} />
        </>
      )}
      {outfit === 'doctorCap' && (
        <>
          <path d="M24 93Q60 101 96 93L95 101Q60 109 25 101Z" fill="#8a5a3c" />
          <rect x="42" y="97" width="10" height="8" rx="2" fill="#c58b5b" />
          <rect x="68" y="97" width="10" height="8" rx="2" fill="#c58b5b" />
        </>
      )}

      {/* face */}
      {cape && <path d="M36 64Q60 56 84 64L82 77Q60 70 38 77Z" fill={D} />}
      {mood === 'oops' && (
        <>
          <path d="M40 61l12 4M80 61l-12 4" fill="none" strokeWidth={2.5} />
          <path
            d="M88 52c2 3 3 5 3 6.500a3 3 0 0 1-6 0c0-1.500 1-3.500 3-6.500Z"
            fill="#5bb6e8"
            strokeWidth={2}
          />
        </>
      )}
      {happyEyes ? (
        <>
          <path d="M40 72Q46 63 52 72M68 72Q74 63 80 72" fill="none" />
        </>
      ) : (
        <>
          <ellipse
            cx="46"
            cy="70"
            rx="4.500"
            ry="5.500"
            fill={eyeFill}
            strokeWidth={cape ? 1 : 0}
          />
          <ellipse
            cx="74"
            cy="70"
            rx="4.500"
            ry="5.500"
            fill={eyeFill}
            strokeWidth={cape ? 1 : 0}
          />
          <circle
            cx={cape ? 47 : 47.5}
            cy={cape ? 71 : 68}
            r={cape ? 2.8 : 1.5}
            fill={cape ? D : '#fff'}
            stroke="none"
          />
          <circle
            cx={cape ? 75 : 75.5}
            cy={cape ? 71 : 68}
            r={cape ? 2.8 : 1.5}
            fill={cape ? D : '#fff'}
            stroke="none"
          />
        </>
      )}
      <ellipse cx="37" cy="80" rx="5" ry="3.500" fill="#f5a34a" opacity="0.45" stroke="none" />
      <ellipse cx="83" cy="80" rx="5" ry="3.500" fill="#f5a34a" opacity="0.45" stroke="none" />
      {mood === 'cheer' && (
        <>
          <path d="M48 80Q60 99 72 80Z" fill={D} />
          <ellipse cx="60" cy="90" rx="5" ry="3" fill="#f5a34a" stroke="none" />
        </>
      )}
      {mood === 'oops' && <path d="M52 87Q56 82 60 87T68 87" fill="none" strokeWidth={2.5} />}
      {(mood === 'happy' || mood === 'flying' || mood === 'holdingTrophy') && (
        <path d="M51 81Q60 91 69 81" fill="none" strokeWidth={2.5} />
      )}
      {mood === 'neutral' && <path d="M54 82Q60 86 66 82" fill="none" strokeWidth={2.5} />}

      {/* doctor cap sits on the head, sprout grows through the top */}
      {outfit === 'doctorCap' && (
        <>
          <path d="M38 44C40 29 80 29 82 44Q60 49 38 44Z" fill="#fff" />
          <path d="M60 33v9M55.500 37.500h9" stroke="#006c4a" strokeWidth={3} />
        </>
      )}

      {/* sprout */}
      <path d="M60 38V26" fill="none" />
      <path d="M60 28C50 28 44 22 44 14c10 0 16 6 16 14Z" fill={LEAF} />
      <path d="M60 28c10 0 16-6 16-14-10 0-16 6-16 14Z" fill={LEAF} />

      {bag && (
        <g transform="translate(86 84)">
          <path d="M5 2V-2a6 4 0 0 1 12 0v4" fill="none" />
          <rect x="0" y="2" width="22" height="16" rx="3" fill="#fff" />
          <path d="M11 6v8M7 10h8" stroke="#006c4a" strokeWidth={2.5} />
        </g>
      )}

      {/* raincoat umbrella */}
      {outfit === 'raincoat' && (
        <>
          <path d="M104 40V88" fill="none" />
          <path d="M86 42Q103 16 119 42Z" fill="#f5a34a" />
        </>
      )}

      {/* trophy in the raised right hand */}
      {mood === 'holdingTrophy' && (
        <>
          <path d="M91 26H111V34C111 41 106 44 101 44S91 41 91 34Z" fill={GOLD} />
          <path d="M91 28H86Q86 37 92 37M111 28H116Q116 37 110 37" fill="none" strokeWidth={2.5} />
          <path d="M101 44V49M95 49H107V53H95Z" fill={GOLD} />
        </>
      )}
    </g>
  );

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      {...(decorative
        ? { 'aria-hidden': true }
        : { role: 'img', 'aria-label': en.game.mascotAria })}
    >
      {mood !== 'flying' && (
        <ellipse cx="60" cy="112" rx="28" ry="5" fill="#184030" opacity="0.1" />
      )}
      {mood === 'flying' ? <g transform="rotate(-14 60 70)">{body}</g> : body}
    </svg>
  );
}
