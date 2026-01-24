import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

interface GameRoom {
  id: string;
  teacherId: string;
  players: Map<string, PlayerState>;
  gameState: 'waiting' | 'spinning' | 'answering' | 'results' | 'ended';
  currentChallenge: any;
  leaderboard: PlayerScore[];
  createdAt: Date;
}

interface PlayerState {
  id: string;
  name: string;
  socketId: string;
  score: number;
  streak: number;
  answered: boolean;
  answer?: string;
  isConnected: boolean;
}

interface PlayerScore {
  playerId: string;
  name: string;
  score: number;
  streak: number;
  position: number;
}

class WebSocketManager {
  private io: SocketIOServer;
  private gameRooms: Map<string, GameRoom> = new Map();
  private playerToRoom: Map<string, string> = new Map(); // socketId -> roomId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[WebSocket] Player connected: ${socket.id}`);

      // Player joins a game room
      socket.on('joinGame', (data: { roomId: string; playerName: string }) => {
        this.handlePlayerJoin(socket, data);
      });

      // Player submits an answer
      socket.on('submitAnswer', (data: { roomId: string; answer: string }) => {
        this.handleAnswerSubmission(socket, data);
      });

      // Teacher starts the game
      socket.on('startGame', (data: { roomId: string }) => {
        this.handleGameStart(socket, data);
      });

      // Teacher spins the roulette wheel
      socket.on('spinRoulette', (data: { roomId: string }) => {
        this.handleRouletteSpun(socket, data);
      });

      // Teacher ends the round
      socket.on('endRound', (data: { roomId: string }) => {
        this.handleRoundEnd(socket, data);
      });

      // Teacher ends the game
      socket.on('endGame', (data: { roomId: string }) => {
        this.handleGameEnd(socket, data);
      });

      // Player disconnects
      socket.on('disconnect', () => {
        this.handlePlayerDisconnect(socket);
      });

      // Player reconnects
      socket.on('reconnect', () => {
        console.log(`[WebSocket] Player reconnected: ${socket.id}`);
      });
    });
  }

  private handlePlayerJoin(socket: Socket, data: { roomId: string; playerName: string }) {
    const { roomId, playerName } = data;

    // Get or create game room
    let room = this.gameRooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        teacherId: '', // Will be set by teacher
        players: new Map(),
        gameState: 'waiting',
        currentChallenge: null,
        leaderboard: [],
        createdAt: new Date(),
      };
      this.gameRooms.set(roomId, room);
    }

    // Add player to room
    const playerState: PlayerState = {
      id: `player_${Date.now()}`,
      name: playerName,
      socketId: socket.id,
      score: 0,
      streak: 0,
      answered: false,
      isConnected: true,
    };

    room.players.set(socket.id, playerState);
    this.playerToRoom.set(socket.id, roomId);

    // Join socket to room
    socket.join(roomId);

    // Notify all players in the room
    this.io.to(roomId).emit('playerJoined', {
      playerName,
      playersCount: room.players.size,
      leaderboard: this.getLeaderboard(room),
    });

    console.log(`[WebSocket] Player ${playerName} joined room ${roomId}`);
  }

  private handleAnswerSubmission(socket: Socket, data: { roomId: string; answer: string }) {
    const { roomId, answer } = data;
    const room = this.gameRooms.get(roomId);

    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    // Mark player as answered
    player.answered = true;
    player.answer = answer;

    // Calculate points based on speed and correctness
    const isCorrect = this.checkAnswer(answer, room.currentChallenge);
    const points = isCorrect ? 100 : 0;

    if (isCorrect) {
      player.score += points;
      player.streak += 1;
    } else {
      player.streak = 0;
    }

    // Send instant feedback to player
    socket.emit('answerFeedback', {
      isCorrect,
      points,
      newScore: player.score,
      streak: player.streak,
    });

    // Update leaderboard for all players
    const updatedLeaderboard = this.getLeaderboard(room);
    this.io.to(roomId).emit('leaderboardUpdate', {
      leaderboard: updatedLeaderboard,
      playerName: player.name,
      isCorrect,
    });

    console.log(`[WebSocket] Player ${player.name} answered: ${answer} (Correct: ${isCorrect})`);
  }

  private handleGameStart(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.gameRooms.get(roomId);

    if (!room) return;

    room.gameState = 'spinning';

    // Reset player states
    room.players.forEach((player) => {
      player.answered = false;
      player.answer = undefined;
    });

    // Notify all players
    this.io.to(roomId).emit('gameStarted', {
      message: 'Game has started!',
      gameState: room.gameState,
    });

    console.log(`[WebSocket] Game started in room ${roomId}`);
  }

  private handleRouletteSpun(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.gameRooms.get(roomId);

    if (!room) return;

    room.gameState = 'answering';

    // Generate a random challenge
    room.currentChallenge = this.generateChallenge();

    // Reset player answered states
    room.players.forEach((player) => {
      player.answered = false;
      player.answer = undefined;
    });

    // Notify all players with the challenge
    this.io.to(roomId).emit('rouletteSpun', {
      challenge: room.currentChallenge,
      timerSeconds: 30,
    });

    console.log(`[WebSocket] Roulette spun in room ${roomId}: ${room.currentChallenge.type}`);
  }

  private handleRoundEnd(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.gameRooms.get(roomId);

    if (!room) return;

    room.gameState = 'results';

    // Calculate final leaderboard
    const leaderboard = this.getLeaderboard(room);

    // Notify all players with results
    this.io.to(roomId).emit('roundEnded', {
      leaderboard,
      correctAnswer: room.currentChallenge?.answer,
    });

    console.log(`[WebSocket] Round ended in room ${roomId}`);
  }

  private handleGameEnd(socket: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const room = this.gameRooms.get(roomId);

    if (!room) return;

    room.gameState = 'ended';

    const finalLeaderboard = this.getLeaderboard(room);

    // Notify all players with final results
    this.io.to(roomId).emit('gameEnded', {
      finalLeaderboard,
      message: 'Game has ended!',
    });

    // Clean up room after 5 minutes
    setTimeout(() => {
      this.gameRooms.delete(roomId);
    }, 5 * 60 * 1000);

    console.log(`[WebSocket] Game ended in room ${roomId}`);
  }

  private handlePlayerDisconnect(socket: Socket) {
    const roomId = this.playerToRoom.get(socket.id);

    if (roomId) {
      const room = this.gameRooms.get(roomId);
      if (room) {
        const player = room.players.get(socket.id);
        if (player) {
          player.isConnected = false;

          // Notify other players
          this.io.to(roomId).emit('playerDisconnected', {
            playerName: player.name,
            playersCount: Array.from(room.players.values()).filter((p) => p.isConnected).length,
          });

          console.log(`[WebSocket] Player ${player.name} disconnected from room ${roomId}`);
        }
      }
    }

    this.playerToRoom.delete(socket.id);
  }

  private getLeaderboard(room: GameRoom): PlayerScore[] {
    const scores = Array.from(room.players.values())
      .filter((p) => p.isConnected)
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        score: p.score,
        streak: p.streak,
        position: 0,
      }))
      .sort((a, b) => b.score - a.score);

    // Assign positions
    scores.forEach((score, index) => {
      score.position = index + 1;
    });

    return scores;
  }

  private checkAnswer(answer: string, challenge: any): boolean {
    if (!challenge) return false;
    return answer.toLowerCase().trim() === challenge.answer.toLowerCase().trim();
  }

  private generateChallenge() {
    const challengeTypes = ['trivia', 'match', 'recipe', 'wellness', 'speed'];
    const type = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

    const challenges: Record<string, any> = {
      trivia: {
        type: 'trivia',
        question: 'Which food group is most important for bone health?',
        answer: 'Dairy',
      },
      match: {
        type: 'match',
        question: 'Match the food to its food group: Broccoli',
        answer: 'Vegetables',
      },
      recipe: {
        type: 'recipe',
        question: 'Name a Wisconsin dairy product',
        answer: 'Cheese',
      },
      wellness: {
        type: 'wellness',
        question: 'How many servings of fruits should you eat daily?',
        answer: '2',
      },
      speed: {
        type: 'speed',
        question: 'Name a Wisconsin crop',
        answer: 'Corn',
      },
    };

    return challenges[type];
  }

  public getIO() {
    return this.io;
  }

  public getGameRoom(roomId: string) {
    return this.gameRooms.get(roomId);
  }

  public getAllRooms() {
    return Array.from(this.gameRooms.values());
  }
}

export { WebSocketManager, GameRoom, PlayerState, PlayerScore };
