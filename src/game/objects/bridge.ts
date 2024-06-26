/**
 * Creates a Bridge instance in the game. A bridge, or elevator, can be a powered
 * object that moves in the game. The bridge object is setup to have a max power
 * amount or 1, so the object can only be moving or non-moving.
 */

import { IMAGE_ASSET_KEYS, SPRITE_SHEET_ASSET_KEYS } from '../assets/asset-keys';
import GameScene from '../scenes/game-scene';
import { ButtonPoweredObject } from './button-powered-object';
import { TILE_SIZE } from '../config';

type BridgeConfig = {
  scene: GameScene;
  x: number;
  y: number;
  id: number;
  stops: number[];
  width: number;
  height: number;
};

/**
 * Represents the various states that the bridge can be in. The safe
 * states are meant to represent when it is safe for the player to be
 * able to move onto the game object.
 */
const BRIDGE_STATE = {
  ON: 'ON',
  ON_SAFE: 'ON_SAFE',
  OFF_SAFE: 'OFF_SAFE',
  OFF: 'OFF',
} as const;
type BridgeState = keyof typeof BRIDGE_STATE;

const BRIDGE_DIRECTION = {
  UP: 'UP',
  DOWN: 'DOWN',
} as const;
type BridgeDirection = keyof typeof BRIDGE_DIRECTION;

export class Bridge implements ButtonPoweredObject {
  #scene: GameScene;
  #spriteContainer: Phaser.GameObjects.Container;
  #id: number;
  #bridgeState: BridgeState;
  #x: number;
  #y: number;
  #width: number;
  #height: number;
  #stops: number[];
  #currentStopIndex: number;
  #bridgeDirection: BridgeDirection;
  #bridgeMovementTween: Phaser.Tweens.Tween | undefined;
  #powerLevel: number;

  constructor(config: BridgeConfig) {
    this.#id = config.id;
    this.#scene = config.scene;
    this.#bridgeState = BRIDGE_STATE.OFF;
    this.#x = config.x;
    this.#y = config.y;
    this.#width = config.width;
    this.#height = config.height;
    this.#stops = config.stops;
    this.#currentStopIndex = 0;
    this.#powerLevel = 0;
    this.#bridgeDirection = BRIDGE_DIRECTION.UP;
    this.#spriteContainer = this.#scene.add.container(config.x, this.#stops[0], []).setDepth(2);
    this.#createBridgeSprites();
    this.#spriteContainer.setSize(this.#width, this.#height);
    this.#scene.physics.world.enable(this.#spriteContainer);
    const offsetX = (config.x + this.#width - (this.#spriteContainer.body as Phaser.Physics.Arcade.Body).center.x) / 2;
    (this.#spriteContainer.body as Phaser.Physics.Arcade.Body)
      .setOffset(offsetX, TILE_SIZE * 2.5)
      .setImmovable(true)
      .setAllowGravity(false);
  }

  /**
   * The unique id for this object instance.
   * @type {number}
   */
  get id(): number {
    return this.#id;
  }

  /**
   * The Phaser Container that contains the game objects that make up the bridge.
   * @type {Phaser.GameObjects.Container}
   */
  get bridgeContainer(): Phaser.GameObjects.Container {
    return this.#spriteContainer;
  }

  /**
   * Sets the initial power level for this object. Called when a button instance for this object is created.
   * @param {number} powerLevel the amount of power the connected button has, will be between 0 - 3
   * @returns {void}
   */
  public setInitialPowerLevel(powerLevel: number): void {
    this.#powerLevel = powerLevel;
    if (powerLevel === 0) {
      this.#bridgeState === BRIDGE_STATE.OFF;
      return;
    }
    this.#bridgeState = BRIDGE_STATE.ON;
    this.#handleBridgeMovement();
  }

  /**
   * Updates the current power level for this object.
   * @param {number} powerLevel the amount of power the connected button has, will be between 0 - 3
   * @returns {void}
   */
  public powerLevelChanged(powerLevel: number): void {
    this.#powerLevel = powerLevel;
    if (powerLevel === 0) {
      this.#bridgeState === BRIDGE_STATE.OFF;
      return;
    }
    this.#bridgeState = BRIDGE_STATE.ON;
    this.#handleBridgeMovement();
  }

  /**
   * Creates the Phaser game objects that are associated with this Bridge instance.
   * @returns {void}
   */
  #createBridgeSprites(): void {
    const leftBridgeRail = this.#scene.add.sprite(8, -1 * TILE_SIZE, SPRITE_SHEET_ASSET_KEYS.FENCE, 0).setOrigin(0, 1);
    const midBridgeRail = this.#scene.add
      .tileSprite(
        TILE_SIZE + 8,
        TILE_SIZE * -1,
        this.#width - TILE_SIZE * 2,
        TILE_SIZE,
        SPRITE_SHEET_ASSET_KEYS.FENCE,
        1,
      )
      .setOrigin(0, 1);

    const rightBridgeRail = this.#scene.add
      .sprite(this.#width - TILE_SIZE + 8, -TILE_SIZE, SPRITE_SHEET_ASSET_KEYS.FENCE, 2)
      .setOrigin(0, 1);

    const mainBridgeSprite = this.#scene.add
      .tileSprite(0, 0, this.#width, TILE_SIZE, IMAGE_ASSET_KEYS.BRIDGE_TILE, 0)
      .setOrigin(0, 1);
    const leftLegSprite = this.#scene.add
      .tileSprite(0, 0, TILE_SIZE, this.#height - TILE_SIZE * 2, IMAGE_ASSET_KEYS.BRIDGE_SUPPORT, 0)
      .setOrigin(0);
    const rightLegSprite = this.#scene.add
      .tileSprite(
        this.#width - TILE_SIZE,
        0,
        TILE_SIZE,
        this.#height - TILE_SIZE * 2,
        IMAGE_ASSET_KEYS.BRIDGE_SUPPORT,
        0,
      )
      .setOrigin(0);

    this.#scene.add
      .sprite(this.#x, this.#height + TILE_SIZE, IMAGE_ASSET_KEYS.BRIDGE_BASE, 0)
      .setOrigin(0)
      .setDepth(3);
    this.#scene.add
      .sprite(this.#x + this.#width - TILE_SIZE, this.#height + TILE_SIZE, IMAGE_ASSET_KEYS.BRIDGE_BASE, 0)
      .setOrigin(0)
      .setDepth(3);

    this.#spriteContainer.add([
      leftBridgeRail,
      midBridgeRail,
      rightBridgeRail,
      mainBridgeSprite,
      leftLegSprite,
      rightLegSprite,
    ]);
  }

  /**
   * Contains all of the logic for handling the bridge movement. This method will check the state
   * of the bridge, and then determine the next stop that the bridge should move to if the bridge
   * is currently in the state for moving. The bridge will then be moved using a Phaser Tween.
   * @returns {void}
   */
  #handleBridgeMovement(): void {
    if (this.#powerLevel === 0) {
      this.#bridgeState = BRIDGE_STATE.OFF;
    }
    if (this.#bridgeState === BRIDGE_STATE.OFF || this.#bridgeState === BRIDGE_STATE.OFF_SAFE) {
      return;
    }

    // calculate targetY based on next stop by using current stop index
    let nextStopIndex = this.#currentStopIndex;
    if (this.#bridgeDirection === BRIDGE_DIRECTION.UP) {
      nextStopIndex += 1;
      if (nextStopIndex > this.#stops.length - 1) {
        this.#bridgeDirection = BRIDGE_DIRECTION.DOWN;
        nextStopIndex = this.#currentStopIndex - 1;
      }
    } else {
      nextStopIndex -= 1;
      if (nextStopIndex < 0) {
        this.#bridgeDirection = BRIDGE_DIRECTION.UP;
        nextStopIndex = this.#currentStopIndex + 1;
      }
    }

    // calculate duration based on distance we need to travel, 500 per 32
    const duration = (Math.abs(this.#stops[nextStopIndex] - this.#spriteContainer.y) / 32) * 500;
    if (this.#bridgeMovementTween !== undefined && !this.#bridgeMovementTween.isDestroyed()) {
      this.#bridgeMovementTween.destroy();
    }

    this.#bridgeMovementTween = this.#scene.tweens.add({
      targets: this.#spriteContainer,
      y: this.#stops[nextStopIndex],
      duration: duration,
      delay: 750,
      onComplete: () => {
        this.#bridgeState = BRIDGE_STATE.ON_SAFE;
        this.#currentStopIndex = nextStopIndex;
        // have small delay, and then move bridge again
        this.#scene.time.delayedCall(1500, () => {
          if (this.#bridgeState === BRIDGE_STATE.OFF || this.#bridgeState === BRIDGE_STATE.OFF_SAFE) {
            return;
          }
          this.#bridgeState = BRIDGE_STATE.ON;
          this.#handleBridgeMovement();
        });
      },
    });
  }
}
