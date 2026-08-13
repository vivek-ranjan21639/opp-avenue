import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: {
    noExternal: ['react-helmet-async'],
  },
  build: {
    // Split heavy/admin-only libraries into their own chunks so they don't
    // bloat the initial public bundle. Each named chunk is fetched only when
    // a route that needs it is loaded.
    rollupOptions: {
      output: isSsrBuild
        ? undefined
        : {
            manualChunks: {
              'react-vendor': ['react', 'react-dom', 'react-router-dom'],
              'query-vendor': ['@tanstack/react-query'],
              'supabase-vendor': ['@supabase/supabase-js'],
              'tiptap-vendor': [
                '@tiptap/core',
                '@tiptap/react',
                '@tiptap/starter-kit',
                '@tiptap/extension-color',
                '@tiptap/extension-font-family',
                '@tiptap/extension-highlight',
                '@tiptap/extension-image',
                '@tiptap/extension-link',
                '@tiptap/extension-placeholder',
                '@tiptap/extension-table',
                '@tiptap/extension-table-cell',
                '@tiptap/extension-table-header',
                '@tiptap/extension-table-row',
                '@tiptap/extension-text-align',
                '@tiptap/extension-text-style',
                '@tiptap/extension-underline',
                '@tiptap/extension-youtube',
              ],
              'charts-vendor': ['recharts'],
            },
        },
    },
  },
}));
