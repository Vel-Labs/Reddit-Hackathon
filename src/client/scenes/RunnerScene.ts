import * as Phaser from 'phaser';
import { apiClient } from '../api/client';
import { session } from '../state/session';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';
import { FOUNDING_TILES } from '../../shared/game/foundingTiles';
import { generateRoute, countRouteParcels } from '../../shared/game/generator';
import { scoreRun } from '../../shared/game/scoring';
import { dateKeyUtc } from '../../shared/game/seed';
import { flattenRouteColumns } from '../../shared/game/tile';
import type {
  CourseTile,
  Lane,
  LaneInputEvent,
  RouteBundle,
  RunResult,
  RunSubmission,
} from '../../shared/game/types';

type RunnerMode = 'daily' | 'random' | 'preview';

type RunnerSceneData = {
  route?: RouteBundle;
  previewTile?: CourseTile;
  mode?: RunnerMode;
};

type ActiveRun = {
  token: string;
  routeRevision: number;
  startedAtMs: number;
};

const LANE_Y = [224, 356, 488] as const;
const PLAYER_X = 250;
const COLUMN_WIDTH = 96;
const BASE_COLUMNS_PER_SECOND = 2.75;
const BOOST_COLUMNS_PER_SECOND = 4.1;
const LANE_TWEEN_MS = 210;

const makePreviewRoute = (tile: CourseTile): RouteBundle => {
  const flankA = FOUNDING_TILES[0];
  const flankB = FOUNDING_TILES[1];
  const tiles = [flankA, tile, flankB].filter((entry): entry is CourseTile => Boolean(entry));
  return generateRoute({
    tenant: { id: 'preview', name: 'Builder Preview' },
    dateKey: dateKeyUtc(),
    communityTiles: tiles,
    length: 3,
    seedSalt: `preview:${tile.id}`,
  });
};

const makeLocalRoute = (): RouteBundle =>
  generateRoute({
    tenant: { id: 'local-demo', name: 'Local Demo' },
    dateKey: dateKeyUtc(),
    communityTiles: [],
  });

export class RunnerScene extends Phaser.Scene {
  private route: RouteBundle = makeLocalRoute();
  private mode: RunnerMode = 'daily';
  private columns = flattenRouteColumns(this.route.tiles);
  private activeRun: ActiveRun = { token: 'local-run', routeRevision: 1, startedAtMs: 0 };
  private lane: Lane = 1;
  private targetLane: Lane = 1;
  private positionColumns = 0;
  private processedColumn = -1;
  private integrity = 3;
  private parcelsCollected = 0;
  private boostsTriggered = 0;
  private boostUntilMs = 0;
  private invulnerableUntilMs = 0;
  private complete = false;
  private player?: Phaser.GameObjects.Container;
  private courseGraphics?: Phaser.GameObjects.Graphics;
  private sceneryGraphics?: Phaser.GameObjects.Graphics;
  private integrityText?: Phaser.GameObjects.Text;
  private statsText?: Phaser.GameObjects.Text;
  private keyboard: Phaser.Types.Input.Keyboard.CursorKeys | undefined;
  private touchUp?: Phaser.GameObjects.Zone;
  private touchDown?: Phaser.GameObjects.Zone;
  private wheelA?: Phaser.GameObjects.Arc;
  private wheelB?: Phaser.GameObjects.Arc;
  private parcelVisual?: Phaser.GameObjects.Rectangle;
  private tileLabels = new Map<number, Phaser.GameObjects.Text>();
  private feedbackText?: Phaser.GameObjects.Text;
  private feedbackTween?: Phaser.Tweens.Tween;
  private laneEvents: LaneInputEvent[] = [];

  constructor() {
    super('Runner');
  }

  init(data: RunnerSceneData): void {
    this.mode = data.mode ?? 'daily';
    if (data.previewTile) {
      this.route = makePreviewRoute(data.previewTile);
    } else if (data.route) {
      this.route = data.route;
    } else if (session.lastRoute) {
      this.route = session.lastRoute;
    } else {
      this.route = makeLocalRoute();
    }
    this.columns = flattenRouteColumns(this.route.tiles);
    this.lane = 1;
    this.targetLane = 1;
    this.positionColumns = 0;
    this.processedColumn = -1;
    this.integrity = 3;
    this.parcelsCollected = 0;
    this.boostsTriggered = 0;
    this.boostUntilMs = 0;
    this.invulnerableUntilMs = 0;
    this.complete = false;
    this.laneEvents = [];
    this.activeRun = {
      token: 'local-run',
      routeRevision: this.route.recipe.revision,
      startedAtMs: 0,
    };
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.drawStaticFrame();
    this.sceneryGraphics = this.add.graphics().setDepth(0);
    this.courseGraphics = this.add.graphics().setDepth(2);
    this.tileLabels.clear();
    this.player = this.createCourier().setDepth(5);
    this.player.setPosition(PLAYER_X, LANE_Y[this.lane]);

    this.keyboard = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on('keydown-W', () => this.requestLane(-1));
    this.input.keyboard?.on('keydown-S', () => this.requestLane(1));

    this.touchUp = this.add.zone(1080, 250, 330, 250).setInteractive().setDepth(8);
    this.touchDown = this.add.zone(1080, 505, 330, 250).setInteractive().setDepth(8);
    this.touchUp.on('pointerdown', () => this.requestLane(-1));
    this.touchDown.on('pointerdown', () => this.requestLane(1));

    this.add
      .text(46, 28, this.routeTitle(), {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#243642',
      })
      .setDepth(9);
    this.integrityText = this.add
      .text(46, 66, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#243642',
      })
      .setDepth(9);
    this.statsText = this.add
      .text(1018, 28, '', {
        fontFamily: FONT_FAMILY,
        fontSize: '20px',
        color: '#243642',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(9);
    this.add
      .text(1230, 112, '▲\nMOVE UP\n\n▼\nMOVE DOWN', {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#243642',
        align: 'center',
      })
      .setOrigin(1, 0)
      .setDepth(9);

    createButton(this, 1120, 661, 250, 58, 'EXIT RUN', () => this.scene.start('Menu'), {
      fill: COLORS.muted,
      fontSize: 18,
    });

    this.updateHud();
    this.renderCourse();
    this.activeRun = {
      token: 'local-run',
      routeRevision: this.route.recipe.revision,
      startedAtMs: this.time.now,
    };
    if (this.mode !== 'preview') void this.beginServerRun();
  }

  override update(_time: number, delta: number): void {
    if (this.complete) return;
    if (this.keyboard?.up && Phaser.Input.Keyboard.JustDown(this.keyboard.up)) this.requestLane(-1);
    if (this.keyboard?.down && Phaser.Input.Keyboard.JustDown(this.keyboard.down))
      this.requestLane(1);

    const speed =
      this.time.now < this.boostUntilMs ? BOOST_COLUMNS_PER_SECOND : BASE_COLUMNS_PER_SECOND;
    this.positionColumns += (delta / 1000) * speed;

    const currentColumn = Math.floor(this.positionColumns);
    if (currentColumn > this.processedColumn) {
      for (let column = this.processedColumn + 1; column <= currentColumn; column += 1) {
        this.processColumn(column);
        if (this.complete) return;
      }
      this.processedColumn = currentColumn;
    }

    this.animateCourier(delta, speed);
    this.renderCourse();
    this.updateHud();

    if (this.positionColumns >= this.columns.length - 0.15) {
      void this.finishRun(true);
    }
  }

  private requestLane(direction: -1 | 1): void {
    if (this.complete || !this.player) return;
    const next = Phaser.Math.Clamp(this.targetLane + direction, 0, 2) as Lane;
    if (next === this.targetLane) return;
    this.targetLane = next;
    this.recordLaneEvent(next);
    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      y: LANE_Y[next],
      duration: LANE_TWEEN_MS,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.lane = next;
      },
    });
  }

  private processColumn(column: number): void {
    const cells = this.columns[column];
    if (!cells) return;
    const activeLane = this.targetLane;
    const cell = cells[activeLane];
    if (!cell) return;

    if (cell.terrain === 'gap') {
      this.takeDamage('MISSED ROAD', 900);
    } else if (cell.feature === 'obstacle') {
      this.takeDamage('PACKAGE HIT', 540);
    } else if (cell.feature === 'boost') {
      this.boostUntilMs = Math.max(this.boostUntilMs, this.time.now + 1100);
      this.boostsTriggered += 1;
      this.flashMessage('BOOST!');
    } else if (cell.feature === 'parcel') {
      this.parcelsCollected += 1;
      this.flashMessage('+ PARCEL STAMP');
    }
  }

  private recordLaneEvent(lane: Lane): void {
    const column = Math.max(0, Math.floor(this.positionColumns));
    const last = this.laneEvents.at(-1);
    if (last?.column === column) {
      last.lane = lane;
      return;
    }
    this.laneEvents.push({ column, lane });
  }

  private takeDamage(message: string, slowdownMs: number): void {
    if (this.time.now < this.invulnerableUntilMs || this.complete) return;
    this.integrity -= 1;
    this.invulnerableUntilMs = this.time.now + 760;
    this.boostUntilMs = 0;
    this.cameras.main.shake(160, 0.006);
    this.flashMessage(`${message} · ${Math.max(0, this.integrity)} PIPS LEFT`, COLORS.warning);
    if (this.player) {
      this.tweens.add({
        targets: this.player,
        alpha: 0.3,
        yoyo: true,
        repeat: 3,
        duration: 90,
      });
    }
    this.time.delayedCall(slowdownMs, () => undefined);
    if (this.integrity <= 0) void this.finishRun(false);
  }

  private animateCourier(delta: number, speed: number): void {
    if (!this.player) return;
    const rotationDelta = (delta / 1000) * speed * 4.4;
    if (this.wheelA) this.wheelA.rotation += rotationDelta;
    if (this.wheelB) this.wheelB.rotation += rotationDelta;
    if (this.parcelVisual) this.parcelVisual.rotation = Math.sin(this.time.now / 120) * 0.035;
  }

  private renderCourse(): void {
    const graphics = this.courseGraphics;
    const scenery = this.sceneryGraphics;
    if (!graphics || !scenery) return;
    graphics.clear();
    scenery.clear();
    this.hideTileLabels();

    this.drawProceduralScenery(scenery);
    const startColumn = Math.max(0, Math.floor(this.positionColumns) - 3);
    const visibleColumns = 14;
    for (let offset = 0; offset < visibleColumns; offset += 1) {
      const columnIndex = startColumn + offset;
      const cells = this.columns[columnIndex];
      if (!cells) continue;
      const x = PLAYER_X + (columnIndex - this.positionColumns) * COLUMN_WIDTH;
      for (let laneIndex = 0; laneIndex < 3; laneIndex += 1) {
        const cell = cells[laneIndex];
        if (!cell) continue;
        const y = LANE_Y[laneIndex as Lane];
        if (cell.terrain === 'road') {
          graphics
            .fillStyle(COLORS.ground, 1)
            .fillRect(x - COLUMN_WIDTH / 2, y + 24, COLUMN_WIDTH, 76);
          graphics
            .fillStyle(COLORS.road, 1)
            .fillRoundedRect(x - COLUMN_WIDTH / 2, y + 14, COLUMN_WIDTH + 1, 18, 8);
          graphics
            .lineStyle(2, COLORS.ink, 0.45)
            .strokeRoundedRect(x - COLUMN_WIDTH / 2, y + 14, COLUMN_WIDTH + 1, 18, 8);
        } else {
          graphics.fillStyle(COLORS.skyDark, 0.15).fillRoundedRect(x - 35, y + 18, 70, 22, 6);
        }

        if (cell.feature === 'obstacle') {
          graphics.fillStyle(COLORS.warning, 1).fillRoundedRect(x - 19, y - 20, 38, 38, 6);
          graphics.lineStyle(3, COLORS.ink, 1).strokeRoundedRect(x - 19, y - 20, 38, 38, 6);
          graphics.lineStyle(2, COLORS.ink, 0.55).lineBetween(x - 15, y - 16, x + 15, y + 14);
        } else if (cell.feature === 'boost') {
          graphics
            .fillStyle(COLORS.secondary, 1)
            .fillTriangle(x - 26, y + 15, x + 26, y + 15, x, y - 17);
          graphics
            .lineStyle(2, COLORS.ink, 0.75)
            .strokeTriangle(x - 26, y + 15, x + 26, y + 15, x, y - 17);
        } else if (cell.feature === 'parcel') {
          graphics.fillStyle(COLORS.reward, 1).fillRoundedRect(x - 16, y - 25, 32, 29, 5);
          graphics.lineStyle(2, COLORS.ink, 1).strokeRoundedRect(x - 16, y - 25, 32, 29, 5);
          graphics.lineStyle(2, COLORS.ink, 0.55).lineBetween(x, y - 23, x, y + 2);
        }
      }

      const tileWidth = this.route.tiles[0]?.width ?? 18;
      if (columnIndex > 0 && columnIndex % tileWidth === 0) {
        graphics.lineStyle(3, COLORS.ink, 0.24).lineBetween(x, 136, x, 598);
        const tileIndex = Math.floor(columnIndex / tileWidth);
        const tile = this.route.tiles[tileIndex];
        if (tile) {
          const authorLabel =
            tile.authorId === 'daily-dash-founders'
              ? 'FOUNDING TILE'
              : `BY ${tile.authorName.toUpperCase()}`;
          this.showTileLabel(tileIndex, authorLabel, x);
        }
      }
    }
  }

  private drawProceduralScenery(graphics: Phaser.GameObjects.Graphics): void {
    const seed = this.route.recipe.visualSeed;
    graphics.fillStyle(COLORS.paper, 0.28).fillRect(0, 114, 1280, 500);
    graphics.fillStyle(0xffffff, 0.34);
    for (let index = 0; index < 7; index += 1) {
      const x = ((index * 229 + seed) % 1420) - 80 - ((this.positionColumns * 10) % 140);
      const y = 128 + ((index * 47 + seed) % 75);
      graphics
        .fillCircle(x, y, 32)
        .fillCircle(x + 34, y + 7, 26)
        .fillCircle(x - 30, y + 9, 23);
    }
    graphics.fillStyle(COLORS.secondary, 0.22).fillTriangle(0, 370, 280, 160, 560, 370);
    graphics.fillStyle(COLORS.skyDark, 0.18).fillTriangle(420, 370, 760, 145, 1100, 370);
  }

  private hideTileLabels(): void {
    for (const text of this.tileLabels.values()) {
      text.setVisible(false);
    }
  }

  private showTileLabel(tileIndex: number, label: string, x: number): void {
    if (x < 0 || x > 1280) return;
    let text = this.tileLabels.get(tileIndex);
    if (!text) {
      text = this.add
        .text(x + 8, 117, label, {
          fontFamily: FONT_FAMILY,
          fontSize: '12px',
          fontStyle: 'bold',
          color: '#49626d',
        })
        .setDepth(4);
      this.tileLabels.set(tileIndex, text);
    }
    text
      .setText(label)
      .setPosition(x + 8, 117)
      .setVisible(true);
  }

  private getFeedbackText(): Phaser.GameObjects.Text {
    if (!this.feedbackText) {
      this.feedbackText = this.add
        .text(580, 112, '', {
          fontFamily: FONT_FAMILY,
          fontSize: '24px',
          fontStyle: 'bold',
          color: '#72bf9b',
          backgroundColor: '#fff7dfdd',
          padding: { x: 14, y: 8 },
        })
        .setOrigin(0.5, 0)
        .setDepth(12)
        .setVisible(false);
    }
    return this.feedbackText;
  }

  private flashMessage(message: string, color: number = COLORS.secondary): void {
    const text = this.getFeedbackText();
    this.feedbackTween?.stop();
    text
      .setText(message)
      .setColor(`#${color.toString(16).padStart(6, '0')}`)
      .setPosition(580, 112)
      .setAlpha(1)
      .setVisible(true);
    this.feedbackTween = this.tweens.add({
      targets: text,
      alpha: 0,
      y: 88,
      delay: 550,
      duration: 350,
      onComplete: () => {
        text.setVisible(false).setPosition(580, 112);
      },
    });
  }

  private createCourier(): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);
    const body = this.add.rectangle(0, -8, 76, 38, COLORS.primary).setStrokeStyle(3, COLORS.ink);
    const cab = this.add.rectangle(24, -30, 30, 24, COLORS.paper).setStrokeStyle(3, COLORS.ink);
    const parcel = this.add
      .rectangle(-13, -43, 32, 28, COLORS.reward)
      .setStrokeStyle(3, COLORS.ink)
      .setName('parcel');
    const wheelA = this.add.circle(-24, 18, 14, COLORS.ink).setName('wheel');
    const wheelB = this.add.circle(24, 18, 14, COLORS.ink).setName('wheel');
    this.parcelVisual = parcel;
    this.wheelA = wheelA;
    this.wheelB = wheelB;
    const hubA = this.add.circle(-24, 18, 5, COLORS.paper);
    const hubB = this.add.circle(24, 18, 5, COLORS.paper);
    container.add([body, cab, parcel, wheelA, wheelB, hubA, hubB]);
    return container;
  }

  private drawStaticFrame(): void {
    const frame = this.add.graphics().setDepth(7);
    frame.fillStyle(COLORS.paper, 0.92).fillRoundedRect(20, 15, 1045, 90, 20);
    frame.lineStyle(3, COLORS.ink, 0.65).strokeRoundedRect(20, 15, 1045, 90, 20);
    frame.fillStyle(COLORS.paper, 0.86).fillRoundedRect(1050, 95, 215, 515, 20);
    frame.lineStyle(3, COLORS.ink, 0.65).strokeRoundedRect(1050, 95, 215, 515, 20);
    frame.lineStyle(2, COLORS.ink, 0.2).lineBetween(1065, 350, 1250, 350);
  }

  private updateHud(): void {
    const pips = Array.from({ length: 3 }, (_, index) => (index < this.integrity ? '■' : '□')).join(
      ' '
    );
    this.integrityText?.setText(`PACKAGE ${pips}`);
    const total = Math.max(1, this.columns.length);
    const progress = Phaser.Math.Clamp(Math.floor((this.positionColumns / total) * 100), 0, 100);
    this.statsText?.setText(
      `ROUTE ${progress}%\nPARCELS ${this.parcelsCollected}/${countRouteParcels(this.route)}`
    );
  }

  private routeTitle(): string {
    const prefix =
      this.mode === 'preview'
        ? 'BUILDER TEST'
        : this.mode === 'random'
          ? 'ROADBOOK SHUFFLE'
          : 'DAILY DASH';
    return `${prefix} · ${this.route.recipe.tenantName}`;
  }

  private async beginServerRun(): Promise<void> {
    try {
      const response = await apiClient.startRun(this.route.recipe.id);
      this.activeRun = {
        token: response.run.token,
        routeRevision: response.run.routeRevision,
        startedAtMs: this.time.now,
      };
    } catch {
      this.activeRun = {
        token: 'local-run',
        routeRevision: this.route.recipe.revision,
        startedAtMs: this.time.now,
      };
    }
  }

  private async finishRun(completed: boolean): Promise<void> {
    if (this.complete) return;
    this.complete = true;
    const elapsedMs = Math.max(1, Math.round(this.time.now - this.activeRun.startedAtMs));
    const submission: RunSubmission = {
      token: this.activeRun.token,
      routeId: this.route.recipe.id,
      routeRevision: this.activeRun.routeRevision,
      elapsedMs,
      damageTaken: 3 - this.integrity,
      parcelsCollected: this.parcelsCollected,
      boostsTriggered: this.boostsTriggered,
      completed,
      laneEvents: [...this.laneEvents],
    };

    let result: RunResult = {
      ...submission,
      userId: 'local-player',
      username: 'Local Player',
      score: scoreRun(submission),
      completedAt: new Date().toISOString(),
    };

    if (this.mode !== 'preview' && this.activeRun.token !== 'local-run') {
      try {
        const response = await apiClient.completeRun(submission);
        result = response.result;
        session.profile = response.profile;
      } catch {
        // Preserve a complete local result when Redis or the playtest server is unavailable.
      }
    }

    this.scene.start('Result', {
      result,
      route: this.route,
      mode: this.mode,
    });
  }
}
