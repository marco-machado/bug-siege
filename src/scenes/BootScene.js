import Phaser from 'phaser';
import { BUGS, GRID, GAME, THEME } from '../config/GameConfig.js';

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

    this.load.audio('sfx_wave_start', 'assets/audio/sfx_wave_start.wav');
    this.load.audio('sfx_shoot', 'assets/audio/sfx_shoot.ogg');
    this.load.audio('sfx_splat', 'assets/audio/sfx_splat.wav');
    this.load.audio('sfx_build', 'assets/audio/sfx_build.ogg');
    this.load.audio('sfx_select', 'assets/audio/sfx_select.ogg');
    this.load.audio('sfx_sell', 'assets/audio/sfx_sell.ogg');
    this.load.audio('sfx_hit', 'assets/audio/sfx_hit.ogg');
    this.load.audio('sfx_zap', 'assets/audio/sfx_zap.ogg');
    this.load.audio('sfx_core_destroyed', 'assets/audio/sfx_core_destroyed.ogg');
    this.load.audio('sfx_victory', 'assets/audio/sfx_victory.ogg');
    this.load.audio('bgm_wave', 'assets/audio/bgm_wave.ogg');
  }

  create() {
    for (const key of this.failedKeys) {
      this.generateFallback(key);
    }

    this.generateNebula();
    this.generateParticleTextures();

    this.scene.start('MainMenu');
  }

  generateNebula() {
    const canvas = document.createElement('canvas');
    canvas.width = GAME.canvasWidth;
    canvas.height = GAME.canvasHeight;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = THEME.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const numClouds = 12 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numClouds; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = 400 + Math.random() * 400;
      const color = THEME.nebula[Math.floor(Math.random() * THEME.nebula.length)];
      const opacity = 0.1 + Math.random() * 0.2;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    this.textures.addCanvas('nebula', canvas);
  }

  generateParticleTextures() {
    const g = this.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture('particle', 4, 4);
    g.clear();
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture('particle-glow', 8, 8);
    g.destroy();
  }

  generateFallback(key) {
    if (key.startsWith('sfx_') || key.startsWith('bgm_')) {
      const ctx = this.sound.context;
      if (ctx && ctx.createBuffer) {
        this.cache.audio.add(key, ctx.createBuffer(1, 1, 22050));
      }
      return;
    }

    const g = this.add.graphics();
    const magenta = 0xff00ff;

    if (key.startsWith('turret-') || key === 'core' || key === 'tile') {
      const size = GRID.tileSize;
      g.fillStyle(magenta, 1);
      g.fillRect(0, 0, size, size);
      g.generateTexture(key, size, size);
    } else if (key.startsWith('bug-')) {
      const type = key.replace('bug-', '');
      const size = BUGS[type] ? BUGS[type].size : 48;
      g.fillStyle(magenta, 1);
      g.fillCircle(size / 2, size / 2, size / 2);
      g.generateTexture(key, size, size);
    } else if (key === 'bullet' || key === 'spitter-bullet') {
      g.fillStyle(magenta, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture(key, 8, 8);
    } else if (key === 'background') {
      g.fillStyle(0x1a1a2e, 1);
      g.fillRect(0, 0, GAME.canvasWidth, GAME.canvasHeight);
      g.generateTexture(key, GAME.canvasWidth, GAME.canvasHeight);
    }

    g.destroy();
  }
}
