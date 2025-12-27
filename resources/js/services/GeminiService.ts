import axios from 'axios';
import { ProductInfo, DetailImageSegment } from '../types/modusangse';

export interface ConnectionTestResult {
    textModel: boolean;
    imageModel: boolean;
    latency: number;
    status: 'ONLINE' | 'OFFLINE' | 'PARTIAL';
    timestamp: string;
}

// API Key management is now just passing it to the backend or handling it statefully.
// For compatibility with the existing UI which passes apiKey around, we will accept it as an argument.

export const performDeepConnectionTest = async (apiKey?: string, baseUrl?: string) => {
    try {
        const response = await axios.post('/api/ai/test', { apiKey, baseUrl });
        return response.data;
    } catch (error) {
        console.error("Deep connection test failed:", error);
        return {
            textModel: false,
            imageModel: false,
            latency: 0,
            status: 'OFFLINE',
            timestamp: new Date().toLocaleTimeString(),
        };
    }
};

export const analyzeProductFromImages = async (base64Images: string[], contextText?: string, apiKey?: string, baseUrl?: string): Promise<Partial<ProductInfo>> => {
    try {
        const response = await axios.post('/api/ai/analyze', {
            images: base64Images,
            context: contextText,
            apiKey,
            baseUrl
        });
        return response.data;
    } catch (error) {
        console.error("Analysis failed:", error);
        throw error; // Re-throw to handle in UI
    }
};

export const planDetailPage = async (product: ProductInfo, apiKey?: string, baseUrl?: string): Promise<DetailImageSegment[]> => {
    try {
        const response = await axios.post('/api/ai/plan', {
            product,
            apiKey,
            baseUrl
        });
        return response.data;
    } catch (error) {
        console.error("Planning failed:", error);
        throw new Error("기획안 생성에 실패했습니다.");
    }
};

export const generateSectionImage = async (
    segment: DetailImageSegment,
    referenceImages: string[],
    apiKey?: string,
    baseUrl?: string
): Promise<string> => {
    try {
        const response = await axios.post('/api/ai/image', {
            prompt: segment.visualPrompt, // or visualPromptKo based on backend logic? Backend uses english usually
            referenceImages,
            apiKey,
            baseUrl
        });
        return response.data.image;
    } catch (error) {
        console.error("Image gen failed:", error);
        throw new Error("이미지 생성 실패");
    }
};

export const generateThumbnail = async (
    productName: string,
    features: string,
    customInstructions: string,
    referenceImageBase64: string | null,
    apiKey?: string,
    baseUrl?: string
): Promise<string> => {
    try {
        const prompt = `
            Create a catchy e-commerce thumbnail (1:1 aspect ratio) for the Korean market.
            Product Name: ${productName}
            Key Features: ${features}
            User Design Instructions: ${customInstructions || 'A clean and professional commercial look, K-beauty/K-commercial style'}
        `;

        const response = await axios.post('/api/ai/image', {
            prompt,
            referenceImages: referenceImageBase64 ? [referenceImageBase64] : [],
            apiKey,
            baseUrl
        });
        return response.data.image;
    } catch (error) {
        console.error("Thumbnail gen failed:", error);
        throw new Error("썸네일 생성 실패");
    }
};
