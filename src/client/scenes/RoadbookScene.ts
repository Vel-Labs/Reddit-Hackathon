import * as Phaser from 'phaser';
import { apiClient } from '../api/client';
import { session } from '../state/session';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';
import { generateRoute } from '../../shared/game/generator';
import { dateKeyUtc } from '../../shared/game/seed';
import type {
  CourseTile,
  LeaderboardEntry,
  RouteBundle,
  TileReportReason,
} from '../../shared/game/types';

const FOUNDING_AUTHOR = 'daily-dash-founders';
const REPORT_REASONS: { reason: TileReportReason; label: string }[] = [
  { reason: 'unfair-layout', label: 'FAIRNESS' },
  { reason: 'broken-route', label: 'BROKEN ROUTE' },
  { reason: 'unsafe-content', label: 'SAFETY' },
  { reason: 'wrong-attribution', label: 'ATTRIBUTION' },
];

const localRoute = (): RouteBundle =>
  generateRoute({
    tenant: { id: 'local-demo', name: 'Local Demo' },
    dateKey: dateKeyUtc(),
    communityTiles: [],
  });

const communityPercent = (route: RouteBundle): number => {
  if (route.tiles.length === 0) return 0;
  const communityTiles = route.tiles.filter((tile) => tile.authorId !== FOUNDING_AUTHOR).length;
  return Math.round((communityTiles / route.tiles.length) * 100);
};

const contributorCount = (route: RouteBundle): number =>
  new Set(
    route.tiles.filter((tile) => tile.authorId !== FOUNDING_AUTHOR).map((tile) => tile.authorId)
  ).size;

export class RoadbookScene extends Phaser.Scene {
  private routes: RouteBundle[] = [];
  private selectedIndex = 0;
  private routeText?: Phaser.GameObjects.Text;
  private detailText?: Phaser.GameObjects.Text;
  private leaderboardText?: Phaser.GameObjects.Text;
  private tileText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private selectedTileIndex = 0;
  private selectedReportReasonIndex = 0;

  constructor() {
    super('Roadbook');
  }

  create(): void {
    this.drawFrame();
    this.add.text(76, 54, 'ROADBOOK', {
      fontFamily: FONT_FAMILY,
      fontSize: '50px',
      fontStyle: 'bold',
      color: '#243642',
    });
    this.add.text(78, 108, 'Replay evergreen routes and inspect the current leaderboard.', {
      fontFamily: FONT_FAMILY,
      fontSize: '19px',
      color: '#49626d',
    });

    this.routeText = this.add.text(82, 160, 'Loading routes...', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#243642',
      lineSpacing: 12,
      wordWrap: { width: 520 },
    });
    this.detailText = this.add.text(690, 162, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '19px',
      color: '#243642',
      lineSpacing: 10,
      wordWrap: { width: 460 },
    });
    this.leaderboardText = this.add.text(690, 332, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#243642',
      lineSpacing: 9,
      wordWrap: { width: 460 },
    });
    this.tileText = this.add.text(690, 462, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#243642',
      lineSpacing: 7,
      wordWrap: { width: 480 },
    });
    this.statusText = this.add
      .text(640, 602, 'Roadbook falls back to local founding routes when Devvit is unavailable.', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#49626d',
        align: 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5);

    createButton(this, 205, 648, 210, 54, 'BACK', () => this.scene.start('Menu'), {
      fill: COLORS.muted,
      fontSize: 18,
    });
    createButton(this, 455, 648, 210, 54, 'PREVIOUS', () => this.selectOffset(-1), {
      fill: COLORS.paper,
      fontSize: 18,
    });
    createButton(this, 705, 648, 210, 54, 'NEXT', () => this.selectOffset(1), {
      fill: COLORS.paper,
      fontSize: 18,
    });
    createButton(this, 915, 648, 180, 54, 'PLAY ROUTE', () => this.playSelected(), {
      fill: COLORS.primary,
      fontSize: 18,
    });
    createButton(this, 1120, 648, 160, 54, 'SHUFFLE', () => void this.shuffle(), {
      fill: COLORS.secondary,
      fontSize: 16,
    });
    createButton(this, 742, 568, 125, 42, 'NEXT TILE', () => this.selectNextTile(), {
      fill: COLORS.paper,
      fontSize: 13,
    });
    createButton(this, 887, 568, 135, 42, 'REASON', () => this.cycleReportReason(), {
      fill: COLORS.paper,
      fontSize: 13,
    });
    createButton(this, 1038, 568, 135, 42, 'REPORT', () => void this.reportSelectedTile(), {
      fill: COLORS.warning,
      fontSize: 13,
    });
    createButton(this, 1162, 516, 135, 42, 'REMOVE', () => void this.removeSelectedTile(), {
      fill: COLORS.muted,
      fontSize: 13,
    });

    void this.loadRoutes();
  }

  private async loadRoutes(): Promise<void> {
    try {
      const response = await apiClient.routes();
      this.routes = response.routes.length > 0 ? response.routes : [localRoute()];
      this.statusText?.setText(`Loaded ${this.routes.length} tenant Roadbook route(s).`);
    } catch (error) {
      const route = session.bootstrap?.dailyRoute ?? session.lastRoute ?? localRoute();
      this.routes = [route];
      const message = error instanceof Error ? error.message : 'Server unavailable';
      this.statusText?.setText(`Local Roadbook fallback · ${message}`);
    }
    this.selectedIndex = 0;
    this.selectedTileIndex = 0;
    this.renderRoutes();
    await this.loadLeaderboard();
  }

  private renderRoutes(): void {
    const lines = this.routes.map((route, index) => {
      const marker = index === this.selectedIndex ? '>' : ' ';
      const recipe = route.recipe;
      return `${marker} ${recipe.dateKey} · rev ${recipe.revision}\n  ${recipe.biomeId} · ${communityPercent(route)}% community · ${contributorCount(route)} creators`;
    });
    this.routeText?.setText(lines.join('\n\n'));

    const selected = this.routes[this.selectedIndex];
    if (!selected) {
      this.detailText?.setText('No route selected.');
      this.tileText?.setText('No tile selected.');
      return;
    }
    this.selectedTileIndex = Phaser.Math.Clamp(
      this.selectedTileIndex,
      0,
      Math.max(0, selected.tiles.length - 1)
    );
    this.detailText?.setText(
      [
        `ROUTE ${selected.recipe.dateKey}`,
        `Tenant: r/${selected.recipe.tenantName}`,
        `Biome: ${selected.recipe.biomeId}`,
        `Revision: ${selected.recipe.revision}`,
        `Tiles: ${selected.tiles.length}`,
        `Community authored: ${communityPercent(selected)}%`,
        `Contributors: ${contributorCount(selected)}`,
      ].join('\n')
    );
    this.renderTileInfo(selected);
  }

  private selectOffset(offset: -1 | 1): void {
    if (this.routes.length === 0) return;
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + offset, 0, this.routes.length);
    this.selectedTileIndex = 0;
    this.renderRoutes();
    void this.loadLeaderboard();
  }

  private renderTileInfo(route: RouteBundle): void {
    const tile = route.tiles[this.selectedTileIndex];
    if (!tile) {
      this.tileText?.setText('TILE REVIEW\nNo tile selected.');
      return;
    }
    const reason = REPORT_REASONS[this.selectedReportReasonIndex]?.label ?? 'FAIRNESS';
    this.tileText?.setText(
      [
        `TILE REVIEW ${this.selectedTileIndex + 1}/${route.tiles.length}`,
        `Source: ${this.tileSource(tile)}`,
        `Tile ID: ${tile.id}`,
        `Report reason: ${reason}`,
        'Reports are structured and private to review.',
      ].join('\n')
    );
  }

  private tileSource(tile: CourseTile): string {
    return tile.authorId === FOUNDING_AUTHOR ? 'Daily Dash fallback' : `u/${tile.authorName}`;
  }

  private selectNextTile(): void {
    const selected = this.routes[this.selectedIndex];
    if (!selected || selected.tiles.length === 0) return;
    this.selectedTileIndex = Phaser.Math.Wrap(this.selectedTileIndex + 1, 0, selected.tiles.length);
    this.renderRoutes();
  }

  private cycleReportReason(): void {
    this.selectedReportReasonIndex = Phaser.Math.Wrap(
      this.selectedReportReasonIndex + 1,
      0,
      REPORT_REASONS.length
    );
    this.renderRoutes();
  }

  private async reportSelectedTile(): Promise<void> {
    const selected = this.routes[this.selectedIndex];
    const tile = selected?.tiles[this.selectedTileIndex];
    const reason = REPORT_REASONS[this.selectedReportReasonIndex]?.reason;
    if (!selected || !tile || !reason) return;
    try {
      await apiClient.reportTile({
        routeId: selected.recipe.id,
        routeRevision: selected.recipe.revision,
        tileId: tile.id,
        reason,
      });
      this.statusText?.setText('Report saved for moderator review.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Report failed.';
      this.statusText?.setText(`Report unavailable · ${message}`);
    }
  }

  private async removeSelectedTile(): Promise<void> {
    const selected = this.routes[this.selectedIndex];
    const tile = selected?.tiles[this.selectedTileIndex];
    if (!selected || !tile) return;
    try {
      const response = await apiClient.removeRouteTile(tile.id, {
        routeId: selected.recipe.id,
        routeRevision: selected.recipe.revision,
      });
      this.statusText?.setText(`Tile removed. Repaired ${response.repairedRoutes} route(s).`);
      await this.loadRoutes();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Removal failed.';
      this.statusText?.setText(`Removal unavailable · ${message}`);
    }
  }

  private async loadLeaderboard(): Promise<void> {
    const selected = this.routes[this.selectedIndex];
    if (!selected) {
      this.leaderboardText?.setText('LEADERBOARD\nNo route selected.');
      return;
    }
    try {
      const response = await apiClient.leaderboard(selected.recipe.id, selected.recipe.revision);
      this.leaderboardText?.setText(
        this.formatLeaderboard(response.entries, response.routeRevision)
      );
    } catch {
      this.leaderboardText?.setText(
        `LEADERBOARD · REV ${selected.recipe.revision}\nNo ranked runs yet.\nPractice results stay local.`
      );
    }
  }

  private formatLeaderboard(entries: LeaderboardEntry[], routeRevision: number): string {
    const heading = `LEADERBOARD · REV ${routeRevision}`;
    if (entries.length === 0) return `${heading}\nNo ranked runs yet.`;
    return `${heading}\n${entries
      .slice(0, 6)
      .map((entry) => `${entry.rank}. ${entry.username} · ${entry.score.toLocaleString()}`)
      .join('\n')}`;
  }

  private playSelected(): void {
    const selected = this.routes[this.selectedIndex] ?? localRoute();
    session.lastRoute = selected;
    this.scene.start('Runner', { route: selected, mode: 'random' });
  }

  private async shuffle(): Promise<void> {
    try {
      const response = await apiClient.randomRoute();
      session.lastRoute = response.route;
      this.scene.start('Runner', { route: response.route, mode: 'random' });
    } catch {
      this.playSelected();
    }
  }

  private drawFrame(): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(COLORS.paper, 1).fillRoundedRect(40, 34, 1200, 650, 30);
    graphics.lineStyle(4, COLORS.ink, 1).strokeRoundedRect(40, 34, 1200, 650, 30);
    graphics.fillStyle(COLORS.skyDark, 0.16).fillRoundedRect(64, 146, 560, 430, 18);
    graphics.fillStyle(COLORS.white, 0.46).fillRoundedRect(668, 146, 508, 430, 18);
    graphics.lineStyle(2, COLORS.ink, 0.2).strokeRoundedRect(668, 146, 508, 430, 18);
  }
}
