/**
 * Shared game utils that are responsible for creating unique effects in our game.
 * The utils will make use of the built in Phaser 3 tweens, events, and particles
 * to enhance our game.
 */

import { ATLAS_ASSET_KEYS } from '../assets/asset-keys';

/**
 * Creates a shake like animation effect by using the built in Phaser 3 Tweens. The provided game object
 * will be the target of the Tween that is created.
 * @param scene {Phaser.Scene} The Phaser 3 Scene instance that the tween will be added to.
 * @param target {Phaser.GameObjects.Sprite} The target game object that the effect will be applied to.
 * @returns {Phaser.Tweens.Tween}
 */
export function shake(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite): Phaser.Tweens.Tween {
  const shakeTween = scene.tweens.add({
    targets: target,
    x: target.x + 5,
    y: target.y - 5,
    duration: 50,
    yoyo: true,
    repeat: 8,
    ease: Phaser.Math.Easing.Bounce.InOut,
    delay: 0,
    paused: false,
  });
  return shakeTween;
}

/**
 * Creates a fade out animation effect by using the built in Phaser 3 Tweens. The provided game object
 * will be the target of the Tween that is created.
 * @param scene {Phaser.Scene} The Phaser 3 Scene instance that the tween will be added to.
 * @param target {Phaser.GameObjects.Sprite} The target game object that the effect will be applied to.
 * @returns {Phaser.Tweens.Tween}
 */
export function fadeOut(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite): Phaser.Tweens.Tween {
  const fadeOutTween = scene.tweens.add({
    targets: target,
    alpha: 0,
    duration: 750,
    ease: Phaser.Math.Easing.Circular.Out,
    delay: 0,
    paused: false,
  });
  return fadeOutTween;
}

/**
 * Creates a flash animation effect by using the built in Phaser 3 Timer Events. The provided game object
 * will be the target of the effect that is created.
 * @param scene {Phaser.Scene} The Phaser 3 Scene instance that the effect will be added to.
 * @param target {Phaser.GameObjects.Sprite} The target game object that the effect will be applied to.
 * @returns {void}
 */
export function flash(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite): void {
  scene.time.addEvent({
    delay: 450,
    callback: () => {
      target.setTintFill(0xffffff);
      target.setAlpha(0.7);

      scene.time.addEvent({
        delay: 300,
        callback: () => {
          target.setTint(0xffffff);
          target.setAlpha(1);
        },
      });
    },
    startAt: 300,
    repeat: 1,
  });
}

/**
 * Creates an exploding animation effect by using the built in Phaser 3 ParticleEmitter. The provided game object
 * will be position of where the effect is added to in the Phaser 3 Scene.
 * @param scene {Phaser.Scene} The Phaser 3 Scene instance that the effect will be added to.
 * @param target {Phaser.GameObjects.Sprite} The target game object that the effect will be applied to.
 * @param callback {() => void} an optional callback function that will be called once the effect is done.
 * @returns {void}
 */
export function explode(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite, callback: () => void = () => {}): void {
  let counter = 0;
  const emitter = scene.add
    .particles(target.x, target.y, ATLAS_ASSET_KEYS.FLARES, {
      frame: ['red'],
      lifespan: 500,
      speed: { min: 100, max: 250 },
      scale: { start: 0.4, end: 0 },
      gravityY: 200,
      blendMode: 'ADD',
      emitting: false,
      deathCallback: () => {
        counter += 1;
        if (counter === 16) {
          callback();
        }
      },
    })
    .setAlpha(0.5);
  emitter.explode(16);
}
