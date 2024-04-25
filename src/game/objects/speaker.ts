/**
 * Creates a Speaker instance in the game. A speaker is an object that can be used
 * for communicating with a npc in the game. A speaker can have a max level of 3 power.
 * The power to the speaker is used to determine the range the speaker can reach, and so
 * the more power has a speaker has, the further the npc can be from the speaker.
 */

import { AUDIO_ASSET_KEYS, IMAGE_ASSET_KEYS, SPRITE_SHEET_ASSET_KEYS } from '../assets/asset-keys';
import GameScene from '../scenes/game-scene';
import { playSoundFx } from '../utils/sound-utils';

type SpeakerConfig = {
  scene: GameScene;
  x: number;
  y: number;
  flipX: boolean;
  startingEnergy: number;
  id: number;
};

export class Speaker {
  #scene: GameScene;
  #sprite: Phaser.GameObjects.Sprite;
  #energyLevel: number;
  #maxEnergy: number;
  #id: number;
  #speakerRange: Phaser.GameObjects.Image;
  #speakerRangeTween: Phaser.Tweens.Tween | undefined;
  #inTutorial: boolean;

  constructor(config: SpeakerConfig) {
    this.#inTutorial = false;
    this.#id = config.id;
    this.#scene = config.scene;
    this.#maxEnergy = 3;
    this.#energyLevel = config.startingEnergy;
    this.#sprite = config.scene.add
      .sprite(config.x, config.y, SPRITE_SHEET_ASSET_KEYS.SPEAKER, 0)
      .setFlipX(config.flipX)
      .setOrigin(0, 1)
      .setInteractive();
    this.#setTexture();

    const center = this.#sprite.getCenter();
    this.#speakerRange = this.#scene.add.image(center.x, center.y, IMAGE_ASSET_KEYS.DASH_CIRCLE).setAlpha(0);
    this.#scene.physics.world.once(Phaser.Physics.Arcade.Events.WORLD_STEP, () => {
      this.#scene.physics.world.enable(this.#speakerRange);
      const body = this.#speakerRange.body as Phaser.Physics.Arcade.Body;
      body.setCircle(body.halfWidth, 0, body.halfHeight - body.halfWidth).setAllowGravity(false);
      this.#speakerRange.setScale(0.01);
      this.#displaySpeakerRange(false);
    });

    this.#sprite.on(Phaser.Input.Events.POINTER_DOWN, () => {
      this.handlePlayerClick();
    });
  }

  /**
   * The Phaser Game Object that represents this game object.
   * @type {Phaser.GameObjects.Sprite}
   */
  get sprite(): Phaser.GameObjects.Sprite {
    return this.#sprite;
  }

  /**
   * The Phaser Game Object that represents the speakers range.
   * @type {Phaser.GameObjects.Image}
   */
  get speakerRange(): Phaser.GameObjects.Image {
    return this.#speakerRange;
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
   * Called each update tick of the game loop.
   * @returns {void}
   */
  public update(): void {
    if (this.#speakerRange.alpha === 0) {
      return;
    }
    this.#speakerRange.angle += 0.5;
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
    this.#displaySpeakerRange(true);
    playSoundFx(this.#scene, AUDIO_ASSET_KEYS.SPEAKER_BEEP);
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
      return;
    }
    if (this.#energyLevel === 2) {
      this.#sprite.setFrame(2);
      return;
    }
    this.#sprite.setFrame(3);
  }

  /**
   * Updates the game object associated with the speaker range. The range
   * is directly related to the amount of energy this object has.
   * @returns {void}
   */
  #displaySpeakerRange(show: boolean): void {
    if (this.#energyLevel === 0) {
      this.#speakerRange.setScale(0.01);
      return;
    }
    if (this.#energyLevel === 1) {
      this.#speakerRange.setScale(0.4);
    } else if (this.#energyLevel === 2) {
      this.#speakerRange.setScale(0.75);
    } else {
      this.#speakerRange.setScale(1.2);
    }
    if (!show) {
      return;
    }

    this.#speakerRange.setAlpha(0.5);
    if (this.#speakerRangeTween !== undefined && !this.#speakerRangeTween.isDestroyed()) {
      this.#speakerRangeTween.destroy();
    }
    this.#speakerRangeTween = this.#scene.tweens.add({
      targets: this.#speakerRange,
      alpha: 0,
      duration: 500,
      delay: 750,
    });
  }
}
