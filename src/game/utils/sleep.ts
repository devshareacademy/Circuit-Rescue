/**
 * Used for allowing the code to wait a certain amount of time before executing
 * the next code.
 * @param milliseconds the number of milliseconds to wait
 * @returns {Promise<void>}
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
