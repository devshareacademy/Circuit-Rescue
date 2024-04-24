/**
 * A custom Phaser 3 Scene that is responsible for loading any assets that we
 * will show during the PreLoad Scene. These assets act as a loading page while
 * we load in the rest of the assets for the game. This is so if downloading
 * the assets takes a long time, the player won't just be looking at a black screen.
 */

import { IMAGE_ASSET_KEYS } from '../assets/asset-keys';
import { SceneKeys } from './scene-keys';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.BootScene });
  }

  public preload(): void {
    this.load.image(IMAGE_ASSET_KEYS.PHASER_LOGO, 'assets/images/phaser-logo.png');
  }

  public create(): void {
    this.scene.start(SceneKeys.PreloadScene);
  }
}
