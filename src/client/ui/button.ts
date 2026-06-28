import type * as Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../theme';

export type ButtonOptions = {
  fill?: number;
  textColor?: string;
  stroke?: number;
  fontSize?: number;
  depth?: number;
};

export const createButton = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  options: ButtonOptions = {}
): Phaser.GameObjects.Container => {
  const fill = options.fill ?? COLORS.primary;
  const stroke = options.stroke ?? COLORS.ink;
  const shadow = scene.add.rectangle(0, 6, width, height, COLORS.shadow, 0.25).setOrigin(0.5);
  const background = scene.add
    .rectangle(0, 0, width, height, fill)
    .setStrokeStyle(3, stroke)
    .setOrigin(0.5);
  const text = scene.add
    .text(0, 0, label, {
      color: options.textColor ?? '#243642',
      fontFamily: FONT_FAMILY,
      fontSize: `${options.fontSize ?? 24}px`,
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5);
  const container = scene.add.container(x, y, [shadow, background, text]);
  container.setSize(width, height).setInteractive({ useHandCursor: true });
  container.setDepth(options.depth ?? 10);
  container.on('pointerover', () => background.setFillStyle(fill, 0.86));
  container.on('pointerout', () => background.setFillStyle(fill, 1));
  container.on('pointerdown', () => container.setY(y + 4));
  container.on('pointerup', () => {
    container.setY(y);
    onClick();
  });
  return container;
};
