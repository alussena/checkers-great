import { supabase } from '../lib/supabaseClient';

export default function ProPage() {
  const handleUpgrade = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user!.id }),
    });
    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="max-w-md mx-auto p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Upgrade to Pro</h1>
      <p className="mb-4">Разблокируйте премиум-темы, AI-тренера и максимальную сложность ИИ</p>
      <button onClick={handleUpgrade} className="bg-purple-600 text-white px-6 py-3 rounded-xl text-lg">
        Подписаться за $4.99/мес
      </button>
    </div>
  );
}