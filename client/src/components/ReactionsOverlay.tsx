import { useState, useCallback } from 'react';
import { useDataChannel } from '@livekit/components-react';

interface FloatingEmoji {
  id: string;
  emoji: string;
  left: number;
}

interface HandRaise {
  identity: string;
  name: string;
  timestamp: number;
}

export default function ReactionsOverlay() {
  const [emojis, setEmojis] = useState<FloatingEmoji[]>([]);
  const [handRaises, setHandRaises] = useState<HandRaise[]>([]);

  const handleMessage = useCallback((msg: any) => {
    try {
      // payload is Uint8Array
      const decoder = new TextDecoder();
      const str = decoder.decode(msg.payload);
      const data = JSON.parse(str);

      if (data.type === 'emoji') {
        const newEmoji: FloatingEmoji = {
          id: Math.random().toString(36).substr(2, 9),
          emoji: data.emoji,
          left: Math.random() * 80 + 10, // random left position between 10% and 90%
        };
        setEmojis((prev) => [...prev, newEmoji]);
        
        // Remove emoji after animation (3 seconds)
        setTimeout(() => {
          setEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id));
        }, 3000);
      } else if (data.type === 'hand_raise') {
        if (data.state) {
          setHandRaises((prev) => {
            const exists = prev.find(h => h.identity === data.identity);
            if (exists) return prev;
            return [...prev, { identity: data.identity, name: data.user, timestamp: Date.now() }];
          });
        } else {
          setHandRaises((prev) => prev.filter(h => h.identity !== data.identity));
        }
      }
    } catch (err) {
      console.error('Failed to parse data channel message', err);
    }
  }, []);

  // Listen to 'reactions' topic
  useDataChannel('reactions', handleMessage);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 1000, overflow: 'hidden' }}>
      
      {/* Floating Emojis */}
      {emojis.map((e) => (
        <div
          key={e.id}
          style={{
            position: 'absolute',
            left: `${e.left}%`,
            bottom: '100px',
            fontSize: '56px',
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
            animation: 'floatUp 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
          }}
        >
          {e.emoji}
        </div>
      ))}

      {/* Hand Raise Toasts */}
      <div style={{ 
        position: 'absolute', 
        top: '24px', 
        right: '24px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        {handRaises.map((h) => (
          <div 
            key={h.identity} 
            style={{ 
              background: 'linear-gradient(135deg, rgba(30,30,40,0.9), rgba(20,20,25,0.95))', 
              color: 'white', 
              padding: '12px 20px', 
              borderRadius: '16px', 
              fontWeight: 500, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              animation: 'slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              border: '1px solid rgba(79, 172, 254, 0.3)',
              borderLeft: '4px solid #4facfe',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{
              background: 'rgba(79, 172, 254, 0.2)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px'
            }}>
              ✋
            </div>
            <span style={{ fontSize: '15px' }}>
              <strong style={{ color: '#4facfe' }}>{h.name}</strong> raised hand
            </span>
          </div>
        ))}
      </div>

      <style>
        {`
          @keyframes floatUp {
            0% { transform: translateY(0) scale(0.3) rotate(-15deg); opacity: 0; }
            10% { transform: translateY(-30px) scale(1.2) rotate(10deg); opacity: 1; }
            20% { transform: translateY(-60px) scale(1) rotate(-5deg); opacity: 1; }
            80% { transform: translateY(-300px) scale(1) rotate(5deg); opacity: 0.8; }
            100% { transform: translateY(-400px) scale(0.8) rotate(0deg); opacity: 0; }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(50px) scale(0.9); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }
        `}
      </style>
    </div>
  );
}
