import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import DetailPlanner from '../Components/DetailPlanner';
import ThumbnailGenerator from '../Components/ThumbnailGenerator';
import { ApiKeySelection } from '../Components/ApiKeySelection';
import SettingsModal from '../Components/SettingsModal';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    email_verified_at: string;
    has_api_key: boolean;
}

interface PageProps {
    auth: {
        user: User;
    };
}

const Home: React.FC<PageProps> = ({ auth }) => {
    const [activeTab, setActiveTab] = useState<'detail' | 'thumb'>('detail');
    const [isApiKeyReady, setIsApiKeyReady] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [resetKey, setResetKey] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Auto-login if user has API Key
    React.useEffect(() => {
        if (auth.user && auth.user.has_api_key) {
            setIsApiKeyReady(true);
            setApiKey(''); // Empty key triggers backend fallback to stored key
        }
    }, [auth.user]);

    // 전역 초기화 핸들러: 모든 상태를 초기 상태로 되돌림
    const handleGlobalReset = () => {
        if (window.confirm("입력한 모든 데이터가 삭제되고 시작 화면으로 돌아갑니다. 정말 초기화하시겠습니까?")) {
            setIsApiKeyReady(false);
            setApiKey('');
            setBaseUrl('');
            setActiveTab('detail');
            setResetKey(prev => prev + 1);
        }
    };

    return (
        <>
            <Head title="모두의 상세페이지" />
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

                            <div className="flex items-center gap-4">
                                {isApiKeyReady && (
                                    <div className="flex items-center gap-4">
                                        {/* 탭 네비게이션 */}
                                        <nav className="hidden sm:flex space-x-1 bg-neutral-800 p-1 rounded-lg border border-neutral-700">
                                            <button
                                                onClick={() => setActiveTab('detail')}
                                                className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'detail'
                                                    ? 'bg-yellow-500 text-neutral-900 shadow-sm'
                                                    : 'text-neutral-400 hover:text-white'
                                                    }`}
                                            >
                                                상세페이지 제작
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('thumb')}
                                                className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'thumb'
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

                                {/* Auth Links */}
                                <div className="flex items-center gap-3 border-l border-neutral-800 pl-4">
                                    {auth.user ? (
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="hidden sm:inline text-sm text-neutral-400">
                                                    <span className="text-yellow-500 font-bold">{auth.user.name}</span>님
                                                </span>
                                                <Link
                                                    href={route('profile.edit')}
                                                    className="text-xs border border-neutral-700 bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-md hover:bg-neutral-700 hover:text-white transition"
                                                >
                                                    내 정보
                                                </Link>
                                            </div>
                                            <Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                                className="text-xs font-bold text-neutral-500 hover:text-white transition"
                                            >
                                                로그아웃
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route('login')}
                                                className="text-sm font-bold text-neutral-400 hover:text-white transition px-2"
                                            >
                                                로그인
                                            </Link>
                                            <Link
                                                href={route('register')}
                                                className="text-sm font-bold bg-yellow-500 text-neutral-900 px-4 py-2 rounded-lg hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20"
                                            >
                                                회원가입
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {!auth.user ? (
                        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in-up">
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight leading-tight">
                                    AI로 만드는<br />압도적 상세페이지
                                </h2>
                                <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
                                    상품 이미지만 올리세요. <br className="sm:hidden" />
                                    AI가 기획부터 디자인, 썸네일 제작까지 <br className="sm:hidden" />
                                    단 1분 만에 완성해드립니다.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <Link
                                    href={route('login')}
                                    className="px-8 py-4 bg-yellow-500 text-neutral-900 rounded-xl font-bold text-lg hover:bg-yellow-400 transition transform hover:scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center"
                                >
                                    로그인하기
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="px-8 py-4 bg-neutral-800 text-white rounded-xl font-bold text-lg hover:bg-neutral-700 transition transform hover:scale-105 border border-neutral-700 flex items-center justify-center"
                                >
                                    회원가입
                                </Link>
                            </div>
                        </div>
                    ) : (
                        !isApiKeyReady ? (
                            <ApiKeySelection
                                key={`auth-${resetKey}`}
                                onReady={(key, url) => { setIsApiKeyReady(true); setApiKey(key); if (url) setBaseUrl(url); }}
                            />
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
                                {activeTab === 'detail' && <DetailPlanner apiKey={apiKey} baseUrl={baseUrl} />}
                                {activeTab === 'thumb' && <ThumbnailGenerator apiKey={apiKey} baseUrl={baseUrl} />}
                            </div>
                        )
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
        </>
    );
};

export default Home;
