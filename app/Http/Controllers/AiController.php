<?php

namespace App\Http\Controllers;

use App\Services\GeminiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiController extends Controller
{
    public function __construct()
    {
        // middleware?
    }

    private function getApiKey($inputKey)
    {
        // Trim input key if provided
        if (!empty($inputKey) && is_string($inputKey) && trim($inputKey) !== '') {
            $trimmed = trim($inputKey);
            if (!str_starts_with($trimmed, 'AIza')) {
                // Log or just let it pass to eventually fail? 
                // Better to strict check here if we are sure all Google Keys start with AIza. 
                // Yes they do.
            }
            return $trimmed;
        }

        $user = Auth::user();
        if ($user && $user->google_api_key) {
            // If stored key is invalid, we can't do much but return it.
            return $user->google_api_key;
        }

        return null;
    }

    public function connectionTest(Request $request)
    {
        $apiKey = $this->getApiKey($request->input('apiKey'));

        if (!$apiKey) {
            return response()->json(['status' => 'OFFLINE', 'error' => 'API Key missing']);
        }

        $service = new GeminiService(
            $apiKey,
            $request->input('baseUrl')
        );
        return response()->json($service->deepConnectionTest());
    }

    public function analyzeProduct(Request $request)
    {
        $request->validate([
            'images' => 'nullable|array',
            'context' => 'nullable|string',
            'apiKey' => 'nullable|string', // Changed to nullable
            'baseUrl' => 'nullable|string'
        ]);

        $apiKey = $this->getApiKey($request->input('apiKey'));

        if (!$apiKey) {
            return response()->json(['error' => 'API Key is required.'], 401);
        }

        Log::info("Analyze Request", [
            'has_images' => !empty($request->input('images')),
            'context_length' => strlen($request->input('context') ?? ''),
            'api_key_source' => $request->input('apiKey') ? 'input' : 'stored',
            'api_key_preview' => substr($apiKey, 0, 5) . '...',
            'base_url' => $request->input('baseUrl')
        ]);

        $service = new GeminiService(
            $apiKey,
            $request->input('baseUrl')
        );

        try {
            $result = $service->analyzeProductFromImages(
                $request->input('images') ?? [], // Ensure array
                $request->input('context')
            );
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error("Analysis Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 400); // Return 400 for API errors
        }
    }

    public function planDetail(Request $request)
    {
        $request->validate([
            'product' => 'required|array',
            'apiKey' => 'nullable|string', // Changed to nullable
            'baseUrl' => 'nullable|string'
        ]);

        $apiKey = $this->getApiKey($request->input('apiKey'));
        if (!$apiKey)
            return response()->json(['error' => 'API Key required'], 401);

        $service = new GeminiService(
            $apiKey,
            $request->input('baseUrl')
        );
        $plan = $service->planDetailPage($request->input('product'));

        return response()->json($plan);
    }

    public function generateImage(Request $request)
    {
        $request->validate([
            'prompt' => 'required|string',
            'apiKey' => 'nullable|string', // Changed to nullable
            'referenceImages' => 'nullable|array',
            'baseUrl' => 'nullable|string'
        ]);

        $apiKey = $this->getApiKey($request->input('apiKey'));
        if (!$apiKey)
            return response()->json(['error' => 'API Key required'], 401);

        $service = new GeminiService(
            $apiKey,
            $request->input('baseUrl')
        );
        try {
            $image = $service->generateImage(
                $request->input('prompt'),
                $request->input('referenceImages', [])
            );
            return response()->json(['image' => $image]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
