import * as Phaser from 'phaser';
import { KENNEY_ROLE_PATHS, kenneyAssetUrl, kenneyTextureKey } from '../art/kenney';
import { COLORS } from '../theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const role of Object.keys(KENNEY_ROLE_PATHS) as (keyof typeof KENNEY_ROLE_PATHS)[]) {
      this.load.image(kenneyTextureKey(role), kenneyAssetUrl(role));
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.sky);
    this.scene.start('Menu');
  }
}
