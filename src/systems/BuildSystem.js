import { TURRETS } from '../config/GameConfig.js';
import { Turret } from '../entities/Turret.js';

const BUILD_OPTIONS = [
  { type: 'blaster', label: 'Blaster', desc: 'Single target, 2 shots/sec' },
  { type: 'zapper', label: 'Zapper', desc: 'Chain lightning, hits 3' },
  { type: 'slowfield', label: 'Slowfield', desc: 'Slows bugs 50%' },
  { type: 'wall', label: 'Wall Block', desc: 'Blocks path, 100 HP' },
];

export class BuildSystem {
  constructor(scene) {
    this.scene = scene;
    this.menuContainer = null;
    this.turretMenuContainer = null;
    this.selectedTile = null;
  }

  setup() {
    this.scene.input.on('pointerdown', (pointer) => {
      if (this.scene.phase !== 'build') return;
      this.handleClick(pointer);
    });
  }

  handleClick(pointer) {
    const { col, row } = this.scene.grid.worldToGrid(pointer.worldX, pointer.worldY);

    if (!this.scene.grid.isInBounds(col, row)) {
      this.closeMenus();
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

  openBuildMenu(col, row) {
    this.selectedTile = { col, row };
    const world = this.scene.grid.gridToWorld(col, row);

    this.menuContainer = this.scene.add.container(world.x + 40, world.y - 60);
    const bg = this.scene.add.rectangle(0, 0, 180, BUILD_OPTIONS.length * 36 + 12, 0x111122, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4488aa);
    this.menuContainer.add(bg);

    BUILD_OPTIONS.forEach((opt, i) => {
      const conf = TURRETS[opt.type];
      const canAfford = this.scene.economy.canAfford(conf.cost);
      const color = canAfford ? '#ffffff' : '#555555';
      const y = 8 + i * 36;

      const text = this.scene.add.text(8, y, `${opt.label} ($${conf.cost})`, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color,
      }).setInteractive({ useHandCursor: canAfford });

      if (canAfford) {
        text.on('pointerover', () => text.setColor('#00ff88'));
        text.on('pointerout', () => text.setColor('#ffffff'));
        text.on('pointerdown', () => this.placeTurret(opt.type));
      }

      this.menuContainer.add(text);
    });

    this.menuContainer.setDepth(100);
  }

  placeTurret(type) {
    const { col, row } = this.selectedTile;
    const conf = TURRETS[type];

    if (!this.scene.economy.spend(conf.cost)) return;

    const cellState = type === 'wall' ? 'wall' : 'turret';
    this.scene.grid.setCell(col, row, cellState);

    const world = this.scene.grid.gridToWorld(col, row);
    const turret = new Turret(this.scene, col, row, type, world.x, world.y);
    this.scene.turrets.push(turret);

    if (turret.wallBody) {
      this.scene.wallBodies.add(turret.wallBody);
    }

    this.closeMenus();
  }

  openTurretMenu(col, row) {
    const turret = this.scene.turrets.find(t => t.gridCol === col && t.gridRow === row);
    if (!turret) return;

    const world = this.scene.grid.gridToWorld(col, row);
    this.turretMenuContainer = this.scene.add.container(world.x + 40, world.y - 30);

    let items = [];
    if (!turret.upgraded) {
      const upgCost = turret.getUpgradeCost();
      const canUpgrade = this.scene.economy.canAfford(upgCost);
      items.push({
        label: `Upgrade ($${upgCost})`,
        color: canUpgrade ? '#ffffff' : '#555555',
        enabled: canUpgrade,
        action: () => {
          if (this.scene.economy.spend(upgCost)) {
            turret.upgrade();
          }
          this.closeMenus();
        },
      });
    }

    items.push({
      label: `Sell ($${turret.getSellValue()})`,
      color: '#ffaa00',
      enabled: true,
      action: () => {
        this.scene.economy.sellRefund(turret.cost);
        turret.destroy();
        this.closeMenus();
      },
    });

    const bg = this.scene.add.rectangle(0, 0, 160, items.length * 32 + 12, 0x111122, 0.95)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0x4488aa);
    this.turretMenuContainer.add(bg);

    items.forEach((item, i) => {
      const y = 8 + i * 32;
      const text = this.scene.add.text(8, y, item.label, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: item.color,
      }).setInteractive({ useHandCursor: item.enabled });

      if (item.enabled) {
        text.on('pointerover', () => text.setColor('#00ff88'));
        text.on('pointerout', () => text.setColor(item.color));
        text.on('pointerdown', () => item.action());
      }

      this.turretMenuContainer.add(text);
    });

    this.turretMenuContainer.setDepth(100);
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
  }
}
