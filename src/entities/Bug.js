import Phaser from 'phaser';
import { BUGS, STEERING } from '../config/GameConfig.js';

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
    this.bugType = type;
    this.hp = conf.hp;
    this.maxHp = conf.hp;
    this.moveSpeed = conf.speed;
    this.baseSpeed = conf.speed;
    this.coreDamage = conf.coreDamage;
    this.wallDamage = conf.wallDamage;
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

  steer() {
    if (!this.active || !this.corePos) return;

    const speed = this.slowed ? this.baseSpeed * 0.5 : this.baseSpeed;
    const dx = this.corePos.x - this.x;
    const dy = this.corePos.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    let dirX = dx / dist;
    let dirY = dy / dist;

    const blocker = this.getAvoidanceTarget(dirX, dirY);
    if (blocker) {
      const bx = blocker.sprite.x - this.x;
      const by = blocker.sprite.y - this.y;
      const cross = dirX * by - dirY * bx;
      let perpX, perpY;
      if (cross >= 0) {
        perpX = dirY;
        perpY = -dirX;
      } else {
        perpX = -dirY;
        perpY = dirX;
      }
      const w = STEERING.avoidanceWeight;
      dirX = dirX * (1 - w) + perpX * w;
      dirY = dirY * (1 - w) + perpY * w;
      const len = Math.sqrt(dirX * dirX + dirY * dirY);
      dirX /= len;
      dirY /= len;
    }

    this.setVelocity(dirX * speed, dirY * speed);
    this.setRotation(Math.atan2(dirY, dirX) + Math.PI / 2);
  }

  steerSwarmer() {
    if (!this.active || !this.corePos) return;

    const speed = this.slowed ? this.baseSpeed * 0.5 : this.baseSpeed;
    let targetX = this.corePos.x;
    let targetY = this.corePos.y;

    if (this.scene && this.scene.turrets) {
      let nearestDist = Infinity;
      for (const turret of this.scene.turrets) {
        if (!turret.sprite || !turret.sprite.active) continue;
        const d = Phaser.Math.Distance.Between(this.x, this.y, turret.sprite.x, turret.sprite.y);
        if (d < nearestDist) {
          nearestDist = d;
          targetX = turret.sprite.x;
          targetY = turret.sprite.y;
        }
      }
      const distToCore = Phaser.Math.Distance.Between(this.x, this.y, this.corePos.x, this.corePos.y);
      if (distToCore < nearestDist) {
        targetX = this.corePos.x;
        targetY = this.corePos.y;
      }
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    this.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    this.setRotation(Math.atan2(dy, dx) + Math.PI / 2);
  }

  getAvoidanceTarget(dirX, dirY) {
    if (!this.scene || !this.scene.turrets) return null;

    let nearest = null;
    let nearestProj = Infinity;

    for (const turret of this.scene.turrets) {
      if (!turret.sprite || !turret.sprite.active) continue;
      const rx = turret.sprite.x - this.x;
      const ry = turret.sprite.y - this.y;
      const proj = rx * dirX + ry * dirY;
      if (proj < 0 || proj > STEERING.avoidanceLookahead) continue;
      const perpDist = Math.abs(rx * dirY - ry * dirX);
      if (perpDist < STEERING.avoidanceClearance && proj < nearestProj) {
        nearestProj = proj;
        nearest = turret;
      }
    }

    return nearest;
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
    if (!this.scene || !this.scene.turrets) return null;
    const range = BUGS[this.bugType].attackRange;
    if (!range) return null;

    let nearest = null;
    let minDist = range;

    for (const turret of this.scene.turrets) {
      if (!turret.sprite || !turret.sprite.active) continue;
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

    this.steer();
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
