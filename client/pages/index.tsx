import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const login = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-8">♞ Checkers Pro</h1>
      {!user ? (
        <button onClick={login} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-lg">
          Войти через Google
        </button>
      ) : (
        <div className="space-y-4 text-center">
          <p>Привет, {user.user_metadata?.full_name || user.email}!</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => router.push('/game/ai')} className="btn">🤖 Против ИИ</button>
            <button onClick={() => router.push('/game/create')} className="btn">👥 Игра с другом</button>
            <button onClick={() => router.push('/game/matchmaking')} className="btn">🎲 Быстрая игра</button>
            <button onClick={() => router.push('/leaderboard')} className="btn">🏆 Лидерборд</button>
          </div>
        </div>
      )}
    </div>
  );
}