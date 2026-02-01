/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'selector', // or 'class'
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Surface palette (slate-based)
                surface: {
                    0: '#ffffff',
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617',
                },
                // Primary (violet - more vibrant)
                primary: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7e22ce',
                    800: '#6b21a8',
                    900: '#581c87',
                    950: '#3b0764',
                },
                // Accent colors
                accent: {
                    teal: {
                        50: '#f0fdfa',
                        500: '#14b8a6',
                        600: '#0d9488',
                    },
                    orange: {
                        50: '#fff7ed',
                        500: '#f97316',
                        600: '#ea580c',
                    },
                    emerald: {
                        50: '#ecfdf5',
                        500: '#10b981',
                        600: '#059669',
                    },
                },
            },
            spacing: {
                '0.75': '0.1875rem',
                '1.25': '0.3125rem',
                '2.25': '0.5625rem',
                '3.5': '0.875rem',
                '4.5': '1.125rem',
            },
            fontSize: {
                '2xs': ['0.6875rem', { lineHeight: '1rem' }],
            },
            boxShadow: {
                'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
                'soft-lg': '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 2px 8px -2px rgba(0, 0, 0, 0.06)',
                'glow': '0 0 20px -5px rgba(168, 85, 247, 0.4)',
                'glow-sm': '0 0 10px -3px rgba(168, 85, 247, 0.3)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in': 'slideIn 0.2s ease-out',
                'scale-in': 'scaleIn 0.15s ease-out',
                'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.8' },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
        },
    },
    plugins: [],
}
