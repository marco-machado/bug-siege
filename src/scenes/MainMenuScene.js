import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    this.add.text(400, 220, 'BUG SIEGE', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5);

    const startBtn = this.add.text(400, 350, '[ START GAME ]', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startBtn.on('pointerover', () => startBtn.setColor('#00ff88'));
    startBtn.on('pointerout', () => startBtn.setColor('#ffffff'));
    startBtn.on('pointerdown', () => this.scene.start('Game'));
  }
}
