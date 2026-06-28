import * as Phaser from 'phaser';
import { apiClient } from '../api/client';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';
import { MAX_BUILD_BUDGET } from '../../shared/game/constants';
import {
  calculateBuildBudget,
  createDraftTile,
  isBufferColumn,
  setTileCell,
} from '../../shared/game/tile';
import type { CourseTile, Feature, Lane, Terrain } from '../../shared/game/types';
import { validateCourseTile } from '../../shared/game/validator';

type BuilderTool = 'road' | 'gap' | 'obstacle' | 'boost' | 'parcel';

const TOOL_META: Record<
  BuilderTool,
  { label: string; fill: number; terrain: Terrain; feature: Feature }
> = {
  road: { label: 'ROAD', fill: COLORS.roadLight, terrain: 'road', feature: 'none' },
  gap: { label: 'GAP', fill: COLORS.skyDark, terrain: 'gap', feature: 'none' },
  obstacle: { label: 'OBSTACLE', fill: COLORS.warning, terrain: 'road', feature: 'obstacle' },
  boost: { label: 'BOOST', fill: COLORS.secondary, terrain: 'road', feature: 'boost' },
  parcel: { label: 'PARCEL', fill: COLORS.reward, terrain: 'road', feature: 'parcel' },
};

export class BuilderScene extends Phaser.Scene {
  private tile: CourseTile = createDraftTile();
  private tool: BuilderTool = 'obstacle';
  private grid?: Phaser.GameObjects.Graphics;
  private statusText?: Phaser.GameObjects.Text;
  private budgetText?: Phaser.GameObjects.Text;
  private toolText?: Phaser.GameObjects.Text;
  private lastPaintKey = '';

  private readonly gridX = 88;
  private readonly gridY = 142;
  private readonly cellWidth = 60;
  private readonly cellHeight = 92;

  constructor() {
    super('Builder');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.paper, 1).fillRoundedRect(35, 28, 1210, 664, 28);
    panel.lineStyle(4, COLORS.ink, 1).strokeRoundedRect(35, 28, 1210, 664, 28);

    this.add.text(76, 54, 'BUILD TODAY’S TILE', {
      fontFamily: FONT_FAMILY,
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#243642',
    });
    this.add.text(
      77,
      105,
      'Paint a fair route. The first and last three columns are neutral connectors.',
      {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: '#49626d',
      }
    );

    this.grid = this.add.graphics();
    this.statusText = this.add.text(90, 446, 'Choose a tool, paint a tile, then certify it.', {
      fontFamily: FONT_FAMILY,
      fontSize: '18px',
      color: '#243642',
      wordWrap: { width: 1060 },
    });
    this.budgetText = this.add.text(1010, 57, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#243642',
    });
    this.toolText = this.add.text(1010, 90, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '16px',
      color: '#49626d',
    });

    const tools = Object.keys(TOOL_META) as BuilderTool[];
    tools.forEach((tool, index) => {
      const meta = TOOL_META[tool];
      createButton(
        this,
        166 + index * 190,
        530,
        168,
        58,
        meta.label,
        () => {
          this.tool = tool;
          this.updateReadout();
        },
        { fill: meta.fill, fontSize: 18 }
      );
    });

    createButton(this, 190, 625, 220, 60, 'BACK', () => this.scene.start('Menu'), {
      fill: COLORS.muted,
      fontSize: 20,
    });
    createButton(this, 470, 625, 240, 60, 'CERTIFY TILE', () => this.certify(), {
      fill: COLORS.reward,
      fontSize: 20,
    });
    createButton(this, 760, 625, 240, 60, 'TEST RIDE', () => this.testRide(), {
      fill: COLORS.secondary,
      fontSize: 20,
    });
    createButton(this, 1050, 625, 240, 60, 'PUBLISH', () => void this.publish(), {
      fill: COLORS.primary,
      fontSize: 20,
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.paintFromPointer(pointer));
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) this.paintFromPointer(pointer);
    });
    this.input.on('pointerup', () => {
      this.lastPaintKey = '';
    });

    this.renderGrid();
    this.updateReadout();
  }

  private paintFromPointer(pointer: Phaser.Input.Pointer): void {
    const column = Math.floor((pointer.x - this.gridX) / this.cellWidth);
    const laneIndex = Math.floor((pointer.y - this.gridY) / this.cellHeight);
    if (column < 0 || column >= this.tile.width || laneIndex < 0 || laneIndex >= 3) return;
    if (isBufferColumn(column, this.tile.width)) {
      this.statusText?.setText(
        'Connector columns are locked so every generated route stitches fairly.'
      );
      return;
    }
    const key = `${laneIndex}:${column}:${this.tool}`;
    if (key === this.lastPaintKey) return;
    this.lastPaintKey = key;

    const meta = TOOL_META[this.tool];
    const candidate = setTileCell(this.tile, laneIndex as Lane, column, meta.terrain, meta.feature);
    if (calculateBuildBudget(candidate) > MAX_BUILD_BUDGET) {
      this.statusText?.setText(
        `Build budget capped at ${MAX_BUILD_BUDGET}. Erase or simplify first.`
      );
      return;
    }
    this.tile = candidate;
    this.renderGrid();
    this.updateReadout();
  }

  private renderGrid(): void {
    const graphics = this.grid;
    if (!graphics) return;
    graphics.clear();

    for (let laneIndex = 0; laneIndex < 3; laneIndex += 1) {
      for (let column = 0; column < this.tile.width; column += 1) {
        const x = this.gridX + column * this.cellWidth;
        const y = this.gridY + laneIndex * this.cellHeight;
        const cell = this.tile.lanes[laneIndex]?.[column];
        if (!cell) continue;
        const locked = isBufferColumn(column, this.tile.width);
        graphics.fillStyle(locked ? COLORS.muted : COLORS.white, locked ? 0.28 : 0.58);
        graphics.fillRoundedRect(x + 2, y + 2, this.cellWidth - 4, this.cellHeight - 4, 8);
        graphics.lineStyle(2, COLORS.ink, locked ? 0.32 : 0.62);
        graphics.strokeRoundedRect(x + 2, y + 2, this.cellWidth - 4, this.cellHeight - 4, 8);

        if (cell.terrain === 'road') {
          graphics
            .fillStyle(COLORS.road, 1)
            .fillRoundedRect(x + 4, y + 55, this.cellWidth - 8, 15, 6);
        } else {
          graphics.fillStyle(COLORS.skyDark, 0.28).fillRect(x + 5, y + 50, this.cellWidth - 10, 27);
        }

        if (cell.feature === 'obstacle') {
          graphics.fillStyle(COLORS.warning, 1).fillRoundedRect(x + 16, y + 29, 28, 28, 5);
          graphics.lineStyle(2, COLORS.ink, 1).strokeRoundedRect(x + 16, y + 29, 28, 28, 5);
        } else if (cell.feature === 'boost') {
          graphics
            .fillStyle(COLORS.secondary, 1)
            .fillTriangle(x + 13, y + 58, x + 42, y + 58, x + 28, y + 35);
        } else if (cell.feature === 'parcel') {
          graphics.fillStyle(COLORS.reward, 1).fillRoundedRect(x + 18, y + 29, 25, 24, 4);
          graphics.lineStyle(2, COLORS.ink, 1).strokeRoundedRect(x + 18, y + 29, 25, 24, 4);
        }
      }
    }

    graphics.lineStyle(4, COLORS.secondary, 0.8);
    graphics.strokeRoundedRect(this.gridX, this.gridY, this.cellWidth * 3, this.cellHeight * 3, 12);
    graphics.strokeRoundedRect(
      this.gridX + this.cellWidth * (this.tile.width - 3),
      this.gridY,
      this.cellWidth * 3,
      this.cellHeight * 3,
      12
    );
  }

  private updateReadout(): void {
    const budget = calculateBuildBudget(this.tile);
    this.budgetText?.setText(`BUDGET ${budget}/${MAX_BUILD_BUDGET}`);
    this.toolText?.setText(`ACTIVE TOOL: ${TOOL_META[this.tool].label}`);
  }

  private certify(): boolean {
    const validation = validateCourseTile(this.tile);
    this.tile = { ...this.tile, metrics: validation.metrics };
    if (validation.ok) {
      const warnings = validation.issues.filter((issue) => issue.severity === 'warning');
      this.statusText?.setText(
        `CERTIFIED · ${validation.metrics.cleanPathCount.toLocaleString()} clean path states · difficulty ${validation.metrics.difficulty}/5${warnings.length ? ` · ${warnings[0]?.message ?? ''}` : ''}`
      );
      return true;
    }
    const firstError = validation.issues.find((issue) => issue.severity === 'error');
    this.statusText?.setText(
      `NOT CERTIFIED · ${firstError?.message ?? 'Unknown validation error.'}`
    );
    return false;
  }

  private testRide(): void {
    if (!this.certify()) return;
    this.scene.start('Runner', { previewTile: this.tile, mode: 'preview' });
  }

  private async publish(): Promise<void> {
    if (!this.certify()) return;
    this.statusText?.setText('Publishing certified tile…');
    try {
      const response = await apiClient.submitTile(this.tile);
      this.tile = response.tile;
      this.statusText?.setText('PUBLISHED · Your tile is eligible for a future community route.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      this.statusText?.setText(`Practice tile saved only in this session · ${message}`);
    }
  }
}
