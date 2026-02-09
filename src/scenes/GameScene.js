import Phaser from 'phaser';
import { GRID, GAME, ECONOMY } from '../config/GameConfig.js';
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

    this.coreZone = this.add.zone(
      this.grid.getCoreWorldPos().x,
      this.grid.getCoreWorldPos().y,
      GRID.tileSize,
      GRID.tileSize,
    );
    this.physics.add.existing(this.coreZone, true);
    this.physics.add.overlap(this.bugs, this.coreZone, this.onBugHitCore, null, this);

    this.events.on('bug-killed', (data) => {
      this.economy.earn(data.reward);
      this.totalKills++;
      this.waveManager.onBugDied();
    });

    this.events.on('start-wave-early', () => {
      if (this.phase === 'build') {
        if (this.buildCountdown > 0) {
          this.economy.earn(ECONOMY.earlyStartBonus);
        }
        this.startWavePhase();
      }
    });

    this.buildSystem.setup();

    this.scene.launch('UIScene');

    this.startBuildPhase();

    this.events.emit('credits-changed', { credits: this.economy.getCredits() });
    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });
  }

  renderGrid() {
    for (let r = 0; r < GRID.rows; r++) {
      for (let c = 0; c < GRID.cols; c++) {
        const { x, y } = this.grid.gridToWorld(c, r);
        this.add.image(x, y, 'tile').setAlpha(0.5);
      }
    }
  }

  renderCore() {
    const pos = this.grid.getCoreWorldPos();
    this.coreSprite = this.add.sprite(pos.x, pos.y, 'core');
  }

  placeStarterTurrets() {
    for (const s of GRID.starterTurrets) {
      const world = this.grid.gridToWorld(s.col, s.row);
      const turret = new Turret(this, s.col, s.row, s.type, world.x, world.y);
      this.turrets.push(turret);
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
  }

  onWaveComplete() {
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

  onBulletHitBug(_bullet, _bug) {
    const bullet = _bullet;
    const bug = _bug;
    if (!bullet.active || !bug.active) return;
    bug.takeDamage(bullet.damage);
    bullet.despawn();
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

    turret.takeDamage(bug.wallDamage);
  }

  onBugHitCore(_bug) {
    const bug = _bug;
    if (!bug.active) return;

    this.baseHp -= bug.coreDamage;
    if (this.baseHp < 0) this.baseHp = 0;

    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });

    bug.despawn();
    this.waveManager.onBugDied();

    if (this.baseHp <= 0) {
      this.gameOver(false);
    }
  }

  gameOver(won) {
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

  update(time, delta) {
    this.bugs.getChildren().forEach((bug) => {
      if (bug.active) bug.slowed = false;
    });

    for (const turret of this.turrets) {
      turret.update(time, delta, this.bugs);
    }
  }
}
