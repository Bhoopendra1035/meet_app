import React, { useState } from 'react';
import { Video } from 'lucide-react';
import { UserSession } from '../App';

interface AuthPageProps {
  onSignIn: (user: UserSession) => void;
}

export default function AuthPage({ onSignIn }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || (!isLogin && !name.trim())) {
      return;
    }

    const finalName = name.trim() || email.split('@')[0];
    
    const session: UserSession = {
      name: finalName,
      email: email.trim(),
      avatar: finalName.charAt(0).toUpperCase()
    };

    localStorage.setItem('meet_user_session', JSON.stringify(session));
    onSignIn(session);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo">
            <Video size={32} color="white" />
          </div>
          <h1 className="auth-title text-gradient">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Sign in to access your secure meetings' 
              : 'Sign up to start hosting high-quality video calls'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input
                type="text"
                required={!isLogin}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="john@example.com"
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="auth-switch-btn"
          >
            {isLogin 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
