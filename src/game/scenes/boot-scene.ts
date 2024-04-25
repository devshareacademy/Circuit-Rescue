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

  /**
   * Triggered when the Scenes Preload Lifecycle event is fired. This is responsible for
   * queuing up all of the files that we want the Phaser loader to handle.
   * @returns {void}
   */
  public preload(): void {
    this.load.image(IMAGE_ASSET_KEYS.PHASER_LOGO, 'assets/images/phaser-logo.png');
  }

  /**
   * Triggered when the Scenes Create Lifecycle event is fired. This is responsible for
   * transitioning to the next scene once all of the assets are loaded in the preload method.
   * @returns {void}
   */
  public create(): void {
    this.scene.start(SceneKeys.PreloadScene);
  }
}
