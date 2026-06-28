import * as Phaser from 'phaser';
import { COLORS } from '../theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.scene.start('Menu');
  }
}
