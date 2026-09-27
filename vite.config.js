import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
    const plugins = [react(), tailwindcss()];
    try {
        const m = await import('./.vite-source-tags.js');
        plugins.push(m.sourceTags());
    } catch {
        // optional local plugin
    }
    const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
    const processEnvDefines = {};
    for (const [key, value] of Object.entries(env)) {
        processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
    }
    return {
        base: '/web/',
        build: {
            // Files must live under dist/web/ so `serve -s dist` resolves /web/assets/* correctly.
            outDir: 'dist/web',
            emptyOutDir: true,
        },
        plugins,
        envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
        define: processEnvDefines,
        server: {
            proxy: {
                '/api': {
                    target: process.env.VITE_API_PROXY || 'http://localhost:8787',
                    changeOrigin: true,
                },
                '/uploads': {
                    target: process.env.VITE_API_PROXY || 'http://localhost:8787',
                    changeOrigin: true,
                },
            },
        },
    };
});
