import Phaser from 'phaser';
import { TURRETS } from '../config/GameConfig.js';

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

    this.fireTimer = 0;
    this.sprite = scene.add.sprite(worldX, worldY, `turret-${type}`);

    if (type === 'wall') {
      this.wallBody = scene.physics.add.staticImage(worldX, worldY, `turret-${type}`);
      this.wallBody.setVisible(false);
      this.wallBody.turretRef = this;
    }

    if (type === 'slowfield') {
      this.auraGraphics = scene.add.graphics();
      this.drawAura();
    }
  }

  update(_time, delta, bugs) {
    if (this.type === 'wall') return;

    if (this.type === 'slowfield') {
      this.updateSlowfieldAura(bugs);
      return;
    }

    this.fireTimer -= delta;
    if (this.fireTimer > 0) return;

    const target = this.findNearestBug(bugs);
    if (!target) return;

    this.sprite.setRotation(
      Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y)
    );

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

  fire(target) {
    const bullet = this.scene.bullets.get();
    if (!bullet) return;
    bullet.fire(this.sprite.x, this.sprite.y, target.x, target.y, this.damage);
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
    this.showMuzzleFlash();
  }

  drawLightningChain(targets) {
    const g = this.scene.add.graphics();
    g.lineStyle(2, 0xaa44ff, 1);

    g.beginPath();
    g.moveTo(this.sprite.x, this.sprite.y);
    for (const t of targets) {
      g.lineTo(t.x, t.y);
    }
    g.strokePath();

    this.scene.time.delayedCall(200, () => g.destroy());
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

  drawAura() {
    if (!this.auraGraphics) return;
    this.auraGraphics.clear();
    this.auraGraphics.fillStyle(0x44ddff, 0.12);
    this.auraGraphics.fillCircle(this.sprite.x, this.sprite.y, this.range);
    this.auraGraphics.lineStyle(1, 0x44ddff, 0.3);
    this.auraGraphics.strokeCircle(this.sprite.x, this.sprite.y, this.range);
  }

  showMuzzleFlash() {
    const flash = this.scene.add.circle(this.sprite.x, this.sprite.y, 8, 0xffffaa, 0.9);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 120,
      onComplete: () => flash.destroy(),
    });
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
      this.drawAura();
    }
    if (this.type === 'wall' && conf.upgradedHp) {
      this.hp = conf.upgradedHp;
    }

    this.sprite.setTint(0xffdd44);

    return true;
  }

  takeDamage(amount) {
    if (this.hp === null) return false;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    this.sprite.destroy();
    if (this.wallBody) {
      this.wallBody.destroy();
    }
    if (this.auraGraphics) {
      this.auraGraphics.destroy();
    }
    this.scene.grid.setCell(this.gridCol, this.gridRow, 'empty');
    const idx = this.scene.turrets.indexOf(this);
    if (idx !== -1) this.scene.turrets.splice(idx, 1);
  }

  getUpgradeCost() {
    return TURRETS[this.type].upgradeCost;
  }

  getSellValue() {
    return Math.floor(this.cost * 0.5);
  }
}
