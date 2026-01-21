'use client';

import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/lib/store';
import { Room, User, VoteValue, ESTIMATION_STRATEGIES, EstimationStrategy } from '@/types';

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.room as string;
  const userName = searchParams.get('userName') || 'Anonymous';
  const roomName = searchParams.get('roomName') || 'Estimation Room';
  const strategy = (searchParams.get('strategy') as EstimationStrategy) || 'fibonacci';
  const shouldCreate = searchParams.get('create') === 'true';

  const { room, currentUser, setRoom, setCurrentUser } = useRoomStore();
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null);
  const [storyName, setStoryName] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [azureDevOpsUrl, setAzureDevOpsUrl] = useState('');

  useEffect(() => {
    const socket = getSocket();

    socket.on('connect', () => {
      if (shouldCreate) {
        socket.emit('create-room', { roomId, roomName, userName, strategy });
      } else {
        socket.emit('join-room', { roomId, userName });
      }
    });

    socket.on('room-joined', ({ room, user }: { room: Room; user: User }) => {
      setRoom(room);
      setCurrentUser(user);
      setAzureDevOpsUrl(room.azureDevOpsUrl || '');
    });

    socket.on('room-updated', (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setAzureDevOpsUrl(updatedRoom.azureDevOpsUrl || '');
    });

    socket.on('error', ({ message }: { message: string }) => {
      alert(message);
    });

    return () => {
      socket.off('connect');
      socket.off('room-joined');
      socket.off('room-updated');
      socket.off('error');
    };
  }, [roomId, userName, roomName, strategy, shouldCreate, setRoom, setCurrentUser]);

  const handleVote = (vote: VoteValue) => {
    if (room?.revealed) return;
    
    setSelectedVote(vote);
    const socket = getSocket();
    socket.emit('vote', { roomId, vote });
  };

  const handleReveal = () => {
    const socket = getSocket();
    socket.emit('reveal-votes', { roomId });
  };

  const handleReset = () => {
    const socket = getSocket();
    socket.emit('reset-votes', { roomId });
    setSelectedVote(null);
    setStoryName('');
  };

  const handleStoryChange = (name: string) => {
    setStoryName(name);
    const socket = getSocket();
    socket.emit('update-story', { roomId, storyName: name });
  };

  const handleAzureUrlChange = (url: string) => {
    setAzureDevOpsUrl(url);
    const socket = getSocket();
    socket.emit('update-azure-url', { roomId, azureDevOpsUrl: url });
  };

  const extractWorkItemId = (text: string): string | null => {
    // Match patterns like #12345, AB#12345, or just 12345 at the start
    const match = text.match(/^(?:([A-Z]+))?#?(\d{3,})/i);
    return match ? match[2] : null;
  };

  const generateAzureDevOpsLink = (text: string): JSX.Element | string => {
    if (!azureDevOpsUrl) return text;
    
    const workItemId = extractWorkItemId(text);
    if (!workItemId) return text;

    // Remove trailing slash from URL if present
    const baseUrl = azureDevOpsUrl.replace(/\/$/, '');
    const workItemUrl = `${baseUrl}/_workitems/edit/${workItemId}`;

    return (
      <a
        href={workItemUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 hover:text-orange-700 underline font-semibold"
        title={`Open work item ${workItemId} in Azure DevOps`}
      >
        #{workItemId}
      </a>
    );
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAverage = () => {
    if (!room?.revealed) return null;
    
    const numericVotes = room.users
      .filter(u => u.vote && !isNaN(Number(u.vote)))
      .map(u => Number(u.vote));
    
    if (numericVotes.length === 0) return null;
    
    const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    return avg.toFixed(1);
  };

  const getVoteDistribution = () => {
    if (!room?.revealed) return {};
    
    const distribution: Record<string, number> = {};
    room.users.forEach(user => {
      if (user.vote) {
        distribution[user.vote] = (distribution[user.vote] || 0) + 1;
      }
    });
    
    return distribution;
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to room...</p>
        </div>
      </div>
    );
  }

  const allVoted = room.users.length > 0 && room.users.every(u => u.hasVoted);
  const average = getAverage();
  const voteOptions = ESTIMATION_STRATEGIES[room.strategy]?.values || ESTIMATION_STRATEGIES.fibonacci.values;
  const strategyConfig = ESTIMATION_STRATEGIES[room.strategy] || ESTIMATION_STRATEGIES.fibonacci;
  const voteDistribution = getVoteDistribution();
  const maxVoteCount = Math.max(...Object.values(voteDistribution), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{room.name}</h1>
              <p className="text-gray-600 mt-1">
                Room ID: <span className="font-mono font-semibold">{roomId}</span>
                <span className="mx-2">•</span>
                <span className="text-orange-600 font-medium">{strategyConfig.name}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                title="Settings"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={copyRoomLink}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all font-medium"
              >
                {copied ? '✓ Copied!' : '🔗 Copy Link'}
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Azure DevOps Integration</h3>
              <p className="text-xs text-gray-500 mb-2">
                Enter your Azure DevOps organization URL to enable work item linking (e.g., https://dev.azure.com/yourorg/yourproject)
              </p>
              <input
                type="url"
                value={azureDevOpsUrl}
                onChange={(e) => handleAzureUrlChange(e.target.value)}
                placeholder="https://dev.azure.com/yourorg/yourproject"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Enter work items as #12345 or AB#12345 in the story field
              </p>
            </div>
          )}

          {room.revealed && average && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">
                Average: <span className="text-2xl">{average}</span> points
              </p>
            </div>
          )}

          {room.revealed && Object.keys(voteDistribution).length > 0 && (
            <div className="mt-6 p-6 bg-white border-2 border-orange-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Vote Distribution</h3>
              <div className="flex items-end justify-center gap-2 h-48">
                {voteOptions
                  .filter(value => voteDistribution[value])
                  .map((value) => {
                    const count = voteDistribution[value];
                    const heightPercent = (count / maxVoteCount) * 100;
                    
                    return (
                      <div key={value} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                        <div className="text-sm font-semibold text-gray-700">{count}</div>
                        <div 
                          className="w-full bg-orange-500 rounded-t-lg transition-all duration-500 hover:bg-orange-600"
                          style={{ height: `${heightPercent}%`, minHeight: '20px' }}
                        />
                        <div className="text-sm font-bold text-gray-800">{value}</div>
                      </div>
                    );
                  })}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Total votes: {room.users.filter(u => u.hasVoted).length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Story Input */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={storyName}
              onChange={(e) => handleStoryChange(e.target.value)}
              placeholder="Story or task to estimate (e.g., #12345 or User Story Title)..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-lg text-gray-900 placeholder:text-gray-400"
            />
          </div>
          {storyName && azureDevOpsUrl && extractWorkItemId(storyName) && (
            <div className="text-sm text-gray-600 mt-2">
              🔗 Linked to: {generateAzureDevOpsLink(storyName)}
            </div>
          )}
        </div>

        {/* Voting Cards */}
        {!room.revealed && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Select Your Estimate
              <span className="text-sm font-normal text-gray-500 ml-2">({strategyConfig.description})</span>
            </h2>
            <div className={`grid gap-3 ${
              voteOptions.length <= 6 
                ? 'grid-cols-3 md:grid-cols-6' 
                : voteOptions.length <= 10 
                ? 'grid-cols-5 md:grid-cols-10' 
                : 'grid-cols-4 md:grid-cols-8 lg:grid-cols-13'
            }`}>
              {voteOptions.map((value) => (
                <button
                  key={value}
                  onClick={() => handleVote(value)}
                  className={`aspect-square rounded-xl font-bold transition-all transform hover:scale-105 ${
                    value === '?' || value === '☕' ? 'text-xl' : 'text-2xl'
                  } ${
                    selectedVote === value
                      ? 'bg-orange-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Participants ({room.users.length})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {room.users.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  user.hasVoted
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 truncate">
                    {user.name}
                    {user.id === currentUser?.id && ' (You)'}
                  </span>
                  <span className="text-2xl">
                    {user.hasVoted ? (room.revealed && user.vote ? user.vote : '✓') : '⏱️'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            onClick={handleReveal}
            disabled={!allVoted || room.revealed}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              allVoted && !room.revealed
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            🎉 Reveal Votes
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-4 px-6 rounded-xl font-semibold text-lg bg-amber-600 text-white hover:bg-amber-700 transition-all shadow-lg"
          >
            🔄 New Round
          </button>
        </div>

        {/* History Section */}
        {room.history && room.history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Session History ({room.history.length})
              </h2>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                {showHistory ? '▼ Hide' : '▶ Show'}
              </button>
            </div>
            
            {showHistory && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {[...room.history].reverse().map((entry, index) => {
                  const voteValues = Object.values(entry.votes);
                  const voteCounts: Record<string, number> = {};
                  voteValues.forEach(vote => {
                    voteCounts[vote] = (voteCounts[vote] || 0) + 1;
                  });

                  return (
                    <div key={room.history.length - 1 - index} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-800 flex-1">
                          {extractWorkItemId(entry.storyName) && room.azureDevOpsUrl ? (
                            <span>
                              {generateAzureDevOpsLink(entry.storyName)}{' '}
                              {entry.storyName.replace(/^(?:([A-Z]+))?#?(\d{3,})\s*/i, '')}
                            </span>
                          ) : (
                            entry.storyName
                          )}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-2">
                        {entry.average && (
                          <span className="text-green-700 font-semibold">
                            Avg: {entry.average}
                          </span>
                        )}
                        <span className="text-gray-600 text-sm">
                          {Object.keys(entry.votes).length} votes
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {Object.entries(voteCounts).map(([vote, count]) => (
                          <span
                            key={vote}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                          >
                            {vote}: {count}
                          </span>
                        ))}
                      </div>

                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          View individual votes
                        </summary>
                        <div className="mt-2 pl-4 space-y-1">
                          {Object.entries(entry.votes).map(([name, vote]) => (
                            <div key={name} className="text-sm text-gray-600">
                              <span className="font-medium">{name}:</span> {vote}
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
