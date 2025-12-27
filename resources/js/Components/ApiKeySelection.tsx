import React, { useEffect, useState } from 'react';

interface Props {
  onReady: (key: string, baseUrl?: string) => void;
}

export const ApiKeySelection: React.FC<Props> = ({ onReady }) => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [envKeyDetected, setEnvKeyDetected] = useState(false);
  const [manualKey, setManualKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://generativelanguage.googleapis.com/v1beta');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const checkKey = async () => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        setEnvKeyDetected(true);
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

  const handleUseEnvKey = () => {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      onReady(process.env.API_KEY, baseUrl);
    }
  };

  const handleManualSubmit = () => {
    if (!manualKey.trim()) {
      alert("API 키를 입력해주세요.");
      return;
    }
    setHasKey(true);
    onReady(manualKey, baseUrl);
  };

  if (loading) return <div className="p-8 text-center text-neutral-400">Loading system check...</div>;

  if (hasKey) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center p-8 bg-neutral-800 rounded-2xl shadow-2xl border border-neutral-700 m-4 max-w-lg mx-auto animate-fade-in">
      <div className="bg-neutral-900 p-5 rounded-full border border-neutral-700">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-yellow-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">API 키 입력이 필요합니다</h2>

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
              <span className="px-2 bg-neutral-800 text-neutral-500">또는 직접 입력</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-neutral-400 text-sm">
        Google Gemini API 키를 입력해주세요.<br />
        입력한 키는 저장되지 않고 이번 세션에만 사용됩니다.
      </p>

      <div className="w-full space-y-3">
        <input
          type="password"
          placeholder="Google Gemini API Key 입력 (AI Studio)"
          className="w-full p-4 bg-neutral-900 border border-neutral-700 rounded-xl text-white outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition"
          value={manualKey}
          onChange={(e) => setManualKey(e.target.value)}
        />

        <div className="w-full">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition mb-2"
          >
            {showAdvanced ? '▼ 고급 설정 접기' : '▶ 고급 설정 (Proxy/Endpoint)'}
          </button>

          {showAdvanced && (
            <div className="w-full p-3 bg-neutral-900/50 rounded-xl border border-neutral-800 mb-3 animate-fade-in">
              <label className="block text-left text-[10px] text-neutral-500 uppercase font-bold mb-1">Base URL (Optional)</label>
              <input
                type="text"
                placeholder="https://generativelanguage.googleapis.com/v1beta"
                className="w-full p-2 bg-black border border-neutral-800 rounded-lg text-xs text-neutral-300 outline-none focus:border-yellow-500"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
              <p className="text-[10px] text-neutral-600 text-left mt-1">
                * Proxy 서버를 사용하는 경우 해당 주소를 입력하세요. (기본값: Google Official)
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleManualSubmit}
          className="w-full py-4 bg-yellow-500 text-neutral-900 font-black rounded-xl hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] transition flex items-center justify-center gap-2"
        >
          시작하기
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      <div className="text-sm text-neutral-500">
        <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-500 transition">
          결제 및 API 키 관련 도움말 보기
        </a>
      </div>
    </div>
  );
};