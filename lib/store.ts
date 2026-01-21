import { create } from 'zustand';
import { RoomState } from '@/types';

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  currentUser: null,
  setRoom: (room) => set({ room }),
  setCurrentUser: (user) => set({ currentUser: user }),
  reset: () => set({ room: null, currentUser: null }),
}));
