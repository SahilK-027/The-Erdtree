import FallingLeavesSystem from './FallingLeavesSystem.class';
import Game from '../../../Game.class';

export default class FallingLeaves {
  constructor() {
    this.game = Game.getInstance();
    const leaf = this.game.resources.items.leafModel;
    const leafGeometry = leaf.scene.children[0].geometry;
    const tree1Bounds = {
      yMin: 15,
      yMax: 30,
      xRange: 2.5,
      zRange: 2.5,
      originX: 8,
      originZ: 0,
    };
    this.fallingLeavesSystem = new FallingLeavesSystem(
      leafGeometry.clone(),
      tree1Bounds,
    );
  }

  update(delta) {
    this.fallingLeavesSystem.update(delta);
  }
}
