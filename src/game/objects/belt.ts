/**
 * Creates a conveyor belt in the game, which can be controlled by one of the button panels.
 * A belt in the game will have a max power of 3, and the more power that is supplied to the
 * belt will result in the belt going faster. When a NPC runs on the belt, they will be
 * slowed down.
 */

import { SPRITE_SHEET_ASSET_KEYS } from '../assets/asset-keys';
import { TILE_SIZE } from '../config';
import GameScene from '../scenes/game-scene';
import { ANIMATION_KEY } from '../schema/data-schema';
import { ButtonPoweredObject } from './button-powered-object';

/**
 * Represents how fast a belt will move, and affect the NPCs speed.
 * These levels correlate to the amount of energy a belt has.
 */
const BELT_STATE = {
  OFF: 'OFF',
  SLOW: 'SLOW',
  MED: 'MED',
  FAST: 'FAST',
} as const;
type BeltState = keyof typeof BELT_STATE;

type BeltConfig = {
  scene: GameScene;
  x: number;
  y: number;
  width: number;
  id: number;
};

export class Belt implements ButtonPoweredObject {
  #scene: GameScene;
  #width: number;
  #beltSpriteContainer: Phaser.GameObjects.Container;
  #startSprite!: Phaser.GameObjects.Sprite;
  #midSprite!: Phaser.GameObjects.Sprite;
  #midTileSprite!: Phaser.GameObjects.TileSprite;
  #endSprite!: Phaser.GameObjects.Sprite;
  #id: number;
  #beltState: BeltState;
  #surfaceSpeed: Phaser.Math.Vector2;

  constructor(config: BeltConfig) {
    this.#id = config.id;
    this.#width = config.width;
    this.#scene = config.scene;
    this.#beltState = BELT_STATE.OFF;
    this.#surfaceSpeed = new Phaser.Math.Vector2(0, 0);
    this.#beltSpriteContainer = config.scene.add.container(config.x + TILE_SIZE / 2, config.y, []);
    this.#createSprites();
    this.#beltSpriteContainer.setSize(this.#width, TILE_SIZE);
    this.#scene.physics.world.enable(this.#beltSpriteContainer);

    const offsetX =
      (config.x + this.#width - (this.#beltSpriteContainer.body as Phaser.Physics.Arcade.Body).center.x - 16) / 2;

    (this.#beltSpriteContainer.body as Phaser.Physics.Arcade.Body)
      .setOffset(offsetX, -2)
      .setImmovable(true)
      .setAllowGravity(false);
  }

  /**
   * The Phaser Container that contains the game objects that make up the Belt.
   * @type {Phaser.GameObjects.Container}
   */
  get spriteContainer(): Phaser.GameObjects.Container {
    return this.#beltSpriteContainer;
  }

  /**
   * The unique id for this belt instance.
   * @type {number}
   */
  get id(): number {
    return this.#id;
  }

  /**
   * Represents how fast the belt is moving, which will be applied to the game
   * object that is on the belt.
   * @type {Phaser.Math.Vector2}
   */
  get speed(): Phaser.Math.Vector2 {
    return this.#surfaceSpeed;
  }

  /**
   * Sets the initial power level for this object. Called when a button instance for this object is created.
   * @param {number} powerLevel the amount of power the connected button has, will be between 0 - 3
   * @returns {void}
   */
  public setInitialPowerLevel(powerLevel: number): void {
    if (powerLevel === 0) {
      this.#beltState = BELT_STATE.OFF;
    } else if (powerLevel === 1) {
      this.#beltState = BELT_STATE.SLOW;
    } else if (powerLevel === 2) {
      this.#beltState = BELT_STATE.MED;
    } else {
      this.#beltState = BELT_STATE.FAST;
    }
    this.#setTextures();
  }

  /**
   * Updates the current power level for this object.
   * @param {number} powerLevel the amount of power the connected button has, will be between 0 - 3
   * @returns {void}
   */
  public powerLevelChanged(powerLevel: number): void {
    if (powerLevel === 0) {
      this.#beltState = BELT_STATE.OFF;
    } else if (powerLevel === 1) {
      this.#beltState = BELT_STATE.SLOW;
    } else if (powerLevel === 2) {
      this.#beltState = BELT_STATE.MED;
    } else {
      this.#beltState = BELT_STATE.FAST;
    }
    this.#setTextures();
  }

  /**
   * Called each update tick of the game loop.
   * @returns {void}
   */
  public update(): void {
    this.#midTileSprite.setFrame(this.#midSprite.frame.name);
  }

  /**
   * Creates the Phaser game objects that are associated with this Belt instance.
   * @returns {void}
   */
  #createSprites(): void {
    this.#startSprite = this.#scene.add.sprite(0, 0, SPRITE_SHEET_ASSET_KEYS.BELT_START, 0);
    // calculate mid belt width size by taking total width and subtracting the size of the start and end pieces
    const midSpriteWidth = this.#width - TILE_SIZE * 2;
    this.#midSprite = this.#scene.add.sprite(TILE_SIZE, 0, SPRITE_SHEET_ASSET_KEYS.BELT_MID, 0).setVisible(false);
    this.#midTileSprite = this.#scene.add
      .tileSprite(TILE_SIZE / 2, 0, midSpriteWidth, TILE_SIZE, SPRITE_SHEET_ASSET_KEYS.BELT_MID, 0)
      .setOrigin(0, 0.5);
    this.#endSprite = this.#scene.add.sprite(this.#width - TILE_SIZE, 0, SPRITE_SHEET_ASSET_KEYS.BELT_END, 0);
    this.#beltSpriteContainer.add([this.#startSprite, this.#midSprite, this.#midTileSprite, this.#endSprite]);
  }

  /**
   * Updates the textures and animations that are currently being
   * used for the belt game objects. These will be based on the current state
   * of the game object.
   * @returns {void}
   */
  #setTextures(): void {
    if (this.#beltState === BELT_STATE.OFF) {
      this.#startSprite.anims.stop();
      this.#midSprite.anims.stop();
      this.#endSprite.anims.stop();
      this.#surfaceSpeed.set(0);
      return;
    }
    let animationSpeed = 20;
    this.#surfaceSpeed.set(-1.5, 0);
    if (this.#beltState === BELT_STATE.SLOW) {
      animationSpeed = 8;
      this.#surfaceSpeed.set(-0.9, 0);
    } else if (this.#beltState === BELT_STATE.MED) {
      animationSpeed = 12;
      this.#surfaceSpeed.set(-1.2, 0);
    }

    this.#startSprite.playReverse({
      key: ANIMATION_KEY.BELT_START,
      frameRate: animationSpeed,
    });
    this.#midSprite.playReverse({
      key: ANIMATION_KEY.BELT_MID,
      frameRate: animationSpeed,
    });
    this.#endSprite.playReverse({
      key: ANIMATION_KEY.BELT_END,
      frameRate: animationSpeed,
    });
  }
}
