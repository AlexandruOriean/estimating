# Story Poker - Agile Estimation Tool

A real-time story estimation app for Scrum teams, built with Next.js, TypeScript, and Socket.io.

## Features

- ✨ Create or join estimation rooms
- 🎯 Real-time voting with Fibonacci scale (1, 2, 3, 5, 8, 13, 21)
- 👥 Live participant tracking
- 🎉 Simultaneous card reveal
- 📊 Automatic average calculation
- 📱 Fully responsive (mobile & desktop)
- 🔗 Shareable room links

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io with custom Node.js server
- **State Management**: Zustand

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open** [http://localhost:3000](http://localhost:3000)

The app uses a custom Node.js server to properly integrate Socket.io with Next.js.

## Production Deployment

For production:

```bash
npm run build
npm start
```

## How to Use

1. **Create a Room**: Enter your name and optionally a room name, then click "Create Room"
2. **Share the Link**: Copy the room link and share it with your team
3. **Join**: Team members can join using the room ID
4. **Vote**: Select your estimate from the Fibonacci scale
5. **Reveal**: Once everyone has voted, click "Reveal Votes" to see all estimates
6. **New Round**: Click "New Round" to reset for the next story

## Project Structure

```
/app
  /api/socket      # Socket.io server endpoint
  /room/[room]     # Room page
  page.tsx         # Home page
/lib
  socket.ts        # Socket.io client
  store.ts         # Zustand store
/types
  index.ts         # TypeScript types
```


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
