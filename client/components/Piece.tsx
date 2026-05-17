import React from 'react';

interface PieceProps {
  type: number; 
  isSelected: boolean;
}

export default function Piece({ type, isSelected }: PieceProps) {
  const backgroundColor =
    type === 1 || type === 3 ? 'var(--piece-white)' : 'var(--piece-black)';

  const isKing = type === 3 || type === 4;
  const crownColor = type === 3 ? '#000000' : '#FFFFFF'; 

  return (
    <div
      className="w-[70%] h-[70%] rounded-full flex items-center justify-center shadow-lg"
      style={{
        backgroundColor,
        border: isSelected ? '3px solid gold' : '2px solid #333',
        position: 'relative',
      }}
    >
      {isKing && (
        <span
          className="absolute text-2xl leading-none"
          style={{ color: crownColor }}
        >
          ♛
        </span>
      )}
    </div>
  );
}