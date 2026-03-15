import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Collapsible from '@/components/Collapsible';

const defaultProps = {
  expanded: false,
  onToggle: vi.fn(),
  header: <span>Test Header</span>,
  id: 'test-content',
};

describe('Collapsible', () => {
  // ── Header visibility ──────────────────────────────────────────────────
  it('always renders the header content', () => {
    render(<Collapsible {...defaultProps}><p>Body</p></Collapsible>);
    expect(screen.getByText('Test Header')).toBeInTheDocument();
  });

  it('always renders children in the DOM (for scrollHeight measurement)', () => {
    render(<Collapsible {...defaultProps}><p>Body Content</p></Collapsible>);
    // Children exist in DOM even when collapsed (clipped by overflow-hidden)
    expect(screen.getByText('Body Content')).toBeInTheDocument();
  });

  // ── Toggle behavior ────────────────────────────────────────────────────
  it('calls onToggle when header button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <Collapsible {...defaultProps} onToggle={onToggle}>
        <p>Body</p>
      </Collapsible>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  // ── Accessibility ──────────────────────────────────────────────────────
  it('sets aria-expanded to false when collapsed', () => {
    render(<Collapsible {...defaultProps} expanded={false}><p>Body</p></Collapsible>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded to true when expanded', () => {
    render(<Collapsible {...defaultProps} expanded={true}><p>Body</p></Collapsible>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('sets aria-controls on the header button', () => {
    render(<Collapsible {...defaultProps}><p>Body</p></Collapsible>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-controls', 'test-content');
  });

  it('content region has role="region"', () => {
    render(<Collapsible {...defaultProps} expanded={true}><p>Body</p></Collapsible>);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('content region has aria-labelledby pointing to header', () => {
    render(<Collapsible {...defaultProps}><p>Body</p></Collapsible>);
    const region = document.getElementById('test-content');
    expect(region).toHaveAttribute('aria-labelledby', 'test-content-header');
  });

  // ── Visual states ──────────────────────────────────────────────────────
  it('content has maxHeight 0 when collapsed', () => {
    render(<Collapsible {...defaultProps} expanded={false}><p>Body</p></Collapsible>);
    const region = document.getElementById('test-content')!;
    expect(region.style.maxHeight).toBe('0px');
  });

  it('content has opacity 0 when collapsed', () => {
    render(<Collapsible {...defaultProps} expanded={false}><p>Body</p></Collapsible>);
    const region = document.getElementById('test-content')!;
    expect(region.style.opacity).toBe('0');
  });

  it('content has opacity 1 when expanded', () => {
    render(<Collapsible {...defaultProps} expanded={true}><p>Body</p></Collapsible>);
    const region = document.getElementById('test-content')!;
    expect(region.style.opacity).toBe('1');
  });

  it('content has overflow-hidden class for clipping', () => {
    render(<Collapsible {...defaultProps}><p>Body</p></Collapsible>);
    const region = document.getElementById('test-content')!;
    expect(region.className).toContain('overflow-hidden');
  });

  // ── Chevron rotation ───────────────────────────────────────────────────
  it('chevron has rotate-0 when collapsed', () => {
    const { container } = render(<Collapsible {...defaultProps} expanded={false}><p>Body</p></Collapsible>);
    const chevron = container.querySelector('svg');
    // SVG className is SVGAnimatedString in jsdom — use getAttribute
    expect(chevron?.getAttribute('class')).toContain('rotate-0');
  });

  it('chevron has rotate-90 when expanded', () => {
    const { container } = render(<Collapsible {...defaultProps} expanded={true}><p>Body</p></Collapsible>);
    const chevron = container.querySelector('svg');
    expect(chevron?.getAttribute('class')).toContain('rotate-90');
  });

  // ── Custom className ───────────────────────────────────────────────────
  it('applies className to outer container', () => {
    const { container } = render(
      <Collapsible {...defaultProps} className="bg-stone-900 rounded-xl">
        <p>Body</p>
      </Collapsible>
    );
    expect(container.firstElementChild?.className).toContain('bg-stone-900');
    expect(container.firstElementChild?.className).toContain('rounded-xl');
  });

  // ── Locked mode ──────────────────────────────────────────────────────
  it('renders header as non-interactive div when locked', () => {
    render(
      <Collapsible {...defaultProps} locked>
        <p>Body</p>
      </Collapsible>
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Test Header')).toBeInTheDocument();
  });

  it('does not call onToggle when locked header is clicked', () => {
    const onToggle = vi.fn();
    render(
      <Collapsible {...defaultProps} onToggle={onToggle} locked>
        <p>Body</p>
      </Collapsible>
    );
    fireEvent.click(screen.getByText('Test Header'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('still shows chevron when locked', () => {
    const { container } = render(
      <Collapsible {...defaultProps} locked expanded={true}>
        <p>Body</p>
      </Collapsible>
    );
    const chevron = container.querySelector('svg');
    expect(chevron?.getAttribute('class')).toContain('rotate-90');
  });

  it('locked collapsed state has maxHeight 0 and opacity 0', () => {
    render(
      <Collapsible {...defaultProps} locked expanded={false}>
        <p>Body</p>
      </Collapsible>
    );
    const region = document.getElementById('test-content')!;
    expect(region.style.maxHeight).toBe('0px');
    expect(region.style.opacity).toBe('0');
  });

  it('locked expanded state has opacity 1', () => {
    render(
      <Collapsible {...defaultProps} locked expanded={true}>
        <p>Body</p>
      </Collapsible>
    );
    const region = document.getElementById('test-content')!;
    expect(region.style.opacity).toBe('1');
  });
});
