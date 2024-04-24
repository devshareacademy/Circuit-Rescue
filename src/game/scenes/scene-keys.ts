/**
 * When a scene is created in Phaser, each scene must have a unique identifier.
 * This is provided through the `super` method when we extend the base Phaser
 * 3 Scene class. These keys are abstracted here so we can reference all of these
 * keys from 1 spot in the code since most scenes will transition to another scene.
 */

export const SceneKeys = {
  BootScene: 'BootScene',
  GameScene: 'GameScene',
  PreloadScene: 'PreloadScene',
  TitleScene: 'TitleScene',
  CreditsScene: 'CreditsScene',
} as const;
