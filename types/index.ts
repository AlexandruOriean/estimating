export type VoteValue = string;

export type EstimationStrategy = 
  | 'fibonacci'
  | 'modified-fibonacci'
  | 't-shirt'
  | 'powers-of-2'
  | 'linear';

export interface EstimationConfig {
  name: string;
  description: string;
  values: VoteValue[];
}

export const ESTIMATION_STRATEGIES: Record<EstimationStrategy, EstimationConfig> = {
  'fibonacci': {
    name: 'Fibonacci',
    description: 'Classic Fibonacci sequence (0, 1, 2, 3, 5, 8, 13, 21)',
    values: ['0', '1', '2', '3', '5', '8', '13', '21', '?', '☕']
  },
  'modified-fibonacci': {
    name: 'Modified Fibonacci',
    description: 'Extended Fibonacci with ½ and larger values',
    values: ['0', '½', '1', '2', '3', '5', '8', '13', '20', '40', '100', '?', '☕']
  },
  't-shirt': {
    name: 'T-Shirt Sizes',
    description: 'Relative sizing with T-shirt sizes',
    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕']
  },
  'powers-of-2': {
    name: 'Powers of 2',
    description: 'Exponential scale (1, 2, 4, 8, 16, 32, 64)',
    values: ['0', '1', '2', '4', '8', '16', '32', '64', '?', '☕']
  },
  'linear': {
    name: 'Linear',
    description: 'Simple linear scale (1-10)',
    values: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '?', '☕']
  }
};

export interface User {
  id: string;
  name: string;
  vote?: VoteValue;
  hasVoted: boolean;
}

export interface HistoryEntry {
  storyName: string;
  votes: Record<string, VoteValue>;
  average?: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  users: User[];
  revealed: boolean;
  currentStory?: string;
  strategy: EstimationStrategy;
  history: HistoryEntry[];
  azureDevOpsUrl?: string;
}

export interface RoomState {
  room: Room | null;
  currentUser: User | null;
  setRoom: (room: Room) => void;
  setCurrentUser: (user: User) => void;
  reset: () => void;
}
