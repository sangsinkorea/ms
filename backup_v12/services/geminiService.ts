
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { DetailImageSegment, ProductInfo } from "../types";

// Helper to get the AI instance with the user-selected key
const getAIClient = async (): Promise<GoogleGenAI> => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 상세 연결 테스트 결과 인터페이스
export interface ConnectionTestResult {
  textModel: boolean;
  imageModel: boolean;
  latency: number;
  status: 'ONLINE' | 'OFFLINE' | 'PARTIAL';
  timestamp: string;
}

// 상세 연결 테스트 함수
export const performDeepConnectionTest = async (): Promise<ConnectionTestResult> => {
  const startTime = Date.now();
  let textModelOk = false;
  let imageModelOk = false;

  try {
    const ai = await getAIClient();
    
    // 1. 텍스트 모델 테스트 (가장 기본적인 가용성 체크)
    const textResp = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'ping',
    });
    textModelOk = !!textResp.text;

    // 2. 이미지 모델 가용성 확인
    // 실제 이미지 생성은 리소스를 많이 소모하므로 응답 구조만 확인
    const imgCheckResp = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: 'check model capability and latency',
    });
    imageModelOk = !!imgCheckResp;

    const latency = Date.now() - startTime;
    let status: 'ONLINE' | 'OFFLINE' | 'PARTIAL' = 'OFFLINE';
    if (textModelOk && imageModelOk) status = 'ONLINE';
    else if (textModelOk || imageModelOk) status = 'PARTIAL';

    return {
      textModel: textModelOk,
      imageModel: imageModelOk,
      latency,
      status,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.error("Deep connection test failed:", error);
    return {
      textModel: false,
      imageModel: false,
      latency: Date.now() - startTime,
      status: 'OFFLINE',
      timestamp: new Date().toLocaleTimeString(),
    };
  }
};

// Helper to clean JSON string (remove markdown code blocks if present)
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  let cleaned = text.replace(/^```json\s*/, '').replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned;
};

// Helper to extract MIME type from base64 string
const getBase64Details = (base64String: string): { data: string, mimeType: string } => {
    const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
        return {
            mimeType: match[1],
            data: match[2]
        };
    }
    return {
        mimeType: 'image/jpeg',
        data: base64String
    };
};

// Helper to retry operations with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  retries: number = 3,
  initialDelay: number = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const status = error?.status || error?.response?.status;
    const message = error?.message || '';

    const isOverloaded = status === 503 || message.includes('overloaded') || message.includes('UNAVAILABLE');
    const isQuota = status === 429 || message.includes('quota') || message.includes('429');

    const shouldRetry = retries > 0 && (isOverloaded || isQuota);

    if (!shouldRetry) {
       if (status === 400 || message.includes('400') || message.includes('INVALID_ARGUMENT')) {
           throw error; 
       }

      let userMessage = "알 수 없는 오류가 발생했습니다.";

      if (isQuota) {
        userMessage = "⚠️ API 사용량이 초과되었습니다 (Quota Exceeded).\n잠시 후 다시 시도하거나, Google Cloud 콘솔에서 결제 계정과 할당량을 확인해주세요.";
      } else if (isOverloaded) {
        userMessage = "⚠️ AI 서버가 혼잡합니다 (System Overload).\n잠시 후 다시 시도해주세요.";
      } else if (status === 403 || message.includes('403') || message.includes('PERMISSION_DENIED') || message.includes('API key')) {
        userMessage = "⚠️ API 키 권한 오류 (Permission Denied).\nAPI 키가 올바른지, 결제 계정이 연결된 프로젝트인지 확인해주세요.";
      } else if (message.includes('SAFETY')) {
        userMessage = "⚠️ 안전 필터에 의해 차단되었습니다 (Safety Violation).\n부적절한 내용이 포함되어 있는지 확인해주세요.";
      } else {
        userMessage = `⚠️ 오류가 발생했습니다: ${message.substring(0, 100)}...`;
      }
      
      throw new Error(userMessage);
    }

    console.warn(`API Error (Status: ${status}). Retrying in ${initialDelay}ms...`, message);
    await new Promise(resolve => setTimeout(resolve, initialDelay));
    return retryWithBackoff(operation, retries - 1, initialDelay * 2);
  }
};

export const analyzeProductFromImages = async (base64Images: string[], contextText?: string): Promise<Partial<ProductInfo>> => {
  const ai = await getAIClient();
  const hasImages = base64Images.length > 0;
  
  let promptContext = "";
  if (hasImages) {
    promptContext = `Analyze the provided product images.`;
    if (contextText) promptContext += `\nAdditional User Context: "${contextText}" (Use this hint to better understand the product).`;
  } else {
    promptContext = `Analyze the following product description. NO images provided, so rely solely on the text.\nProduct Description: "${contextText}"`;
  }

  const prompt = `
    ${promptContext}
    
    Task: Extract or infer product details for a Korean e-commerce listing.
    
    Extract or infer the following details:
    1. name: A catchy product name in Korean.
    2. category: The product category (e.g., 패션, 식품).
    3. price: An estimated price range and a plausible promotion (e.g., "39,000원 (런칭특가 20%)").
    4. features: 3-5 key selling points or visual features in Korean.
    5. targetAudience: The most likely target demographic and persona (e.g., "트렌드에 민감한 20대 여성", "캠핑을 즐기는 3040 남성").
  `;

  const parts: any[] = base64Images.map(img => {
      const { data, mimeType } = getBase64Details(img);
      return {
          inlineData: {
              data: data,
              mimeType: mimeType
          }
      };
  });
  parts.push({ text: prompt });

  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
      model: hasImages ? 'gemini-2.5-flash' : 'gemini-3-pro-preview', 
      contents: { parts },
      config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  price: { type: Type.STRING },
                  features: { type: Type.STRING },
                  targetAudience: { type: Type.STRING },
              },
              required: ["name", "category", "price", "features", "targetAudience"]
          }
      }
  }));
  
  try {
      return JSON.parse(cleanJson(response.text || "{}"));
  } catch (e) {
      console.error("Failed to parse analysis JSON:", response.text);
      return {};
  }
};

export const planDetailPage = async (product: ProductInfo): Promise<DetailImageSegment[]> => {
  const ai = await getAIClient();
  
  let structureGuide = "";
  if (product.length === 5) {
    structureGuide = "5 Sections: 1. Hook, 2. Solution, 3. Clarity, 4. Service, 5. Information Disclosure (제품정보고시).";
  } else if (product.length === 7) {
    structureGuide = "7 Sections: 1. Hook, 2. Solution, 3. Social Proof, 4. Detail Deep Dive, 5. Clarity, 6. Service, 7. Information Disclosure (제품정보고시).";
  } else if (product.length === 9) {
    structureGuide = "9 Sections: 1. Hook, 2. Brand Story, 3. Solution, 4. Competitor Comparison, 5. Social Proof, 6. Detail Deep Dive, 7. Clarity, 8. Service, 9. Information Disclosure (제품정보고시).";
  } else if (product.length === 12) {
    structureGuide = "12 Sections: 1. Hook (Problem), 2. Brand Story, 3. Solution (Concept), 4. Solution (Details), 5. Competitor Comparison, 6. Social Proof (Reviews), 7. Deep Dive (Visuals 1), 8. Deep Dive (Visuals 2), 9. Clarity (Specs), 10. FAQ, 11. Service (Delivery/AS), 12. Information Disclosure (제품정보고시).";
  } else {
    structureGuide = "Auto: Analyze the product category. Usually 6-8 sections. IMPORTANT: The VERY LAST section must ALWAYS be 'Product Information Disclosure (제품정보고시)'.";
  }

  const prompt = `
    You are an expert Korean E-commerce Strategist. Plan a high-conversion product detail page.
    
    Product Details:
    - Name: ${product.name}
    - Category: ${product.category}
    - Features: ${product.features}
    - Target Audience: ${product.targetAudience}
    - Price/Promo: ${product.price}
    ${product.analysisContext ? `- Additional Context: ${product.analysisContext}` : ""}

    MANDATORY RULE:
    - The final section in the list MUST be the "Product Information Disclosure" (제품정보고시). 

    Requirement:
    - Structure: ${structureGuide}
    - STRICT CONSTRAINT: All 'keyMessage' (copy) MUST be in natural, persuasive KOREAN (Hangul).
    - 'visualPrompt': Describe the image in English for an image generation model.
    - 'visualPromptKo': A natural Korean translation of the 'visualPrompt'.
    - 'logicalSections': A short tag (Hook, Solution, Trust, Info).
  `;

  const response = await retryWithBackoff<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            logicalSections: { type: Type.STRING },
            keyMessage: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            visualPromptKo: { type: Type.STRING },
          },
          required: ["title", "logicalSections", "keyMessage", "visualPrompt", "visualPromptKo"],
        },
      },
    },
  }));

  try {
      const rawSegments = JSON.parse(cleanJson(response.text || "[]"));
      return rawSegments.map((seg: any, index: number) => ({
        ...seg,
        id: `seg-${Date.now()}-${index}`,
      }));
  } catch (e) {
      console.error("Failed to parse plan JSON:", response.text);
      throw new Error("기획안 생성에 실패했습니다. 다시 시도해주세요.");
  }
};

export const generateSectionImage = async (
  segment: DetailImageSegment, 
  referenceImages: string[]
): Promise<string> => {
  const ai = await getAIClient();

  const partsWithImages: any[] = [];
  referenceImages.slice(0, 3).forEach(img => {
      const { data, mimeType } = getBase64Details(img);
      partsWithImages.push({
        inlineData: {
          data: data,
          mimeType: mimeType,
        },
      });
  });

  const textPrompt = `
    Create a high-quality vertical e-commerce image (9:16 aspect ratio).
    
    Context: ${segment.visualPrompt}
    Key Message to include in Korean: "${segment.keyMessage}"
    
    Typography Guidelines:
    - Use modern, professional, and high-end Korean Sans-serif typography.
    - Ensure any rendered text is highly legible, aesthetically pleasing, and balanced.
    - Style: Premium commercial photography layout.
    - If the context is "Product Information Disclosure", use a clean, structured infographic style with clear data visualization.
  `;
  
  partsWithImages.push({ text: textPrompt });

  const callApi = async (useImages: boolean) => {
      return ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: useImages ? partsWithImages : [{ text: textPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16",
            imageSize: "1K"
          }
        }
      });
  };

  try {
      const response = await retryWithBackoff(() => callApi(referenceImages.length > 0));
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
  } catch (e: any) {
      const isBadRequest = e.status === 400 || e.message?.includes('INVALID_ARGUMENT') || e.message?.includes('400');
      if (referenceImages.length > 0 && isBadRequest) {
          const response = await retryWithBackoff(() => callApi(false));
           for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
      } else {
         throw new Error(e.message);
      }
  }
  throw new Error("이미지 생성 결과가 없습니다.");
};

export const generateThumbnail = async (
  productName: string,
  features: string,
  customInstructions: string,
  referenceImageBase64: string | null
): Promise<string> => {
  const ai = await getAIClient();
  const partsWithImages: any[] = [];
  if (referenceImageBase64) {
    const { data, mimeType } = getBase64Details(referenceImageBase64);
    partsWithImages.push({
      inlineData: {
        data: data,
        mimeType: mimeType,
      },
    });
  }

  const textPrompt = `
    Create a catchy e-commerce thumbnail (1:1 aspect ratio).
    Product Name: ${productName}
    Key Features: ${features}
    User Design Instructions: ${customInstructions || 'A clean and professional commercial look'}
    
    Typography Guidelines:
    - Use bold, modern, and highly readable Korean fonts for the product name and features.
    - The design should be premium and balanced.
    - Ensure high contrast and high legibility for mobile users.
    - Focus on making the product stand out.
  `;
  partsWithImages.push({ text: textPrompt });

  const callApi = async (useImages: boolean) => {
      return ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: useImages ? partsWithImages : [{ text: textPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });
  };

  try {
      const response = await retryWithBackoff(() => callApi(!!referenceImageBase64));
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
  } catch (e: any) {
      const isBadRequest = e.status === 400 || e.message?.includes('INVALID_ARGUMENT') || e.message?.includes('400');
      if (referenceImageBase64 && isBadRequest) {
          const response = await retryWithBackoff(() => callApi(false));
           for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
          }
      } else {
         throw e;
      }
  }
  throw new Error("썸네일 생성 실패");
};
