/**
 * Creates a Button instance in the game. A button is a mechanism that allows a player
 * to control the amount of energy that currently associated with another game object
 * in the scene (belts, bridges, doors, etc). When a button is clicked, energy will
 * either be transferred to the connected object, or removed depending on if the object
 * was already at max capacity based on the current energy the player has.
 */

import { AUDIO_ASSET_KEYS, SPRITE_SHEET_ASSET_KEYS } from '../assets/asset-keys';
import GameScene from '../scenes/game-scene';
import { playSoundFx } from '../utils/sound-utils';
import { ButtonPoweredObject } from './button-powered-object';

type ButtonConfig = {
  scene: GameScene;
  x: number;
  y: number;
  flipX: boolean;
  startingEnergy: number;
  id: number;
  connectedObject: ButtonPoweredObject;
  maxEnergy: number;
};

export class Button {
  #scene: GameScene;
  #sprite: Phaser.GameObjects.Sprite;
  #energyLevel: number;
  #maxEnergy: number;
  #id: number;
  #connectedObject: ButtonPoweredObject;
  #inTutorial: boolean;

  constructor(config: ButtonConfig) {
    this.#inTutorial = false;
    this.#id = config.id;
    this.#scene = config.scene;
    this.#maxEnergy = config.maxEnergy;
    this.#energyLevel = config.startingEnergy;
    this.#connectedObject = config.connectedObject;
    this.#sprite = config.scene.add
      .sprite(config.x, config.y, SPRITE_SHEET_ASSET_KEYS.BUTTON, 0)
      .setFlipX(config.flipX)
      .setOrigin(0, 1)
      .setInteractive();
    this.#setTexture();

    this.#sprite.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.handlePlayerClick();
    });
    this.#connectedObject.setInitialPowerLevel(this.#energyLevel);
  }

  /**
   * The Phaser Game Object that represents this game object.
   * @type {Phaser.GameObjects.Sprite}
   */
  get sprite(): Phaser.GameObjects.Sprite {
    return this.#sprite;
  }

  /**
   * The current energy level of this object.
   * @type {number}
   */
  get currentEnergy(): number {
    return this.#energyLevel;
  }

  /**
   * Mark the object as being used in the tutorial so the regular functionality is disabled.
   * @type {boolean}
   */
  set inTutorial(val: boolean) {
    this.#inTutorial = val;
  }

  /**
   * Handles player input. When this object is clicked on, we update the energy
   * level based on if the player has energy available, and then we update the
   * associated sprites to match the provided energy level.
   * @returns {void}
   */
  public handlePlayerClick(): void {
    if (this.#inTutorial) {
      return;
    }
    if (this.#scene.currentEnergy === 0 && this.#energyLevel === 0) {
      return;
    }
    // if we are below max energy, and there is available energy, bump usage here
    if (this.#energyLevel < this.#maxEnergy && this.#scene.currentEnergy > 0) {
      this.#energyLevel += 1;
      this.#scene.updateEnergy(-1);
    } else {
      // if we are below or at max, then take energy from here and move to global store
      this.#scene.updateEnergy(this.#energyLevel);
      this.#energyLevel = 0;
    }

    this.#setTexture();
    this.#connectedObject.powerLevelChanged(this.#energyLevel);
    playSoundFx(this.#scene, AUDIO_ASSET_KEYS.SWITCH_BEEP);
  }

  /**
   * Sets the texture for the Phaser Game object.
   * @returns {void}
   */
  #setTexture(): void {
    if (this.#energyLevel === 0) {
      this.#sprite.setFrame(0);
      return;
    }
    if (this.#energyLevel === 1) {
      this.#sprite.setFrame(1);
      if (this.#maxEnergy === 1) {
        this.#sprite.setFrame(4);
      }
      return;
    }
    if (this.#energyLevel === 2) {
      this.#sprite.setFrame(2);
      return;
    }
    this.#sprite.setFrame(3);
  }
}
