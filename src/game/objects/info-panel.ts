/**
 * Creates an info panel instance in the game. The info panel is used for displaying
 * informational text to the player. Currently, this object is used as part of the
 * tutorial flow in the first level.
 */

import { IMAGE_ASSET_KEYS } from '../assets/asset-keys';

type InfoPanelConfig = {
  scene: Phaser.Scene;
};

export class InfoPanel {
  #scene: Phaser.Scene;
  #container: Phaser.GameObjects.Container;

  constructor(config: InfoPanelConfig) {
    this.#scene = config.scene;
    this.#container = this.#scene.add.container(config.scene.scale.width / 2, config.scene.scale.height / 2);
    const panel = this.#scene.add
      .nineslice(0, 0, IMAGE_ASSET_KEYS.INFO_PANEL, 0, 600, 350, 100, 100, 100, 100)
      .setScale(0.5);
    this.#container.add(panel);
    this.hide();
  }

  /**
   * Shows this game object in the Phaser Scene.
   * @returns {void}
   */
  public show(): void {
    this.#container.setAlpha(1);
  }

  /**
   * Hides this game object in the Phaser Scene.
   * @returns {void}
   */
  public hide(): void {
    this.#container.setAlpha(0);
  }

  /**
   * Replaces all of the Phaser Game Objects in this container with the newly provided objects.
   * @param {Phaser.GameObjects.GameObject[]} gameObjects the new Phaser game objects to add to this container
   * @returns {void}
   */
  public updateContent(gameObjects: Phaser.GameObjects.GameObject[]): void {
    this.#container.removeBetween(1, this.#container.list.length, true);
    this.#container.add(gameObjects);
  }

  /**
   * Returns the text style that should be used for the Phaser Text Game Objects in the info panel.
   * @returns {Phaser.Types.GameObjects.Text.TextStyle}
   */
  public getInfoPanelTextStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      fontFamily: "'Orbitron', sans-serif",
      fontSize: '12px',
      resolution: 12,
      wordWrap: {
        width: 175,
      },
      color: '#ffffff',
    };
  }
}
