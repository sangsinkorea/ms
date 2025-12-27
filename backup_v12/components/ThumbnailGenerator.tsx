
import React, { useState, useRef } from 'react';
import { generateThumbnail } from '../services/geminiService';

const ThumbnailGenerator: React.FC = () => {
  const [productName, setProductName] = useState('');
  const [features, setFeatures] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [refImage, setRefImage] = useState<string | null>(null);
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!productName || !refImage) {
        alert("상품명과 이미지는 필수입니다.");
        return;
    }
    setLoading(true);
    setGeneratedImage(null);
    try {
        const url = await generateThumbnail(productName, features, customInstructions, refImage);
        setGeneratedImage(url);
    } catch (e: any) {
        console.error(e);
        alert(e.message || "생성 실패. API 키 또는 이미지를 확인해주세요.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in p-2">
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white border-l-4 border-yellow-500 pl-4">썸네일 생성 설정</h2>
            
            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">상품명</label>
                <input 
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="상품명 입력"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">강조 문구 (특징)</label>
                <input 
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 outline-none"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="예: 1+1 행사중, 초강력 흡수"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">원하는 디자인 컨셉 / 지시사항</label>
                <textarea 
                    className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-yellow-500 outline-none h-24 resize-none transition"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="예: 따뜻한 감성적인 분위기, 배경은 미니멀하게, 폰트는 가독성 좋고 고급스럽게 등"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">참조 이미지 업로드 (필수)</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer h-40 w-full bg-neutral-800 border-2 border-dashed border-neutral-600 rounded-lg flex items-center justify-center hover:border-yellow-500 hover:bg-neutral-700/50 overflow-hidden relative transition group"
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>
                    {refImage ? (
                        <img src={refImage} className="w-full h-full object-cover" alt="Reference" />
                    ) : (
                        <div className="text-center">
                            <span className="text-3xl block mb-2 opacity-30">📸</span>
                            <span className="text-neutral-500 group-hover:text-yellow-500 font-medium transition text-sm">원본 상품 사진 업로드</span>
                        </div>
                    )}
                </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-yellow-500 text-neutral-900 text-lg font-black rounded-xl hover:bg-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-50 transition"
            >
                {loading ? 'AI 디자인 생성 중...' : '썸네일 생성하기'}
            </button>
        </div>

        <div className="bg-neutral-800 rounded-2xl border border-neutral-700 flex items-center justify-center p-8 min-h-[400px] shadow-lg">
            {loading ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-neutral-400">사용자 지시사항을 반영하여<br/>최적의 디자인을 구성 중입니다...</p>
                </div>
            ) : generatedImage ? (
                <div className="space-y-6 text-center w-full">
                    <img src={generatedImage} alt="Thumbnail" className="rounded-lg shadow-2xl max-w-full h-auto border border-neutral-600 mx-auto" />
                    <a 
                        href={generatedImage} 
                        download="thumbnail.png" 
                        className="inline-block px-6 py-3 bg-neutral-700 text-white rounded-lg font-bold hover:bg-neutral-600 transition"
                    >
                        이미지 다운로드
                    </a>
                </div>
            ) : (
                <div className="text-neutral-500 text-center">
                    <div className="text-4xl mb-4 opacity-20">🖼️</div>
                    <p>설정을 완료하고<br/>생성 버튼을 눌러주세요.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default ThumbnailGenerator;
