import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init() {
    this.gameScene = this.scene.get('Game');
  }

  create() {
    this.waveText = this.add.text(16, 16, 'Wave: 1/10', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });

    this.creditsText = this.add.text(16, 42, 'Credits: 200', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    });

    const barX = 620;
    const barY = 20;
    const barW = 160;
    const barH = 16;

    this.hpBarBg = this.add.rectangle(barX, barY, barW, barH, 0x333333).setOrigin(0);
    this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, 0x00ff44).setOrigin(0);

    this.hpLabel = this.add.text(barX, barY + barH + 4, 'HP: 100/100', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    });

    this.phaseText = this.add.text(400, 580, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#88ccff',
    }).setOrigin(0.5);

    this.startWaveBtn = this.add.text(400, 556, '[ START WAVE ] (Space)', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.startWaveBtn.on('pointerdown', () => {
      this.gameScene.events.emit('start-wave-early');
    });

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.startWaveBtn.visible) {
        this.gameScene.events.emit('start-wave-early');
      }
    });

    this.onCreditsChanged = (data) => {
      this.creditsText.setText(`Credits: ${data.credits}`);
    };

    this.onWaveChanged = (data) => {
      this.waveText.setText(`Wave: ${data.wave}/${data.total}`);
    };

    this.onHpChanged = (data) => {
      const pct = data.hp / data.maxHp;
      this.hpBarFill.setDisplaySize(160 * pct, 16);
      this.hpBarFill.setFillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333);
      this.hpLabel.setText(`HP: ${data.hp}/${data.maxHp}`);
    };

    this.onPhaseChanged = (data) => {
      if (data.phase === 'build') {
        this.startWaveBtn.setVisible(true);
        this.phaseText.setText('BUILD PHASE');
      } else {
        this.startWaveBtn.setVisible(false);
        this.phaseText.setText('');
      }
    };

    this.onTimerTick = (data) => {
      this.phaseText.setText(`BUILD PHASE — ${data.seconds}s`);
    };

    this.gameScene.events.on('credits-changed', this.onCreditsChanged);
    this.gameScene.events.on('wave-changed', this.onWaveChanged);
    this.gameScene.events.on('hp-changed', this.onHpChanged);
    this.gameScene.events.on('phase-changed', this.onPhaseChanged);
    this.gameScene.events.on('timer-tick', this.onTimerTick);

    this.events.once('shutdown', () => {
      this.gameScene.events.off('credits-changed', this.onCreditsChanged);
      this.gameScene.events.off('wave-changed', this.onWaveChanged);
      this.gameScene.events.off('hp-changed', this.onHpChanged);
      this.gameScene.events.off('phase-changed', this.onPhaseChanged);
      this.gameScene.events.off('timer-tick', this.onTimerTick);
    });
  }
}
