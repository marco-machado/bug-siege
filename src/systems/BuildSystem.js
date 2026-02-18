import { TURRETS, GAME } from '../config/GameConfig.js';
import { Turret } from '../entities/Turret.js';

const BUILD_OPTIONS = [
  { type: 'blaster', label: 'Blaster', desc: 'Single target, 2 shots/sec' },
  { type: 'zapper', label: 'Zapper', desc: 'Chain lightning, hits 3' },
  { type: 'slowfield', label: 'Slowfield', desc: 'Slows bugs 50%' },
  { type: 'wall', label: 'Wall Block', desc: 'Blocks path, 100 HP' },
];

const UPGRADE_DESC = {
  blaster: 'Damage 10→20',
  zapper: 'Damage 15→30',
  slowfield: 'Range +0.5 tiles',
  wall: 'HP 100→200',
};

export class BuildSystem {
  constructor(scene) {
    this.scene = scene;
    this.menuContainer = null;
    this.turretMenuContainer = null;
    this.selectedTile = null;
    this.hoverHighlight = null;
    this.lastHoverCol = -1;
    this.lastHoverRow = -1;
  }

  setup() {
    this.scene.input.on('pointerdown', (pointer, currentlyOver) => {
      if (this.scene.phase !== 'build' && this.scene.phase !== 'wave') return;
      if (currentlyOver.length > 0) return;
      this.handleClick(pointer);
    });

    this.scene.input.on('pointermove', (pointer) => {
      this.handleHover(pointer);
    });
  }

  handleClick(pointer) {
    const { col, row } = this.scene.grid.worldToGrid(pointer.worldX, pointer.worldY);

    if (!this.scene.grid.isInBounds(col, row)) {
      this.closeMenus();
      return;
    }

    if (this.scene.phase === 'wave') {
      const turret = this.scene.turrets.find(t => t.gridCol === col && t.gridRow === row);
      if (turret) turret.showRange();
      return;
    }

    const cell = this.scene.grid.getCell(col, row);

    if (cell === 'empty') {
      this.closeMenus();
      this.openBuildMenu(col, row);
    } else if (cell === 'turret' || cell === 'wall') {
      this.closeMenus();
      this.openTurretMenu(col, row);
    } else {
      this.closeMenus();
    }
  }

  clampMenuPosition(worldX, worldY, menuWidth, menuHeight) {
    const W = GAME.canvasWidth;
    const H = GAME.canvasHeight;
    let x = worldX + 80;
    let y = worldY - menuHeight / 2;

    if (x + menuWidth > W - 20) {
      x = worldX - 80 - menuWidth;
    }
    if (y < 20) {
      y = 20;
    }
    if (y + menuHeight > H - 20) {
      y = H - 20 - menuHeight;
    }

    return { x, y };
  }

  openBuildMenu(col, row) {
    this.selectedTile = { col, row };
    const world = this.scene.grid.gridToWorld(col, row);

    const currentCredits = this.scene.economy.getCredits();
    const headerHeight = 40;
    const lineHeight = 72;
    const menuWidth = 380;
    const menuHeight = headerHeight + BUILD_OPTIONS.length * lineHeight + 20;

    const pos = this.clampMenuPosition(world.x, world.y, menuWidth, menuHeight);
    this.menuContainer = this.scene.add.container(pos.x, pos.y);

    const bg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, 0x111122, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x4488aa);
    this.menuContainer.add(bg);

    const creditsHeader = this.scene.add.text(16, 8, `Credits: $${currentCredits}`, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    });
    this.menuContainer.add(creditsHeader);

    BUILD_OPTIONS.forEach((opt, i) => {
      const conf = TURRETS[opt.type];
      const canAfford = this.scene.economy.canAfford(conf.cost);
      const color = canAfford ? '#ffffff' : '#555555';
      const y = headerHeight + 12 + i * lineHeight;

      const label = this.scene.add.text(16, y, `${opt.label} ($${conf.cost})`, {
        fontSize: '26px',
        fontFamily: 'monospace',
        color,
      }).setInteractive({ useHandCursor: true });

      const desc = this.scene.add.text(16, y + 32, opt.desc, {
        fontSize: '20px',
        fontFamily: 'monospace',
        color: canAfford ? '#88aacc' : '#444444',
      });

      if (canAfford) {
        label.on('pointerover', () => label.setColor('#00ff88'));
        label.on('pointerout', () => label.setColor('#ffffff'));
        label.on('pointerdown', () => this.placeTurret(opt.type));
      } else {
        label.on('pointerdown', () => this.flashDenied(label));
      }

      this.menuContainer.add(label);
      this.menuContainer.add(desc);
    });

    this.menuContainer.setDepth(100);
  }

  placeTurret(type) {
    const { col, row } = this.selectedTile;
    const conf = TURRETS[type];

    if (!this.scene.grid.canPlace(col, row)) {
      this.closeMenus();
      return;
    }

    if (!this.scene.economy.spend(conf.cost)) return;

    const cellState = type === 'wall' ? 'wall' : 'turret';
    this.scene.grid.setCell(col, row, cellState);

    const world = this.scene.grid.gridToWorld(col, row);
    const turret = new Turret(this.scene, col, row, type, world.x, world.y);
    this.scene.turrets.push(turret);

    if (turret.wallBody) {
      this.scene.wallBodies.add(turret.wallBody);
    }

    this.scene.showBuildFlash(world.x, world.y);
    this.closeMenus();
  }

  openTurretMenu(col, row) {
    const turret = this.scene.turrets.find(t => t.gridCol === col && t.gridRow === row);
    if (!turret) return;

    const world = this.scene.grid.gridToWorld(col, row);
    const currentCredits = this.scene.economy.getCredits();

    const items = [];
    if (!turret.upgraded) {
      const upgCost = turret.getUpgradeCost();
      const canUpgrade = this.scene.economy.canAfford(upgCost);
      const upgradeDesc = UPGRADE_DESC[turret.type] || '';
      items.push({
        label: `Upgrade ($${upgCost})`,
        desc: upgradeDesc,
        color: canUpgrade ? '#ffffff' : '#555555',
        enabled: canUpgrade,
        action: (textObj) => {
          if (canUpgrade) {
            if (this.scene.economy.spend(upgCost)) {
              turret.upgrade();
            }
            this.closeMenus();
          } else {
            this.flashDenied(textObj);
          }
        },
      });
    }

    if (turret.hp < turret.maxHp) {
      const repairCost = turret.getRepairCost();
      const canRepair = this.scene.economy.canAfford(repairCost);
      items.push({
        label: `Repair ($${repairCost})`,
        desc: `HP: ${turret.hp}/${turret.maxHp}`,
        color: canRepair ? '#ffffff' : '#555555',
        enabled: canRepair,
        action: (textObj) => {
          if (canRepair) {
            if (this.scene.economy.spend(repairCost)) {
              turret.repair();
            }
            this.closeMenus();
          } else {
            this.flashDenied(textObj);
          }
        },
      });
    }

    const sameTypeDamaged = this.scene.turrets.filter(
      t => t.type === turret.type && t.hp < t.maxHp
    );
    if (sameTypeDamaged.length >= 2) {
      const totalTypeCost = sameTypeDamaged.reduce((sum, t) => sum + t.getRepairCost(), 0);
      const canRepairType = this.scene.economy.canAfford(totalTypeCost);
      const typeLabel = turret.type.charAt(0).toUpperCase() + turret.type.slice(1);
      items.push({
        label: `Repair All ${typeLabel}s ($${totalTypeCost})`,
        desc: `${sameTypeDamaged.length} damaged`,
        color: canRepairType ? '#ffffff' : '#555555',
        enabled: canRepairType,
        action: (textObj) => {
          if (canRepairType) {
            if (this.scene.economy.spend(totalTypeCost)) {
              sameTypeDamaged.forEach(t => t.repair());
            }
            this.closeMenus();
          } else {
            this.flashDenied(textObj);
          }
        },
      });
    }

    const allDamaged = this.scene.turrets.filter(t => t.hp < t.maxHp);
    if (allDamaged.length >= 2 && allDamaged.length !== sameTypeDamaged.length) {
      const totalAllCost = allDamaged.reduce((sum, t) => sum + t.getRepairCost(), 0);
      const canRepairAll = this.scene.economy.canAfford(totalAllCost);
      items.push({
        label: `Repair All ($${totalAllCost})`,
        desc: `${allDamaged.length} damaged`,
        color: canRepairAll ? '#ffffff' : '#555555',
        enabled: canRepairAll,
        action: (textObj) => {
          if (canRepairAll) {
            if (this.scene.economy.spend(totalAllCost)) {
              allDamaged.forEach(t => t.repair());
            }
            this.closeMenus();
          } else {
            this.flashDenied(textObj);
          }
        },
      });
    }

    items.push({
      label: `Sell ($${turret.getSellValue()})`,
      desc: '',
      color: '#ffaa00',
      enabled: true,
      action: () => {
        this.scene.economy.sellRefund(turret.cost);
        turret.destroy();
        this.closeMenus();
      },
    });

    const turretHeaderHeight = 40;
    const lineHeight = 60;
    const menuWidth = 340;
    const menuHeight = turretHeaderHeight + items.length * lineHeight + 20;

    const pos = this.clampMenuPosition(world.x, world.y, menuWidth, menuHeight);
    this.turretMenuContainer = this.scene.add.container(pos.x, pos.y);

    const bg = this.scene.add.rectangle(0, 0, menuWidth, menuHeight, 0x111122, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x4488aa);
    this.turretMenuContainer.add(bg);

    const creditsLabel = this.scene.add.text(16, 8, `Credits: $${currentCredits}`, {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#ffdd00',
    });
    this.turretMenuContainer.add(creditsLabel);

    items.forEach((item, i) => {
      const y = turretHeaderHeight + 12 + i * lineHeight;
      const text = this.scene.add.text(16, y, item.label, {
        fontSize: '26px',
        fontFamily: 'monospace',
        color: item.color,
      }).setInteractive({ useHandCursor: true });

      if (item.desc) {
        const descText = this.scene.add.text(16, y + 30, item.desc, {
          fontSize: '20px',
          fontFamily: 'monospace',
          color: '#88aacc',
        });
        this.turretMenuContainer.add(descText);
      }

      text.on('pointerover', () => text.setColor('#00ff88'));
      text.on('pointerout', () => text.setColor(item.color));
      text.on('pointerdown', () => item.action(text));

      this.turretMenuContainer.add(text);
    });

    this.turretMenuContainer.setDepth(100);
  }

  flashDenied(textObj) {
    const origColor = textObj.style.color;
    textObj.setColor('#ff3333');
    this.scene.time.delayedCall(300, () => {
      if (textObj.active) textObj.setColor(origColor);
    });
  }

  handleHover(pointer) {
    if (this.scene.phase !== 'build' || this.menuContainer || this.turretMenuContainer) {
      this.hideHoverHighlight();
      return;
    }

    const { col, row } = this.scene.grid.worldToGrid(pointer.worldX, pointer.worldY);

    if (!this.scene.grid.isInBounds(col, row)) {
      this.hideHoverHighlight();
      return;
    }

    if (col === this.lastHoverCol && row === this.lastHoverRow) return;

    const cell = this.scene.grid.getCell(col, row);
    if (cell === 'core') {
      this.hideHoverHighlight();
      return;
    }

    const color = cell === 'empty' ? 0x00ff88 : 0x4488aa;
    const tileSize = this.scene.grid.tileSize;
    const world = this.scene.grid.gridToWorld(col, row);

    if (!this.hoverHighlight) {
      this.hoverHighlight = this.scene.add.rectangle(world.x, world.y, tileSize, tileSize, color, 0.3);
    } else {
      this.hoverHighlight.setPosition(world.x, world.y);
      this.hoverHighlight.setFillStyle(color, 0.3);
      this.hoverHighlight.setVisible(true);
    }

    this.lastHoverCol = col;
    this.lastHoverRow = row;
  }

  hideHoverHighlight() {
    if (this.hoverHighlight) {
      this.hoverHighlight.setVisible(false);
    }
    this.lastHoverCol = -1;
    this.lastHoverRow = -1;
  }

  closeMenus() {
    if (this.menuContainer) {
      this.menuContainer.destroy();
      this.menuContainer = null;
    }
    if (this.turretMenuContainer) {
      this.turretMenuContainer.destroy();
      this.turretMenuContainer = null;
    }
    this.selectedTile = null;
    this.hideHoverHighlight();
  }
}
