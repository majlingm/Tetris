import { Pieces } from './pieces.js';

export class Board {
  constructor() {
    // Setting variables
    this.boardWidth = 10;
    this.boardHeight = 20;
    this.currentPieceX = (this.boardWidth / 2) - 3;
    this.currentPieceY = 0;
    this.paper = document.getElementById('tetris');
    this.nextPieceBox = document.getElementById('nextPiece');
    this.paperCx = this.paper.getContext('2d');
    this.pieces = new Pieces();
    this.paperWidth = this.paper.width;
    this.paperHeight = this.paper.height;
    this.cellWidth = this.paperWidth / this.boardWidth;
    this.cellHeight = this.paperHeight / this.boardHeight;
    this.board = new Array(this.boardHeight);
    this.currentPieceCoords = [];
    this.currentPiece = [];
    this.nextPieceInLine = this.pieces.getNewPiece();
    this.blocks = [];

    this.init();
  }

  init() {
    this.fitBoardToScreen();

    // Preloading images
    for (let i = 0; i < 7; i++) {
      this.blocks.push(new Image());
      this.blocks[i].src = `img/block${i + 1}.png`;
    }

    // Initialize and fill the board
    for (let key = 0; key < this.board.length; key++) {
      this.board[key] = new Array(this.boardWidth);

      for (let key2 = 0; key2 < this.board[key].length; key2++) {
        if ((key2 === 0) || (key2 === (this.boardWidth - 1)) || (key === this.boardHeight - 1)) {
          this.board[key][key2] = 1;
        } else {
          this.board[key][key2] = 0;
        }
      }
    }

    window.addEventListener('resize', () => {
      this.fitBoardToScreen();
    });
  }

  drawNextPiece() {
    this.nextPieceBox.innerHTML = '';

    this.nextPieceInLine.forEach((row) => {
      row.forEach((color) => {
        if (color > 0) {
          const img = document.createElement('img');
          img.src = this.blocks[color - 1].src;
          img.width = 20;
          img.height = 20;
          img.style.cssFloat = 'left';
          this.nextPieceBox.appendChild(img);
        } else {
          const div = document.createElement('div');
          div.style.width = '20px';
          div.style.height = '20px';
          div.style.cssFloat = 'left';
          this.nextPieceBox.appendChild(div);
        }
      });
    });
  }

  movePieceLeft() {
    if (!this.detectCollision(-1, 0)) {
      this.currentPieceX--;
      this.drawBoard();
    }
  }

  movePieceRight() {
    if (!this.detectCollision(1, 0)) {
      this.currentPieceX++;
      this.drawBoard();
    }
  }

  movePieceDown() {
    if (!this.detectCollision(0, 1)) {
      this.currentPieceY++;
      this.drawBoard();
      return true;
    } else {
      return false;
    }
  }

  movePieceTo(x, y) {
    if (x !== false) {
      // x can be negative sometimes, fixing with offset
      const currentPieceXpositive = this.currentPieceX + 100;
      x = x + 100;

      let neededMovesX = x - currentPieceXpositive;
      let direction = false;

      if (neededMovesX) {
        direction = (neededMovesX / Math.abs(neededMovesX)) > 0 ? 'right' : 'left';
        neededMovesX = Math.abs(neededMovesX);

        for (let i = 0; i < neededMovesX; i++) {
          if (direction === 'left') {
            this.movePieceLeft();
          } else if (direction === 'right') {
            this.movePieceRight();
          }
        }
      }
    }

    if (y !== false) {
      let neededMovesY = y - this.currentPieceY;
      let direction = false;

      if (neededMovesY) {
        direction = (neededMovesY / Math.abs(neededMovesY)) > 0 ? 'down' : 'up';
        neededMovesY = Math.abs(neededMovesY);

        for (let i = 0; i < neededMovesY; i++) {
          if (direction === 'down') {
            this.movePieceDown();
          }
          // Can't move pieces up
        }
      }
    }
  }

  dropPiece() {
    if (this.currentPiece) {
      let yCheck = 0;

      while (!this.detectCollision(0, yCheck)) {
        yCheck++;
      }

      this.currentPieceY = this.currentPieceY + yCheck - 1;
      this.drawBoard();
      this.placePiece();
    }
  }

  getBoard() {
    return this.board;
  }

  getBoardSize() {
    return {
      w: this.boardWidth,
      h: this.boardHeight
    };
  }

  getCurrentPiecePosition() {
    return {
      x: this.currentPieceX,
      y: this.currentPieceY
    };
  }

  fitBoardToScreen() {
    const availablePixels = window.innerHeight;
    const tetrisPosition = this.paper.getBoundingClientRect();

    const adjustedPixels = availablePixels - (Math.ceil(tetrisPosition.top) * 2);
    this.paper.width = adjustedPixels / 2;
    this.paper.height = adjustedPixels;
  }

  pieceToCoords(piece) {
    const coords = [];

    piece.forEach((row, y) => {
      row.forEach((c, x) => {
        if (c) {
          coords.push([y, x, c]);
        }
      });
    });

    // Make some corrections to make each piece start at the top
    coords.forEach((value, key) => {
      coords[key][0] += -(coords[coords.length - 1][0]);
    });

    return coords;
  }

  nextPiece(newPiece) {
    if (newPiece) {
      this.currentPiece = this.nextPieceInLine;
      this.nextPieceInLine = this.pieces.getNewPiece();
      this.currentPieceX = (this.boardWidth / 2) - 3;
      this.currentPieceY = 0;
      this.drawNextPiece();

      if (this.detectCollision(0, 0, this.pieceToCoords(this.currentPiece))) {
        return false;
      }
    } else {
      if (!this.detectCollision(0, 0, this.pieceToCoords(this.pieces.seeNextInRotation()))) {
        this.currentPiece = this.pieces.getNextRotation();
      } else {
        return false;
      }
    }

    this.currentPieceCoords = [];
    this.currentPieceCoords = this.pieceToCoords(this.currentPiece);
    this.drawBoard();
    return true;
  }

  // Tests if a piece can move x, y steps, returns true if collision is detected
  // If piece isn't set it will use the currentPieceCoords
  detectCollision(x, y, piece) {
    let result = 0;
    const pieceCoords = piece ? [...piece.map(arr => [...arr])] : [...this.currentPieceCoords.map(arr => [...arr])];

    pieceCoords.forEach((value) => {
      // Only check places that are on screen
      if ((value[0] + this.currentPieceY + y) >= 0 &&
          (value[1] + this.currentPieceX + x) >= 0 &&
          (value[1] + this.currentPieceX) < this.boardWidth) {
        result += this.board[value[0] + this.currentPieceY + y][value[1] + this.currentPieceX + x];
      }

      if (((value[1] + this.currentPieceX + x) < 1) ||
          ((value[1] + this.currentPieceX + x) >= (this.boardWidth - 1))) {
        result += 1;
      }
    });

    return result;
  }

  // Adds a piece to the board so that it sticks
  placePiece() {
    if (this.currentPiece) {
      this.currentPieceCoords.forEach((value) => {
        if ((value[0] + this.currentPieceY) >= 0) {
          this.board[value[0] + this.currentPieceY][value[1] + this.currentPieceX] = value[2];
        }
      });

      this.currentPiece = false;
    }
  }

  // Removes rows that are full from the board array, returning number of rows removed
  removeFullRows() {
    let rows = 0;

    for (let key = 0; key < this.board.length; key++) {
      let count = 0;

      for (let key2 = 0; key2 < this.board[key].length; key2++) {
        if (this.board[key][key2] > 1) {
          count++;
        }
      }

      if (count === (this.boardWidth - 2)) {
        const emptyRow = new Array(this.boardWidth).fill(0);
        emptyRow[0] = 1;
        emptyRow[emptyRow.length - 1] = 1;
        rows++;
        this.board.splice(key, 1);
        this.board.unshift(emptyRow);
      }
    }

    this.drawBoard();
    return rows;
  }

  // Draws the board and the pieces on it to a canvas element
  drawBoard() {
    let x = 0;
    let y = 0;
    let yCheck = 0;

    // Deep copy the array
    const currentBoard = this.board.map(row => [...row]);

    // Is there a piece on the board
    if (this.currentPiece) {
      // Calculate shadowPiece
      while (!this.detectCollision(0, yCheck)) {
        yCheck++;
      }

      this.currentPieceCoords.forEach((value) => {
        // Add shadowPiece
        if ((value[0] + this.currentPieceY + yCheck > 0) &&
            (currentBoard[value[0] + this.currentPieceY + yCheck - 1][value[1] + this.currentPieceX] === 0)) {
          currentBoard[value[0] + this.currentPieceY + yCheck - 1][value[1] + this.currentPieceX] = 7;
        }

        // Only add blocks that are on screen
        if ((value[0] + this.currentPieceY) >= 0) {
          currentBoard[value[0] + this.currentPieceY][value[1] + this.currentPieceX] = value[2];
        }
      });
    }

    this.clearBoard();

    currentBoard.forEach((row, rowKey) => {
      row.forEach((cell, cellKey) => {
        if (currentBoard[rowKey][cellKey] === 1) {
          // Wall - don't draw
        } else if (currentBoard[rowKey][cellKey] > 1) {
          this.paperCx.drawImage(
            this.blocks[currentBoard[rowKey][cellKey] - 1],
            x,
            y,
            (this.paperWidth / 500) * 50,
            (this.paperHeight / 1000) * 50
          );
        }
        x += this.cellWidth;
      });

      x = 0;
      y += this.cellHeight;
    });
  }

  // Clears the canvas element
  clearBoard() {
    this.paperCx.clearRect(0, 0, this.paper.width, this.paper.height);
  }

  // Fills the board with blocks, used to show the game is over
  fillBoard() {
    this.board.forEach((row, key) => {
      row.forEach((value, key2) => {
        if (this.board[key][key2] !== 1) {
          this.board[key][key2] = Math.floor(Math.random() * 5) + 2;
        }
      });
    });

    this.drawBoard();
  }
}
