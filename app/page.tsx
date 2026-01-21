'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ESTIMATION_STRATEGIES, EstimationStrategy } from '@/types';

export default function Home() {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [strategy, setStrategy] = useState<EstimationStrategy>('fibonacci');
  const [action, setAction] = useState<'create' | 'join'>('create');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) return;

    if (action === 'create') {
      const newRoomId = Math.random().toString(36).substring(2, 8);
      router.push(`/room/${newRoomId}?userName=${encodeURIComponent(userName)}&roomName=${encodeURIComponent(roomName || 'Estimation Room')}&strategy=${strategy}&create=true`);
    } else {
      if (!roomId.trim()) return;
      router.push(`/room/${roomId}?userName=${encodeURIComponent(userName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎯 Story Poker</h1>
          <p className="text-gray-600">Agile estimation made simple</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setAction('create')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              action === 'create'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setAction('join')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
              action === 'join'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Join Room
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userName" className="block text-sm font-medium text-orange-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          {action === 'create' && (
            <>
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-orange-700 mb-1">
                  Room Name (optional)
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Sprint 24 Planning"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label htmlFor="strategy" className="block text-sm font-medium text-orange-700 mb-1">
                  Estimation Strategy
                </label>
                <select
                  id="strategy"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as EstimationStrategy)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-white text-gray-900"
                >
                  {Object.entries(ESTIMATION_STRATEGIES).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.name} - {config.description}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {action === 'join' && (
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-orange-700 mb-1">
                Room ID
              </label>
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            {action === 'create' ? '🚀 Create Room' : '👋 Join Room'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p className="font-medium mb-2">Available Strategies:</p>
            <p>Fibonacci • Modified Fibonacci • T-Shirt Sizes • Powers of 2 • Linear</p>
          </div>
        </div>
      </div>
    </div>
  );
}
