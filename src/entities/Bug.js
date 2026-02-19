import Phaser from 'phaser';
import { BUGS, STEERING, TURRETS } from '../config/GameConfig.js';

export class Bug extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bug-swarmer');
    this.bugType = 'swarmer';
    this.hp = 0;
    this.maxHp = 0;
    this.moveSpeed = 0;
    this.coreDamage = 0;
    this.wallDamage = 0;
    this.reward = 0;
    this.slowed = false;
    this.baseSpeed = 0;
    this.attackTimer = 0;
    this.wallAttackCooldown = 0;
  }

  spawn(x, y, type, corePos) {
    const conf = BUGS[type];
    if (!conf) {
      console.error(`Bug.spawn: unknown type "${type}". Valid: ${Object.keys(BUGS).join(', ')}`);
      return;
    }
    this.bugType = type;
    this.hp = conf.hp;
    this.maxHp = conf.hp;
    this.moveSpeed = conf.speed;
    this.baseSpeed = conf.speed;
    this.coreDamage = conf.coreDamage ?? conf.damage ?? 0;
    this.wallDamage = conf.wallDamage ?? conf.damage ?? 0;
    this.reward = conf.reward;
    this.slowed = false;
    this.attackTimer = 0;
    this.wallAttackCooldown = 0;
    this.corePos = corePos;

    this.setTexture(`bug-${type}`);
    this.setDisplaySize(conf.size, conf.size);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setCircle(this.width / 2);
    this.setOrigin(0.5);
  }

  getSpeed() {
    return this.slowed ? this.baseSpeed * TURRETS.slowfield.slowFactor : this.baseSpeed;
  }

  applyMovement(dirX, dirY, speed) {
    this.setVelocity(dirX * speed, dirY * speed);
    this.setRotation(Math.atan2(dirY, dirX) + Math.PI / 2);
  }

  activeTurrets() {
    if (!this.scene || !this.scene.turrets) return [];
    return this.scene.turrets.filter(t => t.sprite && t.sprite.active);
  }

  steerToCore() {
    if (!this.active || !this.corePos) {
      this.setVelocity(0, 0);
      return;
    }
    const dx = this.corePos.x - this.x;
    const dy = this.corePos.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) return;
    this.applyMovement(dx / dist, dy / dist, this.getSpeed());
  }

  steer() {
    if (!this.active || !this.corePos) {
      this.setVelocity(0, 0);
      return;
    }

    const dx = this.corePos.x - this.x;
    const dy = this.corePos.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    let forceX = dx / dist;
    let forceY = dy / dist;

    const radius = STEERING.avoidanceRadius;
    const radiusSq = radius * radius;
    const strength = STEERING.repulsionStrength;

    for (const turret of this.activeTurrets()) {
      const tx = turret.sprite.x - this.x;
      const ty = turret.sprite.y - this.y;
      const tDistSq = tx * tx + ty * ty;
      if (tDistSq >= radiusSq || tDistSq < 1) continue;
      const tDist = Math.sqrt(tDistSq);
      const factor = (1 - tDist / radius) * strength;
      forceX -= (tx / tDist) * factor;
      forceY -= (ty / tDist) * factor;
    }

    const len = Math.sqrt(forceX * forceX + forceY * forceY);
    if (len < 0.0001) return;

    this.applyMovement(forceX / len, forceY / len, this.getSpeed());
  }

  steerSwarmer() {
    if (!this.active || !this.corePos) {
      this.setVelocity(0, 0);
      return;
    }

    const target = this.findNearestTarget();
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    this.applyMovement(dx / dist, dy / dist, this.getSpeed());
  }

  findNearestTarget() {
    let nearestX = this.corePos.x;
    let nearestY = this.corePos.y;
    let nearestDist = Phaser.Math.Distance.Between(this.x, this.y, nearestX, nearestY);

    for (const turret of this.activeTurrets()) {
      const d = Phaser.Math.Distance.Between(this.x, this.y, turret.sprite.x, turret.sprite.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestX = turret.sprite.x;
        nearestY = turret.sprite.y;
      }
    }

    return { x: nearestX, y: nearestY };
  }

  takeDamage(amount) {
    this.hp -= amount;
    this.setAlpha(0.6);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.setAlpha(1);
    });

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.scene.events.emit('bug-killed', {
      reward: this.reward,
      type: this.bugType,
      x: this.x,
      y: this.y,
    });
    this.despawn();
  }

  despawn() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  findAttackTarget() {
    const range = BUGS[this.bugType].attackRange;
    if (!range) return null;

    let nearest = null;
    let minDist = range;

    for (const turret of this.activeTurrets()) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, turret.sprite.x, turret.sprite.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = turret;
      }
    }
    return nearest;
  }

  fireSpitterBullet(target) {
    if (!target.sprite || !target.sprite.active) return;
    this.fireSpitterBulletAt(target.sprite.x, target.sprite.y);
  }

  fireSpitterBulletAt(targetX, targetY) {
    if (!this.scene.spitterBullets) return;
    const bullet = this.scene.spitterBullets.get();
    if (!bullet) return;
    bullet.fire(this.x, this.y, targetX, targetY, this.wallDamage, 200, 'spitter-bullet');
  }

  updateSpitter(delta) {
    const target = this.findAttackTarget();

    if (target) {
      this.setVelocity(0, 0);
      const dx = target.sprite.x - this.x;
      const dy = target.sprite.y - this.y;
      this.setRotation(Math.atan2(dy, dx) + Math.PI / 2);

      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        this.fireSpitterBullet(target);
        this.attackTimer = 1000 / BUGS.spitter.attackRate;
      }
      return;
    }

    if (this.corePos) {
      const distToCore = Phaser.Math.Distance.Between(this.x, this.y, this.corePos.x, this.corePos.y);
      if (distToCore <= BUGS.spitter.attackRange) {
        this.setVelocity(0, 0);
        const dx = this.corePos.x - this.x;
        const dy = this.corePos.y - this.y;
        this.setRotation(Math.atan2(dy, dx) + Math.PI / 2);

        this.attackTimer -= delta;
        if (this.attackTimer <= 0) {
          this.fireSpitterBulletAt(this.corePos.x, this.corePos.y);
          this.attackTimer = 1000 / BUGS.spitter.attackRate;
        }
        return;
      }
    }

    this.steerToCore();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    if (this.wallAttackCooldown > 0) this.wallAttackCooldown -= delta;

    if (this.bugType === 'spitter') {
      this.updateSpitter(delta);
    } else if (this.bugType === 'swarmer') {
      this.steerSwarmer();
    } else {
      this.steer();
    }
  }
}
