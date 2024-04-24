/**
 * Contains all of the Tiled specific layer names from the Tiled map data that is
 * imported. The Tiled JSON data is the various levels that make up the game.
 */

export const TILED_LAYER_NAMES = {
  COLLISION: 'collision',
  DOORS: 'doors',
  BLOCKS: 'blocks',
} as const;

export const TILED_OBJECT_LAYER_NAMES = {
  BUTTONS: 'buttons',
  SPEAKERS: 'speakers',
  DOORS: 'doors',
  NPCS: 'npcs',
  ENERGY: 'energy',
  EXIT: 'exit',
  BELTS: 'belts',
  SMASHERS: 'smashers',
  BRIDGES: 'bridges',
} as const;
