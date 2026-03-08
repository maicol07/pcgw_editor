import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { execSync } from 'child_process'

let version = 'main'
try {
    version = execSync('git describe --tags --exact-match').toString().trim()
} catch (e) {
    // No exact tag found, default to main
}

const commitHash = execSync('git rev-parse --short HEAD').toString().trim()

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(version),
        __COMMIT_HASH__: JSON.stringify(commitHash),
    },
    plugins: [
        vue(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'script',
            devOptions: {
                enabled: true
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 4194304 // 4 MB
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'maskable-icon.png'],
            manifest: {
                name: 'PCGW Editor',
                short_name: 'PCGW Editor',
                description: 'PCGamingWiki Editor Tool',
                theme_color: '#5b21b6',
                background_color: '#0f172a',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '640x640',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '640x640',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '640x640',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'maskable-icon.png',
                        sizes: '640x640',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ],
                screenshots: [
                    {
                        src: 'screenshot-wide.jpeg',
                        sizes: '1674x1607',
                        type: 'image/jpeg',
                        form_factor: 'wide'
                    }
                ],
                categories: ['utilities', 'productivity']
            }
        })
    ],
    server: {
        proxy: {
            '/pcgw-api': {
                target: 'https://www.pcgamingwiki.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/pcgw-api/, '/w/api.php'),
                headers: {
                    'Origin': 'https://www.pcgamingwiki.com'
                }
            }
        }
    }
})
