import { GameState, MoveRecord } from './types';
import { getLegalMoves, applyMove, findBestMove, cloneBoard, initBoard } from './gameLogic';

export interface AnalysisResult {
  moveNumber: number;
  playerMove: MoveRecord;
  bestMove: MoveRecord;
  comment: string;
  isMistake: boolean;
}

export function analyzeGame(game: GameState): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  let board = initBoard(); // начальная позиция
  const history = game.moveHistory;
  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    // применяем ход игрока
    board = applyMove(board, move);

    // находим лучший ход для текущей позиции (ИИ уровня hard)
    const best = findBestMove(board, move.player, 'hard');

    // Преобразуем Move в MoveRecord
    const bestMove: MoveRecord = {
      ...best,
      notation: moveToString(best.from, best.to),
      player: move.player,
    };

    const playerScoreDelta = evaluateMoveQuality(board, move, bestMove);
    const isMistake = playerScoreDelta < -50; // условная граница

    results.push({
      moveNumber: i + 1,
      playerMove: move,
      bestMove,
      comment: isMistake
        ? `Лучше было пойти ${moveToString(best.from, best.to)}`
        : 'Хороший ход!',
      isMistake,
    });
  }
  return results;
}

function moveToString(from: [number,number], to: [number,number]) {
  const cols = 'abcdefgh';
  return `${cols[from[1]]}${8-from[0]} → ${cols[to[1]]}${8-to[0]}`;
}

function evaluateMoveQuality(board: number[][], actual: MoveRecord, best: MoveRecord): number {
  const boardAfterActual = applyMove(cloneBoard(board), actual);
  const boardAfterBest = applyMove(cloneBoard(board), best);
  const evalActual = simpleEval(boardAfterActual);
  const evalBest = simpleEval(boardAfterBest);
  return evalActual - evalBest;
}

function simpleEval(board: number[][]): number {
  let score = 0;
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === 1) score += 100;
      else if (p === 2) score -= 100;
      else if (p === 3) score += 200;
      else if (p === 4) score -= 200;
    }
  return score;
}