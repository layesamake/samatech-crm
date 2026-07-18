import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductInterestSelector } from './ProductInterestSelector';

describe('ProductInterestSelector', () => {
  const products = [
    { id: 'active', name: 'Audit CRM' },
    { id: 'archived', name: 'Ancien service', archived: true },
  ];

  it('permet une sélection tactile et la recherche', () => {
    const onChange = vi.fn();
    render(<ProductInterestSelector products={products} selectedIds={[]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Audit CRM'));
    expect(onChange).toHaveBeenCalledWith(['active']);
    fireEvent.change(screen.getByLabelText('Rechercher un produit à associer'), { target: { value: 'ancien' } });
    expect(screen.queryByText('Audit CRM')).not.toBeInTheDocument();
    expect(screen.getByText(/Ancien service/)).toBeInTheDocument();
  });

  it('affiche une association archivée existante sans permettre une nouvelle sélection', () => {
    render(<ProductInterestSelector products={products} selectedIds={['archived']} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/Ancien service/)).toBeChecked();
    expect(screen.getByLabelText(/Ancien service/)).toBeDisabled();
    expect(screen.getByText(/1 élément sélectionné/)).toBeInTheDocument();
  });
});
