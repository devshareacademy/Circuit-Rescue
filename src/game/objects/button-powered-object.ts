/**
 * A common interface that all objects that can be powered by a button
 * should implement. Examples of button powered object include the
 * bridge/elevator, door, and belt game objects.
 */
export interface ButtonPoweredObject {
  powerLevelChanged(powerLevel: number): void;
  setInitialPowerLevel(powerLevel: number): void;
}
