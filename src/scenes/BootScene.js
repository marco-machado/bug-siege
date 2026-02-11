import Phaser from 'phaser';
import { BUGS, GRID, GAME } from '../config/GameConfig.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
    this.failedKeys = new Set();
  }

  preload() {
    const W = GAME.canvasWidth;
    const H = GAME.canvasHeight;
    const barW = 600;
    const barH = 40;
    const barX = (W - barW) / 2;
    const barY = H / 2;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(barX, barY, barW, barH);

    const progressBar = this.add.graphics();

    const loadingText = this.add.text(W / 2, barY - 40, 'Loading...', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ff88, 1);
      progressBar.fillRect(barX + 4, barY + 4, (barW - 8) * value, barH - 8);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    this.load.on('loaderror', (file) => {
      console.warn(`Failed to load asset: ${file.key} (${file.url})`);
      this.failedKeys.add(file.key);
    });

    this.load.image('turret-blaster', 'assets/turrets/blaster.png');
    this.load.image('turret-zapper', 'assets/turrets/zapper.png');
    this.load.image('turret-slowfield', 'assets/turrets/slowfield.png');
    this.load.image('turret-wall', 'assets/turrets/wall.png');
    this.load.image('bug-swarmer', 'assets/bugs/swarmer.png');
    this.load.image('bug-brute', 'assets/bugs/brute.png');
    this.load.image('bug-spitter', 'assets/bugs/spitter.png');
    this.load.image('bug-boss', 'assets/bugs/boss.png');
    this.load.image('bullet', 'assets/environment/bullet.png');
    this.load.image('spitter-bullet', 'assets/environment/spitter-bullet.png');
    this.load.image('core', 'assets/environment/core.png');
    this.load.image('background', 'assets/environment/background.jpg');
    this.load.image('tile', 'assets/environment/tile.png');
  }

  create() {
    for (const key of this.failedKeys) {
      this.generateFallback(key);
    }

    this.scene.start('MainMenu');
  }

  generateFallback(key) {
    const g = this.add.graphics();
    const magenta = 0xff00ff;

    if (key.startsWith('turret-') || key === 'core' || key === 'tile') {
      const size = GRID.tileSize;
      g.fillStyle(magenta, 1);
      g.fillRect(0, 0, size, size);
      g.generateTexture(key, size, size);
    } else if (key.startsWith('bug-')) {
      const type = key.replace('bug-', '');
      const size = BUGS[type] ? BUGS[type].size : 108;
      g.fillStyle(magenta, 1);
      g.fillCircle(size / 2, size / 2, size / 2);
      g.generateTexture(key, size, size);
    } else if (key === 'bullet' || key === 'spitter-bullet') {
      g.fillStyle(magenta, 1);
      g.fillCircle(9, 9, 9);
      g.generateTexture(key, 18, 18);
    } else if (key === 'background') {
      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
      g.generateTexture(key, GAME.canvasWidth, GAME.canvasHeight);
    }

    g.destroy();
  }
}
