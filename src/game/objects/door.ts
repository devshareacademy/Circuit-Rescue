/**
 * Creates a Door instance in the game. A door is a simple object that can be
 * powered by energy in a level. Typically, the exit to the level is protected
 * by a door that needs to be opened with 3 energy. A door can have a max level
 * of 3 energy, and a door will only be fully open when the energy level is
 * set to 3.
 */

import { ANIMATION_KEY } from '../schema/data-schema';
import { AUDIO_ASSET_KEYS, SPRITE_SHEET_ASSET_KEYS } from '../assets/asset-keys';
import GameScene from '../scenes/game-scene';
import { ButtonPoweredObject } from './button-powered-object';
import { playSoundFx } from '../utils/sound-utils';

type DoorConfig = {
  scene: GameScene;
  x: number;
  y: number;
  flipX: boolean;
  id: number;
  isLevelEntrance: boolean;
};

const DOOR_STATE = {
  CLOSED: 'CLOSED',
  PARTIAL1: 'PARTIAL1',
  PARTIAL2: 'PARTIAL2',
  OPEN: 'OPEN',
} as const;
type DoorState = keyof typeof DOOR_STATE;

export class Door implements ButtonPoweredObject {
  #scene: GameScene;
  #sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  #id: number;
  #doorState: DoorState;
  #isLevelEntrance: boolean;

  constructor(config: DoorConfig) {
    this.#id = config.id;
    this.#scene = config.scene;
    this.#isLevelEntrance = config.isLevelEntrance;
    this.#doorState = DOOR_STATE.CLOSED;
    this.#sprite = config.scene.physics.add
      .sprite(config.x, config.y, SPRITE_SHEET_ASSET_KEYS.DOOR, 0)
      .setFlipX(config.flipX)
      .setOrigin(0, 0.5);
    this.#setTexture();
    if (this.#isLevelEntrance) {
      this.#doorState = DOOR_STATE.OPEN;
      this.#setTexture();
      this.#scene.physics.world.once(Phaser.Physics.Arcade.Events.WORLD_STEP, () => {
        this.#sprite.body.enable = true;
      });
    }
  }

  /**
   * The Phaser Game Object that represents this game object.
   * @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}
   */
  get sprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    return this.#sprite;
  }

  /**
   * The unique id for this object instance.
   * @type {number}
   */
  get id(): number {
    return this.#id;
  }

  /**
   * Indicates if this door is a level opening which should be closed after the npc enters.
   * @type {boolean}
   */
  get isLevelEntrance(): boolean {
    return this.#isLevelEntrance;
  }

  /**
   * Updates the door state to be closed, and then plays the closing door animation.
   * @returns {Promise<void>}
   */
  public async closeDoor(): Promise<void> {
    return new Promise((resolve) => {
      this.#doorState = DOOR_STATE.CLOSED;
      this.#sprite.play(ANIMATION_KEY.DOOR_OPEN_TO_CLOSED);
      this.#sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ANIMATION_KEY.DOOR_OPEN_TO_CLOSED, () => {
        resolve();
      });
    });
  }

  /**
   * Sets the initial power level for this object. Called when a button instance for this object is created.
   * @param {number} powerLevel the amount of power the connected button has, will be between 0 - 3
   * @returns {void}
   */
  public setInitialPowerLevel(powerLevel: number): void {
    if (powerLevel === 0) {
      this.#doorState = DOOR_STATE.CLOSED;
    } else if (powerLevel === 1) {
      this.#doorState = DOOR_STATE.PARTIAL1;
      this.#sprite.play(ANIMATION_KEY.DOOR_CLOSED_TO_PARTIAL1_OPEN);
    } else if (powerLevel === 2) {
      this.#doorState = DOOR_STATE.PARTIAL2;
    } else {
      this.#doorState = DOOR_STATE.OPEN;
    }
    this.#setTexture();
  }

  /**
   * Updates the current power level for this object.
   * @param {number} powerLevel the amount of power the connected button has, will be between 0 - 3
   * @returns {void}
   */
  public powerLevelChanged(powerLevel: number): void {
    if (!this.#sprite.body.enable) {
      this.#sprite.body.enable = true;
    }
    const currentState = this.#doorState;
    if (powerLevel === 0) {
      this.#doorState = DOOR_STATE.CLOSED;
      if (currentState === DOOR_STATE.PARTIAL2) {
        this.#sprite.play(ANIMATION_KEY.DOOR_PARTIAL2_OPEN_TO_CLOSED);
        playSoundFx(this.#scene, AUDIO_ASSET_KEYS.DOOR_CLOSE);
        return;
      }
      if (currentState === DOOR_STATE.PARTIAL1) {
        this.#sprite.play(ANIMATION_KEY.DOOR_PARTIAL1_OPEN_TO_CLOSED);
        playSoundFx(this.#scene, AUDIO_ASSET_KEYS.DOOR_CLOSE);
        return;
      }
      this.#sprite.play(ANIMATION_KEY.DOOR_OPEN_TO_CLOSED);
      playSoundFx(this.#scene, AUDIO_ASSET_KEYS.DOOR_CLOSE);
      return;
    }
    if (powerLevel === 1) {
      this.#doorState = DOOR_STATE.PARTIAL1;
      this.#sprite.play(ANIMATION_KEY.DOOR_CLOSED_TO_PARTIAL1_OPEN);
      return;
    }
    if (powerLevel === 2) {
      this.#doorState = DOOR_STATE.PARTIAL2;
      this.#sprite.play(ANIMATION_KEY.DOOR_PARTIAL1_OPEN_TO_PARTIAL2_OPEN);
      return;
    }
    this.#doorState = DOOR_STATE.OPEN;
    this.#sprite.play(ANIMATION_KEY.DOOR_PARTIAL2_OPEN_TO_OPEN);
    this.#sprite.body.enable = false;
    return;
  }

  /**
   * Sets the texture for the Phaser Game object.
   * @returns {void}
   */
  #setTexture(): void {
    if (this.#doorState === DOOR_STATE.CLOSED) {
      this.#sprite.setFrame(0);
      return;
    }
    if (this.#doorState === DOOR_STATE.PARTIAL1) {
      this.#sprite.setFrame(1);
      return;
    }
    if (this.#doorState === DOOR_STATE.PARTIAL2) {
      this.#sprite.setFrame(2);
      return;
    }
    this.#sprite.setFrame(4);
    this.#scene.physics.world.once(Phaser.Physics.Arcade.Events.WORLD_STEP, () => {
      this.#sprite.body.enable = false;
    });
  }
}
