import Phaser from 'phaser';
import { GRID, GAME, ECONOMY, DEBUG } from '../config/GameConfig.js';
import { Grid } from '../entities/Grid.js';
import { Turret } from '../entities/Turret.js';
import { Bug } from '../entities/Bug.js';
import { Bullet } from '../entities/Bullet.js';
import { WaveManager } from '../systems/WaveManager.js';
import { EconomyManager } from '../systems/EconomyManager.js';
import { BuildSystem } from '../systems/BuildSystem.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init() {
    this.phase = 'build';
    this.baseHp = GAME.baseHp;
    this.totalKills = 0;
    this.turrets = [];
    this.buildTimer = null;
    this.buildCountdown = 0;
  }

  create() {
    this.grid = new Grid();
    this.economy = new EconomyManager(this);
    this.waveManager = new WaveManager(this);
    this.buildSystem = new BuildSystem(this);

    this.add.image(GAME.canvasWidth / 2, GAME.canvasHeight / 2, 'background');

    this.renderGrid();
    this.renderCore();

    this.bugs = this.physics.add.group({
      classType: Bug,
      maxSize: GAME.maxBugsPoolSize,
      runChildUpdate: true,
    });

    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: GAME.maxBulletsPoolSize,
      runChildUpdate: true,
    });

    this.spitterBullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 20,
      runChildUpdate: true,
    });

    this.wallBodies = this.physics.add.staticGroup();

    this.placeStarterTurrets();

    this.physics.add.overlap(this.bullets, this.bugs, this.onBulletHitBug, null, this);
    this.physics.add.overlap(this.spitterBullets, this.wallBodies, this.onSpitterBulletHitWall, null, this);
    this.physics.add.collider(this.bugs, this.wallBodies, this.onBugHitWall, null, this);
    this.physics.add.overlap(this.bugs, this.wallBodies, this.onBugHitWall, null, this);

    this.coreZone = this.add.zone(
      this.grid.getCoreWorldPos().x,
      this.grid.getCoreWorldPos().y,
      GRID.tileSize,
      GRID.tileSize,
    );
    this.physics.add.existing(this.coreZone, true);
    this.physics.add.overlap(this.bugs, this.coreZone, this.onBugHitCore, null, this);
    this.physics.add.overlap(this.spitterBullets, this.coreZone, this.onSpitterBulletHitCore, null, this);

    this.events.on('bug-killed', this.onBugKilled, this);
    this.events.on('start-wave-early', this.onStartWaveEarly, this);

    this.buildSystem.setup();
    if (DEBUG.enableDebugKeys) this.setupDebugKeys();

    this.scene.launch('UIScene');

    this.startBuildPhase();

    this.events.emit('credits-changed', { credits: this.economy.getCredits() });
    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });

    this.events.once('shutdown', () => {
      this.events.off('bug-killed', this.onBugKilled, this);
      this.events.off('start-wave-early', this.onStartWaveEarly, this);
      if (this.input.keyboard) this.input.keyboard.removeAllListeners();
    });
  }

  renderGrid() {
    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const { x, y } = this.grid.gridToWorld(c, r);
        this.add.image(x, y, 'tile').setDisplaySize(GRID.tileSize, GRID.tileSize).setAlpha(0.5);
      }
    }
  }

  renderCore() {
    const pos = this.grid.getCoreWorldPos();
    this.coreSprite = this.add.sprite(pos.x, pos.y, 'core').setDisplaySize(GRID.tileSize, GRID.tileSize);
  }

  placeStarterTurrets() {
    for (const s of GRID.starterTurrets) {
      const world = this.grid.gridToWorld(s.col, s.row);
      const turret = new Turret(this, s.col, s.row, s.type, world.x, world.y);
      this.turrets.push(turret);
      if (turret.wallBody) {
        this.wallBodies.add(turret.wallBody);
      }
    }
  }

  setupDebugKeys() {
    const types = { ONE: 'swarmer', TWO: 'brute', THREE: 'spitter', FOUR: 'boss' };
    for (const [key, type] of Object.entries(types)) {
      this.input.keyboard.on(`keydown-${key}`, () => {
        if (this.phase !== 'wave') return;
        const pos = this.waveManager.getRandomEdgePosition();
        const corePos = this.grid.getCoreWorldPos();
        const bug = this.bugs.get();
        if (bug) {
          bug.spawn(pos.x, pos.y, type, corePos);
          this.waveManager.bugsAlive++;
        }
      });
    }
  }

  startBuildPhase() {
    this.phase = 'build';
    this.buildSystem.closeMenus();
    this.events.emit('phase-changed', { phase: 'build' });

    if (this.waveManager.getCurrentWave() === 0) {
      this.buildCountdown = GAME.buildPhaseSeconds;
      this.events.emit('timer-tick', { seconds: this.buildCountdown });
      this.buildTimer = this.time.addEvent({
        delay: 1000,
        repeat: GAME.buildPhaseSeconds - 1,
        callback: () => {
          this.buildCountdown--;
          this.events.emit('timer-tick', { seconds: this.buildCountdown });
          if (this.buildCountdown <= 0) {
            this.startWavePhase();
          }
        },
      });
    }
  }

  startWavePhase() {
    if (this.buildTimer) {
      this.buildTimer.remove();
      this.buildTimer = null;
    }

    this.phase = 'wave';
    this.buildSystem.closeMenus();
    this.events.emit('phase-changed', { phase: 'wave' });
    this.waveManager.startWave();
    this.showWaveAnnouncement(this.waveManager.getCurrentWave());
  }

  onWaveComplete() {
    if (this.phase === 'gameover') return;
    const waveNum = this.waveManager.getCurrentWave();
    this.economy.awardWaveBonus(waveNum);

    if (waveNum >= GAME.totalWaves) {
      this.gameOver(true);
      return;
    }

    this.buildCountdown = GAME.buildPhaseSeconds;
    this.phase = 'build';
    this.events.emit('phase-changed', { phase: 'build' });
    this.events.emit('timer-tick', { seconds: this.buildCountdown });

    this.buildTimer = this.time.addEvent({
      delay: 1000,
      repeat: GAME.buildPhaseSeconds - 1,
      callback: () => {
        this.buildCountdown--;
        this.events.emit('timer-tick', { seconds: this.buildCountdown });
        if (this.buildCountdown <= 0) {
          this.startWavePhase();
        }
      },
    });
  }

  onBugKilled(data) {
    this.economy.earn(data.reward);
    this.totalKills++;
    this.waveManager.onBugDied();
    this.showBugDeathEffect(data.x, data.y, data.type);
  }

  onStartWaveEarly() {
    if (this.phase === 'build') {
      if (this.buildCountdown > 0) {
        this.economy.earn(ECONOMY.earlyStartBonus);
      }
      this.startWavePhase();
    }
  }

  onBulletHitBug(_bullet, _bug) {
    const bullet = _bullet;
    const bug = _bug;
    if (!bullet.active || !bug.active) return;
    bullet.despawn();
    bug.takeDamage(bullet.damage);
  }

  onSpitterBulletHitWall(_bullet, _wall) {
    const bullet = _bullet;
    const wall = _wall;
    if (!bullet.active || !wall.active) return;

    const turret = wall.turretRef;
    if (turret) {
      turret.takeDamage(bullet.damage);
    }
    bullet.despawn();
  }

  onBugHitWall(_bug, _wall) {
    const bug = _bug;
    const wall = _wall;
    if (!bug.active || !wall.active) return;

    const turret = wall.turretRef;
    if (!turret) return;

    if (bug.wallAttackCooldown > 0) return;
    bug.wallAttackCooldown = 1000;
    turret.takeDamage(bug.wallDamage);
  }

  onSpitterBulletHitCore(_core, _bullet) {
    const bullet = _bullet;
    if (!bullet.active) return;
    if (this.phase === 'gameover') return;

    this.baseHp -= bullet.damage;
    if (this.baseHp < 0) this.baseHp = 0;

    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });

    if (this.coreSprite && this.coreSprite.active) {
      this.coreSprite.setTintFill(0xff4444);
      this.time.delayedCall(100, () => {
        if (this.coreSprite && this.coreSprite.active) {
          this.coreSprite.clearTint();
        }
      });
    }

    bullet.despawn();

    if (this.baseHp <= 0) {
      this.gameOver(false);
    }
  }

  onBugHitCore(_core, _bug) {
    const bug = _bug;
    if (!bug.active) return;
    if (this.phase === 'gameover') return;

    this.baseHp -= bug.coreDamage;
    if (this.baseHp < 0) this.baseHp = 0;

    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });

    if (this.coreSprite && this.coreSprite.active) {
      this.coreSprite.setTintFill(0xff4444);
      this.time.delayedCall(100, () => {
        if (this.coreSprite && this.coreSprite.active) {
          this.coreSprite.clearTint();
        }
      });
    }

    bug.despawn();

    if (this.baseHp <= 0) {
      this.gameOver(false);
      return;
    }

    this.waveManager.onBugDied();
  }

  gameOver(won) {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';

    this.scene.stop('UIScene');
    this.scene.start('GameOver', {
      won,
      wave: this.waveManager.getCurrentWave(),
      totalKills: this.totalKills,
      credits: this.economy.getCredits(),
      baseHp: this.baseHp,
    });
  }

  showBugDeathEffect(x, y, type) {
    const colors = { swarmer: 0x44ff44, brute: 0xff4444, spitter: 0xaa44ff, boss: 0x9900ff };
    const color = colors[type] || 0xffffff;
    const count = type === 'boss' ? 12 : 6;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const particle = this.add.circle(x, y, 3, color, 1);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0.2,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  showBuildFlash(x, y) {
    const flash = this.add.rectangle(x, y, GRID.tileSize, GRID.tileSize, 0x00ff88, 0.5);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  showWaveAnnouncement(waveNum) {
    const text = this.add.text(GAME.canvasWidth / 2, GAME.canvasHeight / 2 - 120, `WAVE ${waveNum}`, {
      fontSize: '72px',
      fontFamily: 'monospace',
      color: '#ff8844',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      y: text.y - 20,
      duration: 400,
      ease: 'Power2',
      yoyo: true,
      hold: 600,
      onComplete: () => text.destroy(),
    });
  }

  update(time, delta) {
    this.bugs.getChildren().forEach((bug) => {
      if (bug.active) bug.slowed = false;
    });

    for (const turret of this.turrets) {
      turret.update(time, delta, this.bugs);
    }
  }
}
