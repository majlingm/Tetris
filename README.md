# Tetris

A Tetris clone written in JavaScript, originally created in 2010 and modernized in 2024.

## Features

- Classic Tetris gameplay
- **Single-player mode** with progressive difficulty
- **Multiplayer mode** with real-time PvP battles
- Keyboard and touch controls
- Responsive design
- Progressive difficulty (10 levels)
- Scoring system based on lines cleared
- Shadow piece preview
- Next piece preview
- Send attack lines to your opponent in multiplayer!

## Controls

### Keyboard
- **Arrow Left**: Move piece left
- **Arrow Right**: Move piece right
- **Arrow Down**: Move piece down faster
- **Arrow Up**: Rotate piece
- **Space**: Drop piece instantly
- **P**: Pause/unpause game

### Touch (Mobile)
- **Tap**: Rotate piece
- **Swipe Down**: Drop piece
- **Drag Left/Right**: Move piece horizontally
- **Drag Down**: Move piece down

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running Single Player (Static)

For single-player development with hot reload:
```bash
npm run dev
```

This will start a local development server (typically at `http://localhost:5173`).

### Running Multiplayer Server

To play multiplayer, you need to run the Node.js server:

```bash
npm run server
```

This will start the multiplayer server on `http://localhost:8080`.

For development with auto-restart:
```bash
npm run server:dev
```

Then open `http://localhost:8080` in your browser to access:
- **Menu** - Choose between single and multiplayer
- **Single Player** - Play solo
- **Multiplayer** - Wait for an opponent and battle!

**Note:** To test multiplayer locally, open two browser windows/tabs and both players will be automatically paired.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Game Modes

### Single Player
- Classic Tetris experience
- Increasing difficulty up to level 10
- High score tracking (local session)

### Multiplayer
- Real-time player vs player battles
- Automatic matchmaking (pairs two players)
- Send attack lines to your opponent when you clear multiple lines
- First player to top out loses
- Live opponent board preview

## Multiplayer Mechanics

- Clear **2 lines**: Send 1 attack line to opponent
- Clear **3 lines**: Send 2 attack lines to opponent
- Clear **4 lines** (Tetris): Send 3 attack lines to opponent
- Attack lines are added to the bottom of opponent's board with random gaps
- Strategy: Clear multiple lines at once to pressure your opponent!

## Modernization (2024)

This project was originally written in 2010 using jQuery and older JavaScript patterns. The 2024 modernization includes:

- **ES6+ Modules**: Converted from global scripts to ES6 module system
- **Modern JavaScript**: Uses classes, arrow functions, const/let, template literals
- **No jQuery**: Replaced with vanilla JavaScript DOM manipulation
- **Modern Touch Events**: Replaced Hammer.js with native touch event handling
- **Multiplayer Server**: Modernized Node.js server with Express and Socket.io
- **Build System**: Added Vite for modern development experience
- **Package Management**: Added npm/package.json for dependency management
- **Clean CSS**: Removed unnecessary vendor prefixes
- **Better Code Organization**: Modular structure with clear separation of concerns

## Technology Stack

### Client-Side
- **Vanilla JavaScript** (ES6+)
- **HTML5 Canvas** for rendering
- **CSS3** for styling
- **Socket.io Client** for multiplayer real-time communication
- **Vite** for build tooling

### Server-Side (Multiplayer)
- **Node.js** (ES6+ modules)
- **Express** for HTTP server
- **Socket.io** for WebSocket real-time communication
- Automatic player matchmaking system

## License

MIT

## Author

Original: Mikael Majling (2010)
Modernized: 2024
