/**
 * Main entrypoint for the web application. When the index.html file loads, the page calls this
 * this file, which then creates an instance of the Circuit Rescue game.
 */

import Game from './game/game';

window.onload = async () => {
  try {
    new Game().start();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await window.screen.orientation['lock']('landscape');
  } catch (error) {
    console.log((error as Error).message);
  }
};
