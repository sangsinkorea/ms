import React, { useEffect, useState } from 'react';

interface Props {
  onReady: () => void;
}

export const ApiKeySelection: React.FC<Props> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envKeyDetected, setEnvKeyDetected] = useState(false);

  const checkKey = async () => {
    try {
      // Check for environment variable existence (and non-empty value)
      // Note: In some build environments process.env.API_KEY might be defined but empty string.
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        setEnvKeyDetected(true);
      }

      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
        if (selected) {
          onReady();
          return;
        }
      } else {
        console.warn("AI Studio window object not found.");
      }
    } catch (e) {
      console.error("Error checking API key:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    try {
        if((window as any).aistudio && (window as any).aistudio.openSelectKey) {
            await (window as any).aistudio.openSelectKey();
            // We assume success if no error, but race condition might exist. 
            // The prompt says: "assume the key selection was successful ... Do not add delay"
            setHasKey(true);
            onReady();
        } else {
            alert("AI Studio integration is not available in this environment.");
        }
    } catch (e) {
        console.error("Selection failed", e);
        setHasKey(false);
    }
  };

  const handleUseEnvKey = () => {
    // Just proceed, assuming process.env.API_KEY is valid
    onReady();
  };

  if (loading) return <div className="p-8 text-center text-neutral-400">Loading system check...</div>;

  // If already selected/confirmed via aistudio check
  if (hasKey) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center p-8 bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-700 m-4 max-w-lg mx-auto animate-fade-in">
      <div className="bg-neutral-900 p-5 rounded-full border border-neutral-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-yellow-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">API 키 연동이 필요합니다</h2>
      
      {envKeyDetected && (
        <div className="w-full bg-green-900/20 border border-green-500/30 p-4 rounded-lg animate-pulse-once">
            <p className="text-green-400 text-sm font-bold mb-1">✅ 환경 변수에서 API 키 감지됨</p>
            <p className="text-neutral-400 text-xs mb-3">설정된 API_KEY를 사용하여 즉시 시작할 수 있습니다.</p>
            <button 
                onClick={handleUseEnvKey}
                className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-lg border border-neutral-600 transition flex items-center justify-center gap-2"
            >
                <span>기존 API 키 사용하기</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
            </button>
            
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-700"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-2 bg-neutral-800 text-neutral-500">또는 다른 키 선택</span>
                </div>
            </div>
        </div>
      )}

      <p className="text-neutral-400 text-sm">
        이 앱은 Google Gemini의 유료 모델(Gemini 3 Pro Image)을 사용합니다.<br/>
        본인의 Google Cloud 프로젝트와 결제 계정이 연결된 API 키를 선택해주세요.
      </p>
      
      <button 
        onClick={handleSelectKey}
        className={`px-8 py-3 ${envKeyDetected ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' : 'bg-yellow-500 text-neutral-900 hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)]'} font-bold rounded-lg transition flex items-center gap-2 mx-auto`}
      >
        <span>Google Cloud API 키 선택하기</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </button>
      
      <div className="text-sm text-neutral-500">
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-500 transition">
          결제 및 API 키 관련 도움말 보기
        </a>
      </div>
    </div>
  );
};