// Lightweight dynamic SEO: sets the document title + meta/OpenGraph tags.
// (Helps tab titles and social-share previews. Full crawler SEO would need SSR — see roadmap.)
export function setSEO({ title, description, image, url } = {}) {
  if (typeof document === 'undefined') return;
  if (title) document.title = title;

  const upsert = (attr, key, content) => {
    if (!content) return;
    let el = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  upsert('name', 'description', description);
  upsert('property', 'og:title', title);
  upsert('property', 'og:description', description);
  upsert('property', 'og:image', image);
  upsert('property', 'og:type', 'website');
  upsert('property', 'og:url', url || (typeof window !== 'undefined' ? window.location.href : ''));
  upsert('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
}
