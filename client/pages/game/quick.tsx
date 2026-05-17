
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function QuickGamePage() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(180); // 3 минуты

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      alert('Время вышло!');
      router.push('/');
    }
  }, [timeLeft]);

  return (
    <div className="flex flex-col items-center p-4">
      <div className="text-4xl font-bold mb-4">{Math.floor(timeLeft/60)}:{(timeLeft%60).toString().padStart(2,'0')}</div>
      {/* Здесь вставьте компонент игры с ИИ или мультиплеером, аналогичный game/ai, но с таймером */}
    </div>
  );
}