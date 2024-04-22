# Circuit-Rescue

A Phaser 3 game that was submitted for the Gavedev.js Jam 2024 game jam.

You can play the game here: TODO

## Story

In the not to distant future, a group of individuals have taken over your town.
Their goal is to gain full control of the power grids in the area, and your town
contains the main power grid. To gain control, the group has rounded up all of the
townsfolk and power plant workers, and they have locked them up in an underground
facility. However, you have managed to escape them for now...

This is your time to be a hero, however unlike the movies and comic books, you don't
have any special powers... One skill you poses though, is the ability to hack. Your
computer skills are legendary and you have managed to hack into the underground
facilities network, and with your access you view the facilities security camera
footage and communicate with the trapped civilians.

Today is the day you save them all...

## How To Play

In order to help the people escape, you will be interacting with various devices in each level.
Each device will do something different, and you will have the ability to turn some of these devices
on/off, and change the amount of power that is supplied to each device. To interact with a device, you
just need to click on that device in the game. Devices that can be interacted with will emit a pink glow.

### Speakers

Speakers in the game allow you to communicate with the trapped people in each level. As you provide more
power to each speaker, the louder the range of the speaker, which means you will be able to communicate with
characters that are further away.

### Control Panel

Control panels allow you to modify the power that is supplied to various devices in each level. As you click on
each control power, you will either add or remove power to each device. Some devices can just be toggled on and
off, while others will have varying levels of power.

### Goal

In each level, your goal is to help the npc escape the level. This will involve helping unlocking a door for
them to escape through, or powering devices in each level to help them safely navigate to the exit.

## Credits

This game would not have been possible without the art and audio of these amazing artists!

| Asset | Author | Link |
| ------| ------ | ---- |
| Level Art | free-game-assets | [industrial zone tileset](https://free-game-assets.itch.io/free-industrial-zone-tileset-pixel-art) |
| Level Art | free-game-assets | [overlay effects](https://free-game-assets.itch.io/free-cyberpunk-overlay-effects-for-platformer-game) |
| npcs | free-game-assets | [townspeople](https://free-game-assets.itch.io/free-townspeople-cyberpunk-pixel-art) |
| backgrounds | free-game-assets | [backgrounds](https://free-game-assets.itch.io/free-scrolling-city-backgrounds-pixel-art) |
| UI Art | sungraphica | [ui](https://sungraphica.itch.io/sci-fi-game-ui-collection-free-version) |
| music | rustedstudio | [cybertracks](https://rustedstudio.itch.io/cybertracks-volume-1) |
| sfx | shapeforms | [sfx](https://shapeforms.itch.io/shapeforms-audio-free-sfx) |

---

## Local Development

### Requirements

[Node.js](https://nodejs.org) and [Yarn](https://yarnpkg.com/) are required to install dependencies and run scripts via `yarn`.

[Vite](https://vitejs.dev/) is required to bundle and serve the web application. This is included as part of the projects dev dependencies.

### Available Commands

| Command | Description |
|---------|-------------|
| `yarn install --frozen-lockfile` | Install project dependencies |
| `yarn start` | Build project and open web server running project |
| `yarn build` | Builds code bundle for production |
| `yarn lint` | Uses ESLint to lint code |

### Writing Code

After cloning the repo, run `yarn install --frozen-lockfile` from your project directory. Then, you can start the local development
server by running `yarn start`.

After starting the development server with `yarn start`, you can edit any files in the `src` folder
and parcel will automatically recompile and reload your server (available at `http://localhost:8080`
by default).

### Deploying Code

After you run the `yarn build` command, your code will be built into a single bundle located at
`dist/*` along with any other assets you project depended.

If you put the contents of the `dist` folder in a publicly-accessible location (say something like `http://myserver.com`),
you should be able to open `http://myserver.com/index.html` and play your game.

### Static Assets

Any static assets like images or audio files should be placed in the `public` folder. It'll then be served at `http://localhost:8080/path-to-file-your-file/file-name.file-type`.

## Issues

For any issues you encounter, please open a new [GitHub Issue](https://github.com/devshareacademy/Circuit-Rescue/issues) on this project.

## Questions, Comments, and Suggestions

If you have any questions, comments, or suggestions for future content, please feel free to open a new [GitHub Discussion](https://github.com/orgs/devshareacademy/discussions).
