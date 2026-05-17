
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getSocket } from '../../lib/api';

export default function AnalysisPage() {
  const router = useRouter();
  const { gameId } = router.query;
  const [analysis, setAnalysis] = useState<any[]>([]);

  useEffect(() => {
    if (!gameId) return;
    const socket = getSocket();
    socket.emit('requestAnalysis', gameId);
    socket.on('analysisResult', ({ analysis }) => {
      setAnalysis(analysis);
    });
  }, [gameId]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🧠 AI Coach — анализ партии</h1>
      {analysis.map((item, i) => (
        <div key={i} className={`p-2 border rounded mb-2 ${item.isMistake ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
          <p className="font-semibold">Ход {item.moveNumber}: {item.comment}</p>
          <p className="text-sm">Ваш ход: {item.playerMove.from} → {item.playerMove.to}</p>
          <p className="text-sm">Лучший ход: {item.bestMove.from} → {item.bestMove.to}</p>
        </div>
      ))}
    </div>
  );
}