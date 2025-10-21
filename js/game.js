import { Board } from './board.js';

export class Game {
  constructor() {
    this.board = new Board();
    this.scoreBoard = document.getElementById('scoreBoard');
    this.touchSensitivityX = 1.2;
    this.touchSensitivityY = 1;
    this.scoreTotal = 0;
    this.linesTotal = 0;
    this.level = 0;
    this.delay = 1000 - (this.level * 6);
    this.interval = null;
    this.paused = false;

    // Defining keyboard controls
    this.movingLeft = false;
    this.movingRight = false;
    this.movingDown = false;
    this.dragStartPiecePosition = false;

    // Touch handling state
    this.touchState = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isDragging: false,
      startTime: 0
    };
  }

  start() {
    // Set the events, key controls
    this.setEvents();

    // Starting the main loop
    setTimeout(() => this.mainLoop(), this.delay);
    this.board.nextPiece(true);
  }

  setEvents() {
    // Keyboard events
    document.addEventListener('keydown', (event) => {
      if (event.which === 37 && !this.movingLeft) {
        this.board.movePieceLeft();
        this.movingLeft = setInterval(() => this.board.movePieceLeft(), 150);
      }

      if (event.which === 39 && !this.movingRight) {
        this.board.movePieceRight();
        this.movingRight = setInterval(() => this.board.movePieceRight(), 150);
      }

      if (event.which === 40 && !this.movingDown) {
        this.board.movePieceDown();
        this.movingDown = setInterval(() => this.board.movePieceDown(), 150);
      }

      if (event.which === 38) {
        this.board.nextPiece(false);
      }

      if (event.which === 32) {
        this.board.dropPiece(false);
      }

      if (event.which === 80) {
        if (this.paused) {
          this.unPause();
        } else {
          this.pause();
        }
      }

      console.log(this.board.getCurrentPiecePosition());
    });

    document.addEventListener('keyup', (event) => {
      if (event.which === 37) {
        clearInterval(this.movingLeft);
        this.movingLeft = false;
      }

      if (event.which === 39) {
        clearInterval(this.movingRight);
        this.movingRight = false;
      }

      if (event.which === 40) {
        clearInterval(this.movingDown);
        this.movingDown = false;
      }
    });

    // Modern touch event handling (replaces Hammer.js)
    document.body.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      this.touchState.startX = touch.clientX;
      this.touchState.startY = touch.clientY;
      this.touchState.currentX = touch.clientX;
      this.touchState.currentY = touch.clientY;
      this.touchState.isDragging = false;
      this.touchState.startTime = Date.now();
      this.dragStartPiecePosition = this.board.getCurrentPiecePosition();
    }, { passive: false });

    document.body.addEventListener('touchmove', (event) => {
      event.preventDefault();
      const touch = event.touches[0];
      this.touchState.currentX = touch.clientX;
      this.touchState.currentY = touch.clientY;

      const deltaX = this.touchState.currentX - this.touchState.startX;
      const deltaY = this.touchState.currentY - this.touchState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > 10) {
        this.touchState.isDragging = true;
        this.handleDrag(deltaX, deltaY);
      }
    }, { passive: false });

    document.body.addEventListener('touchend', (event) => {
      event.preventDefault();
      const deltaX = this.touchState.currentX - this.touchState.startX;
      const deltaY = this.touchState.currentY - this.touchState.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const timeDiff = Date.now() - this.touchState.startTime;

      // Detect swipe down (fast downward movement)
      if (timeDiff < 300 && deltaY > 50 && Math.abs(deltaX) < 50) {
        this.board.dropPiece(false);
      }
      // Detect tap (no significant movement)
      else if (!this.touchState.isDragging && distance < 10) {
        this.board.nextPiece(false);
      }

      this.touchState.isDragging = false;
    }, { passive: false });
  }

  handleDrag(deltaX, deltaY) {
    const boardSize = this.board.getBoardSize();
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine primary direction
    if (absX > absY) {
      // Horizontal drag
      const windowWidth = window.innerWidth;
      const triggerSpace = windowWidth / (boardSize.w * this.touchSensitivityX);
      const rowsToMove = deltaX / triggerSpace;
      const newPosition = this.dragStartPiecePosition.x +
        ((rowsToMove / Math.abs(rowsToMove)) * Math.floor(Math.abs(rowsToMove)));

      this.board.movePieceTo(newPosition, false);
    } else {
      // Vertical drag
      const windowHeight = window.innerHeight;
      const triggerSpace = windowHeight / (boardSize.h * this.touchSensitivityY);
      const rowsToMove = deltaY / triggerSpace;
      const newPosition = this.dragStartPiecePosition.y +
        ((rowsToMove / Math.abs(rowsToMove)) * Math.floor(Math.abs(rowsToMove)));

      this.board.movePieceTo(false, newPosition);
    }
  }

  pause() {
    this.paused = true;
  }

  unPause() {
    this.paused = false;
    setTimeout(() => this.mainLoop(), this.delay);
  }

  mainLoop() {
    if (!this.board.movePieceDown()) {
      this.board.placePiece();

      // Calculate game level, speed, score etc.
      const lines = this.board.removeFullRows();
      this.linesTotal += lines;
      this.level = (Math.floor(this.linesTotal / 6) <= 10) ? Math.floor(this.linesTotal / 6) : 10;
      const delay = 1000 - (this.level * 83);
      this.scoreTotal += Math.floor(((this.level / 2 + 1) * (lines * 100) + (10 * lines * lines * (this.level / 3))));
      this.scoreBoard.innerHTML = `<p>Score:${this.scoreTotal}</p><p> Lines:${this.linesTotal}</p><p> Level:${this.level}</p>`;

      if (!this.board.nextPiece(true)) {
        // Can't place the next piece
        // Game Over
        this.board.fillBoard();
        this.scoreBoard.innerHTML = `<p><strong>Game Over</strong></p><p>Score:${this.scoreTotal}</p><p> Lines:${this.linesTotal}</p><p> Level:${this.level}</p>`;
        return false;
      }
    } else {
      const delay = 1000 - (this.level * 83);
    }

    if (!this.paused) {
      setTimeout(() => this.mainLoop(), this.delay);
    }
  }
}
