import { describe, test, expect, beforeEach } from 'vitest';
import { setSEO, setJsonLd, productJsonLd } from './seo';

describe('setSEO', () => {
  beforeEach(() => { document.head.innerHTML = ''; document.title = ''; });

  test('sets document title', () => {
    setSEO({ title: 'Mon Produit' });
    expect(document.title).toBe('Mon Produit');
  });

  test('upserts description + OG meta tags', () => {
    setSEO({ title: 'T', description: 'desc', image: 'https://x.com/a.jpg' });
    expect(document.head.querySelector('meta[name="description"]').content).toBe('desc');
    expect(document.head.querySelector('meta[property="og:title"]').content).toBe('T');
    expect(document.head.querySelector('meta[property="og:image"]').content).toBe('https://x.com/a.jpg');
    expect(document.head.querySelector('meta[name="twitter:card"]').content).toBe('summary_large_image');
  });

  test('does not duplicate meta tags on repeated calls', () => {
    setSEO({ title: 'A', description: 'one' });
    setSEO({ title: 'B', description: 'two' });
    expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1);
    expect(document.head.querySelector('meta[name="description"]').content).toBe('two');
  });
});

describe('setJsonLd', () => {
  beforeEach(() => { document.head.innerHTML = ''; });

  test('injects a JSON-LD script', () => {
    setJsonLd('product', { '@type': 'Product', name: 'X' });
    const el = document.getElementById('jsonld-product');
    expect(el).toBeTruthy();
    expect(el.type).toBe('application/ld+json');
    expect(JSON.parse(el.textContent).name).toBe('X');
  });

  test('removes the script when passed null', () => {
    setJsonLd('product', { name: 'X' });
    setJsonLd('product', null);
    expect(document.getElementById('jsonld-product')).toBeNull();
  });
});

describe('productJsonLd', () => {
  test('builds a schema.org Product with EUR offer', () => {
    const ld = productJsonLd({ name: 'T-Shirt', price: 19.9, images: ['a.jpg'], sku: 'TS1' }, 'Boutiki');
    expect(ld['@type']).toBe('Product');
    expect(ld.name).toBe('T-Shirt');
    expect(ld.brand).toEqual({ '@type': 'Brand', name: 'Boutiki' });
    expect(ld.offers.price).toBe('19.90');
    expect(ld.offers.priceCurrency).toBe('EUR');
  });

  test('returns null without a product', () => {
    expect(productJsonLd(null)).toBeNull();
  });
});
