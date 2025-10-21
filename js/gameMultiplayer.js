import { Board } from './board.js';

export class GameMultiplayer {
  constructor(socket) {
    this.socket = socket;
    this.board = new Board();
    this.opponentBoard = null;
    this.scoreBoard = document.getElementById('scoreBoard');
    this.statusBoard = document.getElementById('statusBoard');
    this.opponentCanvas = document.getElementById('opponentBoard');
    this.opponentCtx = this.opponentCanvas ? this.opponentCanvas.getContext('2d') : null;

    this.touchSensitivityX = 1.2;
    this.touchSensitivityY = 1;
    this.scoreTotal = 0;
    this.linesTotal = 0;
    this.level = 0;
    this.delay = 1000 - (this.level * 6);
    this.paused = false;
    this.gameStarted = false;
    this.isLeader = false;

    // Keyboard controls
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

    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.socket.on('waitingForOpponent', () => {
      this.updateStatus('Waiting for opponent...');
    });

    this.socket.on('opponentFound', (data) => {
      this.updateStatus('Opponent found! Get ready...');
      // Signal we're ready to start
      setTimeout(() => {
        this.socket.emit('playerReady');
      }, 1000);
    });

    this.socket.on('startGame', (data) => {
      this.isLeader = data.isLeader;
      this.start();
    });

    this.socket.on('nextTick', () => {
      // Server-controlled game tick (not used in client-controlled mode)
    });

    this.socket.on('receiveLines', (data) => {
      this.addPenaltyLines(data.lines);
    });

    this.socket.on('updateOpponentBoard', (data) => {
      this.opponentBoard = data.board;
      this.drawOpponentBoard();
    });

    this.socket.on('winner', () => {
      this.updateStatus('YOU WIN!');
      this.paused = true;
    });

    this.socket.on('loser', () => {
      this.updateStatus('GAME OVER - You Lost');
      this.paused = true;
      this.board.fillBoard();
    });

    this.socket.on('opponentDisconnected', () => {
      this.updateStatus('Opponent disconnected - You Win!');
      this.paused = true;
    });
  }

  updateStatus(message) {
    if (this.statusBoard) {
      this.statusBoard.innerHTML = `<p>${message}</p>`;
    }
  }

  start() {
    this.gameStarted = true;
    this.updateStatus('FIGHT!');

    setTimeout(() => {
      this.updateStatus('');
    }, 2000);

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

    // Modern touch event handling
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

      // Detect swipe down
      if (timeDiff < 300 && deltaY > 50 && Math.abs(deltaX) < 50) {
        this.board.dropPiece(false);
      }
      // Detect tap
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

    if (absX > absY) {
      const windowWidth = window.innerWidth;
      const triggerSpace = windowWidth / (boardSize.w * this.touchSensitivityX);
      const rowsToMove = deltaX / triggerSpace;
      const newPosition = this.dragStartPiecePosition.x +
        ((rowsToMove / Math.abs(rowsToMove)) * Math.floor(Math.abs(rowsToMove)));

      this.board.movePieceTo(newPosition, false);
    } else {
      const windowHeight = window.innerHeight;
      const triggerSpace = windowHeight / (boardSize.h * this.touchSensitivityY);
      const rowsToMove = deltaY / triggerSpace;
      const newPosition = this.dragStartPiecePosition.y +
        ((rowsToMove / Math.abs(rowsToMove)) * Math.floor(Math.abs(rowsToMove)));

      this.board.movePieceTo(false, newPosition);
    }
  }

  addPenaltyLines(numLines) {
    // Add penalty lines to the bottom of the board
    const boardArray = this.board.getBoard();
    const boardWidth = this.board.getBoardSize().w;

    for (let i = 0; i < numLines; i++) {
      // Remove top row
      boardArray.shift();

      // Add new row at bottom with random gaps
      const newRow = new Array(boardWidth).fill(2);
      newRow[0] = 1; // Wall
      newRow[boardWidth - 1] = 1; // Wall

      // Create a random gap
      const gapPosition = Math.floor(Math.random() * (boardWidth - 2)) + 1;
      newRow[gapPosition] = 0;

      boardArray.push(newRow);
    }

    this.board.drawBoard();
  }

  drawOpponentBoard() {
    if (!this.opponentCtx || !this.opponentBoard) return;

    const canvas = this.opponentCanvas;
    const ctx = this.opponentCtx;
    const cellWidth = canvas.width / 10;
    const cellHeight = canvas.height / 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let y = 0;
    this.opponentBoard.forEach((row) => {
      let x = 0;
      row.forEach((cell) => {
        if (cell > 1) {
          ctx.fillStyle = this.getCellColor(cell);
          ctx.fillRect(x, y, cellWidth - 1, cellHeight - 1);
        }
        x += cellWidth;
      });
      y += cellHeight;
    });
  }

  getCellColor(colorIndex) {
    const colors = [
      '#000000', // 0 - empty
      '#333333', // 1 - wall
      '#00ffff', // 2 - I piece (cyan)
      '#ffff00', // 3 - O piece (yellow)
      '#800080', // 4 - T piece (purple)
      '#00ff00', // 5 - S piece (green)
      '#ff0000', // 6 - Z piece (red)
      '#0000ff', // 7 - J piece (blue)
      '#ff8000'  // 8 - L piece (orange)
    ];
    return colors[colorIndex] || '#ffffff';
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
      this.delay = 1000 - (this.level * 83);
      this.scoreTotal += Math.floor(((this.level / 2 + 1) * (lines * 100) + (10 * lines * lines * (this.level / 3))));
      this.scoreBoard.innerHTML = `<p>Score:${this.scoreTotal}</p><p>Lines:${this.linesTotal}</p><p>Level:${this.level}</p>`;

      // Send lines to opponent if we cleared any
      if (lines > 1) {
        this.socket.emit('sendLines', { lines: lines - 1 });
      }

      // Send board state to opponent
      this.socket.emit('sendBoard', { board: this.board.getBoard() });

      if (!this.board.nextPiece(true)) {
        // Can't place the next piece - Game Over
        this.board.fillBoard();
        this.socket.emit('gameOver');
        this.scoreBoard.innerHTML = `<p><strong>Game Over</strong></p><p>Score:${this.scoreTotal}</p><p>Lines:${this.linesTotal}</p><p>Level:${this.level}</p>`;
        return false;
      }
    }

    if (!this.paused) {
      setTimeout(() => this.mainLoop(), this.delay);
    }
  }
}
