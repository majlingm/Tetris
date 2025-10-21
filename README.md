# Tetris

A Tetris clone written in JavaScript, originally created in 2010 and modernized in 2024.

## Features

- Classic Tetris gameplay
- Keyboard and touch controls
- Responsive design
- Progressive difficulty (10 levels)
- Scoring system based on lines cleared
- Shadow piece preview
- Next piece preview

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

### Running Locally

For development with hot reload:
```bash
npm run dev
```

This will start a local development server (typically at `http://localhost:5173`).

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Modernization (2024)

This project was originally written in 2010 using jQuery and older JavaScript patterns. The 2024 modernization includes:

- **ES6+ Modules**: Converted from global scripts to ES6 module system
- **Modern JavaScript**: Uses classes, arrow functions, const/let, template literals
- **No jQuery**: Replaced with vanilla JavaScript DOM manipulation
- **Modern Touch Events**: Replaced Hammer.js with native touch event handling
- **Build System**: Added Vite for modern development experience
- **Package Management**: Added npm/package.json for dependency management
- **Clean CSS**: Removed unnecessary vendor prefixes
- **Better Code Organization**: Modular structure with clear separation of concerns

## Technology Stack

- **Vanilla JavaScript** (ES6+)
- **HTML5 Canvas** for rendering
- **CSS3** for styling
- **Vite** for build tooling

## License

MIT

## Author

Original: Mikael Majling (2010)
Modernized: 2024
