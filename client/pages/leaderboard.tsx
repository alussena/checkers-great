import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [city, setCity] = useState('');

  const fetchLeaderboard = async () => {
    let query = supabase.from('users').select('username, elo, city').order('elo', { ascending: false }).limit(20);
    if (city) query = query.ilike('city', `%${city}%`);
    const { data } = await query;
    setPlayers(data || []);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [city]);

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🏆 Лидерборд</h1>
      <div className="mb-4">
        <input
          className="border rounded px-2 py-1 w-full"
          placeholder="Введите город (например, Алматы)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      {players.map((p, i) => (
        <div key={i} className="flex justify-between border-b py-2">
          <span>{i+1}. {p.username}</span>
          <span>{p.city || '—'}</span>
          <span className="font-bold">{p.elo}</span>
        </div>
      ))}
    </div>
  );
}