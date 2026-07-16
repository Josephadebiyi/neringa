import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

// Hostinger normally applies the .htaccess SPA rewrite. These physical route
// entry points are an additional fallback so direct visits and browser refreshes
// still boot React even when host-level rewrite rules are delayed or unavailable.
const appRoutes = [
    'test', 'about', 'how-it-works', 'login', 'signup', 'terms', 'privacy',
    'help', 'track', 'banned', 'signup-test', 'dashboard', 'search',
    'post-trip', 'send-package', 'forgot-password', 'verify-otp',
    'reset-password', 'verify', 'support', 'shipping-success',
    'payment/callback', 'checkout/payment',
]

function hostingerRouteFallbacks() {
    return {
        name: 'hostinger-route-fallbacks',
        apply: 'build',
        async closeBundle() {
            const outputRoot = resolve('dist')
            await Promise.all(appRoutes.map(async (route) => {
                const routeEntry = resolve(outputRoot, route, 'index.html')
                await mkdir(dirname(routeEntry), { recursive: true })
                await copyFile(resolve(outputRoot, 'index.html'), routeEntry)
            }))
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), hostingerRouteFallbacks()],
    css: {
        postcss: {
            plugins: [
                tailwindcss(),
                autoprefixer(),
            ],
        },
    },
})
