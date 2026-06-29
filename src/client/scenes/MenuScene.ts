import * as Phaser from 'phaser';
import { apiClient } from '../api/client';
import { session } from '../state/session';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';
import { generateRoute } from '../../shared/game/generator';
import { dateKeyUtc } from '../../shared/game/seed';

export class MenuScene extends Phaser.Scene {
  private tenantText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;

  constructor() {
    super('Menu');
  }

  create(): void {
    this.drawBackground();
    this.add
      .text(86, 74, 'DAILY DASH', {
        fontFamily: FONT_FAMILY,
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#243642',
      })
      .setDepth(2);
    this.add
      .text(92, 153, 'Build a tile today. Ride the community route forever.', {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        color: '#243642',
      })
      .setDepth(2);

    this.tenantText = this.add.text(94, 202, 'Opening the local route…', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#49626d',
    });

    createButton(this, 300, 300, 360, 72, 'RIDE TODAY’S ROUTE', () => {
      const route = session.bootstrap?.dailyRoute ?? this.createLocalRoute();
      session.lastRoute = route;
      this.scene.start('Runner', { route, mode: 'daily' });
    });

    createButton(
      this,
      300,
      390,
      360,
      72,
      'BUILD A COURSE TILE',
      () => this.scene.start('Builder'),
      { fill: COLORS.secondary }
    );

    createButton(this, 300, 480, 360, 72, 'ROADBOOK', () => this.scene.start('Roadbook'), {
      fill: COLORS.primary,
      fontSize: 22,
    });

    createButton(this, 300, 570, 170, 64, 'CREATOR', () => this.scene.start('Creator'), {
      fill: COLORS.reward,
      fontSize: 18,
    });

    createButton(this, 493, 570, 174, 64, 'BADGES', () => this.scene.start('Achievements'), {
      fill: COLORS.reward,
      fontSize: 18,
    });

    this.statusText = this.add
      .text(710, 579, 'Three lanes. Three integrity pips. One fair route required.', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#243642',
        wordWrap: { width: 470 },
        align: 'center',
      })
      .setOrigin(0.5);

    void this.loadBootstrap();
  }

  private createLocalRoute() {
    return generateRoute({
      tenant: { id: 'local-demo', name: 'Local Demo' },
      dateKey: dateKeyUtc(),
      communityTiles: [],
    });
  }

  private async loadBootstrap(): Promise<void> {
    try {
      const bootstrap = await apiClient.bootstrap();
      session.bootstrap = bootstrap;
      if (bootstrap.profile) session.profile = bootstrap.profile;
      else delete session.profile;
      session.lastRoute = bootstrap.dailyRoute;
      this.tenantText?.setText(
        `Today in r/${bootstrap.tenant.name} · ${bootstrap.authenticated ? `signed in as ${bootstrap.username}` : 'practice mode'}`
      );
      this.statusText?.setText(
        bootstrap.worldTourEnabled
          ? 'Tenant route ready · World Tour catalog connected'
          : 'Tenant route ready · World Tour remains an optional post-MVP adapter'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Server unavailable';
      this.tenantText?.setText(`Local demo mode · ${message}`);
    }
  }

  private drawBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paper, 1).fillRoundedRect(40, 34, 1200, 650, 30);
    graphics.lineStyle(4, COLORS.ink, 1).strokeRoundedRect(40, 34, 1200, 650, 30);

    graphics.fillStyle(COLORS.skyDark, 0.18).fillRoundedRect(628, 74, 555, 470, 26);
    const laneYs = [190, 320, 450];
    for (const [index, y] of laneYs.entries()) {
      graphics.fillStyle(COLORS.road, 1).fillRoundedRect(680, y, 440, 18, 9);
      graphics.lineStyle(3, COLORS.ink, 1).strokeRoundedRect(680, y, 440, 18, 9);
      if (index === 0) {
        graphics.fillStyle(COLORS.warning, 1).fillRoundedRect(955, y - 38, 34, 38, 5);
      }
      if (index === 1) {
        graphics.fillStyle(COLORS.secondary, 1).fillTriangle(825, y, 852, y, 838, y - 25);
        graphics.fillStyle(COLORS.reward, 1).fillCircle(1050, y - 25, 13);
      }
      if (index === 2) {
        graphics.fillStyle(COLORS.skyDark, 0.18).fillRect(870, y - 6, 90, 32);
      }
    }

    graphics.fillStyle(COLORS.primary, 1).fillRoundedRect(735, 402, 72, 42, 12);
    graphics.lineStyle(3, COLORS.ink, 1).strokeRoundedRect(735, 402, 72, 42, 12);
    graphics.fillStyle(COLORS.ink, 1).fillCircle(752, 449, 15).fillCircle(793, 449, 15);
    graphics.fillStyle(COLORS.reward, 1).fillRoundedRect(755, 374, 35, 31, 4);
  }
}
