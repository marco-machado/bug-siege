import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'bullet');
    this.damage = 0;
    this.speed = 900;
  }

  fire(x, y, targetX, targetY, damage, speed, texture) {
    this.damage = damage;
    this.speed = speed !== undefined ? speed : 900;
    this.setTexture(texture || 'bullet');
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;

    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    this.setVelocity(
      Math.cos(angle) * this.speed,
      Math.sin(angle) * this.speed,
    );
    this.setRotation(angle + Math.PI / 2);
  }

  despawn() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.setVelocity(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;

    const bounds = this.scene.physics.world.bounds;
    if (
      this.x < bounds.x - 113 ||
      this.x > bounds.x + bounds.width + 113 ||
      this.y < bounds.y - 113 ||
      this.y > bounds.y + bounds.height + 113
    ) {
      this.despawn();
    }
  }
}
