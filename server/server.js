import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Serve static files from the root directory
app.use(express.static(join(__dirname, '..')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '..', 'menu.html'));
});

app.get('/singleplayer', (req, res) => {
  res.sendFile(join(__dirname, '..', 'index.html'));
});

app.get('/multiplayer', (req, res) => {
  res.sendFile(join(__dirname, '..', 'tetris2p.html'));
});

// Tetris multiplayer game logic
class GameRoom {
  constructor() {
    this.playerQueue = [];
    this.activeGames = new Map();
  }

  addPlayer(socket) {
    const player = {
      id: socket.id,
      socket: socket,
      connected: true,
      ready: false,
      gameOver: false,
      opponent: null
    };

    this.playerQueue.push(player);
    console.log(`Player ${socket.id} joined the queue. Queue size: ${this.playerQueue.length}`);

    // Try to pair with waiting player
    if (this.playerQueue.length >= 2) {
      this.pairPlayers();
    } else {
      socket.emit('waitingForOpponent');
    }

    return player;
  }

  pairPlayers() {
    if (this.playerQueue.length < 2) return;

    const player1 = this.playerQueue.shift();
    const player2 = this.playerQueue.shift();

    player1.opponent = player2;
    player2.opponent = player1;

    const gameId = `game_${player1.id}_${player2.id}`;
    this.activeGames.set(player1.id, { gameId, player: player1 });
    this.activeGames.set(player2.id, { gameId, player: player2 });

    console.log(`Pairing ${player1.id} with ${player2.id}`);

    player1.socket.emit('opponentFound', { opponentId: player2.id });
    player2.socket.emit('opponentFound', { opponentId: player1.id });
  }

  playerReady(socketId) {
    const game = this.activeGames.get(socketId);
    if (!game) return;

    const player = game.player;
    player.ready = true;

    console.log(`Player ${socketId} is ready`);

    if (player.opponent && player.opponent.ready) {
      console.log('Both players ready, starting game!');
      player.socket.emit('startGame', { isLeader: true });
      player.opponent.socket.emit('startGame', { isLeader: false });
      this.startGameLoop(player, player.opponent);
    }
  }

  startGameLoop(player1, player2) {
    const sendTick = () => {
      if (!player1.gameOver && !player2.gameOver && player1.connected && player2.connected) {
        player1.socket.emit('nextTick');
        player2.socket.emit('nextTick');
        setTimeout(sendTick, 800);
      } else if (player1.gameOver && !player2.gameOver) {
        player2.socket.emit('winner');
        player1.socket.emit('loser');
      } else if (player2.gameOver && !player1.gameOver) {
        player1.socket.emit('winner');
        player2.socket.emit('loser');
      } else if (!player1.connected) {
        player2.socket.emit('opponentDisconnected');
      } else if (!player2.connected) {
        player1.socket.emit('opponentDisconnected');
      }
    };

    sendTick();
  }

  sendLines(socketId, lines) {
    const game = this.activeGames.get(socketId);
    if (game && game.player.opponent) {
      game.player.opponent.socket.emit('receiveLines', { lines });
    }
  }

  sendBoard(socketId, board) {
    const game = this.activeGames.get(socketId);
    if (game && game.player.opponent) {
      game.player.opponent.socket.emit('updateOpponentBoard', { board });
    }
  }

  setGameOver(socketId) {
    const game = this.activeGames.get(socketId);
    if (game) {
      game.player.gameOver = true;
      console.log(`Player ${socketId} game over`);
    }
  }

  removePlayer(socketId) {
    const game = this.activeGames.get(socketId);

    if (game) {
      const player = game.player;
      player.connected = false;

      if (player.opponent) {
        player.opponent.socket.emit('opponentDisconnected');
      }

      this.activeGames.delete(socketId);
      console.log(`Player ${socketId} disconnected`);
    }

    // Remove from queue if still waiting
    const queueIndex = this.playerQueue.findIndex(p => p.id === socketId);
    if (queueIndex !== -1) {
      this.playerQueue.splice(queueIndex, 1);
    }
  }
}

const gameRoom = new GameRoom();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('joinGame', () => {
    gameRoom.addPlayer(socket);
  });

  socket.on('playerReady', () => {
    gameRoom.playerReady(socket.id);
  });

  socket.on('sendLines', (data) => {
    gameRoom.sendLines(socket.id, data.lines);
  });

  socket.on('sendBoard', (data) => {
    gameRoom.sendBoard(socket.id, data.board);
  });

  socket.on('gameOver', () => {
    gameRoom.setGameOver(socket.id);
  });

  socket.on('disconnect', () => {
    gameRoom.removePlayer(socket.id);
  });
});

const PORT = process.env.PORT || 8080;

httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║      Tetris Multiplayer Server          ║
╚══════════════════════════════════════════╝

Server running on http://localhost:${PORT}

Available routes:
  - http://localhost:${PORT}/              (Menu)
  - http://localhost:${PORT}/singleplayer  (Single Player)
  - http://localhost:${PORT}/multiplayer   (Multiplayer)

Waiting for players...
  `);
});
