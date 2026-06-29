import * as Phaser from 'phaser';
import { AchievementsScene } from './scenes/AchievementsScene';
import { BootScene } from './scenes/BootScene';
import { BuilderScene } from './scenes/BuilderScene';
import { CreatorScene } from './scenes/CreatorScene';
import { MenuScene } from './scenes/MenuScene';
import { ResultScene } from './scenes/ResultScene';
import { RoadbookScene } from './scenes/RoadbookScene';
import { RunnerScene } from './scenes/RunnerScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#aedfd8',
  width: 1280,
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [
    BootScene,
    MenuScene,
    BuilderScene,
    CreatorScene,
    RoadbookScene,
    RunnerScene,
    ResultScene,
    AchievementsScene,
  ],
};

document.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
