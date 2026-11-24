import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// Numéro de version affiché en bas de Réglages (S18.21) : nombre de livraisons (commits), date de construction
// à l'heure de Paris et code court du dernier commit. Tout se calcule seul à chaque construction.
function git(cmd: string, fallback: string): string {
  try {
    return execSync(`git ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return fallback
  }
}
const built = new Date().toLocaleString('fr-FR', {
  timeZone: 'Europe/Paris',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})
const APP_VERSION = {
  number: git('rev-list --count HEAD', '0'),
  date: built.replace(',', ''),
  commit: git('rev-parse --short HEAD', 'local'),
}

// base './' : l'appli peut être hébergée à la racine ou dans un sous-dossier
// (ex. GitHub Pages : https://<user>.github.io/nikki-app/).
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(APP_VERSION) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // Les polices japonaises sont découpées en ~120 fichiers : on les garde
        // tous en cache pour que l'appli s'affiche bien hors-ligne.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: '日記 – Journal de japonais',
        short_name: '日記',
        description: 'Un petit journal quotidien en japonais, avec correction.',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f1ecdd',
        theme_color: '#f1ecdd',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
