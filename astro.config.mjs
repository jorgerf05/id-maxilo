import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://jorgerf05.github.io',
  base: '/id-maxilo',
  output: 'static',
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
