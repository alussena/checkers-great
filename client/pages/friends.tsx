import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export default function FriendsPage() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchFriends();
    fetchRequests();
  }, [user]);

  const fetchFriends = async () => {
    const { data } = await supabase
      .from('friendships')
      .select('user1_id, user2_id, user1:user1_id(username), user2:user2_id(username)')
      .or(`user1_id.eq.${user!.id},user2_id.eq.${user!.id}`);
    if (data) setFriends(data);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('friend_requests')
      .select('id, from_user_id, to_user_id, status, from_user:from_user_id(username)')
      .eq('to_user_id', user!.id)
      .eq('status', 'pending');
    if (data) setRequests(data);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    const { data } = await supabase
      .from('users')
      .select('id, username')
      .ilike('username', `%${searchQuery}%`)
      .neq('id', user!.id)
      .limit(10);
    setSearchResults(data || []);
  };

  const sendFriendRequest = async (toUserId: string) => {
    await supabase.from('friend_requests').insert({
      from_user_id: user!.id,
      to_user_id: toUserId,
    });
    alert('Запрос отправлен');
  };

  const acceptRequest = async (requestId: string, fromUserId: string) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    // Создаём дружбу
    await supabase.from('friendships').insert({
      user1_id: user!.id,
      user2_id: fromUserId,
    });
    fetchFriends();
    fetchRequests();
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Друзья</h1>

      {/* Поиск */}
      <div className="flex gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 flex-1"
          placeholder="Поиск по никнейму"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button onClick={searchUsers} className="bg-blue-600 text-white px-3 py-1 rounded">Искать</button>
      </div>
      {searchResults.map((u) => (
        <div key={u.id} className="flex justify-between items-center border-b py-2">
          <span>{u.username}</span>
          <button onClick={() => sendFriendRequest(u.id)} className="text-blue-600 text-sm">Добавить</button>
        </div>
      ))}

      {/* Входящие заявки */}
      <h2 className="text-xl font-bold mt-6 mb-2">Заявки в друзья</h2>
      {requests.map((req) => (
        <div key={req.id} className="flex justify-between items-center border-b py-2">
          <span>{req.from_user.username}</span>
          <button onClick={() => acceptRequest(req.id, req.from_user_id)} className="bg-green-500 text-white px-3 py-1 rounded text-sm">Принять</button>
        </div>
      ))}

      {/* Список друзей */}
      <h2 className="text-xl font-bold mt-6 mb-2">Мои друзья</h2>
      {friends.map((f) => {
        const friend = f.user1_id === user!.id ? f.user2 : f.user1;
        return <div key={friend.id} className="border-b py-2">{friend.username}</div>;
      })}
    </div>
  );
}