import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    /**
     * Content-Security-Policy voor de pagina's. SvelteKit voegt zelf een nonce
     * toe aan zijn eigen scripts, dus 'script-src' kan bij 'self' blijven.
     *
     * - style-src 'unsafe-inline': de pagina's gebruiken style-attributen en
     *   Svelte-overgangen maken inline <style>-elementen.
     * - img/media data: en blob: — portretten zijn data-URI's en een vraag kan
     *   een ingebouwd fragment (data:) meebrengen; de telefoon leest een
     *   gekozen selfie via blob:.
     * - De lettertypen komen van Google Fonts; zonder internet vallen ze terug
     *   op het systeemlettertype en verandert er verder niets.
     */
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
        'font-src': ['self', 'https://fonts.gstatic.com', 'data:'],
        'img-src': ['self', 'data:', 'blob:'],
        'media-src': ['self', 'data:', 'blob:'],
        'connect-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
        'frame-ancestors': ['none'],
      },
    },
  },
};

export default config;
