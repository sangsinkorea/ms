
import React, { useState, useRef } from 'react';
import { ProductInfo, PageLength, DetailImageSegment } from '../types';
import { planDetailPage, generateSectionImage, analyzeProductFromImages } from '../services/geminiService';
// @ts-ignore
import { jsPDF } from 'https://esm.sh/jspdf';

const getPreviewStructure = (len: PageLength) => {
    if (len === 'auto') return [];
    const structures: Record<number, {name: string, type: 'hook' | 'solution' | 'proof' | 'detail' | 'trust' | 'brand' | 'info'}[]> = {
        5: [
            { name: 'Hook (도입: 문제제기)', type: 'hook' },
            { name: 'Solution (솔루션: 제품소개)', type: 'solution' },
            { name: 'Clarity (정보: 스펙/사이즈)', type: 'detail' },
            { name: 'Service (서비스: 배송/AS)', type: 'trust' },
            { name: 'Information (제품정보고시)', type: 'info' }
        ],
        7: [
            { name: 'Hook (도입: 강렬한 훅)', type: 'hook' },
            { name: 'Solution (솔루션: 제품소개)', type: 'solution' },
            { name: 'Social Proof (검증: 리뷰/평점)', type: 'proof' },
            { name: 'Deep Dive (상세: 특장점 심화)', type: 'detail' },
            { name: 'Clarity (정보: 스펙/옵션)', type: 'detail' },
            { name: 'Service (서비스: 배송안내)', type: 'trust' },
            { name: 'Information (제품정보고시)', type: 'info' }
        ],
        9: [
            { name: 'Hook (도입: 강렬한 훅)', type: 'hook' },
            { name: 'Brand Story (브랜드 철학)', type: 'brand' },
            { name: 'Solution (솔루션: 제품소개)', type: 'solution' },
            { name: 'Comparison (비교: 타사대비 우위)', type: 'proof' },
            { name: 'Social Proof (검증: 베스트 리뷰)', type: 'proof' },
            { name: 'Deep Dive (상세: 디테일 컷)', type: 'detail' },
            { name: 'Clarity (정보: 스펙/사이즈)', type: 'detail' },
            { name: 'Service (서비스: 배송안내)', type: 'trust' },
            { name: 'Information (제품정보고시)', type: 'info' }
        ],
        12: [
            { name: 'Hook (도입: 문제제기)', type: 'hook' },
            { name: 'Brand Story (브랜드 스토리)', type: 'brand' },
            { name: 'Solution (핵심 가치 제안)', type: 'solution' },
            { name: 'Solution (기능적 특징)', type: 'solution' },
            { name: 'Comparison (타사 비교)', type: 'proof' },
            { name: 'Social Proof (사용자 리뷰)', type: 'proof' },
            { name: 'Deep Dive (상세 디테일 1)', type: 'detail' },
            { name: 'Deep Dive (상세 디테일 2)', type: 'detail' },
            { name: 'Clarity (제품 사양)', type: 'detail' },
            { name: 'Trust (FAQ)', type: 'trust' },
            { name: 'Service (배송/AS 안내)', type: 'trust' },
            { name: 'Information (제품정보고시)', type: 'info' }
        ]
    };
    return structures[len as number] || [];
};

const getTypeStyle = (type: string) => {
    switch(type) {
        case 'hook': return 'bg-red-500/10 border-red-500/30 text-red-200';
        case 'solution': return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200';
        case 'proof': return 'bg-green-500/10 border-green-500/30 text-green-200';
        case 'brand': return 'bg-purple-500/10 border-purple-500/30 text-purple-200';
        case 'trust': return 'bg-blue-500/10 border-blue-500/30 text-blue-200';
        case 'info': return 'bg-neutral-700 border-neutral-500 text-white';
        case 'detail': default: return 'bg-neutral-800 border-neutral-600 text-neutral-300';
    }
};

const DetailPlanner: React.FC = () => {
  const [step, setStep] = useState<'INPUT' | 'PLANNING' | 'REVIEW' | 'GENERATING' | 'RESULT'>('INPUT');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);

  const [productInfo, setProductInfo] = useState<ProductInfo>({
    name: '',
    category: '',
    price: '',
    features: '',
    targetAudience: '',
    referenceImages: [],
    analysisContext: '',
    length: 'auto',
  });

  const [plan, setPlan] = useState<DetailImageSegment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (files.length > 5) {
        alert("사진은 최대 5장까지 업로드 가능합니다.");
        return;
    }
    const readers: Promise<string>[] = [];
    Array.from(files).forEach((file: File) => {
        readers.push(new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        }));
    });
    try {
        const base64Images = await Promise.all(readers);
        setProductInfo(prev => ({ ...prev, referenceImages: base64Images }));
    } catch (e) {
        console.error("Image read failed", e);
    }
  };

  const handleRemoveImage = (index: number) => {
      setProductInfo(prev => ({
          ...prev,
          referenceImages: prev.referenceImages.filter((_, i) => i !== index)
      }));
  };

  const handleAnalyzeImages = async () => {
      const hasImages = productInfo.referenceImages.length > 0;
      const hasText = productInfo.analysisContext && productInfo.analysisContext.trim().length > 0;
      if (!hasImages && !hasText) {
          alert("이미지를 업로드하거나 설명을 입력해주세요.");
          return;
      }
      setAnalyzing(true);
      setError(null);
      try {
        const analysis = await analyzeProductFromImages(productInfo.referenceImages, productInfo.analysisContext);
        setProductInfo(prev => ({
            ...prev,
            name: analysis.name || prev.name,
            category: analysis.category || prev.category,
            price: analysis.price || prev.price,
            features: analysis.features || prev.features,
            targetAudience: analysis.targetAudience || prev.targetAudience
        }));
      } catch (e: any) {
        setError(e.message || "분석 중 오류가 발생했습니다.");
      } finally {
        setAnalyzing(false);
      }
  };

  const handleAutoRecommendFeatures = async () => {
     if (!productInfo.name) {
         alert("상품명을 입력해주세요.");
         return;
     }
     setProductInfo(prev => ({...prev, features: prev.features + " (AI 추천: 고품질 소재, 빠른 배송, 트렌디한 디자인)"}));
  };

  const generatePlan = async () => {
    if (!productInfo.name) {
      setError("상품명은 필수입니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setStep('PLANNING');
      const generatedPlan = await planDetailPage(productInfo);
      setPlan(generatedPlan);
      setStep('REVIEW');
    } catch (e: any) {
      setError(e.message || "기획 생성 중 오류가 발생했습니다.");
      setStep('INPUT');
    } finally {
      setLoading(false);
    }
  };

  const updateSegment = (id: string, field: keyof DetailImageSegment, value: string) => {
    setPlan(prev => prev.map(seg => seg.id === id ? { ...seg, [field]: value } : seg));
  };

  const processSingleSegment = async (id: string) => {
    const target = plan.find(p => p.id === id);
    if (!target || target.isGenerating) return;

    setPlan(prev => prev.map(p => 
        p.id === id ? { ...p, isGenerating: true, errorMessage: undefined } : p
    ));

    try {
        const imageUrl = await generateSectionImage(target, productInfo.referenceImages);
        setPlan(prev => prev.map(p => 
            p.id === id ? { ...p, imageUrl: imageUrl, isGenerating: false } : p
        ));
    } catch (e: any) {
        setPlan(prev => prev.map(p => 
            p.id === id ? { ...p, isGenerating: false, errorMessage: e.message } : p
        ));
    }
  };

  const startGeneration = async () => {
    setStep('GENERATING');
    const CONCURRENCY_LIMIT = 2;
    const segmentsToProcess = [...plan];
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < segmentsToProcess.length) {
        const index = currentIndex++;
        const segment = segmentsToProcess[index];
        if (!segment) break;
        if (segment.imageUrl && !segment.errorMessage) continue;
        await processSingleSegment(segment.id);
      }
    };

    const workers = Array(Math.min(CONCURRENCY_LIMIT, segmentsToProcess.length)).fill(null).map(() => worker());
    await Promise.all(workers);
    setStep('RESULT');
  };

  const downloadAll = () => {
      plan.forEach((seg, idx) => {
          if(seg.imageUrl) {
              const link = document.createElement('a');
              link.href = seg.imageUrl;
              link.download = `detail_page_${idx + 1}_${seg.logicalSections}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      });
  };

  const downloadAsPDF = async () => {
    if (plan.length === 0 || !plan.every(s => !!s.imageUrl)) {
        alert("아직 모든 이미지가 생성되지 않았습니다.");
        return;
    }
    
    setIsPdfProcessing(true);
    try {
        // PDF format: A4 (210 x 297 mm) is standard, but e-commerce is vertical.
        // We will create a PDF where each page matches the aspect ratio of our image.
        // 9:16 aspect ratio -> width 210mm, height = 210 * 16 / 9 = 373.33mm
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [210, 373.33]
        });

        for (let i = 0; i < plan.length; i++) {
            const seg = plan[i];
            if (seg.imageUrl) {
                if (i > 0) pdf.addPage([210, 373.33], 'portrait');
                pdf.addImage(seg.imageUrl, 'PNG', 0, 0, 210, 373.33);
            }
        }
        
        const fileName = `${productInfo.name || '상세페이지'}_전체.pdf`;
        pdf.save(fileName);
    } catch (e) {
        console.error("PDF generation failed", e);
        alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
        setIsPdfProcessing(false);
    }
  };

  if (step === 'INPUT') {
    const previewStructure = getPreviewStructure(productInfo.length);
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in p-2">
        <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-yellow-500 pl-4">1. 기본 정보 입력</h2>
        <div className="bg-neutral-800 p-6 rounded-xl border border-dashed border-neutral-600 hover:border-yellow-500 transition group relative">
            <div className="mb-6">
                <label className="block text-sm font-bold text-yellow-400 mb-2">[선택] 제품 사진 업로드 (최대 5장)</label>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden"/>
                {productInfo.referenceImages.length === 0 ? (
                    <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer flex flex-col items-center justify-center h-32 bg-neutral-900 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition">
                        <div className="text-center text-neutral-500 group-hover:text-yellow-500 transition">
                            <span className="text-2xl block mb-1">+</span>
                            <span className="text-sm font-medium">사진 업로드 (선택)</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {productInfo.referenceImages.map((img, idx) => (
                            <div key={idx} className="relative aspect-square bg-neutral-900 rounded-lg overflow-hidden border border-neutral-700">
                                <img src={img} alt={`Ref ${idx}`} className="w-full h-full object-cover" />
                                <button onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-red-600 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                        ))}
                        {productInfo.referenceImages.length < 5 && (
                            <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-neutral-900 border border-neutral-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-yellow-500 hover:text-yellow-500 text-neutral-600 transition">
                                <span className="text-2xl">+</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="mb-4 pt-4 border-t border-neutral-700/50">
                <label className="block text-sm font-bold text-yellow-400 mb-2">제품 설명 / 특징</label>
                <textarea className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:ring-1 focus:ring-yellow-500 outline-none mb-2 resize-none h-24 transition" placeholder="설명을 자세히 적어주세요." value={productInfo.analysisContext} onChange={(e) => setProductInfo({...productInfo, analysisContext: e.target.value})}/>
            </div>
            <button onClick={handleAnalyzeImages} disabled={analyzing} className="w-full py-3 bg-neutral-700 hover:bg-neutral-600 text-yellow-400 font-bold rounded-lg border border-yellow-500/30 flex items-center justify-center gap-2 transition disabled:opacity-50">
                {analyzing ? <><div className="animate-spin h-5 w-5 border-2 border-yellow-500 border-t-transparent rounded-full"></div><span>분석 중...</span></> : <><span>✨ AI 자동 분석</span></>}
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">상품명</label>
                <input type="text" className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none" value={productInfo.name} onChange={(e) => setProductInfo({...productInfo, name: e.target.value})}/>
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">카테고리</label>
                <input type="text" className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none" value={productInfo.category} onChange={(e) => setProductInfo({...productInfo, category: e.target.value})}/>
            </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">가격 / 프로모션</label>
            <input type="text" className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none" value={productInfo.price} onChange={(e) => setProductInfo({...productInfo, price: e.target.value})}/>
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-neutral-400">상품 특징</label>
                <button onClick={handleAutoRecommendFeatures} className="text-xs text-neutral-500 hover:text-white">+ 내용 추가</button>
            </div>
            <textarea className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white outline-none h-24 transition" value={productInfo.features} onChange={(e) => setProductInfo({...productInfo, features: e.target.value})}/>
        </div>
        <div>
            <label className="block text-sm font-medium text-neutral-400 mb-3">길이 설정</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                {[{val:'auto',label:'Auto'},{val:5,label:'5장'},{val:7,label:'7장'},{val:9,label:'9장'},{val:12,label:'12장'}].map((opt) => (
                    <button key={opt.val} onClick={() => setProductInfo({...productInfo, length: opt.val as any})} className={`p-4 text-center border rounded-xl transition font-medium ${productInfo.length === opt.val ? 'bg-neutral-800 border-yellow-500 text-yellow-400' : 'bg-neutral-800 border-neutral-700 text-neutral-400'}`}>
                        {opt.label}
                    </button>
                ))}
            </div>
            <div className="bg-neutral-900 rounded-xl border border-neutral-700 p-5 shadow-inner">
                {productInfo.length === 'auto' ? (
                     <div className="flex flex-col items-center justify-center py-8 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg bg-neutral-800/30">
                        <p className="font-medium text-sm text-neutral-300">AI가 최적의 구조를 설계합니다 (마지막은 정보고시)</p>
                     </div>
                ) : (
                    <div className="relative pl-4 border-l-2 border-neutral-800 space-y-3">
                        {previewStructure.map((item, idx) => (
                            <div key={idx} className="relative">
                                <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neutral-800 border-2 border-neutral-600"></div>
                                <div className={`p-3 rounded-lg border text-sm font-bold flex items-center gap-3 shadow-sm ${getTypeStyle(item.type)}`}>
                                    <span className="opacity-50 text-xs">{idx + 1}</span>
                                    <span>{item.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        {error && <div className="p-3 bg-red-900/30 border border-red-500/50 rounded text-red-400 text-sm text-center">{error}</div>}
        <button onClick={generatePlan} disabled={loading || analyzing} className="w-full py-4 bg-yellow-500 text-neutral-900 text-lg font-black rounded-xl hover:bg-yellow-400 shadow-xl disabled:opacity-50 mt-4">
            {loading ? 'AI 기획중...' : 'AI 기획안 생성하기'}
        </button>
      </div>
    );
  }

  if (step === 'PLANNING') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[500px]">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-500 mb-6"></div>
              <h3 className="text-2xl font-bold text-white mb-2">AI 전략가가 기획중입니다</h3>
          </div>
      )
  }

  if (step === 'REVIEW') {
      return (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-neutral-800 pb-6 gap-4 sticky top-0 bg-neutral-900/90 backdrop-blur z-10">
                  <h2 className="text-2xl font-bold text-white border-l-4 border-yellow-500 pl-4">2. 기획안 검토 및 수정</h2>
                  <button onClick={startGeneration} className="w-full md:w-auto px-8 py-3 bg-yellow-500 text-neutral-900 rounded-lg font-bold hover:bg-yellow-400 shadow-lg transition">
                      전체 이미지 생성 시작 &rarr;
                  </button>
              </div>

              <div className="grid grid-cols-1 gap-8">
                  {plan.map((seg, index) => (
                      <div key={seg.id} className="bg-neutral-800 p-6 rounded-2xl shadow-lg border border-neutral-700 flex flex-col md:flex-row gap-8">
                          <div className="md:w-1/3 flex flex-col gap-3">
                              <span className="inline-block px-3 py-1 bg-neutral-900 text-yellow-500 text-xs font-bold rounded-full w-fit border border-neutral-700">
                                  SECTION {index + 1} : {seg.logicalSections}
                              </span>
                              <div className="aspect-[9/16] bg-neutral-900 rounded-xl border border-neutral-700 flex flex-col items-center justify-center text-neutral-600 text-sm relative overflow-hidden">
                                  {seg.isGenerating ? (
                                      <div className="flex flex-col items-center gap-2">
                                          <div className="animate-spin h-8 w-8 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                                          <span className="text-xs">생성 중...</span>
                                      </div>
                                  ) : seg.imageUrl ? (
                                      <img src={seg.imageUrl} className="w-full h-full object-cover" />
                                  ) : (
                                      <div className="flex flex-col items-center gap-2 text-center p-4">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                          <span>이미지 영역</span>
                                      </div>
                                  )}
                                  
                                  <button 
                                    onClick={() => processSingleSegment(seg.id)}
                                    disabled={seg.isGenerating}
                                    className="absolute bottom-2 right-2 bg-neutral-900/90 hover:bg-yellow-500 hover:text-neutral-900 text-yellow-500 p-2 rounded-lg border border-neutral-700 transition shadow-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                                  >
                                      {seg.imageUrl ? "다시 생성" : "개별 생성"}
                                  </button>
                              </div>
                          </div>
                          <div className="md:w-2/3 space-y-5">
                              <div>
                                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1 block">섹션 제목</label>
                                  <input value={seg.title} onChange={(e) => updateSegment(seg.id, 'title', e.target.value)} className="w-full text-xl font-bold text-white border-b border-neutral-600 hover:border-yellow-500 focus:border-yellow-500 outline-none bg-transparent transition py-1"/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2 block">카피 (광고 문구)</label>
                                  <textarea value={seg.keyMessage} onChange={(e) => updateSegment(seg.id, 'keyMessage', e.target.value)} className="w-full p-4 bg-neutral-900/50 rounded-lg border border-neutral-700 text-neutral-200 font-medium focus:ring-1 focus:ring-yellow-500 outline-none leading-relaxed" rows={3}/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 block">AI 이미지 지시문 (Visual Prompt - English)</label>
                                  <textarea value={seg.visualPrompt} onChange={(e) => updateSegment(seg.id, 'visualPrompt', e.target.value)} className="w-full p-3 bg-neutral-900 rounded-lg text-sm text-neutral-400 border border-neutral-800 focus:border-neutral-600 outline-none" rows={2}/>
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-neutral-500/70 uppercase tracking-wider mb-2 block">지시문 한글 번역 (Visual Prompt - Korean)</label>
                                  <textarea value={seg.visualPromptKo} onChange={(e) => updateSegment(seg.id, 'visualPromptKo', e.target.value)} className="w-full p-3 bg-neutral-900/50 rounded-lg text-sm text-neutral-500 border border-neutral-800 focus:border-neutral-700 outline-none" rows={2}/>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  if (step === 'GENERATING' || step === 'RESULT') {
      return (
        <div className="max-w-2xl mx-auto animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-neutral-900/90 backdrop-blur-md py-4 z-10 border-b border-neutral-800 px-4">
                <h2 className="text-2xl font-bold text-white">
                    {step === 'GENERATING' ? '상세페이지 생성 중...' : '상세페이지 완성'}
                </h2>
                {step === 'RESULT' && (
                     <div className="flex gap-2 sm:gap-3 flex-wrap justify-end">
                        <button onClick={() => setStep('REVIEW')} className="px-3 py-2 text-xs sm:text-sm text-neutral-400 bg-neutral-800 border border-neutral-700 rounded hover:bg-neutral-700 hover:text-white transition">
                            기획안으로
                        </button>
                        <button 
                            onClick={downloadAsPDF} 
                            disabled={isPdfProcessing}
                            className="px-3 py-2 text-xs sm:text-sm bg-neutral-700 text-yellow-500 border border-yellow-500/30 rounded font-bold hover:bg-neutral-600 transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {isPdfProcessing ? (
                                <div className="animate-spin h-3 w-3 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            )}
                            PDF 다운로드
                        </button>
                        <button onClick={downloadAll} className="px-3 py-2 text-xs sm:text-sm bg-yellow-500 text-neutral-900 rounded font-bold hover:bg-yellow-400 shadow-lg transition flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            전체 저장 (PNG)
                        </button>
                     </div>
                )}
            </div>

            <div className="flex flex-col items-center bg-neutral-800 shadow-2xl overflow-hidden rounded-lg min-h-screen border border-neutral-800">
                {plan.map((seg, index) => (
                    <div key={seg.id} className="w-full relative group border-b border-neutral-700 last:border-0">
                        {seg.isGenerating ? (
                            <div className="aspect-[9/16] bg-neutral-800 w-full flex flex-col items-center justify-center animate-pulse">
                                <div className="loader ease-linear rounded-full border-4 border-t-4 border-yellow-500 h-12 w-12 mb-4"></div>
                                <p className="text-neutral-400 font-medium">#{index + 1} 생성 중...</p>
                            </div>
                        ) : seg.imageUrl ? (
                            <div className="relative w-full">
                                <img src={seg.imageUrl} alt={seg.title} className="w-full block" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-start justify-end p-4">
                                     <button 
                                        onClick={() => processSingleSegment(seg.id)}
                                        className="bg-yellow-500 text-neutral-900 px-3 py-1.5 rounded-md font-bold text-xs shadow-xl flex items-center gap-1 hover:scale-105 active:scale-95 transition"
                                     >
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                         다시 생성
                                     </button>
                                </div>
                                <div className="absolute top-2 left-2 bg-neutral-900/80 backdrop-blur text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-neutral-700 uppercase">
                                    {seg.logicalSections}
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-[9/16] bg-neutral-900 w-full flex items-center justify-center text-neutral-600">
                                {seg.errorMessage ? (
                                    <div className="text-center p-4">
                                        <p className="text-red-400 font-bold mb-2">생성 실패</p>
                                        <button onClick={() => processSingleSegment(seg.id)} className="text-xs bg-neutral-800 px-3 py-1 rounded border border-neutral-700 hover:bg-neutral-700 transition">다시 시도</button>
                                    </div>
                                ) : '대기 중...'}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      );
  }
  return null;
};

export default DetailPlanner;
