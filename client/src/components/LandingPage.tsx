import React, { useState, useEffect } from 'react';
import { Video, Keyboard, Link as LinkIcon, Calendar, Plus, X, Copy, Check } from 'lucide-react';
import { UserSession } from '../App';

interface LandingPageProps {
  user: UserSession;
  onSignOut: () => void;
  onCreateRoom: (roomId: string) => void;
  onJoinRoom: (roomId: string) => void;
}

export default function LandingPage({ user, onSignOut, onCreateRoom, onJoinRoom }: LandingPageProps) {
  const [roomCode, setRoomCode] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Dropdown & Modal states
  const [showMeetDropdown, setShowMeetDropdown] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  
  const [showLaterModal, setShowLaterModal] = useState<boolean>(false);
  const [laterRoomCode, setLaterRoomCode] = useState<string>('');
  const [copiedLater, setCopiedLater] = useState<boolean>(false);

  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false);
  const [calTitle, setCalTitle] = useState<string>('General Discussion');
  const [calDate, setCalDate] = useState<string>('');
  const [calTime, setCalTime] = useState<string>('12:00');
  const [scheduledDetails, setScheduledDetails] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      };
      setCurrentTime(date.toLocaleString('en-US', options).replace(',', ' •'));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Helper to generate a room code
  const generateCode = () => {
    const randPart = (len: number) => Math.random().toString(36).substring(2, 2 + len);
    return `${randPart(3)}-${randPart(4)}-${randPart(3)}`;
  };

  const handleCreateLater = () => {
    const code = generateCode();
    setLaterRoomCode(code);
    setShowLaterModal(true);
    setShowMeetDropdown(false);
  };

  const handleStartInstant = () => {
    const code = generateCode();
    onCreateRoom(code);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = generateCode();
    const meetLink = `${window.location.origin}/join/${code}`;
    const details = `Subject: ${calTitle}\nDate: ${calDate}\nTime: ${calTime}\nMeeting Link: ${meetLink}`;
    setScheduledDetails(details);
  };

  const handleCopyLink = (linkText: string, setCopiedState: (s: boolean) => void) => {
    navigator.clipboard.writeText(linkText);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    let code = roomCode.trim();
    if (code.includes('/')) {
      const parts = code.split('/');
      code = parts[parts.length - 1];
    }
    
    code = code.split('?')[0];

    if (code) {
      onJoinRoom(code);
    }
  };

  return (
    <div className="min-h-screen">
      {/* App Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Video size={24} color="white" />
          </div>
          <h1 className="logo-text">Connect<span className="text-gradient">Meet</span></h1>
        </div>
        
        <div className="header-right">
          <div className="time-display">{currentTime}</div>
          
          {/* User Profile Menu */}
          <div className="profile-menu-container">
            <button 
              className="profile-btn" 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              title="Account Options"
            >
              {user.avatar}
            </button>
            
            {showProfileMenu && (
              <div className="profile-dropdown glass-panel">
                <div className="dropdown-avatar">{user.avatar}</div>
                <h4>{user.name}</h4>
                <p>{user.email}</p>
                <button className="btn-danger w-full" style={{ width: '100%' }} onClick={onSignOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="hero-section">
        <div className="hero-content">
          <h1>Premium video meetings.<br />Now free for everyone.</h1>
          <p>We engineered the service built for secure, high-performance business meetings, to make it accessible and incredibly fast on any device.</p>
          
          <div className="hero-actions">
            {/* New Meeting Dropdown Container */}
            <div className="action-dropdown-wrapper">
              <button 
                className="btn-primary" 
                onClick={() => setShowMeetDropdown(!showMeetDropdown)}
              >
                <Video size={20} />
                New Meeting
              </button>
              
              {showMeetDropdown && (
                <div className="action-menu glass-panel">
                  <button className="action-item" onClick={handleCreateLater}>
                    <LinkIcon size={18} />
                    <span>Create a meeting for later</span>
                  </button>
                  <button className="action-item" onClick={handleStartInstant}>
                    <Plus size={18} />
                    <span>Start an instant meeting</span>
                  </button>
                  <button className="action-item" onClick={() => { setShowCalendarModal(true); setShowMeetDropdown(false); }}>
                    <Calendar size={18} />
                    <span>Schedule in Calendar</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleJoin} className="join-form">
              <Keyboard size={18} />
              <input 
                type="text" 
                placeholder="Enter a code or link"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
              />
              <button 
                type="submit" 
                className="btn-join"
                disabled={!roomCode.trim()}
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="hero-graphic">
          <div className="floating-card glass-panel">
            <div className="mock-video-area">
              <div className="mock-avatar-pulse">
                {user.avatar}
              </div>
              <span className="mock-badge">{user.name} (You)</span>
            </div>
            <div className="mock-controls">
              <div className="mock-btn active"></div>
              <div className="mock-btn"></div>
              <div className="mock-btn"></div>
            </div>
          </div>
        </div>
      </main>

      {/* 1. Modal: Meeting for Later Link Display */}
      {showLaterModal && (
        <div className="modal-overlay" onClick={() => setShowLaterModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Here's the link to your meeting</h3>
              <button className="btn-icon-sm" onClick={() => setShowLaterModal(false)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              Copy this link and send it to people you want to meet with. Make sure you save it so you can use it later.
            </p>
            <div className="copy-box">
              <span className="copy-text">{`${window.location.origin}/join/${laterRoomCode}`}</span>
              <button 
                className="btn-icon-sm" 
                onClick={() => handleCopyLink(`${window.location.origin}/join/${laterRoomCode}`, setCopiedLater)}
              >
                {copiedLater ? <Check size={18} color="var(--brand-green)" /> : <Copy size={18} />}
              </button>
            </div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '24px' }}
              onClick={() => onCreateRoom(laterRoomCode)}
            >
              Join now
            </button>
          </div>
        </div>
      )}

      {/* 2. Modal: Schedule in Calendar */}
      {showCalendarModal && (
        <div className="modal-overlay" onClick={() => { setShowCalendarModal(false); setScheduledDetails(null); }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Meeting</h3>
              <button className="btn-icon-sm" onClick={() => { setShowCalendarModal(false); setScheduledDetails(null); }}>
                <X size={20} />
              </button>
            </div>
            
            {!scheduledDetails ? (
              <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Topic</label>
                  <input 
                    type="text" 
                    value={calTitle}
                    onChange={(e) => setCalTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Date</label>
                    <input 
                      type="date" 
                      value={calDate}
                      onChange={(e) => setCalDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white', colorScheme: 'dark' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>Time</label>
                    <input 
                      type="time" 
                      value={calTime}
                      onChange={(e) => setCalTime(e.target.value)}
                      required
                      style={{ width: '100%', padding: '12px', background: 'var(--bg-input)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'white', colorScheme: 'dark' }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%' }}>
                  Schedule Meeting
                </button>
              </form>
            ) : (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                  Meeting scheduled successfully! Send these invitation details to your guests:
                </p>
                <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <pre style={{ color: 'var(--brand-primary)', fontSize: '13px', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                    {scheduledDetails}
                  </pre>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                  <button 
                    className="btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => handleCopyLink(scheduledDetails, () => {})}
                  >
                    Copy Details
                  </button>
                  <button 
                    className="btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      const code = scheduledDetails.split('Meeting Link: ')[1].split('/join/')[1].trim();
                      onCreateRoom(code);
                    }}
                  >
                    Join Room
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
