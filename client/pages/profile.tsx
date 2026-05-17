import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.username || '');
    }
  }, [user]);

  const saveUsername = async () => {
    if (!user || !username.trim()) return;

    await supabase.from('users').upsert({ id: user.id, username: username.trim() });

    await supabase.auth.updateUser({ data: { username: username.trim() } });
    alert('Никнейм обновлён');
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Профиль</h1>
      <div className="mb-4">
        <label className="block mb-1">Никнейм</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <button onClick={saveUsername} className="bg-blue-600 text-white px-4 py-2 rounded">Сохранить</button>
    </div>
  );
}