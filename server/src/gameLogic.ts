import { GameState, MoveRecord } from './types';

export function initBoard(): number[][] {
  const board = Array.from({ length: 8 }, () => Array(8).fill(0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0) board[r][c] = 2; // чёрные шашки сверху
    }
  }
  for (let r = 5; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0) board[r][c] = 1; // белые шашки снизу
    }
  }
  return board;
}

export function cloneBoard(board: number[][]): number[][] {
  return board.map(row => [...row]);
}

export function isWhite(piece: number) { return piece === 1 || piece === 3; }
export function isBlack(piece: number) { return piece === 2 || piece === 4; }
export function isKing(piece: number) { return piece === 3 || piece === 4; }
export function pieceColor(piece: number): 'white' | 'black' | null {
  if (isWhite(piece)) return 'white';
  if (isBlack(piece)) return 'black';
  return null;
}

export interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
}

function getPossibleMovesForPiece(board: number[][], r: number, c: number): Move[] {
  const piece = board[r][c];
  if (piece === 0) return [];
  const color = pieceColor(piece)!;
  const moves: Move[] = [];
  const directions = isKing(piece)
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : (color === 'white' ? [[-1,-1],[-1,1]] : [[1,-1],[1,1]]);
  // обычные ходы (без взятия)
  for (const [dr, dc] of directions) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === 0) {
      moves.push({ from: [r,c], to: [nr,nc], captures: [] });
    }
  }

  const captureDirections = isKing(piece)
    ? [[-1,-1],[-1,1],[1,-1],[1,1]]
    : [[-1,-1],[-1,1],[1,-1],[1,1]]; 
  for (const [dr, dc] of captureDirections) {
    let nr = r + dr, nc = c + dc;
    if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
    const enemy = board[nr][nc];
    if (enemy !== 0 && pieceColor(enemy) !== color) {
      const jr = nr + dr, jc = nc + dc;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {

        const captures = collectCaptureSequences(board, r, c, [], color);
        for (const cap of captures) {
          moves.push(cap);
        }
      }
    }
  }

  const captureMoves = moves.filter(m => m.captures.length > 0);
  return captureMoves.length > 0 ? captureMoves : moves;
}

function collectCaptureSequences(
  board: number[][], sr: number, sc: number,
  alreadyCaptured: [number, number][], color: 'white' | 'black'
): Move[] {
  const piece = board[sr][sc];
  const sequences: Move[] = [];
  const directions = isKing(piece) ? [[-1,-1],[-1,1],[1,-1],[1,1]] : [[-1,-1],[-1,1],[1,-1],[1,1]];
  for (const [dr, dc] of directions) {
    const mr = sr + dr, mc = sc + dc;
    if (mr < 0 || mr >= 8 || mc < 0 || mc >= 8) continue;
    const enemy = board[mr][mc];
    if (enemy !== 0 && pieceColor(enemy) !== color) {
      const jr = mr + dr, jc = mc + dc;
      if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === 0) {
        const capKey = `${mr},${mc}`;
        if (alreadyCaptured.some(([r,c]) => r === mr && c === mc)) continue;
        const newBoard = cloneBoard(board);
        newBoard[sr][sc] = 0;
        newBoard[mr][mc] = 0;
        newBoard[jr][jc] = piece; 
        const subSeqs = collectCaptureSequences(newBoard, jr, jc, [...alreadyCaptured, [mr, mc]], color);
        if (subSeqs.length === 0) {
          sequences.push({ from: [sr, sc], to: [jr, jc], captures: [...alreadyCaptured, [mr, mc]] });
        } else {
          for (const sub of subSeqs) {
            sequences.push({
              from: [sr, sc],
              to: sub.to,
              captures: [...alreadyCaptured, [mr, mc], ...sub.captures]
            });
          }
        }
      }
    }
  }
  return sequences;
}

export function getLegalMoves(board: number[][], color: 'white' | 'black'): Move[] {
  const allMoves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (pieceColor(board[r][c]) === color) {
        allMoves.push(...getPossibleMovesForPiece(board, r, c));
      }
    }
  }

  const captureMoves = allMoves.filter(m => m.captures.length > 0);
  if (captureMoves.length === 0) return allMoves;
  const maxCap = Math.max(...captureMoves.map(m => m.captures.length));
  return captureMoves.filter(m => m.captures.length === maxCap);
}

export function applyMove(board: number[][], move: Move): number[][] {
  const newBoard = cloneBoard(board);
  const piece = newBoard[move.from[0]][move.from[1]];
  newBoard[move.from[0]][move.from[1]] = 0;
  for (const [cr, cc] of move.captures) {
    newBoard[cr][cc] = 0;
  }
  newBoard[move.to[0]][move.to[1]] = piece;
  const [tr, tc] = move.to;
  if (piece === 1 && tr === 0) newBoard[tr][tc] = 3; 
  if (piece === 2 && tr === 7) newBoard[tr][tc] = 4; 
  return newBoard;
}

export function checkGameOver(board: number[][]): 'white' | 'black' | 'draw' | null {
  const whiteMoves = getLegalMoves(board, 'white');
  const blackMoves = getLegalMoves(board, 'black');
  if (whiteMoves.length === 0 && blackMoves.length === 0) return 'draw';
  if (whiteMoves.length === 0) return 'black';
  if (blackMoves.length === 0) return 'white';
  return null;
}

// ИИ минимакс 
function evaluateBoard(board: number[][]): number {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p === 1) score += 100 + (7 - r) * 5;
      else if (p === 2) score -= 100 + r * 5;
      else if (p === 3) score += 200;
      else if (p === 4) score -= 200;
    }
  }
  return score;
}

function minimax(board: number[][], depth: number, alpha: number, beta: number, maximizing: boolean, color: 'white' | 'black'): number {
  if (depth === 0) return evaluateBoard(board);
  const moves = getLegalMoves(board, color);
  if (moves.length === 0) return maximizing ? -Infinity : Infinity;
  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, color === 'white' ? 'black' : 'white');
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, color === 'white' ? 'black' : 'white');
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function findBestMove(board: number[][], color: 'white' | 'black', difficulty: 'easy' | 'medium' | 'hard'): Move {
  const depth = { easy: 2, medium: 4, hard: 6 }[difficulty];
  const moves = getLegalMoves(board, color);
  if (moves.length === 0) throw new Error('no moves');
  let bestMove = moves[0];
  let bestScore = color === 'white' ? -Infinity : Infinity;
  for (const move of moves) {
    const newBoard = applyMove(board, move);
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, color !== 'white', color === 'white' ? 'black' : 'white');
    if ((color === 'white' && score > bestScore) || (color === 'black' && score < bestScore)) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}