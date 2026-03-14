import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingState from '@/components/LoadingState';

describe('LoadingState', () => {
  it('renders loading text', () => {
    render(<LoadingState />);
    expect(screen.getByText('Uncovering history...')).toBeInTheDocument();
  });

  it('renders skeleton lines', () => {
    const { container } = render(<LoadingState />);
    const skeletonLines = container.querySelectorAll('.animate-pulse');
    expect(skeletonLines.length).toBeGreaterThan(0);
  });
});
