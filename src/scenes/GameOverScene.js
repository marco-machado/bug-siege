import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  init(data) {
    this.result = data;
  }

  create() {
    const { won, wave, totalKills, credits, baseHp } = this.result;

    const title = won ? 'VICTORY!' : 'DEFEAT';
    const color = won ? '#00ff88' : '#ff3333';

    this.add.text(400, 120, title, {
      fontSize: '48px',
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

    this.add.text(400, 250, stats.join('\n'), {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    const restartBtn = this.add.text(300, 420, '[ RESTART ]', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    restartBtn.on('pointerover', () => restartBtn.setColor('#00ff88'));
    restartBtn.on('pointerout', () => restartBtn.setColor('#ffffff'));
    restartBtn.on('pointerdown', () => this.scene.start('Game'));

    const menuBtn = this.add.text(500, 420, '[ MAIN MENU ]', {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuBtn.on('pointerover', () => menuBtn.setColor('#00ff88'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#ffffff'));
    menuBtn.on('pointerdown', () => this.scene.start('MainMenu'));
  }
}
