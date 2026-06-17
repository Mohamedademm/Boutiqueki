import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';

const product = {
  id: 'p1',
  name: 'T-Shirt Noir',
  price: 19.99,
  comparePrice: 29.99,
  category: 'Vêtements',
  images: ['https://x.com/a.jpg'],
};

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ProductCard product={product} shopSlug="boutiki" {...props} />
    </MemoryRouter>
  );

describe('ProductCard', () => {
  test('renders name, price and links to the product page', () => {
    renderCard();
    expect(screen.getByText('T-Shirt Noir')).toBeInTheDocument();
    expect(screen.getByText('19.99 €')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/s/boutiki/p/p1');
  });

  test('shows discount badge when comparePrice > price', () => {
    renderCard();
    expect(screen.getByText('-33%')).toBeInTheDocument(); // (29.99-19.99)/29.99 ≈ 33%
  });

  test('lazy-loads the product image', () => {
    renderCard();
    expect(screen.getByAltText('T-Shirt Noir')).toHaveAttribute('loading', 'lazy');
  });

  test('fires wishlist toggle without navigating', () => {
    const onWishlistToggle = vi.fn();
    renderCard({ onWishlistToggle });
    fireEvent.click(screen.getByRole('button'));
    expect(onWishlistToggle).toHaveBeenCalledWith('p1');
  });
});
