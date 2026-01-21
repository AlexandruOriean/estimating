const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const rooms = new Map();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    path: '/api/socket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create-room', ({ roomId, roomName, userName, strategy }) => {
      const user = {
        id: socket.id,
        name: userName,
        hasVoted: false,
      };

      rooms.set(roomId, {
        id: roomId,
        name: roomName,
        users: [user],
        revealed: false,
        strategy: strategy || 'fibonacci',
        history: [],
        azureDevOpsUrl: '',
      });

      socket.join(roomId);
      socket.emit('room-joined', { room: rooms.get(roomId), user });
      console.log(`Room created: ${roomId} by ${userName}`);
    });

    socket.on('join-room', ({ roomId, userName }) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      const user = {
        id: socket.id,
        name: userName,
        hasVoted: false,
      };

      room.users.push(user);
      socket.join(roomId);
      
      socket.emit('room-joined', { room, user });
      io.to(roomId).emit('room-updated', room);
      console.log(`${userName} joined room: ${roomId}`);
    });

    socket.on('vote', ({ roomId, vote }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const user = room.users.find((u) => u.id === socket.id);
      if (user) {
        user.vote = vote;
        user.hasVoted = true;
        io.to(roomId).emit('room-updated', room);
        console.log(`${user.name} voted: ${vote}`);
      }
    });

    socket.on('update-story', ({ roomId, storyName }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.currentStory = storyName;
      io.to(roomId).emit('room-updated', room);
    });

    socket.on('update-azure-url', ({ roomId, azureDevOpsUrl }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.azureDevOpsUrl = azureDevOpsUrl;
      io.to(roomId).emit('room-updated', room);
    });

    socket.on('reveal-votes', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.revealed = true;
      io.to(roomId).emit('room-updated', room);
      console.log(`Votes revealed in room: ${roomId}`);
    });

    socket.on('reset-votes', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // Save to history if votes were revealed
      if (room.revealed) {
        const votes = {};
        room.users.forEach((user) => {
          if (user.vote) {
            votes[user.name] = user.vote;
          }
        });

        // Calculate average for numeric votes
        const numericVotes = Object.values(votes)
          .filter(vote => !isNaN(Number(vote)))
          .map(vote => Number(vote));
        
        const average = numericVotes.length > 0
          ? (numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length).toFixed(1)
          : undefined;

        room.history.push({
          storyName: room.currentStory || 'Unnamed Story',
          votes,
          average,
          timestamp: Date.now(),
        });
      }

      // Reset votes for new round
      room.users.forEach((user) => {
        user.vote = undefined;
        user.hasVoted = false;
      });
      room.revealed = false;
      room.currentStory = undefined;
      io.to(roomId).emit('room-updated', room);
      console.log(`Votes reset in room: ${roomId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      rooms.forEach((room, roomId) => {
        const userIndex = room.users.findIndex((u) => u.id === socket.id);
        if (userIndex !== -1) {
          const userName = room.users[userIndex].name;
          room.users.splice(userIndex, 1);
          
          if (room.users.length === 0) {
            rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
          } else {
            io.to(roomId).emit('room-updated', room);
            console.log(`${userName} left room: ${roomId}`);
          }
        }
      });
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
