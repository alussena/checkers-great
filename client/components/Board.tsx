import React from 'react';
import Piece from './Piece';
import { useTheme } from '../context/ThemeContext';
import { Move } from '../lib/types';

interface BoardProps {
  board: number[][];
  selected: [number, number] | null;
  legalMoves: Move[];
  onSquareClick: (r: number, c: number) => void;
  lastMove?: { from: [number, number]; to: [number, number] } | null;
  flipped: boolean;
}

export default function Board({
  board,
  selected,
  legalMoves,
  onSquareClick,
  lastMove,
  flipped,
}: BoardProps) {
  const { theme } = useTheme();

  const renderSquare = (r: number, c: number) => {
    const isDark = (r + c) % 2 === 1;
    const piece = board[r][c];
    const isSelected = selected && selected[0] === r && selected[1] === c;
    const isLegalTarget = legalMoves.some(m => m.to[0] === r && m.to[1] === c);
    const isLastMoveFrom = lastMove && lastMove.from[0] === r && lastMove.from[1] === c;
    const isLastMoveTo = lastMove && lastMove.to[0] === r && lastMove.to[1] === c;

    return (
      <div
        key={`${r}-${c}`}
        className="w-full h-full flex items-center justify-center cursor-pointer relative"
        style={{
          backgroundColor: isDark ? 'var(--board-dark)' : 'var(--board-light)',
          opacity: isLastMoveFrom || isLastMoveTo ? 0.8 : 1,
        }}
        onClick={() => onSquareClick(r, c)}
      >
        {isSelected && <div className="absolute inset-0 border-4 border-yellow-400 rounded-full" />}
        {isLegalTarget && !piece && <div className="w-4 h-4 bg-green-400 rounded-full opacity-50" />}
        {piece !== 0 && <Piece type={piece} isSelected={!!isSelected} />}
      </div>
    );
  };


  const rows = Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) =>
      renderSquare(flipped ? 7 - r : r, flipped ? 7 - c : c)
    )
  );

  return (
    <div className="grid grid-cols-8 w-[400px] h-[400px] sm:w-[500px] sm:h-[500px] border-4 border-gray-800 rounded-lg overflow-hidden">
      {rows}
    </div>
  );
}