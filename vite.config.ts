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

// Production-only CSP. The key control is `script-src` without 'unsafe-inline'/'unsafe-eval':
// it stops injected markup (e.g. from wiki content rendered via v-html) from executing.
// Injected via <meta> because the app deploys as static files (no header control on the host).
// Not applied in dev — Vite's HMR relies on inline/eval scripts. Verify the prod build after changes.
// Hosts the app actually talks to. connect-src used to be `https:`, which allowed exfiltration to
// any HTTPS host and so cancelled most of the CSP's value as an XSS mitigation — the stored AI keys
// and wiki session are exactly what an injected script would want to POST somewhere.
const CONNECT_HOSTS = [
    'https://www.pcgamingwiki.com',
    'https://pcgw-proxy-login.maicol07.workers.dev',
    'https://accounts.google.com',
    'https://www.googleapis.com',
    'https://oauth2.googleapis.com',
    'https://generativelanguage.googleapis.com',
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://api.github.com',
].join(' ')

// Images come from the wiki and its thumbnail hosts, via the worker proxy or directly.
const IMG_HOSTS = [
    'https://pcgw-proxy-login.maicol07.workers.dev',
    'https://www.pcgamingwiki.com',
    'https://images.pcgamingwiki.com',
    'https://thumbnails.pcgamingwiki.com',
].join(' ')

const CSP = [
    "default-src 'self'",
    "script-src 'self' https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    `img-src 'self' data: blob: ${IMG_HOSTS}`,
    `connect-src 'self' blob: ${CONNECT_HOSTS}`,
    "frame-src 'self' https://accounts.google.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
].join('; ')

const cspPlugin = {
    name: 'inject-csp',
    apply: 'build' as const,
    transformIndexHtml(html: string) {
        return html.replace('</title>', `</title>\n  <meta http-equiv="Content-Security-Policy" content="${CSP}">`)
    },
}

// https://vitejs.dev/config/
export default defineConfig({
    css: {
        transformer: 'lightningcss',
    },
    build: {
        cssMinify: 'lightningcss',
    },
    define: {
        __APP_VERSION__: JSON.stringify(version),
        __COMMIT_HASH__: JSON.stringify(commitHash),
    },
    plugins: [
        cspPlugin,
        vue(),
        tailwindcss(),
        VitePWA({
            registerType: 'prompt',
            injectRegister: 'script',
            manifestFilename: 'manifest.json',
            devOptions: {
                enabled: true
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 4194304 // 4 MB
            },
            includeAssets: ['favicon.png', 'apple-touch-icon.png', 'maskable-icon.png'],
            manifest: {
                name: 'PCGamingWiki Editor',
                short_name: 'PCGW Editor',
                description: 'PCGamingWiki Editor Tool',
                theme_color: '#337abe',
                background_color: '#0f172a',
                icons: [
                    {
                        src: 'icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/icon-384x384.png',
                        sizes: '384x384',
                        type: 'image/png',
                        purpose: 'any'
                    },
                    {
                        src: 'icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/icon-192x192-maskable.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'maskable'
                    },
                    {
                        src: 'icons/icon-512x512-maskable.png',
                        sizes: '512x512',
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
