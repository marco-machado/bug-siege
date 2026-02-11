import Phaser from 'phaser';
import { WAVES, GAME } from '../config/GameConfig.js';

export class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 0;
    this.bugsAlive = 0;
    this.bugsToSpawn = [];
    this.spawnTimer = null;
    this.spawning = false;
  }

  startWave() {
    this.currentWave++;
    if (this.currentWave > GAME.totalWaves) return;

    const waveConf = WAVES[this.currentWave - 1];
    this.bugsToSpawn = [];

    for (let i = 0; i < waveConf.swarmers; i++) this.bugsToSpawn.push('swarmer');
    for (let i = 0; i < waveConf.brutes; i++) this.bugsToSpawn.push('brute');
    for (let i = 0; i < waveConf.spitters; i++) this.bugsToSpawn.push('spitter');
    for (let i = 0; i < waveConf.boss; i++) this.bugsToSpawn.push('boss');

    Phaser.Utils.Array.Shuffle(this.bugsToSpawn);

    this.bugsAlive = 0;
    this.spawning = true;

    this.scene.events.emit('wave-changed', {
      wave: this.currentWave,
      total: GAME.totalWaves,
    });

    this.spawnNext();
  }

  spawnNext() {
    if (this.bugsToSpawn.length === 0) {
      this.spawning = false;
      return;
    }

    const type = this.bugsToSpawn.shift();
    const pos = this.getRandomEdgePosition();
    const corePos = this.scene.grid.getCoreWorldPos();

    const bug = this.scene.bugs.get();
    if (bug) {
      bug.spawn(pos.x, pos.y, type, corePos);
      this.bugsAlive++;
    }

    const delay = 500 + Math.random() * 500;
    this.spawnTimer = this.scene.time.delayedCall(delay, () => this.spawnNext());
  }

  getRandomEdgePosition() {
    const w = GAME.canvasWidth;
    const h = GAME.canvasHeight;
    const margin = 20;
    const edge = Phaser.Math.Between(0, 3);

    switch (edge) {
      case 0: return { x: Phaser.Math.Between(margin, w - margin), y: -margin };
      case 1: return { x: Phaser.Math.Between(margin, w - margin), y: h + margin };
      case 2: return { x: -margin, y: Phaser.Math.Between(margin, h - margin) };
      case 3: return { x: w + margin, y: Phaser.Math.Between(margin, h - margin) };
      default: return { x: -margin, y: h / 2 };
    }
  }

  onBugDied() {
    this.bugsAlive--;
    if (this.bugsAlive <= 0 && !this.spawning) {
      this.scene.onWaveComplete();
    }
  }

  getCurrentWave() {
    return this.currentWave;
  }

  reset() {
    this.currentWave = 0;
    this.bugsAlive = 0;
    this.bugsToSpawn = [];
    this.spawning = false;
    if (this.spawnTimer) {
      this.spawnTimer.remove();
      this.spawnTimer = null;
    }
  }
}
