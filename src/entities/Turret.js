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
    this.range = conf.range;
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
  }

  update(_time, delta, bugs) {
    if (this.type === 'wall' || this.type === 'slowfield') return;

    this.fireTimer -= delta;
    if (this.fireTimer > 0) return;

    const target = this.findNearestBug(bugs);
    if (!target) return;

    this.sprite.setRotation(
      Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, target.x, target.y)
    );

    this.fire(target);
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
    }
    if (this.type === 'wall' && conf.upgradedHp) {
      this.hp = conf.upgradedHp;
    }

    this.sprite.setAlpha(1);
    this.sprite.setTint(0xffffff);

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
