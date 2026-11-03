import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home', () => {
  it('affiche le titre de la vitrine', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /bilan nutritionnel, suivi chaque semaine/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /faire le test de vitalité/i })).toHaveAttribute('href', '/test');
  });
});
