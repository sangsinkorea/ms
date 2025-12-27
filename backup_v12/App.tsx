
import React, { useState } from 'react';
import DetailPlanner from './components/DetailPlanner';
import ThumbnailGenerator from './components/ThumbnailGenerator';
import { ApiKeySelection } from './components/ApiKeySelection';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'detail' | 'thumb'>('detail');
  const [isApiKeyReady, setIsApiKeyReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 전역 초기화 핸들러: 모든 상태를 초기 상태로 되돌림
  const handleGlobalReset = () => {
    if (window.confirm("입력한 모든 데이터가 삭제되고 시작 화면으로 돌아갑니다. 정말 초기화하시겠습니까?")) {
      setIsApiKeyReady(false);
      setActiveTab('detail');
      setResetKey(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => {
                if (isApiKeyReady && window.confirm("메인 화면으로 이동하시겠습니까? (작성 중인 내용은 유지됩니다)")) {
                   setActiveTab('detail');
                }
              }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg shadow-[0_0_10px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-transform"></div>
              <h1 className="text-xl font-black tracking-tight text-white">
                모두의 상세페이지
              </h1>
            </div>
            
            {isApiKeyReady && (
                <div className="flex items-center gap-4">
                  {/* 탭 네비게이션 */}
                  <nav className="hidden sm:flex space-x-1 bg-neutral-800 p-1 rounded-lg border border-neutral-700">
                    <button
                        onClick={() => setActiveTab('detail')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${
                        activeTab === 'detail' 
                            ? 'bg-yellow-500 text-neutral-900 shadow-sm' 
                            : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        상세페이지 제작
                    </button>
                    <button
                        onClick={() => setActiveTab('thumb')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${
                        activeTab === 'thumb' 
                            ? 'bg-yellow-500 text-neutral-900 shadow-sm' 
                            : 'text-neutral-400 hover:text-white'
                        }`}
                    >
                        썸네일 제작
                    </button>
                  </nav>

                  <div className="flex items-center gap-2">
                    {/* API 설정 버튼 */}
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="p-2 text-neutral-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-all group"
                      title="API 보안 설정"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-45 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    {/* 전체 초기화 버튼 */}
                    <button 
                      onClick={handleGlobalReset}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all border border-transparent hover:border-red-400/30 group"
                      title="모든 내용 초기화 및 시작화면으로"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-[-45deg] transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden xs:inline">전체 초기화</span>
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isApiKeyReady ? (
            <ApiKeySelection key={`auth-${resetKey}`} onReady={() => setIsApiKeyReady(true)} />
        ) : (
            <div key={`app-${resetKey}`}>
                <div className="sm:hidden flex mb-6 bg-neutral-800 p-1 rounded-lg border border-neutral-700">
                    <button
                        onClick={() => setActiveTab('detail')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition ${activeTab === 'detail' ? 'bg-yellow-500 text-neutral-900' : 'text-neutral-400'}`}
                    >
                        상세페이지
                    </button>
                    <button
                        onClick={() => setActiveTab('thumb')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold transition ${activeTab === 'thumb' ? 'bg-yellow-500 text-neutral-900' : 'text-neutral-400'}`}
                    >
                        썸네일
                    </button>
                </div>
                {activeTab === 'detail' && <DetailPlanner />}
                {activeTab === 'thumb' && <ThumbnailGenerator />}
            </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm text-neutral-500">
                문의 <span className="font-bold text-neutral-300">상신코리아</span>{' '}
                <a href="mailto:help@sangsinkorea.com" target="_blank" className="text-yellow-500 hover:underline hover:text-yellow-400">
                    help@sangsinkorea.com
                </a>
            </p>
            <p className="text-xs text-neutral-600 mt-2">
                Powered by Google Gemini 3 Pro | 상신코리아
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
