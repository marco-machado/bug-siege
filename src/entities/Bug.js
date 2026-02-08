import Phaser from 'phaser';
import { BUGS } from '../config/GameConfig.js';

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
    this.corePos = corePos;

    this.setTexture(`bug-${type}`);
    this.setDisplaySize(conf.size, conf.size);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setCircle(conf.size / 2);
    this.setOrigin(0.5);
  }

  steer() {
    if (!this.active || !this.corePos) return;

    const speed = this.slowed ? this.baseSpeed * 0.5 : this.baseSpeed;
    const dx = this.corePos.x - this.x;
    const dy = this.corePos.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) return;

    this.setVelocity(
      (dx / dist) * speed,
      (dy / dist) * speed,
    );

    this.setRotation(Math.atan2(dy, dx));
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
    this.scene.events.emit('bug-killed', { reward: this.reward, type: this.bugType });
    this.despawn();
  }

  despawn() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.active) {
      this.steer();
    }
  }
}
