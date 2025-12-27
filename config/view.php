<?php

return [
    // Directories where Blade view files are located.
    'paths' => [
        resource_path('views'),
    ],

    // Compiled Blade view path. Vercel's filesystem is read‑only, so we store compiled views in /tmp.
    // The .env variable VIEW_COMPILED_PATH overrides this; default falls back to the usual storage path.
    'compiled' => env('VIEW_COMPILED_PATH', realpath(storage_path('framework/views'))),
];
