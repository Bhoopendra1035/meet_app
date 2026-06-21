import { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  PreJoin,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import ReactionsOverlay from './ReactionsOverlay';
import ReactionsControls from './ReactionsControls';
import { UserSession } from '../App';

interface MeetingRoomProps {
  roomId: string;
  user: UserSession;
  isHost: boolean;
  onLeave: () => void;
}

export default function MeetingRoom({ roomId, user, isHost, onLeave }: MeetingRoomProps) {
  const [preJoinChoices, setPreJoinChoices] = useState<{
    videoEnabled: boolean;
    audioEnabled: boolean;
    username: string;
  } | undefined>(undefined);
  
  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');
  const [waitingStatus, setWaitingStatus] = useState<'pending' | 'admitted' | 'denied' | null>(null);
  const [joinReqId, setJoinReqId] = useState<string | null>(null);

  // Waiting List for Host
  const [waitingList, setWaitingList] = useState<{reqId: string, username: string}[]>([]);

  // Removed auto-skip for host so they can configure their devices (and disable mic if it throws NotFoundError)

  useEffect(() => {
    if (!preJoinChoices) return;

    const connectToRoom = async () => {
      try {
        if (isHost) {
          const res = await fetch(`/api/token?room=${roomId}&username=${preJoinChoices.username}&isHost=true`);
          if (!res.ok) throw new Error('Token fetch failed');
          const data = await res.json();
          setToken(data.token);
          setServerUrl(data.serverUrl);
        } else {
          // Guest flow: request to join first
          const reqRes = await fetch('/api/request-join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room: roomId, username: preJoinChoices.username })
          });
          const reqData = await reqRes.json();
          setJoinReqId(reqData.reqId);
          setWaitingStatus('pending');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to connect to the meeting server. Please ensure the backend is running.');
      }
    };
    
    connectToRoom();
  }, [preJoinChoices, roomId, isHost]);

  // Polling for Guest waiting status
  useEffect(() => {
    if (isHost || waitingStatus !== 'pending' || !joinReqId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/join-status?room=${roomId}&reqId=${joinReqId}`);
        const data = await res.json();
        
        if (data.status === 'admitted') {
          setWaitingStatus('admitted');
          setToken(data.token);
          setServerUrl(data.serverUrl);
          clearInterval(interval);
        } else if (data.status === 'denied') {
          setWaitingStatus('denied');
          setError('The meeting host declined your request to join.');
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isHost, waitingStatus, joinReqId, roomId]);

  // Polling for Host waiting list
  useEffect(() => {
    if (!isHost || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/waiting-list?room=${roomId}`);
        const data = await res.json();
        setWaitingList(data.waiting);
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isHost, roomId, token]);

  const handleAdmit = async (reqId: string, action: 'admit' | 'deny') => {
    try {
      await fetch('/api/handle-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, reqId, action })
      });
      setWaitingList(prev => prev.filter(req => req.reqId !== reqId));
    } catch (err) {
      console.error(err);
    }
  };

  // Render error as overlay instead of unmounting
  // so we don't trigger Client initiated disconnect by accident

  // Camera permissions check (basicSsl bypass requirement)
  if (!navigator.mediaDevices && window.location.protocol === 'http:') {
    return (
      <div className="auth-wrapper" style={{ flexDirection: 'column' }}>
        <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
          <h2 className="auth-title text-gradient" style={{ color: 'var(--brand-red)' }}>Security Error</h2>
          <p className="auth-subtitle" style={{ marginBottom: '24px' }}>
            Browser blocks camera on local HTTP connections. Please use the HTTPS link provided by Vite or ngrok.
          </p>
          <button onClick={onLeave} className="btn-danger">Go Back</button>
        </div>
      </div>
    );
  }

  if (!preJoinChoices) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0E14' }}>
        <PreJoin
          defaults={{
            videoEnabled: true,
            audioEnabled: true,
          }}
          onSubmit={(values) => {
            setPreJoinChoices({ ...values, username: user.name });
          }}
        />
      </div>
    );
  }

  if (!isHost && waitingStatus === 'pending') {
    return (
      <div className="auth-wrapper" style={{ flexDirection: 'column' }}>
        <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
          <h2 className="auth-title text-gradient">Waiting Room</h2>
          <p className="auth-subtitle">Please wait, the meeting host will let you in soon.</p>
          <div style={{ marginTop: '32px' }}>
            <div className="mock-avatar-pulse" style={{ width: '80px', height: '80px', margin: '0 auto' }}>
              {user.avatar}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (token === '') {
    return (
      <div className="auth-wrapper" style={{ flexDirection: 'column' }}>
        <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
          <h2 className="auth-title text-gradient">Connecting...</h2>
          <p className="auth-subtitle">Initializing secure connection.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      
      {isHost && waitingList.length > 0 && (
        <div className="glass-panel" style={{ position: 'absolute', top: '24px', right: '24px', width: '320px', padding: '20px', zIndex: 50, borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'white' }}>Waiting Room ({waitingList.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {waitingList.map((req) => (
              <div key={req.reqId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'white' }}>{req.username}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleAdmit(req.reqId, 'admit')} className="btn-primary" style={{ padding: '6px 16px', fontSize: '12px' }}>Admit</button>
                  <button onClick={() => handleAdmit(req.reqId, 'deny')} className="btn-danger" style={{ padding: '6px 16px', fontSize: '12px' }}>Deny</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10000, background: 'rgba(0,0,0,0.9)', padding: '20px', borderRadius: '10px', color: 'white', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--brand-red)' }}>Connection Error</h2>
          <p>{error}</p>
          <button onClick={onLeave} className="btn-danger">Go Back</button>
        </div>
      )}

      <LiveKitRoom
        video={preJoinChoices.videoEnabled}
        audio={preJoinChoices.audioEnabled}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
        onDisconnected={onLeave}
        onError={(err) => {
          console.error('LiveKit connection error:', err);
          setError(`LiveKit Error: ${err?.message || 'Connection failed'}. Please check your connection and try again.`);
        }}
      >
        <VideoConference />
        <RoomAudioRenderer />
        <ReactionsOverlay />
        <ReactionsControls />
      </LiveKitRoom>
    </div>
  );
}
