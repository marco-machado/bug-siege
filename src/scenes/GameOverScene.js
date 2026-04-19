import Phaser from 'phaser';
import { GAME, POSTFX, THEME } from '../config/GameConfig.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const { won, wave, totalKills, credits, baseHp } = this.result;
    const { canvasWidth: W, canvasHeight: H } = GAME;

    const isWebGL = this.game.renderer.type === Phaser.WEBGL;
    if (!isWebGL) {
      console.warn('[postfx] Canvas renderer detected — vignette disabled');
    } else {
      const v = POSTFX.VIGNETTE;
      this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
    }

    const title = won ? 'VICTORY!' : 'DEFEAT';
    const color = won ? THEME.ui.success.hex : THEME.ui.danger.hex;

    this.add.text(W / 2, H * 0.2, title, {
      fontSize: '96px',
      fontFamily: 'monospace',
      color,
    }).setOrigin(0.5);

    const stats = [
      `Wave Reached: ${wave}/10`,
      `Total Kills: ${totalKills}`,
    ];
    if (won) {
      stats.push(`Remaining Credits: ${credits}`);
      stats.push(`Remaining HP: ${baseHp}`);
    }

    this.add.text(W / 2, H * 0.42, stats.join('\n'), {
      fontSize: '40px',
      fontFamily: 'monospace',
      color: THEME.ui.textPrimary.hex,
      align: 'center',
      lineSpacing: 16,
    }).setOrigin(0.5);

    const restartBtn = this.add.text(W / 2 - 200, H * 0.7, '[ RESTART ]', {
      fontSize: '44px',
      fontFamily: 'monospace',
      color: THEME.ui.textPrimary.hex,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor(THEME.ui.accentPrimary.hex));
    restartBtn.on('pointerout', () => restartBtn.setColor(THEME.ui.textPrimary.hex));
    restartBtn.on('pointerdown', () => this.scene.start('Game'));

    const menuBtn = this.add.text(W / 2 + 200, H * 0.7, '[ MAIN MENU ]', {
      fontSize: '44px',
      fontFamily: 'monospace',
      color: THEME.ui.textPrimary.hex,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor(THEME.ui.accentPrimary.hex));
    menuBtn.on('pointerout', () => menuBtn.setColor(THEME.ui.textPrimary.hex));
    menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
