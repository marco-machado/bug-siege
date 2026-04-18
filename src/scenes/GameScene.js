import Phaser from 'phaser';
import { GRID, GAME, ECONOMY, DEBUG, VFX, POSTFX } from '../config/GameConfig.js';
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
    this._sfxCooldowns = {};
    this.grid = new Grid();
    this.economy = new EconomyManager(this);
    this.waveManager = new WaveManager(this);
    this.buildSystem = new BuildSystem(this);

    this.add.image(GAME.canvasWidth / 2, GAME.canvasHeight / 2, 'nebula');

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
    this.physics.add.overlap(this.spitterBullets, this.coreZone, this.onSpitterBulletHitCore, null, this);

    this.events.on('bug-killed', this.onBugKilled, this);
    this.events.on('start-wave-early', this.onStartWaveEarly, this);

    this.buildSystem.setup();
    if (DEBUG.enableDebugKeys) this.setupDebugKeys();

    this.scene.launch('UIScene');

    const isWebGL = this.game.renderer.type === Phaser.WEBGL;
    if (!isWebGL) {
      console.warn('[postfx] Canvas renderer detected — glow disabled');
    } else {
      const v = POSTFX.VIGNETTE;
      this._vignetteFX = this.cameras.main.postFX.addVignette(v.x, v.y, v.radius, v.buildStrength);
    }

    this._onPhaseChangedVignette = (payload) => {
      if (!this._vignetteFX) return;
      if (this._vignetteTween) this._vignetteTween.destroy();
      const target = payload.phase === 'wave'
        ? POSTFX.VIGNETTE.waveStrength
        : POSTFX.VIGNETTE.buildStrength;
      this._vignetteTween = this.tweens.add({
        targets: this._vignetteFX,
        strength: target,
        duration: POSTFX.VIGNETTE.transitionDuration,
        ease: POSTFX.VIGNETTE.transitionEase,
      });
    };
    this.events.on('phase-changed', this._onPhaseChangedVignette);

    this.startBuildPhase();
    const startBgm = () => this.sound.play('bgm_wave', { loop: true, volume: 0.5 });
    if (this.sound.locked) {
      this.sound.once('unlocked', startBgm);
    } else {
      startBgm();
    }

    this.events.emit('credits-changed', { credits: this.economy.getCredits() });
    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });

    this.events.once('shutdown', () => {
      this.sound.stopByKey('bgm_wave');
      this.sound.stopByKey('sfx_victory');
      this.sound.stopByKey('sfx_core_destroyed');
      this.events.off('bug-killed', this.onBugKilled, this);
      this.events.off('start-wave-early', this.onStartWaveEarly, this);
      if (this.input.keyboard) this.input.keyboard.removeAllListeners();
      this.events.off('phase-changed', this._onPhaseChangedVignette);
      if (this._vignetteTween) { this._vignetteTween.destroy(); this._vignetteTween = null; }
      if (this.cameras.main && this.cameras.main.postFX) {
        this.cameras.main.postFX.clear();
      }
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
    const baseScale = this.coreSprite.scaleX;
    this.tweens.add({
      targets: this.coreSprite,
      scaleX: { from: baseScale, to: baseScale * 1.06 },
      scaleY: { from: baseScale, to: baseScale * 1.06 },
      duration: 1800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    const isWebGL = this.game.renderer.type === Phaser.WEBGL;
    if (isWebGL) {
      const cfg = POSTFX.GLOW.core;
      this.coreSprite.preFX.setPadding(cfg.padding);
      this._coreGlowFX = this.coreSprite.preFX.addGlow(cfg.color, cfg.outerStrength, cfg.innerStrength);
    }
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
    this._startBuildTimer();
  }

  _startBuildTimer() {
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

  startWavePhase() {
    if (this.buildTimer) {
      this.buildTimer.remove();
      this.buildTimer = null;
    }

    this.phase = 'wave';
    this.buildSystem.closeMenus();
    this.events.emit('phase-changed', { phase: 'wave' });
    this.playSfx('sfx_wave_start');
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

    this.phase = 'build';
    this.events.emit('phase-changed', { phase: 'build' });
    this._startBuildTimer();
  }

  onBugKilled(data) {
    this.economy.earn(data.reward);
    this.totalKills++;
    this.waveManager.onBugDied();
    this.playSfx('sfx_splat');
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

  damageCore(amount) {
    this.baseHp -= amount;
    if (this.baseHp < 0) this.baseHp = 0;

    this.events.emit('hp-changed', { hp: this.baseHp, maxHp: GAME.baseHp });
    this.playSfx('sfx_hit');

    if (this.coreSprite && this.coreSprite.active) {
      this.coreSprite.setTintFill(0xff4444);
      this.time.delayedCall(100, () => {
        if (this.coreSprite && this.coreSprite.active) {
          this.coreSprite.clearTint();
        }
      });
    }

    const coreCenter = this.coreSprite
      ? { x: this.coreSprite.x, y: this.coreSprite.y }
      : { x: GAME.canvasWidth / 2, y: GAME.canvasHeight / 2 };
    this.showCoreShockwave(coreCenter.x, coreCenter.y, amount);

    const tier = amount >= 20 ? 'heavy' : amount >= 10 ? 'medium' : 'light';
    this.shakeCamera(tier);

    if (this.baseHp <= 0) {
      this.gameOver(false);
      return true;
    }
    return false;
  }

  onSpitterBulletHitCore(obj1, obj2) {
    const bullet = typeof obj1.despawn === 'function' ? obj1 : obj2;
    if (!bullet.active || this.phase === 'gameover') return;
    this.damageCore(bullet.damage);
    bullet.despawn();
  }

  onBugHitCore(obj1, obj2) {
    const bug = typeof obj1.despawn === 'function' ? obj1 : obj2;
    if (!bug.active || this.phase === 'gameover') return;
    const gameEnded = this.damageCore(bug.coreDamage);
    this.waveManager.onBugDied();
    bug.despawn();
  }

  gameOver(won) {
    if (this.phase === 'gameover') return;
    this.phase = 'gameover';
    this.sound.stopByKey('bgm_wave');
    if (won) this.sound.play('sfx_victory');
    else this.sound.play('sfx_core_destroyed');

    this.scene.stop('UIScene');
    this.scene.start('GameOver', {
      won,
      wave: this.waveManager.getCurrentWave(),
      totalKills: this.totalKills,
      credits: this.economy.getCredits(),
      baseHp: this.baseHp,
    });
  }

  playSfx(key, config) {
    const now = this.time.now;
    const cooldown = { sfx_shoot: 80, sfx_splat: 50, sfx_hit: 100, sfx_zap: 100 }[key] || 0;
    if (cooldown > 0) {
      const last = this._sfxCooldowns[key] || 0;
      if (now - last < cooldown) return;
      this._sfxCooldowns[key] = now;
    }
    this.sound.play(key, config);
  }

  shakeCamera(tier) {
    if (this.phase === 'gameover') return;
    const cfg = VFX.SHAKE[tier];
    if (!cfg) return;
    this.cameras.main.shake(cfg.duration, cfg.intensity, true);
  }

  showBugDeathEffect(x, y, type) {
    const cfg = VFX.DEATH[type] || VFX.DEATH.swarmer;
    const emitterConfig = {
      speed: cfg.speed,
      lifespan: cfg.lifespan,
      scale: cfg.scale,
      maxParticles: cfg.count,
      rotate: { min: 0, max: 360 },
    };
    if (cfg.color) {
      emitterConfig.color = cfg.color;
    } else {
      emitterConfig.tint = cfg.tint;
    }
    const emitter = this.add.particles(x, y, 'particle', emitterConfig);
    emitter.on('complete', () => emitter.destroy());
  }

  showBuildFlash(x, y) {
    const cfg = VFX.BUILD;
    const tint = cfg.tints[Math.floor(Math.random() * cfg.tints.length)];
    const emitter = this.add.particles(x, y, 'particle', {
      speed: cfg.speed,
      lifespan: cfg.lifespan,
      scale: cfg.scale,
      tint: tint,
      gravityY: cfg.gravityY,
      maxParticles: cfg.count,
    });
    emitter.on('complete', () => emitter.destroy());
  }

  showCoreShockwave(x, y, damageAmount) {
    const cfg = VFX.SHOCKWAVE;
    const ringCount = damageAmount >= 20 ? 2 : 1;

    for (let i = 0; i < ringCount; i++) {
      const ring = this.add.graphics();
      ring.setPosition(x, y);
      const delay = i * 80;

      this.time.delayedCall(delay, () => {
        if (!ring.active) return;
        ring.lineStyle(cfg.lineWidth, cfg.color, 1);
        ring.strokeCircle(0, 0, cfg.startRadius);

        this.tweens.add({
          targets: ring,
          scaleX: cfg.endRadius / cfg.startRadius,
          scaleY: cfg.endRadius / cfg.startRadius,
          alpha: 0,
          duration: cfg.duration,
          ease: 'Power2',
          onComplete: () => ring.destroy(),
        });
      });
    }
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
    if (this.phase === 'gameover') return;

    this.bugs.getChildren().forEach((bug) => {
      if (bug.active) bug.slowed = false;
    });

    for (const turret of this.turrets) {
      turret.update(time, delta, this.bugs);
    }
  }
}
