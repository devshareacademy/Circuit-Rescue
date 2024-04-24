# Circuit-Rescue

A Phaser 3 game that was submitted for the Gavedev.js Jam 2024 game jam.

![Screenshot 1](/docs/screenshot1.png?raw=true 'Screenshot 1')

![Screenshot 2](/docs/screenshot2.png?raw=true 'Screenshot 2')

![Screenshot 3](/docs/screenshot5.png?raw=true 'Screenshot 3')

You can play the game here on Itch.io: [Circuit Rescue](https://galemius.itch.io/circuit-rescue)

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

![Speaker](/docs/speaker.png?raw=true 'Speaker')

Speakers in the game allow you to communicate with the trapped people in each level. As you provide more
power to each speaker, the louder the range of the speaker, which means you will be able to communicate with
characters that are further away.

### Control Panel

![Control Panel](/docs/button.png?raw=true 'Control Panel')

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
| UI | kenney | [Onscreen controls](https://www.kenney.nl/assets/onscreen-controls) |
| music | rustedstudio | [cybertracks](https://rustedstudio.itch.io/cybertracks-volume-1) |
| sfx | shapeforms | [sfx](https://shapeforms.itch.io/shapeforms-audio-free-sfx) |

---

## Local Development

### Requirements

[Node.js](https://nodejs.org) and [pNPm](https://pnpm.io/) are required to install dependencies and run scripts via `pnpm`.

[Vite](https://vitejs.dev/) is required to bundle and serve the web application. This is included as part of the projects dev dependencies.

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm install --frozen-lockfile` | Install project dependencies |
| `pnpm start` | Build project and open web server running project |
| `pnpm build` | Builds code bundle for production |
| `pnpm lint` | Uses ESLint to lint code |

### Writing Code

After cloning the repo, run `pnpm install --frozen-lockfile` from your project directory. Then, you can start the local development
server by running `pnpm start`.

After starting the development server with `pnpm start`, you can edit any files in the `src` folder
and parcel will automatically recompile and reload your server (available at `http://localhost:8080`
by default).

### Deploying Code

After you run the `pnpm build` command, your code will be built into a single bundle located at
`dist/*` along with any other assets you project depended.

If you put the contents of the `dist` folder in a publicly-accessible location (say something like `http://myserver.com`),
you should be able to open `http://myserver.com/index.html` and play your game.

### Static Assets

Any static assets like images or audio files should be placed in the `public` folder. It'll then be served at `http://localhost:8080/path-to-file-your-file/file-name.file-type`.

### Project Structure

In the project folder, there is a variety of files and folders. At a high level, here is a quick summary of what each folder and file is used for:

```
.
├── .vscode          this folder contains github workflows for this project, currently setup to allow deploying the project to itch.io
├── .vscode          this folder contains configuration files for the VSCode editor, which will add auto linting and custom launch configurations for running tests (if you are not using VSCode, you can remove this folder from the project)
├── config           this folder contains configuration files for ESLint and TSC (the TypeScript Compiler)
├── dist             a dynamically generated folder which will contain the compiled source code of the finished library (generated when you run the build script)
├── docs             this folder contains the images that are used in the README.md
├── node_modules     a dynamically generated folder which contains the project developer dependencies when working on the library (generated when you run the install script)
├── public           this folder contains all of the static assets that are used in the game
├── src              this folder contains all of the core code for the game
├── .gitignore       this file is used for telling git to ignore certain files in our project (mainly used for our project dependencies and dynamically generated files)
├── package.json     a configuration file for npm that contains metadata about the project
├── tsconfig.json    a configuration file for TSC
├── pnpm-lock.yaml   a configuration file that contains the exact tree structure of the project dependencies and their versions (helps with repeatable project builds)

## Issues

For any issues you encounter, please open a new [GitHub Issue](https://github.com/devshareacademy/Circuit-Rescue/issues) on this project.

