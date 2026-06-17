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

// Inject (or replace) a JSON-LD structured-data block. Pass `null` to remove it.
// Enables rich results (e.g. product price/availability) in search engines.
export function setJsonLd(id, data) {
  if (typeof document === 'undefined') return;
  const elId = `jsonld-${id}`;
  let el = document.getElementById(elId);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = elId;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// Build a schema.org Product object from a product + shop.
export function productJsonLd(product, shopName) {
  if (!product) return null;
  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: product.images?.length ? product.images : undefined,
    description: product.description || undefined,
    sku: product.sku || undefined,
    brand: shopName ? { '@type': 'Brand', name: shopName } : undefined,
    offers: {
      '@type': 'Offer',
      price: Number(product.price).toFixed(2),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  };
}
