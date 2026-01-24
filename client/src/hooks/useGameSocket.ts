import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
  streak: number;
  position: number;
}

interface Challenge {
  type: string;
  question: string;
  answer?: string;
}

interface AnswerFeedback {
  isCorrect: boolean;
  points: number;
  newScore: number;
  streak: number;
}

export const useGameSocket = (roomId: string, playerName: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [gameState, setGameState] = useState<'waiting' | 'spinning' | 'answering' | 'results' | 'ended'>('waiting');
  const [playerCount, setPlayerCount] = useState(0);
  const [answerFeedback, setAnswerFeedback] = useState<AnswerFeedback | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    // Initialize Socket.IO connection
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      setIsConnected(true);

      // Join the game room
      socket.emit('joinGame', { roomId, playerName });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setIsConnected(false);
    });

    // Game events
    socket.on('playerJoined', (data) => {
      setPlayerCount(data.playersCount);
      setLeaderboard(data.leaderboard);
    });

    socket.on('gameStarted', (data) => {
      setGameState(data.gameState);
    });

    socket.on('rouletteSpun', (data) => {
      setCurrentChallenge(data.challenge);
      setTimerSeconds(data.timerSeconds);
      setGameState('answering');
    });

    socket.on('answerFeedback', (data: AnswerFeedback) => {
      setAnswerFeedback(data);
    });

    socket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data.leaderboard);
    });

    socket.on('roundEnded', (data) => {
      setGameState('results');
      setLeaderboard(data.leaderboard);
    });

    socket.on('gameEnded', (data) => {
      setGameState('ended');
      setLeaderboard(data.finalLeaderboard);
    });

    socket.on('playerDisconnected', (data) => {
      setPlayerCount(data.playersCount);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, playerName]);

  const submitAnswer = useCallback((answer: string) => {
    if (socketRef.current) {
      socketRef.current.emit('submitAnswer', { roomId, answer });
    }
  }, [roomId]);

  const startGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('startGame', { roomId });
    }
  }, [roomId]);

  const spinRoulette = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('spinRoulette', { roomId });
    }
  }, [roomId]);

  const endRound = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('endRound', { roomId });
    }
  }, [roomId]);

  const endGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('endGame', { roomId });
    }
  }, [roomId]);

  return {
    isConnected,
    leaderboard,
    currentChallenge,
    gameState,
    playerCount,
    answerFeedback,
    timerSeconds,
    submitAnswer,
    startGame,
    spinRoulette,
    endRound,
    endGame,
  };
};
