export interface Move {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
}

export interface Player {
  id: string;
  username: string;
  elo: number;
  city?: string;
}

export interface GameState {
  id: string;
  board: number[][];
  turn: 'white' | 'black';
  players: {
    white: Player & { captured: number };
    black: Player & { captured: number };
  };
  status: 'active' | 'completed' | 'abandoned';
  winner?: 'white' | 'black' | 'draw';
  moveHistory: MoveRecord[];
  gameType: 'ai' | 'private' | 'public';
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface MoveRecord {
  from: [number, number];
  to: [number, number];
  captures: [number, number][];
  notation: string;
  player: 'white' | 'black';
}