import { useState, useCallback } from 'react';
import { useDataChannel, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { SmilePlus, Hand, Users, MonitorUp } from 'lucide-react';

interface Props {
  showParticipants: boolean;
  onToggleParticipants: () => void;
}

export default function ReactionsControls({ showParticipants, onToggleParticipants }: Props) {
  const { send } = useDataChannel('reactions');
  const { localParticipant } = useLocalParticipant();
  const [showEmojis, setShowEmojis] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  const emojis = ['👍', '❤️', '😂', '😮', '🎉', '👏'];

  const sendEmoji = useCallback((emoji: string) => {
    try {
      const payload = JSON.stringify({
        type: 'emoji',
        emoji,
        user: localParticipant.name || localParticipant.identity,
        identity: localParticipant.identity
      });
      const encoder = new TextEncoder();
      send(encoder.encode(payload), { reliable: true });
      setShowEmojis(false);
    } catch (err) {
      console.error('Failed to send emoji', err);
    }
  }, [send, localParticipant]);

  const toggleHandRaise = useCallback(() => {
    try {
      const newState = !handRaised;
      const payload = JSON.stringify({
        type: 'hand_raise',
        state: newState,
        user: localParticipant.name || localParticipant.identity,
        identity: localParticipant.identity
      });
      const encoder = new TextEncoder();
      send(encoder.encode(payload), { reliable: true });
      setHandRaised(newState);
    } catch (err) {
      console.error('Failed to send hand raise', err);
    }
  }, [send, localParticipant, handRaised]);

  const requestScreenShare = useCallback(() => {
    try {
      const payload = JSON.stringify({
        type: 'request_screen_share',
        user: localParticipant.name || localParticipant.identity,
        identity: localParticipant.identity
      });
      const encoder = new TextEncoder();
      send(encoder.encode(payload), { reliable: true });
      // Optionally show a local success toast here, but for simplicity we just send it.
    } catch (err) {
      console.error('Failed to request screen share', err);
    }
  }, [send, localParticipant]);

  // Check if we currently have screen share permission. If we do, we don't necessarily need the request button, 
  // but we'll show it anyway or we can hide it. Let's hide it if we can already share.
  const canShareScreen = (localParticipant.permissions?.canPublishSources as any[])?.some(s => s === 'screen_share' || s === 3 || s === Track.Source.ScreenShare) ?? false;

  return (
    <div style={{ 
      position: 'absolute', 
      bottom: '100px', 
      left: '50%', 
      transform: 'translateX(-50%)', 
      zIndex: 1000, 
      display: 'flex', 
      gap: '16px',
      background: 'rgba(20, 20, 25, 0.75)',
      backdropFilter: 'blur(12px)',
      padding: '10px 16px',
      borderRadius: '30px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      
      {/* Emoji Menu */}
      <div style={{ position: 'relative' }}>
        {showEmojis && (
          <div style={{ 
            position: 'absolute', 
            bottom: 'calc(100% + 16px)', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            display: 'flex', 
            gap: '12px', 
            padding: '12px 16px', 
            borderRadius: '24px', 
            background: 'rgba(30, 30, 35, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}>
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => sendEmoji(emoji)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '28px', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  padding: '4px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.4) translateY(-4px)';
                  e.currentTarget.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.filter = 'none';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button 
          onClick={() => setShowEmojis(!showEmojis)}
          style={{ 
            background: showEmojis ? 'linear-gradient(135deg, #FF6B6B, #FF8E53)' : 'transparent', 
            color: showEmojis ? 'white' : 'rgba(255,255,255,0.8)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: showEmojis ? '0 4px 15px rgba(255, 107, 107, 0.4)' : 'none'
          }}
          onMouseOver={(e) => { if(!showEmojis) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseOut={(e) => { if(!showEmojis) e.currentTarget.style.background = 'transparent' }}
          title="React"
        >
          <SmilePlus size={22} />
        </button>
      </div>

      {/* Hand Raise */}
      <button 
        onClick={toggleHandRaise}
        style={{ 
          background: handRaised ? 'linear-gradient(135deg, #4facfe, #00f2fe)' : 'transparent', 
          color: handRaised ? 'white' : 'rgba(255,255,255,0.8)',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: handRaised ? '0 4px 15px rgba(79, 172, 254, 0.4)' : 'none'
        }}
        onMouseOver={(e) => { if(!handRaised) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseOut={(e) => { if(!handRaised) e.currentTarget.style.background = 'transparent' }}
        title={handRaised ? "Lower Hand" : "Raise Hand"}
      >
        <Hand size={22} />
      </button>

      {/* Request Screen Share (Only if user doesn't already have permission) */}
      {!canShareScreen && (
        <button 
          onClick={requestScreenShare}
          style={{ 
            background: 'transparent', 
            color: 'rgba(255,255,255,0.8)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          title="Request Screen Share"
        >
          <MonitorUp size={22} />
        </button>
      )}

      {/* Participants */}
      <button 
        onClick={onToggleParticipants}
        style={{ 
          background: showParticipants ? 'linear-gradient(135deg, #8E2DE2, #4A00E0)' : 'transparent', 
          color: showParticipants ? 'white' : 'rgba(255,255,255,0.8)',
          border: 'none',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: showParticipants ? '0 4px 15px rgba(142, 45, 226, 0.4)' : 'none'
        }}
        onMouseOver={(e) => { if(!showParticipants) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseOut={(e) => { if(!showParticipants) e.currentTarget.style.background = 'transparent' }}
        title="Participants"
      >
        <Users size={22} />
      </button>

      <style>
        {`
          @keyframes popIn {
            from { opacity: 0; transform: translate(-50%, 10px) scale(0.9); }
            to { opacity: 1; transform: translate(-50%, 0) scale(1); }
          }
        `}
      </style>
    </div>
  );
}
