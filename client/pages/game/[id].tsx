import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import Board from '../../components/Board';
import Chat from '../../components/Chat';
import GameStatus from '../../components/GameStatus';
import { useAuth } from '../../context/AuthContext';
import { Move } from '../../lib/types';

const INITIAL_BOARD: number[][] = [
  [0, 2, 0, 2, 0, 2, 0, 2],
  [2, 0, 2, 0, 2, 0, 2, 0],
  [0, 2, 0, 2, 0, 2, 0, 2],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
];

export default function GamePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [game, setGame] = useState<any>(null);
  const [board, setBoard] = useState<number[][]>(INITIAL_BOARD);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<{
    from: [number, number];
    to: [number, number];
  } | null>(null);

  const [showColorChoice, setShowColorChoice] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Определяем цвет игрока
  const myColor = user && game
    ? (user.id === game.players?.white?.id ? 'white' : 'black')
    : null;

  useEffect(() => {
    if (!id || !user) return;

    const socket = getSocket();

    supabase.auth.getSession().then(({ data }) => {
      const token = data.session?.access_token;
      if (!token) return;

      socket.auth = { token };
      socket.connect();

      // Отправляем аутентификацию (сервер примет через middleware)
      socket.emit('authenticate', token);

      if (id === 'matchmaking') {
        socket.emit('joinQueue');
      } else if (id !== 'ai') {
        socket.emit('joinPrivateGame', id);
      } else {
        // Игра с ИИ: показываем выбор цвета
        setShowColorChoice(true);
      }
    });

    socket.on('gameStart', (data) => {
      setGame(data);
      setBoard(data.board);
      setShowColorChoice(false);
    });

    socket.on('moveMade', (data) => {
      setGame(data.game);
      setBoard(data.game.board);
      setSelected(null);
    });

    socket.on('gameOver', (data) => {
      setGame(data.game);
      setBoard(data.game.board);
    });

    return () => {
      socket.disconnect();
    };
  }, [id, user]);

  const startAIGame = (playerColor: 'white' | 'black' | 'random') => {
    const socket = getSocket();
    let chosenColor = playerColor;
    if (playerColor === 'random') {
      chosenColor = Math.random() < 0.5 ? 'white' : 'black';
    }
    socket.emit('createAIGame', {
      difficulty: aiDifficulty,
      playerColor: chosenColor,
    });
    // Локальное состояние для немедленного отображения
    setGame({
      id: 'ai',
      board: INITIAL_BOARD,
      turn: 'white',
      players: {
        white: {
          id: chosenColor === 'white' ? user!.id : 'ai',
          username: chosenColor === 'white' ? (user!.user_metadata?.full_name || 'Вы') : 'AI',
          captured: 0,
        },
        black: {
          id: chosenColor === 'black' ? user!.id : 'ai',
          username: chosenColor === 'black' ? (user!.user_metadata?.full_name || 'Вы') : 'AI',
          captured: 0,
        },
      },
      status: 'active',
      moveHistory: [],
      gameType: 'ai',
      aiDifficulty,
    });
  };

  const handleSquareClick = (r: number, c: number) => {
    if (!game || game.turn !== myColor) return;

    if (selected) {
      const move = legalMoves.find((m) => m.to[0] === r && m.to[1] === c);
      if (move) {
        getSocket().emit('makeMove', {
          gameId: game.id,
          move: { from: selected, to: [r, c], captures: move.captures },
        });
        setSelected(null);
      } else {
        setSelected([r, c]);
      }
    } else {
      if (board[r][c] !== 0) setSelected([r, c]);
    }
  };

  useEffect(() => {
    if (game && selected) {
      getSocket().emit(
        'getLegalMoves',
        { gameId: game.id, pos: selected },
        (moves: Move[]) => {
          setLegalMoves(moves);
        }
      );
    } else {
      setLegalMoves([]);
    }
  }, [selected, game]);

  if (showColorChoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center">
          <h2 className="text-2xl font-bold mb-6">Выберите цвет</h2>
          <div className="flex flex-col gap-4 mb-6">
            <button
              onClick={() => startAIGame('white')}
              className="bg-white text-black font-semibold py-3 px-8 rounded-xl border-2 border-gray-300 hover:bg-gray-100"
            >
              ♟️ Играть белыми
            </button>
            <button
              onClick={() => startAIGame('black')}
              className="bg-black text-white font-semibold py-3 px-8 rounded-xl border-2 border-gray-600 hover:bg-gray-800"
            >
              ♟️ Играть чёрными
            </button>
            <button
              onClick={() => startAIGame('random')}
              className="bg-gradient-to-r from-gray-100 to-gray-300 text-black font-semibold py-3 px-8 rounded-xl border-2 border-gray-400 hover:from-gray-200"
            >
              🎲 Случайный цвет
            </button>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-sm">Сложность:</span>
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as any)}
              className="border rounded px-2 py-1"
            >
              <option value="easy">Легко</option>
              <option value="medium">Средне</option>
              <option value="hard">Сложно</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-4">
      <GameStatus game={game} user={user} />
      <Board
        board={board}
        selected={selected}
        legalMoves={legalMoves}
        onSquareClick={handleSquareClick}
        lastMove={lastMove}
      />
      <Chat gameId={game?.id} gameType={game?.gameType} />
    </div>
  );
}