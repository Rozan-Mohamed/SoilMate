import type { GameSlug, MascotMood, MascotOutfit } from '@/api/types';

export type CollectionKind = 'terms' | 'powerBadges' | 'fieldTiles' | 'weatherStickers' | 'none';

export type GameConfig = {
  slug: GameSlug;
  title: string;
  position: 1 | 2 | 3 | 4 | 5;
  total: 5 | 6;
  mascotOutfit: MascotOutfit;
  /** Icon on the hub card. */
  hubIconKey: string;
  speechBubble: string;
  correctBannerTitle: string;
  collectionKind: CollectionKind;
  /** Heading above the collection grid on the score screen. */
  collectionTitle: string;
  /** Celebration style on the score screen. */
  confetti?: 'default' | 'leaves';
  resultTitle: string;
  resultBigMessage?: string;
  resultSubtitle?: string;
  resultScoreLine: (n: number) => string;
  resultMascotMood: MascotMood;
  /** Replaces the mascot on the score screen (Game 2 shows a satellite and a farmer). */
  resultHeroIconKey?: string;
  /** Game 5 shows the mascot under a rainbow. */
  resultRainbow?: boolean;
  badge: { name: string; iconKey: string };
  nextGame: { slug: GameSlug; buttonLabel: string; buttonIconKey: string } | null;
};

// Static per-game UI settings (Part 8). NOT questions: those always come from the API.
export const GAMES: readonly GameConfig[] = [
  {
    slug: 'match-the-word',
    title: 'Match the Word',
    position: 1,
    total: 5,
    mascotOutfit: 'none',
    hubIconKey: 'term-ndvi',
    speechBubble: 'What does this word mean?',
    correctBannerTitle: 'Great job!',
    collectionKind: 'terms',
    collectionTitle: 'Words reviewed',
    resultTitle: 'Great job!',
    resultScoreLine: (n) => `You matched ${n} words`,
    resultMascotMood: 'holdingTrophy',
    badge: { name: 'Word Wizard', iconKey: 'badge-word-wizard' },
    nextGame: {
      slug: 'satellite-or-ground',
      buttonLabel: 'Next Game: Satellite or Ground?',
      buttonIconKey: 'satellite',
    },
  },
  {
    slug: 'satellite-or-ground',
    title: 'Satellite or Ground?',
    position: 2,
    total: 6,
    mascotOutfit: 'none',
    hubIconKey: 'satellite',
    speechBubble: 'Who can tell us this?',
    correctBannerTitle: 'Great job!',
    collectionKind: 'none',
    collectionTitle: 'Field takeaways',
    resultTitle: 'Great job!',
    resultBigMessage: 'Together, we can do better',
    resultSubtitle: 'Satellite sees the big picture. You know the field.',
    resultScoreLine: (n) => `You answered ${n} correctly`,
    resultMascotMood: 'happy',
    resultHeroIconKey: 'result-satellite-and-farmer',
    badge: { name: 'Data Detective', iconKey: 'badge-data-detective' },
    nextGame: {
      slug: 'crop-superpowers',
      buttonLabel: 'Next Game: Crop Superpowers',
      buttonIconKey: 'power-superhero-leaf',
    },
  },
  {
    slug: 'crop-superpowers',
    title: 'Crop Superpowers',
    position: 3,
    total: 6,
    mascotOutfit: 'cape',
    hubIconKey: 'power-superhero-leaf',
    speechBubble: 'What is its main superpower?',
    correctBannerTitle: 'Power unlocked!',
    collectionKind: 'powerBadges',
    collectionTitle: 'Collected powers',
    confetti: 'leaves',
    resultTitle: 'Superpowers unlocked!',
    resultSubtitle: 'Your crops are real heroes',
    resultScoreLine: (n) => `You found ${n} superpowers`,
    resultMascotMood: 'flying',
    badge: { name: 'Crop Hero', iconKey: 'badge-crop-hero' },
    nextGame: {
      slug: 'fix-the-field',
      buttonLabel: 'Next Game: Fix the Field',
      buttonIconKey: 'magnifier-field',
    },
  },
  {
    slug: 'fix-the-field',
    title: 'Fix the Field',
    position: 4,
    total: 6,
    mascotOutfit: 'doctorCap',
    hubIconKey: 'magnifier-field',
    speechBubble: 'How do we fix this?',
    correctBannerTitle: 'Field fixed!',
    collectionKind: 'fieldTiles',
    collectionTitle: 'Field treatments',
    resultTitle: 'Fields fixed!',
    resultSubtitle: 'You are a great field doctor',
    resultScoreLine: (n) => `You fixed ${n} fields`,
    resultMascotMood: 'happy',
    badge: { name: 'Field Doctor', iconKey: 'badge-field-doctor' },
    nextGame: {
      slug: 'weather-and-crops',
      buttonLabel: 'Next Game: Weather and Crops',
      buttonIconKey: 'cloud-sun-drop',
    },
  },
  {
    slug: 'weather-and-crops',
    title: 'Weather and Crops',
    position: 5,
    total: 6,
    mascotOutfit: 'raincoat',
    hubIconKey: 'cloud-sun-drop',
    speechBubble: 'What will happen to the field?',
    correctBannerTitle: 'Nice call!',
    collectionKind: 'weatherStickers',
    collectionTitle: 'Weather sticker collection',
    resultTitle: 'Weather wise!',
    resultSubtitle: 'You can read the sky like a pro',
    resultScoreLine: (n) => `You predicted ${n} weather effects`,
    resultMascotMood: 'happy',
    resultRainbow: true,
    badge: { name: 'Weather Watcher', iconKey: 'badge-weather-watcher' },
    nextGame: null,
  },
];

export const GAME_BY_SLUG = Object.fromEntries(GAMES.map((g) => [g.slug, g])) as Record<
  GameSlug,
  GameConfig
>;

export const isGameSlug = (value: string): value is GameSlug => value in GAME_BY_SLUG;
