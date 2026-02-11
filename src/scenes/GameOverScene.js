import Phaser from 'phaser';
import { GAME } from '../config/GameConfig.js';

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

    const title = won ? 'VICTORY!' : 'DEFEAT';
    const color = won ? '#00ff88' : '#ff3333';

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
      color: '#ffffff',
      align: 'center',
      lineSpacing: 16,
    }).setOrigin(0.5);

    const restartBtn = this.add.text(W / 2 - 200, H * 0.7, '[ RESTART ]', {
      fontSize: '44px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor('#00ff88'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffffff'));
    restartBtn.on('pointerdown', () => this.scene.start('Game'));

    const menuBtn = this.add.text(W / 2 + 200, H * 0.7, '[ MAIN MENU ]', {
      fontSize: '44px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#00ff88'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
