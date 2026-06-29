import * as Phaser from 'phaser';
import type { CreatorOutcomeResponse, CreatorOutcomeTile } from '../../shared/api';
import { apiClient } from '../api/client';
import { session } from '../state/session';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';

const formatChoices = (tile: CreatorOutcomeTile): string =>
  `top ${tile.pathChoices.top} · middle ${tile.pathChoices.middle} · bottom ${tile.pathChoices.bottom}`;

export class CreatorScene extends Phaser.Scene {
  private statusText?: Phaser.GameObjects.Text;
  private bodyText?: Phaser.GameObjects.Text;

  constructor() {
    super('Creator');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paper, 1).fillRoundedRect(40, 34, 1200, 650, 30);
    graphics.lineStyle(4, COLORS.ink, 1).strokeRoundedRect(40, 34, 1200, 650, 30);
    graphics.fillStyle(COLORS.skyDark, 0.14).fillRoundedRect(78, 146, 1124, 396, 18);

    this.add.text(82, 58, 'CREATOR POSTCARD', {
      fontFamily: FONT_FAMILY,
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#243642',
    });
    this.add.text(
      86,
      112,
      'See where your certified tiles entered routes and how players crossed them.',
      {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#49626d',
      }
    );

    this.statusText = this.add.text(90, 165, 'Loading creator outcomes...', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#243642',
      wordWrap: { width: 1040 },
    });
    this.bodyText = this.add.text(92, 225, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#243642',
      lineSpacing: 10,
      wordWrap: { width: 1060 },
    });

    createButton(this, 1090, 640, 240, 58, 'BACK', () => this.scene.start('Menu'), {
      fill: COLORS.primary,
      fontSize: 20,
    });

    void this.loadOutcome();
  }

  private async loadOutcome(): Promise<void> {
    try {
      const response = await apiClient.creatorOutcome();
      session.profile = response.profile;
      this.renderOutcome(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Creator outcomes unavailable.';
      this.statusText?.setText('Creator outcomes need an authenticated playtest session.');
      this.bodyText?.setText(
        [
          message,
          '',
          'Local practice still works, but feature and crossing stats are stored in tenant Redis after Reddit sign-in.',
        ].join('\n')
      );
    }
  }

  private renderOutcome(outcome: CreatorOutcomeResponse): void {
    this.statusText?.setText(
      `${outcome.featuredTiles} featured tile(s) · ${outcome.totalCrossings} total crossing(s)`
    );
    if (outcome.tiles.length === 0) {
      this.bodyText?.setText(
        [
          'No featured creator routes yet.',
          '',
          'Publish a certified tile, then return after a daily route includes it.',
        ].join('\n')
      );
      return;
    }

    const lines = outcome.tiles
      .slice(0, 5)
      .map((tile) =>
        [
          `${tile.dateKey} · route rev ${tile.routeRevision} · section ${tile.tileIndex + 1}`,
          `Crossings ${tile.crossings} · clean ${tile.cleanCrossings} · choices ${formatChoices(tile)}`,
        ].join('\n')
      );
    this.bodyText?.setText(lines.join('\n\n'));
  }
}
