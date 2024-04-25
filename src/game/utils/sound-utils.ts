/**
 * Shared audio utils that are responsible for playing sound files in the Phaser 3 game instance.
 */

/**
 * Will stop all other music in a Phaser 3 Scene instance and start playing the audio file
 * associated with the cache key that is provided. The audio will play in a loop until.
 * @param {Phaser.Scene} scene The Phaser 3 Scene instance the sound file will play in.
 * @param {string} audioKey The unique key tied to the asset that will be played. This is the key that
 *                 was used when the asset was loaded by Phaser (in the PreloadScene class).
 * @returns {void}
 */
export function playBackgroundMusic(scene: Phaser.Scene, audioKey: string): void {
  // get all of the audio objects that are currently playing so we can check if the sound we
  // want to play is already playing, and to stop all other sounds
  const existingSounds = scene.sound.getAllPlaying();
  let musicAlreadyPlaying = false;

  existingSounds.forEach((sound) => {
    if (sound.key === audioKey) {
      musicAlreadyPlaying = true;
      return;
    }
    sound.stop();
  });

  if (!musicAlreadyPlaying) {
    scene.sound.play(audioKey, {
      loop: true,
    });
  }
}

/**
 * Used for playing simple sound effects in a Phaser 3 Scene instance. The audio file
 * associated with the cache key that is provided will be played one time.
 * @param {Phaser.Scene} scene The Phaser 3 Scene instance the sound file will play in.
 * @param {string} audioKey The unique key tied to the asset that will be played. This is the key that
 *                 was used when the asset was loaded by Phaser (in the PreloadScene class).
 * @returns {void}
 */
export function playSoundFx(scene: Phaser.Scene, audioKey: string): void {
  scene.sound.play(audioKey, {
    volume: 0.5,
  });
}
