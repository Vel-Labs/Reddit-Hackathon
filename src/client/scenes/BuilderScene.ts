import * as Phaser from 'phaser';
import { apiClient } from '../api/client';
import { COLORS, FONT_FAMILY } from '../theme';
import { createButton } from '../ui/button';
import { LANE_COUNT, MAX_BUILD_BUDGET } from '../../shared/game/constants';
import {
  calculateBuildBudget,
  cloneTile,
  createDraftTile,
  isBufferColumn,
  setTileCell,
} from '../../shared/game/tile';
import type {
  CourseTile,
  Feature,
  Lane,
  SafePath,
  Terrain,
  TileValidationResult,
  ValidationIssue,
} from '../../shared/game/types';
import { findFairCleanPathsByEntrance, validateCourseTile } from '../../shared/game/validator';

type BuilderTool = 'road' | 'gap' | 'obstacle' | 'boost' | 'parcel';
type IssueHighlight = { lane: Lane; column: number };

const MAX_HISTORY_STATES = 50;

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
  private repairText?: Phaser.GameObjects.Text;
  private budgetText?: Phaser.GameObjects.Text;
  private toolText?: Phaser.GameObjects.Text;
  private historyText?: Phaser.GameObjects.Text;
  private lastPaintKey = '';
  private undoStack: CourseTile[] = [];
  private redoStack: CourseTile[] = [];
  private safePaths: SafePath[] = [];
  private repairIssues: ValidationIssue[] = [];
  private repairIssueIndex = 0;
  private highlightedIssue: IssueHighlight | undefined;

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
    this.repairText = this.add.text(90, 474, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '15px',
      color: '#49626d',
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
    this.historyText = this.add.text(1010, 116, '', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
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
    createButton(this, 805, 86, 110, 44, 'UNDO', () => this.undo(), {
      fill: COLORS.muted,
      fontSize: 16,
    });
    createButton(this, 925, 86, 110, 44, 'REDO', () => this.redo(), {
      fill: COLORS.muted,
      fontSize: 16,
    });
    createButton(this, 1075, 86, 175, 44, 'NEXT ISSUE', () => this.selectNextIssue(), {
      fill: COLORS.warning,
      fontSize: 15,
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
    const previousCell = this.tile.lanes[laneIndex]?.[column];
    const nextCell = candidate.lanes[laneIndex]?.[column];
    if (
      previousCell &&
      nextCell &&
      previousCell.terrain === nextCell.terrain &&
      previousCell.feature === nextCell.feature
    ) {
      return;
    }
    if (calculateBuildBudget(candidate) > MAX_BUILD_BUDGET) {
      this.statusText?.setText(
        `Build budget capped at ${MAX_BUILD_BUDGET}. Erase or simplify first.`
      );
      return;
    }
    this.pushUndoState();
    this.tile = candidate;
    this.safePaths = [];
    this.updateReadout();
    this.renderGrid();
  }

  private pushUndoState(): void {
    this.undoStack.push(cloneTile(this.tile));
    if (this.undoStack.length > MAX_HISTORY_STATES) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  private undo(): void {
    const previous = this.undoStack.pop();
    if (!previous) {
      this.statusText?.setText('Nothing to undo yet.');
      return;
    }
    this.redoStack.push(cloneTile(this.tile));
    this.tile = previous;
    this.safePaths = [];
    this.lastPaintKey = '';
    this.statusText?.setText('Undid the last Builder edit.');
    this.updateReadout();
    this.renderGrid();
  }

  private redo(): void {
    const next = this.redoStack.pop();
    if (!next) {
      this.statusText?.setText('Nothing to redo yet.');
      return;
    }
    this.undoStack.push(cloneTile(this.tile));
    this.tile = next;
    this.safePaths = [];
    this.lastPaintKey = '';
    this.statusText?.setText('Redid the Builder edit.');
    this.updateReadout();
    this.renderGrid();
  }

  private clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.lastPaintKey = '';
    this.safePaths = [];
    this.repairIssues = [];
    this.repairIssueIndex = 0;
    this.highlightedIssue = undefined;
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

    this.renderSafePathOverlay(graphics);
    this.renderIssueOverlay(graphics);
  }

  private renderIssueOverlay(graphics: Phaser.GameObjects.Graphics): void {
    const issue = this.highlightedIssue;
    if (issue?.lane === undefined || issue.column === undefined) return;
    if (issue.column < 0 || issue.column >= this.tile.width) return;

    const x = this.gridX + issue.column * this.cellWidth;
    const y = this.gridY + issue.lane * this.cellHeight;
    graphics
      .fillStyle(COLORS.warning, 0.26)
      .fillRoundedRect(x + 4, y + 4, this.cellWidth - 8, this.cellHeight - 8, 10);
    graphics
      .lineStyle(5, COLORS.warning, 1)
      .strokeRoundedRect(x + 5, y + 5, this.cellWidth - 10, this.cellHeight - 10, 10);
    graphics
      .lineStyle(2, COLORS.ink, 0.9)
      .strokeRoundedRect(x + 10, y + 10, this.cellWidth - 20, this.cellHeight - 20, 8);
  }

  private renderSafePathOverlay(graphics: Phaser.GameObjects.Graphics): void {
    if (this.safePaths.length === 0) return;

    this.safePaths.forEach((path) => {
      const offsetY = (path.entranceLane - 1) * 7;
      graphics.lineStyle(6, COLORS.secondary, 0.88);
      path.points.forEach((point, index) => {
        const x = this.gridX + point.column * this.cellWidth + this.cellWidth / 2;
        const y = this.gridY + point.lane * this.cellHeight + this.cellHeight / 2 + 4 + offsetY;
        if (index === 0) {
          graphics.beginPath();
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      });
      graphics.strokePath();

      for (const point of path.points) {
        const x = this.gridX + point.column * this.cellWidth + this.cellWidth / 2;
        const y = this.gridY + point.lane * this.cellHeight + this.cellHeight / 2 + 4 + offsetY;
        graphics.fillStyle(COLORS.reward, 0.92).fillCircle(x, y, 5);
      }
    });
  }

  private updateReadout(): void {
    const budget = calculateBuildBudget(this.tile);
    this.budgetText?.setText(`BUDGET ${budget}/${MAX_BUILD_BUDGET}`);
    this.toolText?.setText(`ACTIVE TOOL: ${TOOL_META[this.tool].label}`);
    this.historyText?.setText(`UNDO ${this.undoStack.length} · REDO ${this.redoStack.length}`);
    this.refreshRepairSummary();
  }

  private refreshRepairSummary(selectFirst = false): TileValidationResult {
    const validation = validateCourseTile(this.tile);
    const errors = validation.issues.filter((issue) => issue.severity === 'error');
    this.repairIssues = errors;

    if (errors.length === 0) {
      this.repairIssueIndex = 0;
      this.highlightedIssue = undefined;
      this.repairText?.setText('Draft passes safety checks. Test ride or publish when ready.');
      return validation;
    }

    if (selectFirst) {
      this.repairIssueIndex = 0;
    } else {
      this.repairIssueIndex = Phaser.Math.Clamp(this.repairIssueIndex, 0, errors.length - 1);
    }

    const selectedIssue =
      selectFirst || this.highlightedIssue ? errors[this.repairIssueIndex] : undefined;
    this.highlightedIssue = this.toIssueHighlight(selectedIssue);
    const selectedText = selectedIssue ? ` Current: ${this.describeIssue(selectedIssue)}` : '';
    this.repairText?.setText(
      `Draft has ${errors.length} publish blocker${errors.length === 1 ? '' : 's'}. Use NEXT ISSUE to inspect and fix them one at a time.${selectedText}`
    );
    return validation;
  }

  private selectNextIssue(): void {
    const validation = this.refreshRepairSummary();
    if (validation.ok || this.repairIssues.length === 0) {
      this.safePaths = findFairCleanPathsByEntrance(this.tile);
      this.highlightedIssue = undefined;
      this.renderGrid();
      this.statusText?.setText('CERTIFIED · No repair issues left.');
      return;
    }

    if (this.highlightedIssue) {
      this.repairIssueIndex = (this.repairIssueIndex + 1) % this.repairIssues.length;
    }
    const issue = this.repairIssues[this.repairIssueIndex];
    if (!issue) return;
    this.highlightedIssue = this.toIssueHighlight(issue);
    this.safePaths = [];
    this.renderGrid();
    this.statusText?.setText(
      `REPAIR ${this.repairIssueIndex + 1}/${this.repairIssues.length} · ${this.describeIssue(issue)}`
    );
    this.repairText?.setText(
      `Fix this issue, then press NEXT ISSUE again. Publish stays locked until all blockers are resolved.`
    );
  }

  private toIssueHighlight(issue: ValidationIssue | undefined): IssueHighlight | undefined {
    if (issue?.lane === undefined || issue.column === undefined) return undefined;
    return { lane: issue.lane, column: issue.column };
  }

  private describeIssue(issue: ValidationIssue): string {
    const location =
      issue.lane !== undefined && issue.column !== undefined
        ? ` Lane ${issue.lane + 1}, column ${issue.column + 1}.`
        : '';
    return `${issue.message}${location}`;
  }

  private certify(): boolean {
    const validation = this.refreshRepairSummary(true);
    this.tile = { ...this.tile, metrics: validation.metrics };
    if (validation.ok) {
      this.safePaths = findFairCleanPathsByEntrance(this.tile);
      this.highlightedIssue = undefined;
      this.renderGrid();
      const warnings = validation.issues.filter((issue) => issue.severity === 'warning');
      this.statusText?.setText(
        `CERTIFIED · ${validation.metrics.cleanPathCount.toLocaleString()} clean path states · ${this.safePaths.length}/${LANE_COUNT} entrances overlaid · difficulty ${validation.metrics.difficulty}/5${warnings.length ? ` · ${warnings[0]?.message ?? ''}` : ''}`
      );
      return true;
    }
    this.safePaths = [];
    const firstError = this.repairIssues[0];
    this.highlightedIssue = this.toIssueHighlight(firstError);
    this.renderGrid();
    this.statusText?.setText(
      `NOT CERTIFIED · ${firstError ? this.describeIssue(firstError) : 'Unknown validation error.'}`
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
      this.clearHistory();
      this.renderGrid();
      this.updateReadout();
      this.statusText?.setText('PUBLISHED · Your tile is eligible for a future community route.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publish failed.';
      this.statusText?.setText(`Practice tile saved only in this session · ${message}`);
    }
  }
}
