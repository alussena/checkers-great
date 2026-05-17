import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './db';
import { GameState, Player, MoveRecord } from './types';
import {
  initBoard,
  getLegalMoves,
  applyMove,
  checkGameOver,
  cloneBoard,
  findBestMove,
  Move,
} from './gameLogic';
import { analyzeGame } from './coach';

interface QueueEntry {
  socketId: string;
  player: Player;
  joinedAt: number;
}

const gameStates = new Map<string, GameState>();
const waitingQueue: QueueEntry[] = [];
const userSocketMap = new Map<string, string>();

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware для аутентификации по токену при подключении
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('no auth token'));
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return next(new Error('invalid token'));
    socket.data.userId = user.id;
    socket.data.username = user.user_metadata.username || 'Anonymous';
    socket.data.elo = user.user_metadata.elo || 1200;
    socket.data.city = user.user_metadata.city || '';
    next();
  });

  io.on('connection', (socket: Socket) => {
    console.log('authenticated connection', socket.id, socket.data.userId);

    // Дополнительный обработчик аутентификации (если клиент посылает)
    socket.on('authenticate', async (token: string) => {
      // уже аутентифицированы через middleware, но можно обновить данные
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        socket.data.userId = user.id;
        socket.data.username = user.user_metadata.username || 'Anonymous';
        socket.data.elo = user.user_metadata.elo || 1200;
        socket.data.city = user.user_metadata.city || '';
      }
    });

    // Матчмейкинг
    socket.on('joinQueue', () => {
      if (!socket.data.userId) return;
      const entry: QueueEntry = {
        socketId: socket.id,
        player: {
          id: socket.data.userId,
          username: socket.data.username,
          elo: socket.data.elo,
          city: socket.data.city,
        },
        joinedAt: Date.now(),
      };
      waitingQueue.push(entry);

      if (waitingQueue.length >= 2) {
        const p1 = waitingQueue.shift()!;
        const p2 = waitingQueue.shift()!;
        const gameId = uuidv4();
        const game: GameState = {
          id: gameId,
          board: initBoard(),
          turn: 'white',
          players: {
            white: { ...p1.player, captured: 0 },
            black: { ...p2.player, captured: 0 },
          },
          status: 'active',
          moveHistory: [],
          gameType: 'public',
        };
        gameStates.set(gameId, game);
        io.to(p1.socketId).socketsJoin(gameId);
        io.to(p2.socketId).socketsJoin(gameId);
        io.to(gameId).emit('gameStart', {
          gameId,
          opponent: p2.player,
          color: 'white',
          ...game,
        });
        io.to(p2.socketId).emit('gameStart', {
          gameId,
          opponent: p1.player,
          color: 'black',
          ...game,
        });
      }
    });

    // Приватная игра
    socket.on('createPrivateGame', async () => {
      if (!socket.data.userId) return;
      const gameId = uuidv4();
      const game: GameState = {
        id: gameId,
        board: initBoard(),
        turn: 'white',
        players: {
          white: {
            id: socket.data.userId,
            username: socket.data.username,
            elo: socket.data.elo,
            city: socket.data.city,
            captured: 0,
          },
          black: {
            id: '',
            username: 'Waiting...',
            elo: 1200,
            captured: 0,
          },
        },
        status: 'active',
        moveHistory: [],
        gameType: 'private',
      };
      gameStates.set(gameId, game);
      socket.join(gameId);
      socket.emit('privateGameCreated', {
        gameId,
        inviteLink: `${process.env.CLIENT_URL}/game/${gameId}`,
      });
    });

    socket.on('joinPrivateGame', async (gameId: string) => {
      const game = gameStates.get(gameId);
      if (!game || game.players.black.id !== '')
        return socket.emit('gameError', 'Game not available');
      game.players.black = {
        id: socket.data.userId,
        username: socket.data.username,
        elo: socket.data.elo,
        city: socket.data.city,
        captured: 0,
      };
      socket.join(gameId);
      io.to(gameId).emit('gameStart', {
        gameId,
        opponent: game.players.white,
        color: 'black',
        ...game,
      });
      io.to(game.players.white.id).emit('opponentJoined', {
        opponent: game.players.black,
      });
    });

    // Игра с ИИ (теперь принимает playerColor)
    socket.on('createAIGame', (data: { difficulty: string; playerColor: 'white' | 'black' }) => {
      const gameId = 'ai-' + socket.id;
      const playerColor = data.playerColor || 'white';
      const aiColor = playerColor === 'white' ? 'black' : 'white';
      const game: GameState = {
        id: gameId,
        board: initBoard(),
        turn: 'white', // Первый ход всегда белых, но если игрок играет черными, ИИ делает первый ход сразу
        players: {
          white: {
            id: playerColor === 'white' ? socket.data.userId : 'ai',
            username: playerColor === 'white' ? socket.data.username : 'AI',
            elo: playerColor === 'white' ? socket.data.elo : 1200,
            city: socket.data.city,
            captured: 0,
          },
          black: {
            id: playerColor === 'black' ? socket.data.userId : 'ai',
            username: playerColor === 'black' ? socket.data.username : 'AI',
            elo: playerColor === 'black' ? socket.data.elo : 1200,
            captured: 0,
          },
        },
        status: 'active',
        moveHistory: [],
        gameType: 'ai',
        aiDifficulty: data.difficulty as 'easy' | 'medium' | 'hard',
      };
      gameStates.set(gameId, game);
      socket.join(gameId);
      socket.emit('gameStart', game);

      // Если игрок выбрал чёрный цвет, ИИ делает первый ход белыми
      if (playerColor === 'black') {
        setTimeout(() => {
          const aiMove = findBestMove(game.board, 'white', game.aiDifficulty || 'medium');
          game.board = applyMove(game.board, aiMove);
          game.moveHistory.push({
            from: aiMove.from,
            to: aiMove.to,
            captures: aiMove.captures,
            notation: '',
            player: 'white',
          });
          game.players.white.captured += aiMove.captures.length;
          game.turn = 'black';
          io.to(gameId).emit('moveMade', { game });
        }, 500);
      }
    });

    // Ход игрока
    socket.on('makeMove', (data: { gameId: string; move: MoveRecord }) => {
      const game = gameStates.get(data.gameId);
      if (!game || game.status !== 'active') return;

      const playerColor =
        game.players.white.id === socket.data.userId ? 'white' : 'black';
      if (game.turn !== playerColor) return;

      const legalMoves = getLegalMoves(game.board, playerColor);
      const move = legalMoves.find(
        (m) =>
          m.from[0] === data.move.from[0] &&
          m.from[1] === data.move.from[1] &&
          m.to[0] === data.move.to[0] &&
          m.to[1] === data.move.to[1]
      );
      if (!move) return;

      game.board = applyMove(game.board, move);
      game.moveHistory.push({
        ...data.move,
        captures: move.captures,
        player: playerColor,
      });
      game.players[playerColor].captured += move.captures.length;

      const winner = checkGameOver(game.board);
      if (winner) {
        game.status = 'completed';
        game.winner = winner;
        io.to(data.gameId).emit('gameOver', { winner, game });
        saveGameToDB(game);
        if (game.gameType !== 'ai') updateRatings(game);
      } else {
        game.turn = game.turn === 'white' ? 'black' : 'white';
        io.to(data.gameId).emit('moveMade', { game });

        // Ответ ИИ
        if (
          game.gameType === 'ai' &&
          game.turn !== playerColor &&
          game.status === 'active'
        ) {
          const aiColor = game.turn; // 'white' или 'black'
          setTimeout(() => {
            const aiMove = findBestMove(game.board, aiColor, game.aiDifficulty || 'medium');
            game.board = applyMove(game.board, aiMove);
            game.moveHistory.push({
              from: aiMove.from,
              to: aiMove.to,
              captures: aiMove.captures,
              notation: '',
              player: aiColor,
            });
            game.players[aiColor].captured += aiMove.captures.length;

            const aiWinner = checkGameOver(game.board);
            if (aiWinner) {
              game.status = 'completed';
              game.winner = aiWinner;
              io.to(data.gameId).emit('gameOver', { winner: aiWinner, game });
              saveGameToDB(game);
            } else {
              game.turn = aiColor === 'white' ? 'black' : 'white';
              io.to(data.gameId).emit('moveMade', { game });
            }
          }, 500);
        }
      }
    });

    // Чат
    socket.on('chatMessage', (data: { gameId: string; message: string }) => {
      const game = gameStates.get(data.gameId);
      if (!game) return;

      const isFriend = game.gameType === 'private';
      if (!isFriend) {
        const allowedQuickMessages = ['Good luck', 'Good game', 'Thank you'];
        if (!allowedQuickMessages.includes(data.message)) return;
      }

      io.to(data.gameId).emit('chatMessage', {
        user: socket.data.username,
        message: data.message,
        timestamp: Date.now(),
      });
    });

    // Анализ
    socket.on('requestAnalysis', async (gameId: string) => {
      const game = gameStates.get(gameId);
      if (!game || game.status !== 'completed') return;
      const analysis = analyzeGame(game);
      socket.emit('analysisResult', { gameId, analysis });
    });

    // Разрешённые ходы
    socket.on(
      'getLegalMoves',
      (
        { gameId, pos }: { gameId: string; pos: [number, number] },
        callback: (moves: Move[]) => void
      ) => {
        const game = gameStates.get(gameId);
        if (!game) return callback([]);
        const playerColor =
          game.players.white.id === socket.data.userId ? 'white' : 'black';
        const allMoves = getLegalMoves(game.board, playerColor);
        const movesFromPos = allMoves.filter(
          (m) => m.from[0] === pos[0] && m.from[1] === pos[1]
        );
        callback(movesFromPos);
      }
    );

    socket.on('disconnect', () => {
      const idx = waitingQueue.findIndex((e) => e.socketId === socket.id);
      if (idx !== -1) waitingQueue.splice(idx, 1);
    });
  });
}

async function saveGameToDB(game: GameState) {
  await supabase.from('games').insert({
    id: game.id,
    player1_id: game.players.white.id,
    player2_id: game.players.black.id,
    game_type: game.gameType,
    status: game.status,
    winner: game.winner,
    board_snapshot: game.board,
    move_history: game.moveHistory,
  });
}

async function updateRatings(game: GameState) {
  if (!game.winner || game.winner === 'draw') return;
  const winnerId =
    game.winner === 'white' ? game.players.white.id : game.players.black.id;
  const loserId =
    game.winner === 'white' ? game.players.black.id : game.players.white.id;

  const k = 32;
  const winnerUser = await supabase
    .from('users')
    .select('elo')
    .eq('id', winnerId)
    .single();
  const loserUser = await supabase
    .from('users')
    .select('elo')
    .eq('id', loserId)
    .single();
  if (!winnerUser.data || !loserUser.data) return;
  const r1 = winnerUser.data.elo,
    r2 = loserUser.data.elo;
  const e1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
  const newR1 = r1 + k * (1 - e1);
  const newR2 = r2 + k * (0 - (1 - e1));
  await supabase.from('users').update({ elo: newR1 }).eq('id', winnerId);
  await supabase.from('users').update({ elo: newR2 }).eq('id', loserId);
}