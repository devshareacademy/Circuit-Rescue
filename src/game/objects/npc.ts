/**
 * Creates a NPC instance in the game. A npc represents represents one of the individuals
 * that needs to be saved in the game. In order to save a npc, the player needs to guide
 * them to the exit of the level. In order to guid the npc, the player will need to communicate
 * with the npc through one of the speakers in the level.
 */

import { ANIMATION_KEY } from '../schema/data-schema';
import { AUDIO_ASSET_KEYS, SPRITE_SHEET_ASSET_KEYS } from '../assets/asset-keys';
import GameScene from '../scenes/game-scene';
import { Speaker } from './speaker';
import { explode, fadeOut, flash, shake } from '../utils/juice-utils';
import { playSoundFx } from '../utils/sound-utils';

/**
 * Represents the current direction the npc is headed towards.
 */
const DIRECTION = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
} as const;
type Direction = keyof typeof DIRECTION;

/**
 * Represents the state of the npc.
 */
const NPC_STATE = {
  IDLE: 'IDLE',
  WALKING: 'WALKING',
} as const;
type NpcState = keyof typeof NPC_STATE;

const NPC_VELOCITY = 80;

type NpcConfig = {
  scene: GameScene;
  x: number;
  y: number;
  speakers: Speaker[];
};

export class NPC {
  #scene: GameScene;
  #sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  #state: NpcState;
  #direction: Direction;
  #hasEnteredExit: boolean;
  #hasDied: boolean;
  #hasLeftScene: boolean;
  #colliders: Phaser.Physics.Arcade.Collider[];
  #speakers: Speaker[];
  #targetPosition: number | undefined;
  #waitForNpcToReachTargetPositionCallback: (() => void) | undefined;
  #inTutorial: boolean;
  #isEnteringLevel: boolean;
  #justCollidedWithWall: boolean;

  constructor(config: NpcConfig) {
    this.#scene = config.scene;
    this.#sprite = config.scene.physics.add
      .sprite(config.x, config.y, SPRITE_SHEET_ASSET_KEYS.NPC_1_IDLE, 0)
      .setOrigin(0, 1)
      .setInteractive();
    (this.#sprite.body as Phaser.Physics.Arcade.Body).setSize(20, 30, true).setOffset(5, 18).setAllowGravity(true);
    this.#state = NPC_STATE.IDLE;
    this.#sprite.play(ANIMATION_KEY.NPC_1_IDLE);
    this.#direction = DIRECTION.RIGHT;
    this.#hasEnteredExit = false;
    this.#hasLeftScene = false;
    this.#hasDied = false;
    this.#colliders = [];
    this.#speakers = config.speakers;
    this.#inTutorial = false;
    this.#isEnteringLevel = false;
    this.#justCollidedWithWall = false;

    this.#sprite.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.handlePlayerClick(true);
    });
  }

  /**
   * The Phaser Game Object that represents this game object.
   * @type {Phaser.Types.Physics.Arcade.SpriteWithDynamicBody}
   */
  get sprite(): Phaser.Types.Physics.Arcade.SpriteWithDynamicBody {
    return this.#sprite;
  }

  /**
   * Indicates if the npc has reached the goal of the current level.
   * @type {boolean}
   */
  get hasExitedLevel(): boolean {
    return this.#hasLeftScene;
  }

  /**
   * Mark the object as being used in the tutorial so the regular functionality is disabled.
   * @type {boolean}
   */
  set inTutorial(val: boolean) {
    this.#inTutorial = val;
  }

  /**
   * Called each update tick of the game loop.
   * @returns {void}
   */
  public update(): void {
    if (
      this.#waitForNpcToReachTargetPositionCallback !== undefined &&
      this.#targetPosition !== undefined &&
      this.#sprite.x >= this.#targetPosition
    ) {
      this.#waitForNpcToReachTargetPositionCallback();
      return;
    }
    if (this.#state === NPC_STATE.IDLE) {
      return;
    }
    if (this.#hasLeftScene) {
      return;
    }
    if (this.#hasDied) {
      return;
    }
    if (this.#sprite.x >= this.#scene.cameras.main.worldView.width) {
      this.#sprite.destroy();
      this.#hasLeftScene = true;
      this.#scene.npcHasLeftScene();
    }
  }

  /**
   * Adds a new collider that is attached to this npc and another object in the Phaser Scene.
   * These colliders are tracked by the npc so we can disable them when the npc reaches the end
   * of the level, or when the npc dies.
   * @param {Phaser.Physics.Arcade.Collider} collider the collider to keep track of
   * @returns {void}
   */
  public addCollider(collider: Phaser.Physics.Arcade.Collider): void {
    this.#colliders.push(collider);
  }

  /**
   * This is called from the game scene when Phaser detects that this npc instance
   * has collided with one of the wall game objects in the game. When this happens,
   * we turn the npc around and have that npc move in the other direction.
   * @returns {void}
   */
  public collidedWithWall(): void {
    if (this.#isEnteringLevel) {
      return;
    }
    if (this.#justCollidedWithWall) {
      return;
    }

    this.#justCollidedWithWall = true;
    if (this.#direction === DIRECTION.LEFT) {
      this.#moveRight();
    } else {
      this.#moveLeft();
    }

    this.#scene.time.delayedCall(100, () => {
      this.#justCollidedWithWall = false;
    });
  }

  /**
   * This is called from the game scene when Phaser detects that this npc instance
   * has collided with one of the bridge wall game objects in the game. When this happens,
   * we stop the npc movement and have that npc wait until the player interacts with the
   * npc again.
   * @returns {void}
   */
  public collideWithBridgeWall(): void {
    if (this.#justCollidedWithWall) {
      return;
    }
    this.#justCollidedWithWall = true;
    this.handlePlayerClick(false);

    this.#scene.time.delayedCall(1000, () => {
      this.#justCollidedWithWall = false;
    });
  }

  /**
   * This is called from the game scene when Phaser detects that this npc instance
   * has collided with the exit game object in the game scene. When this happens,
   * we disable all of the colliders between this npc and the other objects in the scene.
   * @returns {void}
   */
  public hasEnteredExit(): void {
    if (this.#hasEnteredExit) {
      return;
    }
    this.#hasEnteredExit = true;
    this.#sprite.removeInteractive();
    (this.#sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.#colliders.forEach((collider) => {
      collider.destroy();
    });
  }

  /**
   * This is called from the game scene when Phaser detects that this npc instance
   * has collided with the belt game object in the game scene. When this happens,
   * we update npcs body position in order to slow the npc down based on how fast
   * the belt is moving.
   * @param {Phaser.Math.Vector2} speed the speed of the belt object the npc is on
   * @returns {void}
   */
  public isOnBelt(speed: Phaser.Math.Vector2): void {
    this.#sprite.body.position.add(speed);
  }

  /**
   * This is called from the game scene when Phaser detects that this npc instance
   * has collided with the smasher game object in the game scene. When this happens,
   * we update trigger the game over state in the game scene and play the npc death
   * animation.
   * @returns {void}
   */
  public died(): void {
    if (this.#hasDied) {
      return;
    }
    this.#hasDied = true;
    this.#sprite.removeInteractive();
    this.#colliders.forEach((collider) => {
      collider.destroy();
    });
    this.#sprite.setVelocityX(0);
    this.#sprite.anims.stop();
    // shake and emitter
    shake(this.#scene, this.#sprite);
    flash(this.#scene, this.#sprite);
    this.#scene.time.delayedCall(500, () => {
      fadeOut(this.#scene, this.#sprite);
      explode(this.#scene, this.#sprite, () => {
        this.#scene.triggerGameOver();
      });
      playSoundFx(this.#scene, AUDIO_ASSET_KEYS.EXPLOSION);
    });
  }

  /**
   * Used for moving the npc to a targe position. This is used as part of the
   * tutorial flow for moving the npc around automatically.
   * @param {number} x the x position to move the npc game object to
   * @returns {Promise<void>}
   */
  public async moveToPosition(x: number): Promise<void> {
    return new Promise((resolve) => {
      this.#targetPosition = x;
      this.#waitForNpcToReachTargetPositionCallback = () => {
        this.#waitForNpcToReachTargetPositionCallback = undefined;
        this.#targetPosition = undefined;
        this.#switchStates();
        resolve();
      };
      this.#switchStates();
      this.#sprite.setVelocityX(20);
    });
  }

  /**
   * Used for moving the npc to a targe position when a level starts. This is called
   * from the game scene when we play the npc entering level animation.
   * @returns {Promise<void>}
   */
  public async playEnterLevel(): Promise<void> {
    return new Promise((resolve) => {
      this.#isEnteringLevel = true;
      (this.#sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.#sprite.setVelocityX(0);
      this.#sprite.play(ANIMATION_KEY.NPC_1_WALK);
      const originalX = this.#sprite.x;
      this.#sprite.setX(-30);
      this.#scene.tweens.add({
        targets: this.#sprite,
        x: originalX,
        duration: 1200,
        onComplete: () => {
          (this.#sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
          this.#sprite.play(ANIMATION_KEY.NPC_1_IDLE);
          this.#isEnteringLevel = false;
          resolve();
        },
      });
    });
  }

  /**
   * Handles player input. When this object is clicked on, we check to see if the npc
   * is within range of one of the speakers in the level. If the npc is within range,
   * then we update the state of the npc to be the next state for the npc,
   * walking -> idle, or idle -> walking
   * @returns {void}
   */
  public handlePlayerClick(playerClick: boolean): void {
    if (this.#inTutorial) {
      return;
    }

    const npcBodyRect: Phaser.Geom.Rectangle = new Phaser.Geom.Rectangle(0, 0, 0, 0);
    this.#sprite.body.getBounds(npcBodyRect);

    const isOverlapWithSpeaker = this.#speakers.some((speaker) => {
      const speakerBody = speaker.speakerRange.body as Phaser.Physics.Arcade.Body;

      const speakerBodyBounds: Phaser.Geom.Circle = new Phaser.Geom.Circle(
        speakerBody.x,
        speakerBody.y,
        speakerBody.halfWidth,
      );
      speakerBody.getBounds(speakerBodyBounds);
      return Phaser.Geom.Intersects.CircleToRectangle(speakerBodyBounds, npcBodyRect);
    });
    if (isOverlapWithSpeaker || !playerClick) {
      this.#switchStates();
    }
  }

  /**
   * Responsible for updating the npc state, and updating the Phaser Game Objects texture and
   * animation to match the state that is switched to for this npc instance.
   * @returns {void}
   */
  #switchStates(): void {
    if (this.#state === NPC_STATE.IDLE) {
      this.#state = NPC_STATE.WALKING;
      this.#sprite.play(ANIMATION_KEY.NPC_1_WALK);
      if (this.#direction === DIRECTION.RIGHT) {
        this.#moveRight();
      } else {
        this.#moveLeft();
      }
      return;
    }

    this.#state = NPC_STATE.IDLE;
    this.#sprite.play(ANIMATION_KEY.NPC_1_IDLE);
    this.#sprite.setVelocityX(0);
  }

  /**
   * Updates this npc instance to head right in the game scene.
   * @returns {void}
   */
  #moveRight(): void {
    if (this.#direction !== DIRECTION.RIGHT) {
      this.#direction = DIRECTION.RIGHT;
      this.#sprite.setX(this.#sprite.x + 22);
    } else {
      this.#sprite.setX(this.#sprite.x - 5);
    }
    this.#sprite.setVelocityX(NPC_VELOCITY);
    this.#sprite.setFlipX(false);
    this.#sprite.body.setOffset(5, 18);
  }

  /**
   * Updates this npc instance to head left in the game scene.
   * @returns {void}
   */
  #moveLeft(): void {
    if (this.#direction !== DIRECTION.LEFT) {
      this.#direction = DIRECTION.LEFT;
      this.#sprite.setX(this.#sprite.x - 22);
    } else {
      this.#sprite.setX(this.#sprite.x + 5);
    }
    this.#sprite.setVelocityX(NPC_VELOCITY * -1);
    this.#sprite.setFlipX(true);
    this.#sprite.body.setOffset(22, 18);
  }
}
