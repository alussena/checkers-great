import React from 'react';

interface PieceProps {
  type: number; // 1-белая,2-чёрная,3-белая дамка,4-чёрная дамка
  isSelected: boolean;
}

export default function Piece({ type, isSelected }: PieceProps) {
  const color = type === 1 || type === 3 ? 'var(--piece-white)' : 'var(--piece-black)';
  const isKing = type === 3 || type === 4;
  return (
    <div
      className="w-[70%] h-[70%] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
      style={{ backgroundColor: color, border: isSelected ? '3px solid gold' : '2px solid #333' }}
    >
      {isKing && <span className="text-3xl">♛</span>}
    </div>
  );
}