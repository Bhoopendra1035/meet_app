import { useParticipants } from '@livekit/components-react';
import { Mic, MicOff, Video, VideoOff, X, User, UserMinus, MonitorPlay, MonitorX } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isHost?: boolean;
  roomId?: string;
}

export default function ParticipantsSidebar({ isOpen, onClose, isHost, roomId }: Props) {
  const participants = useParticipants();

  const handleKick = async (identity: string) => {
    if (!roomId) return;
    try {
      await fetch('/api/host/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, identity })
      });
    } catch (err) { console.error(err); }
  };

  const handleMuteAll = async () => {
    if (!roomId) return;
    try {
      await fetch('/api/host/mute-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId })
      });
    } catch (err) { console.error(err); }
  };

  const handleMuteUser = async (identity: string) => {
    if (!roomId) return;
    try {
      await fetch('/api/host/mute-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, identity })
      });
    } catch (err) { console.error(err); }
  };

  // We toggle screen share permission by passing a boolean. 
  // For simplicity, we can pass a boolean to grant/revoke. We assume revocation by default if not granted explicitly here.
  const handleToggleScreenShare = async (identity: string, grant: boolean) => {
    if (!roomId) return;
    try {
      await fetch('/api/host/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, identity, canScreenShare: grant })
      });
    } catch (err) { console.error(err); }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      right: '24px',
      bottom: '120px',
      width: '340px',
      background: 'rgba(20, 20, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }}>
      
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} color="var(--brand-accent)" />
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', margin: 0 }}>
            Participants <span style={{ color: 'var(--text-muted)', fontSize: '14px', marginLeft: '4px' }}>({participants.length})</span>
          </h2>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          <X size={16} />
        </button>
      </div>

      {isHost && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button 
            onClick={handleMuteAll}
            className="btn-danger" 
            style={{ width: '100%', padding: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <MicOff size={16} /> Mute All
          </button>
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {participants.map(p => {
          const isMicOn = p.isMicrophoneEnabled;
          const isCamOn = p.isCameraEnabled;
          const isSpeaking = p.isSpeaking;

          return (
            <div key={p.identity} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.02)',
              marginBottom: '8px',
              transition: 'background 0.2s',
              border: isSpeaking ? '1px solid rgba(79, 172, 254, 0.4)' : '1px solid transparent'
            }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--bg-input), #2a2a35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: 'white',
                  textTransform: 'uppercase',
                  border: isSpeaking ? '2px solid #4facfe' : 'none',
                  boxShadow: isSpeaking ? '0 0 12px rgba(79, 172, 254, 0.5)' : 'none'
                }}>
                  {(p.name || p.identity).substring(0, 1)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: 'white', fontSize: '15px', fontWeight: 500 }}>
                    {p.name || p.identity} {p.isLocal && '(You)'}
                  </span>
                  {isSpeaking && <span style={{ color: '#4facfe', fontSize: '11px', fontWeight: 600 }}>Speaking...</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ 
                  color: isMicOn ? '#4facfe' : '#FF6B6B',
                  background: isMicOn ? 'rgba(79, 172, 254, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isMicOn ? <Mic size={16} /> : <MicOff size={16} />}
                </div>
                
                <div style={{ 
                  color: isCamOn ? '#4facfe' : '#FF6B6B',
                  background: isCamOn ? 'rgba(79, 172, 254, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isCamOn ? <Video size={16} /> : <VideoOff size={16} />}
                </div>
                
                {isHost && !p.isLocal && (
                  <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
                    <button
                      onClick={() => handleMuteUser(p.identity)}
                      title="Mute User"
                      style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                      <MicOff size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleScreenShare(p.identity, true)}
                      title="Grant Screen Share"
                      style={{ background: 'rgba(79, 172, 254, 0.1)', color: '#4facfe', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                      <MonitorPlay size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleScreenShare(p.identity, false)}
                      title="Revoke Screen Share"
                      style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                      <MonitorX size={16} />
                    </button>
                    <button
                      onClick={() => handleKick(p.identity)}
                      title="Remove Participant"
                      style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#FF6B6B', border: 'none', padding: '6px', borderRadius: '50%', cursor: 'pointer' }}
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>

      <style>
        {`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(50px) scale(0.95); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }
        `}
      </style>
    </div>
  );
}
