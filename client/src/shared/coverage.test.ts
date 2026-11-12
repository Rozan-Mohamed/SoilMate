import { describe, expect, it } from 'vitest';
import iconKeys from './icon-keys.json';
import { ICON_MAP } from '@/assets/icon-map';
import { SCENES } from '@/components/scene/scenes';
import { GAMES, GAME_BY_SLUG } from '@/features/learn/gameConfig';
import { GAME_SLUGS } from '@/api/types';

describe('art coverage', () => {
  it('every icon key the API can send has an icon or a scene preset', () => {
    const missing = iconKeys.keys.filter((key) => !(key in ICON_MAP) && !(key in SCENES));
    expect(missing).toEqual([]);
  });

  it('the icon map has no key the API never sends (typos)', () => {
    const known = new Set(iconKeys.keys);
    // A few keys are used only by the client (UI chrome) and are allowed.
    const extra = Object.keys(ICON_MAP).filter((key) => !known.has(key));
    expect(extra).toEqual([]);
  });

  it('every scene preset is a real scene key', () => {
    const known = new Set(iconKeys.keys);
    expect(Object.keys(SCENES).filter((key) => !known.has(key))).toEqual([]);
  });
});

describe('game config', () => {
  it('covers the 5 slugs in order, and each next game follows the previous one', () => {
    expect(GAMES.map((g) => g.slug)).toEqual([...GAME_SLUGS]);
    GAMES.forEach((game, i) => {
      expect(game.position).toBe(i + 1);
      expect(game.nextGame?.slug ?? null).toBe(GAMES[i + 1]?.slug ?? null);
    });
  });

  it('every game has the art keys it points at', () => {
    for (const game of GAMES) {
      expect(ICON_MAP[game.hubIconKey], `${game.slug} hub icon`).toBeDefined();
      expect(ICON_MAP[game.badge.iconKey], `${game.slug} badge icon`).toBeDefined();
      if (game.nextGame)
        expect(ICON_MAP[game.nextGame.buttonIconKey], `${game.slug} next icon`).toBeDefined();
      if (game.resultHeroIconKey) expect(ICON_MAP[game.resultHeroIconKey]).toBeDefined();
    }
    expect(GAME_BY_SLUG['fix-the-field'].title).toBe('Fix the Field');
  });
});
