import Phaser from 'phaser';
import { GAME, DEBUG } from '../config/GameConfig.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init() {
    this.gameScene = this.scene.get('Game');
  }

  create() {
    const { canvasWidth: W, canvasHeight: H } = GAME;

    this.waveText = this.add.text(32, 32, 'Wave: 1/10', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffffff',
    });

    this.creditsText = this.add.text(32, 78, 'Credits: 200', {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    });

    const barX = W - 400;
    const barY = 36;
    const barW = 360;
    const barH = 32;

    this.hpBarBg = this.add.rectangle(barX, barY, barW, barH, 0x333333).setOrigin(0);
    this.hpBarFill = this.add.rectangle(barX, barY, barW, barH, 0x00ff44).setOrigin(0);

    this.hpLabel = this.add.text(barX, barY + barH + 8, 'HP: 100/100', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    });

    this.hpBarWidth = barW;
    this.hpBarHeight = barH;

    this.phaseText = this.add.text(W / 2, H - 50, '', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#88ccff',
    }).setOrigin(0.5);

    this.startWaveBtn = this.add.text(W / 2, H - 90, '[ START WAVE ] (Space)', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#00ff88',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(true);

    this.phaseText.setText('BUILD PHASE');

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

    this.hpTween = null;

    this.onHpChanged = (data) => {
      const pct = data.hp / data.maxHp;
      const targetWidth = this.hpBarWidth * pct;
      this.hpBarFill.setFillStyle(pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff3333);
      this.hpLabel.setText(`HP: ${data.hp}/${data.maxHp}`);
      if (this.hpTween) this.hpTween.destroy();
      this.hpTween = this.tweens.add({
        targets: this.hpBarFill,
        displayWidth: targetWidth,
        duration: 300,
        ease: 'Power2',
      });
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

    if (DEBUG.enableDebugKeys) {
      this.debugText = this.add.text(32, 130, '', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#88ff88',
        backgroundColor: '#000000aa',
        padding: { x: 8, y: 4 },
      }).setScrollFactor(0).setDepth(200);
    }

    this.events.once('shutdown', () => {
      this.gameScene.events.off('credits-changed', this.onCreditsChanged);
      this.gameScene.events.off('wave-changed', this.onWaveChanged);
      this.gameScene.events.off('hp-changed', this.onHpChanged);
      this.gameScene.events.off('phase-changed', this.onPhaseChanged);
      this.gameScene.events.off('timer-tick', this.onTimerTick);
    });
  }

  update() {
    if (!this.debugText) return;

    const turrets = this.gameScene.turrets;
    if (!turrets || turrets.length === 0) {
      this.debugText.setText('No turrets placed');
      return;
    }

    const lines = turrets.map((t) => {
      const upg = t.upgraded ? 'Yes' : 'No';
      const typeName = t.type.charAt(0).toUpperCase() + t.type.slice(1);
      return `${typeName} (${t.gridCol},${t.gridRow}) HP:${t.hp}/${t.maxHp} DMG:${t.damage} UPG:${upg}`;
    });

    this.debugText.setText(lines.join('\n'));
  }
}
