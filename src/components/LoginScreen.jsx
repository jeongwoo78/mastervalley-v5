// LoginScreen.jsx - Master Valley 로그인 화면
import React, { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../config/firebase';
import { Capacitor } from '@capacitor/core';

const LoginScreen = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const initGoogleAuth = async () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      
      if (native) {
        try {
          const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
          await GoogleAuth.initialize({
            clientId: '539777702177-kk0l660744km8e2lc4l171i8ida8a8af.apps.googleusercontent.com',
            scopes: ['profile', 'email'],
          });
          console.log('GoogleAuth initialized');
        } catch (err) {
          console.log('GoogleAuth init error:', err);
        }
      }
    };
    
    initGoogleAuth();
  }, []);

  // Google 로그인
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (isNative) {
        // 네이티브 앱: Capacitor Google Auth 플러그인 사용
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        
        const googleUser = await GoogleAuth.signIn();
        console.log('Native Google login:', googleUser);
        
        // Firebase credential 생성
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const result = await signInWithCredential(auth, credential);
        console.log('Firebase login success:', result.user);
        onLoginSuccess(result.user);
      } else {
        // 웹: 기존 popup 방식
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google login success:', result.user);
        onLoginSuccess(result.user);
      }
    } catch (err) {
      console.error('Google login error:', err);
      if (err.message?.includes('popup_closed')) {
        setError('로그인이 취소되었습니다.');
      } else if (err.message?.includes('network')) {
        setError('네트워크 오류가 발생했습니다.');
      } else {
        setError('Google 로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Apple 로그인
  const handleAppleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, appleProvider);
      console.log('Apple login success:', result.user);
      onLoginSuccess(result.user);
    } catch (err) {
      console.error('Apple login error:', err);
      setError('Apple 로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이메일 로그인/회원가입
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Sign up success:', result.user);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Email login success:', result.user);
      }
      onLoginSuccess(result.user);
    } catch (err) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('등록되지 않은 이메일입니다.');
      } else if (err.code === 'auth/wrong-password') {
        setError('비밀번호가 올바르지 않습니다.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (err.code === 'auth/weak-password') {
        setError('비밀번호는 6자 이상이어야 합니다.');
      } else {
        setError('로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        {/* 로고 */}
        <div className="login-logo">
          <h1>🎨 Master Valley</h1>
          <p>AI 명화 스타일 변환</p>
        </div>

        {/* 소셜 로그인 버튼 */}
        <div className="social-login">
          <button 
            className="social-btn google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 계속하기
          </button>

          <button 
            className="social-btn apple-btn"
            onClick={handleAppleLogin}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Apple로 계속하기
          </button>
        </div>

        {/* 구분선 */}
        <div className="divider">
          <span>또는</span>
        </div>

        {/* 이메일 로그인 */}
        <form className="email-form" onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="email-btn" disabled={loading}>
            {loading ? '처리 중...' : (isSignUp ? '회원가입' : '로그인')}
          </button>
        </form>

        {/* 회원가입/로그인 전환 */}
        <div className="auth-switch">
          <span>
            {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
          </span>
          <button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? '로그인' : '회원가입'}
          </button>
        </div>
      </div>

      <style>{`
        .login-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
          padding: 40px 30px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .login-logo {
          text-align: center;
          margin-bottom: 30px;
        }

        .login-logo h1 {
          font-size: 28px;
          color: #1a1a2e;
          margin: 0 0 8px 0;
        }

        .login-logo p {
          color: #666;
          font-size: 14px;
          margin: 0;
        }

        .social-login {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .google-btn {
          background: white;
          border: 1px solid #ddd;
          color: #333;
        }

        .google-btn:hover:not(:disabled) {
          background: #f5f5f5;
          border-color: #ccc;
        }

        .apple-btn {
          background: #000;
          color: white;
        }

        .apple-btn:hover:not(:disabled) {
          background: #333;
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #ddd;
        }

        .divider span {
          padding: 0 16px;
          color: #999;
          font-size: 13px;
        }

        .email-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .email-form input {
          padding: 14px 16px;
          border: 1px solid #ddd;
          border-radius: 12px;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
        }

        .email-form input:focus {
          border-color: #0f3460;
        }

        .email-form input:disabled {
          background: #f5f5f5;
        }

        .error-message {
          color: #e74c3c;
          font-size: 13px;
          text-align: center;
          padding: 8px;
          background: #ffeaea;
          border-radius: 8px;
        }

        .email-btn {
          padding: 14px 20px;
          background: linear-gradient(135deg, #0f3460, #1a1a2e);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .email-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 52, 96, 0.4);
        }

        .email-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-switch {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }

        .auth-switch button {
          background: none;
          border: none;
          color: #0f3460;
          font-weight: 600;
          cursor: pointer;
          margin-left: 4px;
        }

        .auth-switch button:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
