import { ECONOMY } from '../config/GameConfig.js';

export class EconomyManager {
  constructor(scene) {
    this.scene = scene;
    this.credits = ECONOMY.startingCredits;
  }

  getCredits() {
    return this.credits;
  }

  canAfford(cost) {
    return this.credits >= cost;
  }

  spend(cost) {
    if (!this.canAfford(cost)) return false;
    this.credits -= cost;
    this.scene.events.emit('credits-changed', { credits: this.credits });
    return true;
  }

  earn(amount) {
    this.credits += amount;
    this.scene.events.emit('credits-changed', { credits: this.credits });
  }

  sellRefund(baseCost) {
    const refund = Math.floor(baseCost * ECONOMY.sellReturnRate);
    this.earn(refund);
    return refund;
  }

  awardWaveBonus(waveNumber) {
    const bonus = ECONOMY.waveBonusBase + waveNumber * ECONOMY.waveBonusPerWave;
    this.earn(bonus);
    return bonus;
  }

  reset() {
    this.credits = ECONOMY.startingCredits;
    this.scene.events.emit('credits-changed', { credits: this.credits });
  }
}
