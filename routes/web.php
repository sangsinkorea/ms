<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/api-key', [ProfileController::class, 'updateApiKey'])->name('profile.api-key');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


// AI Routes
use App\Http\Controllers\AiController;

Route::post('/api/ai/test', [AiController::class, 'connectionTest']);
Route::post('/api/ai/analyze', [AiController::class, 'analyzeProduct']);
Route::post('/api/ai/plan', [AiController::class, 'planDetail']);
Route::post('/api/ai/image', [AiController::class, 'generateImage']);

require __DIR__ . '/auth.php';

