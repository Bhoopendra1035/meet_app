import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import MeetingRoom from './components/MeetingRoom';
import AuthPage from './components/AuthPage';

export interface UserSession {
  name: string;
  email: string;
  avatar: string;
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [page, setPage] = useState<'auth' | 'landing' | 'room'>('auth');
  const [roomId, setRoomId] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // 1. Initialize Authentication from LocalStorage
  useEffect(() => {
    const storedSession = localStorage.getItem('meet_user_session');
    if (storedSession) {
      setUser(JSON.parse(storedSession));
    }
    setIsInitializing(false);
  }, []);

  // 2. Handle Routing based on Auth State and URL
  useEffect(() => {
    if (isInitializing) return;

    if (!user) {
      setPage('auth');
      return;
    }

    const path = window.location.pathname;
    let potentialRoomId = path.replace(/^\/join\//, '').replace(/^\//, '');
    
    if (potentialRoomId && potentialRoomId.length >= 3) {
      potentialRoomId = potentialRoomId.split('/')[0];
      setRoomId(potentialRoomId);
      
      // Check if this user is the host for this room from localStorage
      const hostedRooms = JSON.parse(localStorage.getItem('hosted_rooms') || '[]');
      if (hostedRooms.includes(potentialRoomId)) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }
      
      setPage('room');
    } else {
      setPage('landing');
    }
  }, [user, isInitializing]);

  const handleSignIn = (session: UserSession) => {
    setUser(session);
  };

  const handleCreateRoom = (newRoomId: string) => {
    setRoomId(newRoomId);
    setIsHost(true);
    
    // Save to hosted rooms list
    const hostedRooms = JSON.parse(localStorage.getItem('hosted_rooms') || '[]');
    if (!hostedRooms.includes(newRoomId)) {
      hostedRooms.push(newRoomId);
      localStorage.setItem('hosted_rooms', JSON.stringify(hostedRooms));
    }

    window.history.pushState({}, '', `/join/${newRoomId}`);
    setPage('room');
  };

  const handleJoinRoom = (targetRoomId: string) => {
    setRoomId(targetRoomId);
    
    // Even if they click join, check if they are the original host
    const hostedRooms = JSON.parse(localStorage.getItem('hosted_rooms') || '[]');
    setIsHost(hostedRooms.includes(targetRoomId));

    window.history.pushState({}, '', `/join/${targetRoomId}`);
    setPage('room');
  };

  const handleLeaveRoom = () => {
    setPage('landing');
    setRoomId('');
    setIsHost(false);
    window.history.pushState({}, '', '/');
  };

  const handleSignOut = () => {
    localStorage.removeItem('meet_user_session');
    setUser(null);
    setPage('auth');
    setRoomId('');
    setIsHost(false);
    window.history.pushState({}, '', '/');
  };

  if (isInitializing) {
    return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <>
      {page === 'auth' && (
        <AuthPage onSignIn={handleSignIn} />
      )}

      {page === 'landing' && user && (
        <LandingPage 
          user={user}
          onSignOut={handleSignOut}
          onCreateRoom={handleCreateRoom} 
          onJoinRoom={handleJoinRoom} 
        />
      )}

      {page === 'room' && user && (
        <MeetingRoom 
          roomId={roomId} 
          user={user}
          isHost={isHost}
          onLeave={handleLeaveRoom}
        />
      )}
    </>
  );
}
