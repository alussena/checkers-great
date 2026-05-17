import { useAuth } from '../context/AuthContext';

interface GameStatusProps {
  game: any; // Можно заменить на тип GameState, если вы вынесли его в общий модуль
  user: any;
}

export default function GameStatus({ game, user }: GameStatusProps) {
  if (!game) {
    return (
      <div className="text-center p-4 text-gray-500">
        Ожидание подключения к игре...
      </div>
    );
  }

  const myColor = user?.id === game.players?.white?.id ? 'white' : 'black';
  const opponentColor = myColor === 'white' ? 'black' : 'white';
  const myCaptured = game.players?.[myColor]?.captured ?? 0;
  const opponentCaptured = game.players?.[opponentColor]?.captured ?? 0;

  const statusText =
    game.status === 'completed'
      ? `Игра окончена. Победитель: ${game.winner === 'white' ? 'белые' : 'чёрные'}`
      : `Ход ${game.turn === 'white' ? 'белых' : 'чёрных'}`;

  return (
    <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow w-full max-w-md text-center">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1">
          <span className="inline-block w-4 h-4 rounded-full bg-white border border-gray-400"></span>
          <span className="text-sm font-medium">
            {game.players?.white?.username ?? 'Белые'}
          </span>
          <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded-full">
            🛡️ {game.players?.white?.captured ?? 0}
          </span>
        </div>
        <span className="text-xs text-gray-500">vs</span>
        <div className="flex items-center gap-1">
          <span className="text-xs bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded-full">
            🛡️ {game.players?.black?.captured ?? 0}
          </span>
          <span className="text-sm font-medium">
            {game.players?.black?.username ?? 'Чёрные'}
          </span>
          <span className="inline-block w-4 h-4 rounded-full bg-black border border-gray-400"></span>
        </div>
      </div>
      <div className="text-sm font-semibold">
        {statusText}
      </div>
      {game.status === 'active' && (
        <div className="text-xs text-gray-500 mt-1">
          Вы играете {myColor === 'white' ? 'белыми' : 'чёрными'}
        </div>
      )}
    </div>
  );
}