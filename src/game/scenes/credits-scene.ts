/**
 * A Phaser 3 Scene that is shown to the player after they complete all of the
 * levels in the game. This is just a basic credits scene that gives credit to
 * the various artists whose art was used in the game.
 */

import { SceneKeys } from './scene-keys';

const fontStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "'Orbitron', sans-serif",
  fontSize: '32px',
  color: '#ffffff',
};

const altTextStyle: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: "'Orbitron', sans-serif",
  fontSize: '22px',
  color: '#ffffff',
};

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.CreditsScene });
  }

  /**
   * Triggered when the Scenes Create Lifecycle event is fired. This is responsible for
   * creating all of the game objects that are used in this Phaser Scene.
   * @returns {void}
   */
  public create(): void {
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 1).setOrigin(0);
    //this.scene.start(SceneKeys.PreloadScene);
    const { width } = this.scale;
    this.add.text(width / 2, 25, 'Credits', fontStyle).setOrigin(0.5);

    this.add.text(width / 2, 90, 'Created by: galemius', altTextStyle).setOrigin(0.5);
    this.add.text(width / 2, 140, 'Art by:', altTextStyle).setOrigin(0.5);
    this.add.text(width / 2, 160, 'craftpix.net  kenney  sungraphica', altTextStyle).setOrigin(0.5);
    this.add.text(width / 2, 210, 'Music by: ', altTextStyle).setOrigin(0.5);
    this.add.text(width / 2, 230, 'rustedstudio  shapeforms', altTextStyle).setOrigin(0.5);

    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => {
      this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
        if (progress === 1) {
          this.scene.start(SceneKeys.TitleScene);
        }
      });
    });
  }
}
