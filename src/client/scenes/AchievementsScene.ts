import * as Phaser from 'phaser';
import { ACHIEVEMENTS } from '../../shared/game/achievements';
import type { PlayerProfile } from '../../shared/game/types';
import { session } from '../state/session';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';

const statLabel = (
  profile: PlayerProfile | undefined,
  stat: keyof PlayerProfile['stats']
): string => String(profile?.stats[stat] ?? 0);

export class AchievementsScene extends Phaser.Scene {
  constructor() {
    super('Achievements');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paper, 1).fillRoundedRect(38, 30, 1204, 660, 30);
    graphics.lineStyle(4, COLORS.ink, 1).strokeRoundedRect(38, 30, 1204, 660, 30);

    this.add.text(78, 60, 'ACHIEVEMENT POSTCARD', {
      fontFamily: FONT_FAMILY,
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#243642',
    });
    this.add.text(
      80,
      111,
      'Milestones should reinforce fair building, clean deliveries, and community impact.',
      {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#49626d',
      }
    );

    const profile = session.profile;
    const unlocked = new Set(profile?.unlocked.map((entry) => entry.id) ?? []);
    ACHIEVEMENTS.forEach((achievement, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 80 + column * 575;
      const y = 165 + row * 105;
      const isUnlocked = unlocked.has(achievement.id);
      graphics
        .fillStyle(isUnlocked ? COLORS.reward : COLORS.white, isUnlocked ? 0.7 : 0.52)
        .fillRoundedRect(x, y, 535, 83, 16);
      graphics
        .lineStyle(3, COLORS.ink, isUnlocked ? 0.86 : 0.24)
        .strokeRoundedRect(x, y, 535, 83, 16);
      graphics
        .fillStyle(isUnlocked ? COLORS.secondary : COLORS.muted, 1)
        .fillCircle(x + 40, y + 41, 23);
      this.add
        .text(x + 40, y + 40, isUnlocked ? '✓' : '·', {
          fontFamily: FONT_FAMILY,
          fontSize: '28px',
          fontStyle: 'bold',
          color: '#243642',
        })
        .setOrigin(0.5);
      this.add.text(x + 78, y + 12, achievement.name.toUpperCase(), {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#243642',
      });
      this.add.text(x + 78, y + 39, achievement.description, {
        fontFamily: FONT_FAMILY,
        fontSize: '14px',
        color: '#49626d',
        wordWrap: { width: 340 },
      });
      this.add
        .text(x + 497, y + 27, `${statLabel(profile, achievement.stat)}/${achievement.target}`, {
          fontFamily: FONT_FAMILY,
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#243642',
        })
        .setOrigin(1, 0);
    });

    this.add.text(
      80,
      602,
      profile
        ? `Best streak ${profile.stats.bestStreak} · ${profile.stats.uniqueRoutesCompleted} unique routes · ${profile.stats.tilesCertified} certified tiles`
        : 'Practice mode: sign in through Reddit playtest to persist progress.',
      {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#49626d',
      }
    );

    createButton(this, 1090, 640, 240, 58, 'BACK', () => this.scene.start('Menu'), {
      fill: COLORS.primary,
      fontSize: 20,
    });
  }
}
