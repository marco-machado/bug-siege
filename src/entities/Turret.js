import Phaser from 'phaser';
import { GRID, TURRETS, ECONOMY, VFX } from '../config/GameConfig.js';

export class Turret {
  constructor(scene, col, row, type, worldX, worldY) {
    this.scene = scene;
    this.type = type;
    this.gridCol = col;
    this.gridRow = row;
    this.upgraded = false;

    const conf = TURRETS[type];
    this.cost = conf.cost;
    this.range = conf.range || 0;
    this.fireRate = conf.fireRate || 0;
    this.damage = conf.damage || 0;
    this.hp = conf.hp;
    this.maxHp = conf.hp;

    this.fireTimer = 0;
    this.currentTarget = null;
    this.sprite = scene.add.sprite(worldX, worldY, `turret-${type}`).setDisplaySize(GRID.tileSize, GRID.tileSize);

    this.wallBody = scene.physics.add.staticImage(worldX, worldY, `turret-${type}`);
    this.wallBody.setDisplaySize(GRID.tileSize, GRID.tileSize);
    this.wallBody.refreshBody();
    this.wallBody.setVisible(false);
    this.wallBody.turretRef = this;

    if (type === 'slowfield') {
      const cfg = VFX.SLOWFIELD;
      this.auraEmitter = scene.add.particles(worldX, worldY, 'particle', {
        speed: cfg.speed,
        lifespan: cfg.lifespan,
        scale: cfg.scale,
        tint: cfg.tints,
        alpha: cfg.alpha,
        radial: true,
        emitting: false,
      });
      this.pulseTimer = scene.time.addEvent({
        delay: cfg.pulseInterval,
        loop: true,
        callback: () => {
          if (this.auraEmitter && this.auraEmitter.active) {
            this.auraEmitter.explode(cfg.particlesPerPulse);
          }
        },
      });
    }

    const barWidth = GRID.tileSize * 0.8;
    const barHeight = 6;
    const barY = worldY + GRID.tileSize / 2 + 6;
    this.hpBarBg = scene.add.rectangle(worldX, barY, barWidth, barHeight, 0x333333)
      .setOrigin(0.5, 0.5).setVisible(false);
    this.hpBarFill = scene.add.rectangle(worldX, barY, barWidth, barHeight, 0x00ff00)
      .setOrigin(0.5, 0.5).setVisible(false);
    this.idleTween = null;
    if (type !== 'wall') {
      this.idleTween = scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.75, to: 1.0 },
        duration: 1200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  update(_time, delta, bugs) {
    if (this.type === 'wall') return;

    if (this.type === 'slowfield') {
      this.updateSlowfieldAura(bugs);
      return;
    }

    this.fireTimer -= delta;

    let target = this.currentTarget;
    if (target && target.active) {
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, target.x, target.y
      );
      if (dist >= this.range) target = null;
    } else {
      target = null;
    }
    if (!target) target = this.findNearestBug(bugs);
    this.currentTarget = target;
    if (!target) return;

    const aimPos = this.type === 'zapper' ? target : this.getPredictedPosition(target);
    const targetAngle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, aimPos.x, aimPos.y
    ) + Math.PI / 2;
    this.sprite.rotation = Phaser.Math.Angle.RotateTo(
      this.sprite.rotation, targetAngle, TURRETS.rotationSpeed * delta / 1000
    );

    const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - this.sprite.rotation);
    if (Math.abs(angleDiff) > 0.1) return;

    if (this.fireTimer > 0) return;

    if (this.type === 'zapper') {
      this.fireZapper(target, bugs);
    } else {
      this.fire(target);
    }
    this.fireTimer = 1000 / this.fireRate;
  }

  findNearestBug(bugs) {
    let nearest = null;
    let minDist = this.range;

    bugs.getChildren().forEach((bug) => {
      if (!bug.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, bug.x, bug.y
      );
      if (dist < minDist) {
        minDist = dist;
        nearest = bug;
      }
    });

    return nearest;
  }

  getPredictedPosition(target) {
    const bulletSpeed = TURRETS.bulletSpeed;
    const dx = target.x - this.sprite.x;
    const dy = target.y - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const t = dist / bulletSpeed;
    return {
      x: target.x + target.body.velocity.x * t,
      y: target.y + target.body.velocity.y * t,
    };
  }

  getTipPosition() {
    const angle = this.sprite.rotation - Math.PI / 2;
    const offset = GRID.tileSize * 0.45;
    return {
      x: this.sprite.x + Math.cos(angle) * offset,
      y: this.sprite.y + Math.sin(angle) * offset,
    };
  }

  fire(target) {
    const bullet = this.scene.bullets.get();
    if (!bullet) return;
    const predicted = this.getPredictedPosition(target);
    const tip = this.getTipPosition();
    bullet.fire(tip.x, tip.y, predicted.x, predicted.y, this.damage);
    this.scene.playSfx('sfx_shoot');
    this.showMuzzleFlash();
  }

  fireZapper(primaryTarget, bugs) {
    const chainRange = 96;
    const maxChains = TURRETS.zapper.chainTargets;
    const targets = [primaryTarget];

    let lastTarget = primaryTarget;
    for (let i = 0; i < maxChains; i++) {
      let nearest = null;
      let minDist = chainRange;

      bugs.getChildren().forEach((bug) => {
        if (!bug.active || targets.includes(bug)) return;
        const dist = Phaser.Math.Distance.Between(lastTarget.x, lastTarget.y, bug.x, bug.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = bug;
        }
      });

      if (!nearest) break;
      targets.push(nearest);
      lastTarget = nearest;
    }

    for (const target of targets) {
      target.takeDamage(this.damage);
    }

    this.drawLightningChain(targets);
    this.scene.playSfx('sfx_zap');
    this.showMuzzleFlash();
  }

  drawLightningChain(targets) {
    const g = this.scene.add.graphics();
    const tip = this.getTipPosition();
    const cfg = VFX.ZAPPER_TRAIL;

    g.lineStyle(cfg.outerLineWidth, cfg.outerColor, cfg.outerAlpha);
    g.beginPath();
    g.moveTo(tip.x, tip.y);
    for (const t of targets) g.lineTo(t.x, t.y);
    g.strokePath();

    g.lineStyle(cfg.innerLineWidth, cfg.innerColor, cfg.innerAlpha);
    g.beginPath();
    g.moveTo(tip.x, tip.y);
    for (const t of targets) g.lineTo(t.x, t.y);
    g.strokePath();

    this.scene.time.delayedCall(cfg.lineDuration, () => g.destroy());

    this.spawnTrailParticles(tip, targets);
  }

  spawnTrailParticles(tip, targets) {
    const cfg = VFX.ZAPPER_TRAIL;
    const emitter = this.scene.add.particles(0, 0, 'particle-glow', {
      speed: { min: 5, max: 20 },
      lifespan: cfg.trailLifespan,
      scale: cfg.trailScale,
      tint: cfg.trailTint,
      alpha: cfg.trailAlpha,
      emitting: false,
    });

    const points = [tip, ...targets];
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const steps = cfg.particlesPerSegment;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        emitter.emitParticleAt(x, y, 1);
      }
    }

    this.scene.time.delayedCall(cfg.trailLifespan + 50, () => emitter.destroy());
  }

  updateSlowfieldAura(bugs) {
    bugs.getChildren().forEach((bug) => {
      if (!bug.active) return;
      const dist = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y, bug.x, bug.y
      );
      if (dist <= this.range) {
        bug.slowed = true;
      }
    });
  }

  showRange() {
    if (this.range === 0) return;

    const colors = { blaster: 0xffaa44, zapper: 0xaa44ff, slowfield: 0x9966ff };
    const color = colors[this.type] || 0xffffff;

    const g = this.scene.add.graphics();
    g.fillStyle(color, 0.15);
    g.fillCircle(this.sprite.x, this.sprite.y, this.range);
    g.lineStyle(2, color, 0.6);
    g.strokeCircle(this.sprite.x, this.sprite.y, this.range);

    g.setAlpha(0);
    this.scene.tweens.chain({
      targets: g,
      tweens: [
        { alpha: 1, duration: 200, ease: 'Sine.easeOut' },
        { alpha: 1, duration: 3000 },
        { alpha: 0, duration: 200, ease: 'Sine.easeIn' },
      ],
      onComplete: () => g.destroy(),
    });
  }

  showMuzzleFlash() {
    const tip = this.getTipPosition();
    const cfg = VFX.MUZZLE;
    const angleDeg = Phaser.Math.RadToDeg(this.sprite.rotation - Math.PI / 2);

    const emitter = this.scene.add.particles(tip.x, tip.y, 'particle', {
      speed: cfg.speed,
      lifespan: cfg.lifespan,
      scale: cfg.scale,
      tint: cfg.tint,
      angle: { min: angleDeg - cfg.angleSpread, max: angleDeg + cfg.angleSpread },
      maxParticles: cfg.count,
    });
    emitter.on('complete', () => emitter.destroy());
  }

  upgrade() {
    if (this.upgraded) return false;
    this.upgraded = true;

    const conf = TURRETS[this.type];
    if (conf.upgradedDamage) {
      this.damage = conf.upgradedDamage;
    }
    if (this.type === 'slowfield' && conf.upgradedRange) {
      this.range = conf.upgradedRange;
      if (this.auraEmitter) {
        const cfg = VFX.SLOWFIELD;
        this.auraEmitter.destroy();
        this.auraEmitter = this.scene.add.particles(this.sprite.x, this.sprite.y, 'particle', {
          speed: cfg.upgradedSpeed,
          lifespan: cfg.lifespan,
          scale: cfg.scale,
          tint: cfg.upgradedTints,
          alpha: cfg.alpha,
          radial: true,
          emitting: false,
        });
      }
    }
    if (this.type === 'wall' && conf.upgradedHp) {
      this.maxHp = conf.upgradedHp;
    }

    this.hp = this.maxHp;
    this.updateHpBar();
    if (this.idleTween) {
      this.idleTween.destroy();
      this.idleTween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: { from: 0.65, to: 1.0 },
        duration: 900,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
    this.sprite.setTint(0xffdd44);

    return true;
  }

  flashDamage() {
    if (!this.sprite || !this.sprite.active) return;
    this.sprite.setTintFill(0xff4444);
    this.scene.time.delayedCall(100, () => {
      if (!this.sprite || !this.sprite.active) return;
      if (this.upgraded) {
        this.sprite.setTint(0xffdd44);
      } else {
        this.sprite.clearTint();
      }
    });
  }

  takeDamage(amount) {
    if (!this.sprite || !this.sprite.active) return false;
    this.flashDamage();
    this.scene.playSfx('sfx_hit');
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    this.updateHpBar();
    return false;
  }

  destroy() {
    if (this.scene && this.scene.shakeCamera) {
      this.scene.shakeCamera('medium');
    }
    if (this.idleTween) {
      this.idleTween.destroy();
      this.idleTween = null;
    }
    this.sprite.destroy();
    if (this.wallBody) {
      this.wallBody.destroy();
    }
    if (this.auraEmitter) {
      this.auraEmitter.destroy();
      this.auraEmitter = null;
    }
    if (this.pulseTimer) {
      this.pulseTimer.remove();
      this.pulseTimer = null;
    }
    if (this.hpBarBg) this.hpBarBg.destroy();
    if (this.hpBarFill) this.hpBarFill.destroy();
    this.scene.grid.setCell(this.gridCol, this.gridRow, 'empty');
    const idx = this.scene.turrets.indexOf(this);
    if (idx !== -1) this.scene.turrets.splice(idx, 1);
  }

  getUpgradeCost() {
    return TURRETS[this.type].upgradeCost;
  }

  updateHpBar() {
    if (this.hp >= this.maxHp) {
      this.hpBarBg.setVisible(false);
      this.hpBarFill.setVisible(false);
      return;
    }
    this.hpBarBg.setVisible(true);
    this.hpBarFill.setVisible(true);
    const ratio = this.hp / this.maxHp;
    const fullWidth = GRID.tileSize * 0.8;
    const targetWidth = fullWidth * ratio;
    let color = 0x00ff00;
    if (ratio <= 0.25) color = 0xff3333;
    else if (ratio <= 0.5) color = 0xffaa00;
    this.hpBarFill.setFillStyle(color);
    if (this.hpTween) this.hpTween.destroy();
    this.hpTween = this.scene.tweens.add({
      targets: this.hpBarFill,
      displayWidth: targetWidth,
      duration: 200,
      ease: 'Power2',
    });
  }

  repair() {
    this.hp = this.maxHp;
    this.updateHpBar();
  }

  getRepairCost() {
    return Math.ceil(this.cost * (1 - this.hp / this.maxHp) * ECONOMY.repairCostMarkup);
  }

  getSellValue() {
    return Math.floor(this.cost * ECONOMY.sellReturnRate);
  }
}
