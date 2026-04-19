import Phaser from 'phaser';
import { GAME, POSTFX, THEME } from '../config/GameConfig.js';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { canvasWidth: W, canvasHeight: H } = GAME;

    const isWebGL = this.game.renderer.type === Phaser.WEBGL;
    if (!isWebGL) {
      console.warn('[postfx] Canvas renderer detected — vignette disabled');
    } else {
      const v = POSTFX.VIGNETTE;
      this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
    }

    this.createStarfield(W, H);

    const gridG = this.add.graphics();
    gridG.lineStyle(1, THEME.ui.gridLine.num, 0.15);
    for (let x = 0; x < W; x += 64) gridG.lineBetween(x, 0, x, H);
    for (let y = 0; y < H; y += 64) gridG.lineBetween(0, y, W, y);

    this.add.text(W / 2, H * 0.28, 'BUG SIEGE', {
      fontSize: '112px',
      fontFamily: 'monospace',
      color: THEME.ui.accentPrimary.hex,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(W / 2, H * 0.38, 'TOWER DEFENSE', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: THEME.ui.textMuted.hex,
      letterSpacing: 16,
    }).setOrigin(0.5);

    const startBtn = this.add.text(W / 2, H * 0.55, '[ START GAME ]', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: THEME.ui.textPrimary.hex,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor(THEME.ui.accentPrimary.hex));
    startBtn.on('pointerout', () => startBtn.setColor(THEME.ui.textPrimary.hex));
    startBtn.on('pointerdown', () => this.scene.start('Game'));

    this.tweens.add({
      targets: startBtn,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(W / 2, H - 50, 'Defend the core. Survive 10 waves.', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: THEME.ui.textMuted.hex,
    }).setOrigin(0.5);
  }

  createStarfield(w, h) {
    const g = this.add.graphics();
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, w);
      const y = Phaser.Math.Between(0, h);
      const size = Phaser.Math.FloatBetween(0.5, 2.0);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.6);
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, size);
    }
  }
}
