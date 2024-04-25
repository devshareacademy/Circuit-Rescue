/**
 * Shared data utils that are used for working with JSON files and for
 * saving and loading data to the browser local storage.
 */

import { AnimationData, AnimationDataSchema } from '../schema/data-schema';
import { DATA_ASSET_KEYS } from '../assets/asset-keys';

export const LOCAL_STORAGE_LEVEL_KEY = 'currentLevel';

export class DataUtils {
  /**
   * Utility function for retrieving the Animation objects from the `/public/assets/data/animations.json` data file.
   * @param {Phaser.Scene} scene the Phaser 3 Scene instance that will be used for getting data from the cache.
   * @returns {AnimationData}
   */
  static getAnimations(scene: Phaser.Scene): AnimationData {
    const rawData: unknown = scene.cache.json.get(DATA_ASSET_KEYS.ANIMATIONS);
    const parsedData = AnimationDataSchema.safeParse(rawData);
    if (!parsedData.success) {
      console.warn(`[${DataUtils.name}:#getAnimations] encountered error while parsing json data`, parsedData.error);
      return [];
    }
    return parsedData.data;
  }

  /**
   * Will attempt to load the saved level data from the browser local storage.
   * @returns {number | undefined}
   */
  static getSavedLevel(): number | undefined {
    if (!localStorage) {
      return;
    }

    const results = localStorage.getItem(LOCAL_STORAGE_LEVEL_KEY);
    if (results === null) {
      return;
    }

    return parseInt(results, 10);
  }

  /**
   * Will attempt to save the passed in level number to browser local storage.
   * @param {number} level the level number that will be saved
   * @returns {void}
   */
  static setSavedLevel(level: number): void {
    if (!localStorage) {
      return;
    }

    localStorage.setItem(LOCAL_STORAGE_LEVEL_KEY, level.toString());
  }
}
