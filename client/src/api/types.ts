// Mirrors soilmate-learn-play-contract.json (v1.1.0). camelCase everywhere.

export const GAME_SLUGS = [
  'match-the-word',
  'satellite-or-ground',
  'crop-superpowers',
  'fix-the-field',
  'weather-and-crops',
] as const;
export type GameSlug = (typeof GAME_SLUGS)[number];

export type AttemptStatus = 'active' | 'completed' | 'failed' | 'abandoned';
export type MascotOutfit = 'none' | 'cape' | 'doctorCap' | 'raincoat';
export type MascotMood = 'neutral' | 'happy' | 'cheer' | 'oops' | 'flying' | 'holdingTrophy';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'ATTEMPT_NOT_ACTIVE'
  | 'QUESTION_ALREADY_RESOLVED'
  | 'QUESTION_NOT_IN_ATTEMPT'
  | 'ATTEMPT_NOT_FINISHED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'INTERNAL'
  | 'NETWORK'; // frontend only: the request never reached the server

export interface Choice {
  key: string;
  label: string;
  iconKey: string;
}

export interface QuestionForPlay {
  id: string;
  key: string;
  position: number;
  prompt: string;
  subtitle?: string;
  illustrationKey?: string;
  choices: Choice[];
  /** Resume response only. */
  resolved?: boolean;
  /** Resume response only: choices to show disabled. */
  wrongChoiceKeys?: string[];
  /** Resume response only (contract v1.1.0): lets us restore the collection row. */
  firstTryCorrect?: boolean;
}

export interface AttemptState {
  attemptId: string;
  gameSlug: GameSlug;
  status: AttemptStatus;
  hearts: number;
  streak: number;
  points: number;
  total: 5 | 6;
  questions: QuestionForPlay[];
}

export interface CollectionItem {
  key: string;
  label: string;
  iconKey: string;
  earned: boolean;
}

export interface Badge {
  name: string;
  iconKey: string;
  earned: boolean;
}

export interface AnswerResponse {
  correct: boolean;
  /** Only when correct. */
  correctChoiceKey?: string;
  /** Only when correct. */
  explanation?: string;
  firstTry: boolean;
  pointsEarned: 0 | 10;
  hearts: number;
  streak: number;
  totalPoints: number;
  attemptStatus: AttemptStatus;
  allResolved: boolean;
  collectionItem?: CollectionItem;
  /** Fix the Field only, when correct (contract v1.1.0). */
  illustrationFixedKey?: string;
  /** Weather and Crops only, when correct (contract v1.1.0). */
  resultAnimationKey?: string;
}

export interface SkipResponse {
  correctChoiceKey: string;
  explanation: string;
  hearts: number;
  streak: 0;
  totalPoints: number;
  attemptStatus: AttemptStatus;
  allResolved: boolean;
}

export interface RecapChip {
  label: string;
  iconKey: string;
}

export interface FinaleData {
  allGamesDone: boolean;
  totalPoints: number;
  gamesDone: number;
  badges: { gameSlug: GameSlug; name: string; iconKey: string; earned: boolean }[];
  masterBadge: Badge;
}

export interface CompleteResponse {
  attemptId: string;
  gameSlug: GameSlug;
  score: number;
  total: 5 | 6;
  stars: 0 | 1 | 2 | 3;
  points: number;
  bestStreak: number;
  badge: Badge;
  collection: CollectionItem[];
  recap?: RecapChip[];
  nextGame: { slug: GameSlug; title: string } | null;
  finale?: FinaleData;
}

export interface GameSummary {
  slug: GameSlug;
  title: string;
  position: number;
  questionsPerRound: 5 | 6;
  poolSize: 6 | 30;
  questionsSeen: number;
  mascotOutfit: MascotOutfit;
  badge: { name: string; iconKey: string };
  best: {
    score: number | null;
    stars: number | null;
    points: number | null;
    badgeEarned: boolean;
    completed: boolean;
    timesPlayed: number;
  };
}

export interface ProgressResponse {
  totalPoints: number;
  gamesDone: number;
  games: {
    slug: GameSlug;
    completed: boolean;
    bestScore: number | null;
    bestStars: number | null;
    bestPoints: number | null;
    badgeEarned: boolean;
    questionsSeen: number;
  }[];
  masterBadge: Badge;
}

export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; details?: Record<string, unknown> };
}
