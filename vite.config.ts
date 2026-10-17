import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const htmlHybridPlugin = () => ({
  name: 'html-hybrid-plugin',
  transformIndexHtml: {
    order: 'pre' as const,
    handler(html: string) {
      return html
        .replace(/<link rel="stylesheet" href="\.\/bundle\/app\.css"[^>]*>/g, '')
        .replace(
          /<script type="module" src="\.\/bundle\/app\.js"[^>]*><\/script>/g,
          '<script type="module" src="/src/main.tsx"></script>'
        );
    },
  },
});

export default defineConfig(({command}) => {
  return {
    base: command === 'build' ? './' : '/',
    plugins: [htmlHybridPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
