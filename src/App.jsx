// Master Valley v73 - Main App (Firebase Auth 추가)
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './config/firebase';
import LoginScreen from './components/LoginScreen';
import CategorySelection from './components/CategorySelection';
import PhotoStyleScreen from './components/PhotoStyleScreen';
import ProcessingScreen from './components/ProcessingScreen';
import ResultScreen from './components/ResultScreen';
import GalleryScreen from './components/GalleryScreen';
import './styles/App.css';

const App = () => {
  // 인증 상태
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 화면 상태: 'category' | 'photoStyle' | 'processing' | 'result'
  const [currentScreen, setCurrentScreen] = useState('category');
  const [showGallery, setShowGallery] = useState(false);
  
  // 데이터 상태
  const [mainCategory, setMainCategory] = useState(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [aiSelectedArtist, setAiSelectedArtist] = useState(null);
  const [aiSelectedWork, setAiSelectedWork] = useState(null);
  
  // 원클릭 결과
  const [fullTransformResults, setFullTransformResults] = useState(null);
  
  // 거장 관련
  const [masterChatData, setMasterChatData] = useState({});
  const [currentMasterIndex, setCurrentMasterIndex] = useState(0);
  const [masterResultImages, setMasterResultImages] = useState({});
  const [retransformingMasters, setRetransformingMasters] = useState({});

  // Firebase 인증 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        console.log('✅ User logged in:', currentUser.email);
      }
    });

    return () => unsubscribe();
  }, []);

  // 로그인 성공
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      handleReset();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 1단계: 대카테고리 선택
  const handleCategorySelect = (categoryId) => {
    setMainCategory(categoryId);
    setCurrentScreen('photoStyle');
  };

  // 2단계: 사진 + 스타일 선택 완료 → 변환 시작
  const handlePhotoStyleSelect = (photo, style) => {
    setUploadedPhoto(photo);
    setSelectedStyle(style);
    setCurrentScreen('processing');
  };

  // 변환 완료
  const handleProcessingComplete = (style, resultImageUrl, result) => {
    if (result && result.isFullTransform) {
      setFullTransformResults(result.results);
      setResultImage(null);
      setAiSelectedArtist(null);
      setAiSelectedWork(null);
      setCurrentMasterIndex(0);
    } else {
      setFullTransformResults(null);
      setResultImage(resultImageUrl);
      
      if (result && result.aiSelectedArtist) {
        setAiSelectedArtist(result.aiSelectedArtist);
      } else {
        setAiSelectedArtist(null);
      }
      
      if (result && result.selected_work) {
        setAiSelectedWork(result.selected_work);
      } else {
        setAiSelectedWork(null);
      }
    }
    
    setCurrentScreen('result');
  };

  // 처음으로
  const handleReset = () => {
    setCurrentScreen('category');
    setMainCategory(null);
    setUploadedPhoto(null);
    setSelectedStyle(null);
    setResultImage(null);
    setAiSelectedArtist(null);
    setAiSelectedWork(null);
    setFullTransformResults(null);
    setMasterChatData({});
    setCurrentMasterIndex(0);
    setMasterResultImages({});
    setRetransformingMasters({});
  };

  // 뒤로가기
  const handleBackToCategory = () => {
    setCurrentScreen('category');
    setMainCategory(null);
    setUploadedPhoto(null);
  };

  // 다시 시도 성공 시
  const handleRetrySuccess = (result) => {
    if (result.isFullTransform) {
      setFullTransformResults(result.results);
    } else {
      setResultImage(result.resultUrl);
      setAiSelectedArtist(result.aiSelectedArtist || null);
      setAiSelectedWork(result.selected_work || null);
    }
  };

  // 로딩 중
  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
        <style>{`
          .auth-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 로그인 안 된 경우
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      {/* 사용자 정보 & 로그아웃 버튼 */}
      <div className="user-header">
        <span className="user-email">{user.email || user.displayName || '사용자'}</span>
        <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
      </div>

      {/* 갤러리 화면 */}
      {showGallery && (
        <GalleryScreen 
          onBack={() => setShowGallery(false)} 
          onHome={() => {
            setShowGallery(false);
            handleReset();
          }}
        />
      )}

      {/* 메인 앱 */}
      {!showGallery && (
        <>
          {currentScreen === 'category' && (
            <CategorySelection 
              onSelect={handleCategorySelect}
              onGallery={() => setShowGallery(true)}
            />
          )}

          {currentScreen === 'photoStyle' && (
            <PhotoStyleScreen
              mainCategory={mainCategory}
              onBack={handleBackToCategory}
              onSelect={handlePhotoStyleSelect}
            />
          )}

          {currentScreen === 'processing' && (
            <ProcessingScreen
              photo={uploadedPhoto}
              selectedStyle={selectedStyle}
              onComplete={handleProcessingComplete}
            />
          )}

          {currentScreen === 'result' && (
            <ResultScreen
              originalPhoto={uploadedPhoto}
              resultImage={resultImage}
              selectedStyle={selectedStyle}
              aiSelectedArtist={aiSelectedArtist}
              aiSelectedWork={aiSelectedWork}
              fullTransformResults={fullTransformResults}
              onReset={handleReset}
              onGallery={() => setShowGallery(true)}
              onRetrySuccess={handleRetrySuccess}
              masterChatData={masterChatData}
              onMasterChatDataChange={setMasterChatData}
              currentMasterIndex={currentMasterIndex}
              onMasterIndexChange={setCurrentMasterIndex}
              masterResultImages={masterResultImages}
              onMasterResultImagesChange={setMasterResultImages}
              retransformingMasters={retransformingMasters}
              onRetransformingMastersChange={setRetransformingMasters}
            />
          )}
        </>
      )}

      <style>{`
        .app {
          min-height: 100vh;
          position: relative;
        }
        
        .user-header {
          position: fixed;
          top: 0;
          right: 0;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0 0 0 12px;
        }
        
        .user-email {
          color: white;
          font-size: 13px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .logout-btn {
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default App;
