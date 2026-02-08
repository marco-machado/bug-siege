import Phaser from 'phaser';
import { BUGS, GRID } from '../config/GameConfig.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.generateTurretTexture('turret-blaster', 0x3388ff);
    this.generateTurretTexture('turret-zapper', 0xaa44ff);
    this.generateTurretTexture('turret-slowfield', 0x44ddff);
    this.generateWallTexture();
    this.generateCoreTexture();
    this.generateBugTexture('bug-swarmer', BUGS.swarmer.size, 0x44ff44);
    this.generateBugTexture('bug-brute', BUGS.brute.size, 0xff4444);
    this.generateBugTexture('bug-spitter', BUGS.spitter.size, 0xffaa00);
    this.generateBugTexture('bug-boss', BUGS.boss.size, 0xff0000);
    this.generateBulletTexture('bullet', 8, 0xffff00);
    this.generateBulletTexture('spitter-bullet', 8, 0xff6600);
    this.generateTileTexture();

    this.scene.start('MainMenu');
  }

  generateTurretTexture(key, color) {
    const size = GRID.tileSize;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, size - 4, size - 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(size / 2 - 4, 0, 8, -16);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  generateWallTexture() {
    const size = GRID.tileSize;
    const g = this.add.graphics();
    g.fillStyle(0x888888, 1);
    g.fillRect(0, 0, size - 4, size - 4);
    g.lineStyle(2, 0xaaaaaa, 1);
    g.strokeRect(4, 4, size - 12, size - 12);
    g.generateTexture('turret-wall', size, size);
    g.destroy();
  }

  generateCoreTexture() {
    const size = GRID.tileSize;
    const g = this.add.graphics();
    g.fillStyle(0xff8800, 1);
    g.fillRect(0, 0, size - 4, size - 4);
    g.fillStyle(0xffcc00, 1);
    g.fillRect(12, 12, size - 28, size - 28);
    g.generateTexture('core', size, size);
    g.destroy();
  }

  generateBugTexture(key, diameter, color) {
    const g = this.add.graphics();
    const r = diameter / 2;
    g.fillStyle(color, 1);
    g.fillCircle(r, r, r - 2);
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(r - 6, r - 6, 4);
    g.fillCircle(r + 6, r - 6, 4);
    g.generateTexture(key, diameter, diameter);
    g.destroy();
  }

  generateBulletTexture(key, diameter, color) {
    const g = this.add.graphics();
    const r = diameter / 2;
    g.fillStyle(color, 1);
    g.fillCircle(r, r, r);
    g.generateTexture(key, diameter, diameter);
    g.destroy();
  }

  generateTileTexture() {
    const size = GRID.tileSize;
    const g = this.add.graphics();
    g.lineStyle(1, 0x334455, 0.6);
    g.strokeRect(0, 0, size, size);
    g.generateTexture('tile', size, size);
    g.destroy();
  }
}
