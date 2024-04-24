/**
 * The core Phaser 3 Scene of our game. This scene is responsible for the actual
 * game play, and is reused for each level in our game. The scene is setup to
 * expect a level to be provided when the Scene starts, that way we know which
 * assets to load for that level.
 */

import Phaser from 'phaser';
import OutlinePipelinePlugin from 'phaser3-rex-plugins/plugins/outlinepipeline-plugin.js';
import { SceneKeys } from './scene-keys';
import { IMAGE_ASSET_KEYS } from '../assets/asset-keys';
import { TILED_LAYER_NAMES, TILED_OBJECT_LAYER_NAMES } from '../assets/tiled-keys';
import * as TiledSchema from '../schema/tiled-schema';
import { NPC } from '../objects/npc';
import { Speaker } from '../objects/speaker';
import { Button } from '../objects/button';
import { Door } from '../objects/door';
import { Belt } from '../objects/belt';
import { Smasher } from '../objects/smasher';
import { Bridge } from '../objects/bridge';
import { setupTutorial } from '../tutorial/tutorial-utils';
import { Dialog } from '../objects/dialog';
import { InfoPanel } from '../objects/info-panel';
import { DataUtils } from '../utils/data-utils';

const BACKGROUND_POSITION = {
  1: { x: 0, y: -200 },
  2: { x: -30, y: -120 },
  8: { x: -30, y: 0 },
} as const;

const isOutLinePipeline = (value: unknown): value is OutlinePipelinePlugin =>
  !!value && typeof value === 'object' && 'add' in value;

type GameSceneData = {
  level: number;
};

export default class GameScene extends Phaser.Scene {
  #npcs: NPC[];
  #speakers: Speaker[];
  #buttons: Button[];
  #doors: Door[];
  #belts: Belt[];
  #smashers: Smasher[];
  #bridges: Bridge[];
  #doorGroup!: Phaser.Physics.Arcade.Group;
  #smasherGroup!: Phaser.GameObjects.Group;
  #currentEnergy: number;
  #maxEnergy: number;
  #energyContainer!: Phaser.GameObjects.Container;
  #exitZone!: Phaser.GameObjects.Zone;
  #currentLevel: number;
  #npcDialogModal!: Dialog;
  #mainDialogModal!: Dialog;
  #infoPanel!: InfoPanel;
  #finishedLevel: boolean;
  #fullScreenKey: Phaser.Input.Keyboard.Key | undefined;

  constructor() {
    super({ key: SceneKeys.GameScene });
    this.#npcs = [];
    this.#speakers = [];
    this.#buttons = [];
    this.#doors = [];
    this.#belts = [];
    this.#smashers = [];
    this.#bridges = [];
    this.#currentEnergy = 0;
    this.#maxEnergy = 0;
    this.#currentLevel = 1;
    this.#finishedLevel = false;
  }

  get currentEnergy(): number {
    return this.#currentEnergy;
  }

  /**
   * Initializes the classes main properties to their default values since the instance
   * of the Scene that is created gets re-used throughout the lifespan of the game. A new
   * instance is only created when the page is refreshed.
   * @param data {GameSceneData} the data object that is passed when the scene is initialized.
   */
  public init(data: GameSceneData): void {
    this.#finishedLevel = false;
    this.#maxEnergy = 0;
    this.#currentEnergy = 0;
    this.#npcs = [];
    this.#speakers = [];
    this.#buttons = [];
    this.#doors = [];
    this.#belts = [];
    this.#smashers = [];
    this.#bridges = [];

    // attempt to pull the saved level data if a level was not passed to the scene
    // when it was started
    if (Object.keys(data).length === 0) {
      const savedLevel = DataUtils.getSavedLevel();
      if (savedLevel !== undefined) {
        this.#currentLevel = savedLevel;
      }
    } else {
      this.#currentLevel = data.level;
    }

    if (this.#currentLevel === 9) {
      this.#currentLevel = 1;
    }
  }

  /**
   * Triggered when the Scenes Create Lifecycle event is fired. This is responsible for
   * creating all of the various game objects that are used in the game.
   * @returns {Promise<void>}
   */
  public async create(): Promise<void> {
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // full screen support
    this.#fullScreenKey = this.input?.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    // main background
    const bgPosition = (BACKGROUND_POSITION[this.#currentLevel] || BACKGROUND_POSITION[2]) as { x: number; y: number };
    this.add.image(bgPosition.x, bgPosition.y, IMAGE_ASSET_KEYS.BACKGROUND, 0).setOrigin(0);
    this.add.image(this.scale.width / 2, this.scale.height / 2, `LEVEL_${this.#currentLevel}`, 0);
    // add full screen button
    this.add
      .image(5, 5, IMAGE_ASSET_KEYS.FULLSCREEN_BUTTON)
      .setOrigin(0)
      .setScale(0.75)
      .setDepth(4)
      .setInteractive()
      .on(Phaser.Input.Events.POINTER_DOWN, () => {
        this.scale.toggleFullscreen();
      });

    // load in the Tiled level data and attempt to create the various game objects based on the JSON data
    const tiledMapData = this.make.tilemap({ key: `TILED_LEVEL_${this.#currentLevel}` });
    const exitZone = this.#createExitZone(tiledMapData);
    if (exitZone === undefined) {
      return;
    }
    this.#exitZone = exitZone;
    this.#doorGroup = this.#createDoors(tiledMapData);
    this.#belts = this.#createBelts(tiledMapData);
    this.#bridges = this.#createBridges(tiledMapData);
    this.#buttons = this.#createButtons(tiledMapData);
    this.#speakers = this.#createSpeakers(tiledMapData);
    this.#npcs = this.#createNpcs(tiledMapData);
    this.#smashers = this.#createSmashers(tiledMapData);
    this.#smasherGroup = this.add.group(this.#smashers.map((smasher) => smasher.sprite));
    this.#calculateEnergy(tiledMapData);

    // set up all of the collisions and colliders that exist in the game for each npc in the level
    const collisionLayer = this.#createCollisionLayer(tiledMapData);
    if (!collisionLayer) {
      return;
    }
    collisionLayer.setCollision(117, true);
    collisionLayer.setAlpha(0);

    this.#npcs.forEach((npc) => {
      const wallCollider = this.physics.add.collider(npc.sprite, collisionLayer, () => {
        if (npc.sprite.body.blocked.left || npc.sprite.body.blocked.right) {
          npc.collidedWithWall();
          return;
        }
        if (npc.sprite.body.blocked.down) {
          return;
        }
        npc.collidedWithWall();
      });
      npc.addCollider(wallCollider);
      const doorCollider = this.physics.add.collider(npc.sprite, this.#doorGroup, () => {
        npc.collidedWithWall();
      });
      npc.addCollider(doorCollider);
      const exitOverlap = this.physics.add.overlap(npc.sprite, this.#exitZone, () => {
        npc.hasEnteredExit();
      });
      npc.addCollider(exitOverlap);
      this.#belts.forEach((belt) => {
        const beltCollider = this.physics.add.overlap(npc.sprite, belt.spriteContainer, () => {
          npc.isOnBelt(belt.speed);
        });
        npc.addCollider(beltCollider);
      });
      const smasherCollider = this.physics.add.overlap(npc.sprite, this.#smasherGroup, () => {
        npc.died();
      });
      npc.addCollider(smasherCollider);
      this.#bridges.forEach((bridge) => {
        const bridgeCollider = this.physics.add.collider(npc.sprite, bridge.bridgeContainer, () => {
          if ((npc.sprite.body.blocked.left || npc.sprite.body.blocked.right) && npc.sprite.body.blocked.down) {
            npc.collideWithBridgeWall();
            return;
          }
          if (npc.sprite.body.blocked.down) {
            return;
          }
          npc.collideWithBridgeWall();
        });
        npc.addCollider(bridgeCollider);
      });
    });
    // collisionLayer.renderDebug(this.add.graphics());

    // add UI components for tracking how much energy is available to the player for each level
    this.#energyContainer = this.add.container(this.scale.width - 10, 10, []);
    for (let i = 0; i < this.#maxEnergy; i += 1) {
      const img = this.add
        .image(24 * -i, 0, IMAGE_ASSET_KEYS.ENERGY, 0)
        .setScale(0.2)
        .setOrigin(1, 0);
      this.#energyContainer.addAt(img, 0);
    }
    this.#updateEnergyUI();
    this.add.image(0, 0, this.#pickRandomOverlay(), 0).setOrigin(0).setAlpha(0.2).setDepth(5);

    // create UI and tutorial components for the 1st level so we can teach the player
    // the game mechanics. these were added here in order to support
    // additional dialog between the player and npcs when not in the tutorial
    this.#npcDialogModal = new Dialog({
      scene: this,
      x: 0,
      y: 0,
      uiBackGroundAssetKey: IMAGE_ASSET_KEYS.NPC_MODAL,
      uiProfileAssetKey: IMAGE_ASSET_KEYS.PROFILE_HEAD,
    });
    this.#mainDialogModal = new Dialog({
      scene: this,
      x: 0,
      y: 0,
      uiBackGroundAssetKey: IMAGE_ASSET_KEYS.MAIN_MODAL,
      uiProfileAssetKey: IMAGE_ASSET_KEYS.PROFILE_HEAD,
    });
    this.#infoPanel = new InfoPanel({ scene: this });
    await setupTutorial({
      scene: this,
      currentLevel: this.#currentLevel,
      npcs: this.#npcs,
      speakers: this.#speakers,
      buttons: this.#buttons,
      mainDialogModal: this.#mainDialogModal,
      npcDialogModal: this.#npcDialogModal,
      infoPanel: this.#infoPanel,
    });

    // add custom plugins for creating various game effects, currently, just adding a glow to items
    // that can be interacted with
    const plugin = this.plugins.get('rexOutlinePipeline');
    if (plugin !== null && isOutLinePipeline(plugin)) {
      this.#buttons.forEach((button) => {
        plugin.add(button.sprite, {
          thickness: 1.5,
          outlineColor: 0xff00fff,
        });
      });
      this.#speakers.forEach((speaker) => {
        plugin.add(speaker.sprite, {
          thickness: 1.5,
          outlineColor: 0xff00fff,
        });
      });
    }

    // custom level entrance for when a player enters a new level
    if (this.#currentLevel !== 1) {
      this.input.enabled = false;
      await this.#npcs[0].playEnterLevel();
      for (const door of this.#doors) {
        if (door.isLevelEntrance) {
          await door.closeDoor();
        }
      }
      this.input.enabled = true;
    }
  }

  /**
   * Called each update tick of the game loop. This is used for calling the update
   * method on the various objects that were created
   * @returns {void}
   */
  public update(): void {
    if (this.#wasFullScreenKeyPressed()) {
      this.scale.toggleFullscreen();
    }

    if (this.#finishedLevel) {
      return;
    }
    this.#npcs.forEach((npc) => npc.update());
    this.#speakers.forEach((speaker) => speaker.update());
    this.#belts.forEach((belt) => belt.update());
  }

  /**
   * Updates the current energy that is available to the player.
   * @param energyAmount {number} the amount of energy to add or take from the player
   * @returns {void}
   */
  public updateEnergy(energyAmount: number): void {
    this.#currentEnergy += energyAmount;
    this.#updateEnergyUI();
  }

  /**
   * Triggered when a NPC has reached the goal for each level. Used for knowing
   * when a level has been completed successfully.
   * @returns {void}
   */
  public npcHasLeftScene(): void {
    const hasAllNpcsLeft = this.#npcs.every((npc) => npc.hasExitedLevel);
    if (hasAllNpcsLeft) {
      this.#finishedLevel = true;
      DataUtils.setSavedLevel(this.#currentLevel + 1);
      if (this.#currentLevel === 8) {
        this.scene.start(SceneKeys.CreditsScene);
        return;
      }
      this.scene.start(SceneKeys.GameScene, { level: (this.#currentLevel += 1) });
    }
  }

  /**
   * Triggered when a NPC has died from one of the traps in the level.
   * @returns {void}
   */
  public triggerGameOver(): void {
    this.cameras.main.fadeOut(1000, 0, 0, 0, (camera, progress) => {
      if (progress === 1) {
        this.scene.restart({ level: this.#currentLevel });
      }
    });
  }

  /**
   * Updates the energy UI components each time the player gets or loses energy.
   * @returns {void}
   */
  #updateEnergyUI(): void {
    this.#energyContainer.list.forEach((energy, index) => {
      let alpha = 0.4;
      if (index < this.#currentEnergy) {
        alpha = 1;
      }
      (energy as Phaser.GameObjects.Sprite).setAlpha(alpha);
    });
  }

  /**
   * Creates the exit zone for the level, which the NPC must cross to successfully complete the level. This
   * object is created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Phaser.GameObjects.Zone | undefined}
   */
  #createExitZone(tiledMapData: Phaser.Tilemaps.Tilemap): Phaser.GameObjects.Zone | undefined {
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.EXIT);
    if (!layerData || layerData.objects.length > 1) {
      console.warn(`[${GameScene.name}:#createExitZone] encountered error while parsing tiled map data for level exit`);
      return;
    }
    const parsedObject = TiledSchema.TiledExitObjectSchema.safeParse(layerData.objects[0]);
    if (!parsedObject.success) {
      console.warn(
        `[${GameScene.name}:#calculateEnergy] encountered error while parsing tiled map data`,
        parsedObject.error,
      );
      return;
    }
    const obj = parsedObject.data;
    const zone = this.add.zone(obj.x, obj.y, obj.width, obj.height).setOrigin(0, 1);
    this.physics.world.enable(zone);
    (zone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    return zone;
  }

  /**
   * Creates the npcs for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {NPC[]}
   */
  #createNpcs(tiledMapData: Phaser.Tilemaps.Tilemap): NPC[] {
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.NPCS);
    const npcs: NPC[] = [];
    if (!layerData) {
      return npcs;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledNpcObjectSchema.safeParse(rawObject);
      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createNpcs] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const npc = new NPC({ scene: this, x: obj.x, y: obj.y, speakers: this.#speakers });
      npcs.push(npc);
    }
    return npcs;
  }

  /**
   * Creates the door objects for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * These objects are placed in a group so we can do a collision check between the door group and each npc
   * in the current level.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Phaser.Physics.Arcade.Group}
   */
  #createDoors(tiledMapData: Phaser.Tilemaps.Tilemap): Phaser.Physics.Arcade.Group {
    this.#doors = [];
    const gameObjects = this.physics.add.group({ immovable: true, allowGravity: false });
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.DOORS);
    if (!layerData) {
      return gameObjects;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledDoorObjectSchema.safeParse(rawObject);

      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createDoors] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const door = new Door({
        scene: this,
        x: obj.x,
        y: obj.y,
        flipX: this.#shouldFlipGameObject(obj.properties),
        id: this.#getIdFromObject(obj.properties),
        isLevelEntrance: this.#isDoorLevelEntrance(obj.properties),
      });
      gameObjects.add(door.sprite);
      this.#doors.push(door);
    }
    return gameObjects;
  }

  /**
   * Creates the button objects for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Button[]}
   */
  #createButtons(tiledMapData: Phaser.Tilemaps.Tilemap): Button[] {
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.BUTTONS);
    const gameObjects: Button[] = [];
    if (!layerData) {
      return gameObjects;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledButtonObjectSchema.safeParse(rawObject);
      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createButtons] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const connectedObject = this.#getButtonConnectedObject(obj.properties);
      if (!connectedObject) {
        console.warn(
          `[${GameScene.name}:#createButtons] was not able to find connected object while parsing tiled data`,
        );
        continue;
      }

      const button = new Button({
        scene: this,
        x: obj.x,
        y: obj.y,
        flipX: this.#shouldFlipGameObject(obj.properties),
        startingEnergy: this.#getEnergyDetailsFromObject(obj.properties),
        id: this.#getIdFromObject(obj.properties),
        connectedObject: connectedObject,
        maxEnergy: this.#getMaxEnergyDetailsFromObject(obj.properties),
      });
      gameObjects.push(button);
    }
    return gameObjects;
  }

  /**
   * When a button is created in the level, the game expects there to be an associated object that is controlled
   * by the button. This method figures out what the associated object is, and returns that object if found.
   *
   * Example, there is a button to add/remove energy to a door. The button object in Tiled will have a property
   * called `objectId` which is the id of the associated object. There is another property called `activeObjectType`
   * which is used for knowing what type of object is associated with the button.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {Door | Belt | Bridge | undefined}
   */
  #getButtonConnectedObject(objectProperties: TiledSchema.TiledObjectProperty[]): Door | Belt | Bridge | undefined {
    // get the object type from the tiled data
    const activeObjectProp = objectProperties.find(
      (prop) => prop.name === TiledSchema.TILED_BUTTON_PROPERTY_NAME.ACTIVE_OBJECT_TYPE,
    );
    if (!activeObjectProp) {
      return;
    }
    const parsedProperty = TiledSchema.TiledObjectActiveObjectTypePropertySchema.safeParse(activeObjectProp);
    if (!parsedProperty.success) {
      return;
    }

    // find the object id from the tiled data
    const targetObjectIdProp = objectProperties.find(
      (prop) => prop.name === TiledSchema.TILED_BUTTON_PROPERTY_NAME.OBJECT_ID,
    );
    if (targetObjectIdProp === undefined) {
      return;
    }
    const parsedTargetObjectIdProperty = TiledSchema.TiledTargetObjectIdPropertySchema.safeParse(targetObjectIdProp);
    if (!parsedTargetObjectIdProperty.success) {
      return;
    }

    // find the matching object in the game objects that have already been created based on the type and id field we found above
    if (parsedProperty.data.value === TiledSchema.BUTTON_ACTIVE_OBJECT_TYPE.DOOR) {
      return this.#doors.find((door) => door.id === parsedTargetObjectIdProperty.data.value);
    }
    if (parsedProperty.data.value === TiledSchema.BUTTON_ACTIVE_OBJECT_TYPE.BELT) {
      return this.#belts.find((belt) => belt.id === parsedTargetObjectIdProperty.data.value);
    }
    if (parsedProperty.data.value === TiledSchema.BUTTON_ACTIVE_OBJECT_TYPE.BRIDGE) {
      return this.#bridges.find((bridge) => bridge.id === parsedTargetObjectIdProperty.data.value);
    }
    return undefined;
  }

  /**
   * Creates the speaker objects for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Speaker[]}
   */
  #createSpeakers(tiledMapData: Phaser.Tilemaps.Tilemap): Speaker[] {
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.SPEAKERS);
    const gameObjects: Speaker[] = [];
    if (!layerData) {
      return gameObjects;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledSpeakerObjectSchema.safeParse(rawObject);
      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createSpeakers] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const speaker = new Speaker({
        scene: this,
        x: obj.x,
        y: obj.y,
        flipX: this.#shouldFlipGameObject(obj.properties),
        startingEnergy: this.#getEnergyDetailsFromObject(obj.properties),
        id: this.#getIdFromObject(obj.properties),
      });
      gameObjects.push(speaker);
    }
    return gameObjects;
  }

  /**
   * For many of the game objects that are created from Tiled, there is a custom property that indicates
   * if the object should be flipped or not when we create the sprite in our game.
   * This method parses that data from the JSON file.
   *
   * Example, if we want a door to face left or right, the flip property will indicate what value to set for the
   * `flipX` method on the game object in Phaser.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {boolean}
   */
  #shouldFlipGameObject(objectProperties: TiledSchema.TiledObjectProperty[]): boolean {
    const flipProp = objectProperties.find((prop) => prop.name === TiledSchema.TILED_DOOR_PROPERTY_NAME.FLIP);
    if (!flipProp) {
      return false;
    }
    const parsedProperty = TiledSchema.TiledObjectFlipPropertySchema.safeParse(flipProp);
    if (!parsedProperty.success) {
      return false;
    }
    return parsedProperty.data.value;
  }

  /**
   * For each door object we create, there is a property in Tiled that indicates if this is a door that should
   * automatically close when the player enters the level. This is used for the custom scene entrance when the player
   * enters the 2nd level and higher.
   * This method parses that data from the JSON file.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {boolean}
   */
  #isDoorLevelEntrance(objectProperties: TiledSchema.TiledObjectProperty[]): boolean {
    const isLevelEntranceProp = objectProperties.find(
      (prop) => prop.name === TiledSchema.TILED_DOOR_PROPERTY_NAME.IS_LEVEL_ENTRANCE,
    );
    if (!isLevelEntranceProp) {
      return false;
    }
    const parsedProperty = TiledSchema.TiledObjectIsLevelEntrancePropertySchema.safeParse(isLevelEntranceProp);
    if (!parsedProperty.success) {
      return false;
    }
    return parsedProperty.data.value;
  }

  /**
   * For each game object that the player can add or remove energy from, there is a field in Tiled that
   * details the current energy of that object when the level is first started.
   * This method parses that data from the JSON file.
   *
   * Example, when the first level starts, one of the doors has 0 energy while the exit door has 3 energy.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {number}
   */
  #getEnergyDetailsFromObject(objectProperties: TiledSchema.TiledObjectProperty[]): number {
    const energyProp = objectProperties.find(
      (prop) => prop.name === TiledSchema.TILED_ENERGY_PROPERTY_NAME.CURRENT_ENERGY,
    );
    if (!energyProp) {
      return 0;
    }
    const parsedProperty = TiledSchema.TiledObjectCurrentEnergyPropertySchema.safeParse(energyProp);
    if (!parsedProperty.success) {
      return 0;
    }
    return parsedProperty.data.value;
  }

  /**
   * For each game object that the player can add or remove energy from, there is a field in Tiled that
   * details the max energy that can be applied to that object.
   * This method parses that data from the JSON file.
   *
   * Example, some buttons allow you to add up to 3 energy to a door or speaker. The max value is pulled from
   * the level data.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {number}
   */
  #getMaxEnergyDetailsFromObject(objectProperties: TiledSchema.TiledObjectProperty[]): number {
    const energyProp = objectProperties.find((prop) => prop.name === TiledSchema.TILED_BUTTON_PROPERTY_NAME.MAX_ENERGY);
    if (!energyProp) {
      return 3;
    }
    const parsedProperty = TiledSchema.TiledObjectMaxEnergyPropertySchema.safeParse(energyProp);
    if (!parsedProperty.success) {
      return 3;
    }
    return parsedProperty.data.value;
  }

  /**
   * For each game object that we create from Tiled, there is a unique id associated with that object.
   * This method parses that data from the JSON file.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {number}
   */
  #getIdFromObject(objectProperties: TiledSchema.TiledObjectProperty[]): number {
    const idProp = objectProperties.find((prop) => prop.name === TiledSchema.TILED_DOOR_PROPERTY_NAME.ID);
    if (!idProp) {
      return -1;
    }
    const parsedProperty = TiledSchema.TiledObjectIdPropertySchema.safeParse(idProp);
    if (!parsedProperty.success) {
      return 0;
    }
    return parsedProperty.data.value;
  }

  /**
   * For each the smasher game objects, the Tiled JSON data includes a field for knowing how long to wait
   * before the first time the object attempts to crush the player. This method parses that data from the JSON
   * file.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {number}
   */
  #getDelayFromStart(objectProperties: TiledSchema.TiledObjectProperty[]): number {
    const prop = objectProperties.find(
      (prop) => prop.name === TiledSchema.TILED_SMASHER_PROPERTY_NAME.DELAY_FROM_SCENE_START,
    );
    if (!prop) {
      return -1;
    }
    const parsedProperty = TiledSchema.TiledObjectDelayFromSceneStartPropertySchema.safeParse(prop);
    if (!parsedProperty.success) {
      return 0;
    }
    return parsedProperty.data.value;
  }

  /**
   * For each the smasher game objects, the Tiled JSON data includes a field for knowing how long to wait
   * before each time the object attempts to crush the player. This method parses that data from the JSON
   * file.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {number}
   */
  #getDelayBetweenAttacks(objectProperties: TiledSchema.TiledObjectProperty[]): number {
    const prop = objectProperties.find(
      (prop) => prop.name === TiledSchema.TILED_SMASHER_PROPERTY_NAME.DELAY_BETWEEN_ATTACKS,
    );
    if (!prop) {
      return -1;
    }
    const parsedProperty = TiledSchema.TiledObjectDelayBetweenAttacksPropertySchema.safeParse(prop);
    if (!parsedProperty.success) {
      return 0;
    }
    return parsedProperty.data.value;
  }

  /**
   * Creates the main collision layer for the current level based on the object layer in the Tiled JSON data file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Phaser.Tilemaps.TilemapLayer | undefined }
   */
  #createCollisionLayer(tiledMapData: Phaser.Tilemaps.Tilemap): Phaser.Tilemaps.TilemapLayer | undefined {
    const collisionTiles = tiledMapData.addTilesetImage(
      IMAGE_ASSET_KEYS.COLLISION.toLowerCase(),
      IMAGE_ASSET_KEYS.COLLISION,
    );
    if (!collisionTiles) {
      console.warn(`[${GameScene.name}:create] encountered error while creating collision tiles from tiled`);
      return;
    }
    const collisionLayer = tiledMapData.createLayer(TILED_LAYER_NAMES.COLLISION, collisionTiles, 0, 0);
    if (!collisionLayer) {
      console.warn(`[${GameScene.name}:create] encountered error while creating collision layer using data from tiled`);
      return;
    }
    return collisionLayer;
  }

  /**
   * Calculates how much energy is in a given level and how much the energy the player starts with when
   * the level starts. These values are determined based on the Tiled JSON data that is parsed from the map data.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {void}
   */
  #calculateEnergy(tiledMapData: Phaser.Tilemaps.Tilemap): void {
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.ENERGY);
    if (!layerData || layerData.objects.length > 1) {
      console.warn(
        `[${GameScene.name}:#calculateEnergy] encountered error while parsing tiled map data for starting energy`,
      );
      return;
    }
    const parsedObject = TiledSchema.TiledEnergyObjectSchema.safeParse(layerData.objects[0]);
    if (!parsedObject.success) {
      console.warn(
        `[${GameScene.name}:#calculateEnergy] encountered error while parsing tiled map data`,
        parsedObject.error,
      );
      return;
    }
    // starting energy
    this.#currentEnergy = this.#getEnergyDetailsFromObject(parsedObject.data.properties);
    this.#maxEnergy = this.#currentEnergy;

    let energyUsedByDevices = 0;
    this.#buttons.forEach((button) => (energyUsedByDevices += button.currentEnergy));
    this.#speakers.forEach((speaker) => (energyUsedByDevices += speaker.currentEnergy));
    this.#maxEnergy += energyUsedByDevices;
  }

  /**
   * Creates the belt objects for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Belt[]}
   */
  #createBelts(tiledMapData: Phaser.Tilemaps.Tilemap): Belt[] {
    const belts: Belt[] = [];
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.BELTS);
    if (!layerData) {
      return belts;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledBeltObjectSchema.safeParse(rawObject);
      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createBelts] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const belt = new Belt({
        scene: this,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        id: this.#getIdFromObject(obj.properties),
      });
      belts.push(belt);
    }
    return belts;
  }

  /**
   * Creates the smasher objects for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Smasher[]}
   */
  #createSmashers(tiledMapData: Phaser.Tilemaps.Tilemap): Smasher[] {
    const smashers: Smasher[] = [];
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.SMASHERS);
    if (!layerData) {
      return smashers;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledSmasherObjectSchema.safeParse(rawObject);
      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createSmashers] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const smasher = new Smasher({
        scene: this,
        x: obj.x,
        y: obj.y,
        id: this.#getIdFromObject(obj.properties),
        delayBetweenAttacks: this.#getDelayBetweenAttacks(obj.properties),
        delayFromSceneStart: this.#getDelayFromStart(obj.properties),
      });
      smashers.push(smasher);
    }
    return smashers;
  }

  /**
   * Creates the bridge objects for the current level. These objects are created from the object layer data in the Tiled JSON map file.
   * @param tiledMapData {Phaser.Tilemaps.Tilemap} the Tiled map data that will be used for getting objects from.
   * @returns {Bridge[]}
   */
  #createBridges(tiledMapData: Phaser.Tilemaps.Tilemap): Bridge[] {
    const bridges: Bridge[] = [];
    const layerData = tiledMapData.getObjectLayer(TILED_OBJECT_LAYER_NAMES.BRIDGES);
    if (!layerData) {
      return bridges;
    }
    const rawObjects = layerData.objects;
    for (const rawObject of rawObjects) {
      const parsedObject = TiledSchema.TiledBridgeObjectSchema.safeParse(rawObject);
      if (!parsedObject.success) {
        console.warn(
          `[${GameScene.name}:#createBridges] encountered error while parsing tiled map data`,
          parsedObject.error,
        );
        continue;
      }
      const obj = parsedObject.data;
      const bridge = new Bridge({
        scene: this,
        x: obj.x,
        y: obj.y,
        id: this.#getIdFromObject(obj.properties),
        stops: this.#getStopsFromObject(obj.properties),
        width: obj.width,
        height: obj.height,
      });
      bridges.push(bridge);

      const hasNoButton = this.#doesBridgeHaveNoButton(obj.properties);

      if (hasNoButton) {
        bridge.setInitialPowerLevel(1);
      }
    }
    return bridges;
  }

  /**
   * For each bridge/elevator in the game, the Tiled JSON data has an array of stops, which represents the
   * Y coordinates of where the bridge/elevator can stop in the game. These values are used for positioning
   * the game object and for knowing which position to move the bridge to.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {number[]}
   */
  #getStopsFromObject(objectProperties: TiledSchema.TiledObjectProperty[]): number[] {
    const stopsProp = objectProperties.find((prop) => prop.name === TiledSchema.TILED_BRIDGE_PROPERTY_NAME.STOPS);
    if (!stopsProp) {
      return [];
    }
    const parsedProperty = TiledSchema.TiledStopsPropertySchema.safeParse(stopsProp);
    if (!parsedProperty.success) {
      return [];
    }
    return parsedProperty.data.value.split(',').map((val) => parseInt(val, 10));
  }

  /**
   * For each bridge/elevator in the game, the object might have a button associated with it, which allows the
   * player to turn the bridge/elevator on/off in the game. If there is no button, then the bridge elevator
   * will either be stationary or constantly moving.
   * @param objectProperties {TiledSchema.TiledObjectProperty[]} the Tiled object properties to search through.
   * @returns {boolean}
   */
  #doesBridgeHaveNoButton(objectProperties: TiledSchema.TiledObjectProperty[]): boolean {
    const prop = objectProperties.find((prop) => prop.name === TiledSchema.TILED_BRIDGE_PROPERTY_NAME.NO_BUTTON);
    if (!prop) {
      return false;
    }
    const parsedProperty = TiledSchema.TiledObjectNoButtonPropertySchema.safeParse(prop);
    if (!parsedProperty.success) {
      return false;
    }
    return parsedProperty.data.value;
  }

  /**
   * Checks to see if the key assigned to the full screen button was just pressed.
   * This is for keyboard support in the game.
   * @returns {boolean}
   */
  #wasFullScreenKeyPressed(): boolean {
    if (this.#fullScreenKey === undefined) {
      return false;
    }
    return Phaser.Input.Keyboard.JustDown(this.#fullScreenKey);
  }

  /**
   * Choose a random overlay image to apply to the Game view to create a unique game effect.
   * @returns {string}
   */
  #pickRandomOverlay(): string {
    const elements = [
      IMAGE_ASSET_KEYS.OVERLAY_1,
      IMAGE_ASSET_KEYS.OVERLAY_2,
      IMAGE_ASSET_KEYS.OVERLAY_3,
      IMAGE_ASSET_KEYS.OVERLAY_4,
      IMAGE_ASSET_KEYS.OVERLAY_5,
      IMAGE_ASSET_KEYS.OVERLAY_6,
      IMAGE_ASSET_KEYS.OVERLAY_7,
      IMAGE_ASSET_KEYS.OVERLAY_8,
      IMAGE_ASSET_KEYS.OVERLAY_9,
      IMAGE_ASSET_KEYS.OVERLAY_10,
      IMAGE_ASSET_KEYS.OVERLAY_28,
    ];
    const randomIndex = Phaser.Math.Between(0, elements.length - 1);
    return elements[randomIndex];
  }
}
