import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoadingState, { type LoadingPhase } from '@/components/LoadingState';

const now = Date.now();

const activePhases: LoadingPhase[] = [
  { label: 'Searching the archives...', startTime: now - 3000 },
  { label: 'Firing up the time machine...', startTime: 0 },
];

const completedStoryPhases: LoadingPhase[] = [
  { label: 'Searching the archives...', startTime: now - 6000, endTime: now - 3000 },
  { label: 'Firing up the time machine...', startTime: now - 3000 },
];

const allCompletedPhases: LoadingPhase[] = [
  { label: 'Searching the archives...', startTime: now - 6000, endTime: now - 3000 },
  { label: 'Firing up the time machine...', startTime: now - 3000, endTime: now },
];

describe('LoadingState', () => {
  // All content tests pass autoExpand so the body is visible
  it('renders phase list with correct number of phases', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now - 3000} autoExpand />);
    const phaseList = screen.getByTestId('phase-list');
    expect(phaseList.children.length).toBe(2);
  });

  it('renders phase labels', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now - 3000} autoExpand />);
    expect(screen.getByText('Searching the archives...')).toBeInTheDocument();
    expect(screen.getByText('Firing up the time machine...')).toBeInTheDocument();
  });

  it('renders skeleton lines', () => {
    const { container } = render(<LoadingState phases={activePhases} pipelineStart={now} autoExpand />);
    const skeletonLines = container.querySelectorAll('.animate-pulse');
    expect(skeletonLines.length).toBeGreaterThan(0);
  });

  it('shows elapsed timer when pipelineStart is provided', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now - 2500} autoExpand />);
    const timer = screen.getByTestId('elapsed-timer');
    expect(timer).toBeInTheDocument();
    expect(timer.textContent).toMatch(/\d+\.\ds/);
  });

  it('marks active phase with data-phase-state="active"', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now - 3000} autoExpand />);
    const phase0 = screen.getByTestId('phase-0');
    expect(phase0.getAttribute('data-phase-state')).toBe('active');
  });

  it('marks waiting phase with data-phase-state="waiting"', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now - 3000} autoExpand />);
    const phase1 = screen.getByTestId('phase-1');
    expect(phase1.getAttribute('data-phase-state')).toBe('waiting');
  });

  it('marks completed phase with data-phase-state="completed"', () => {
    render(<LoadingState phases={completedStoryPhases} pipelineStart={now - 6000} autoExpand />);
    const phase0 = screen.getByTestId('phase-0');
    expect(phase0.getAttribute('data-phase-state')).toBe('completed');
  });

  it('shows header text', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now} />);
    expect(screen.getByText('Preparing your moment in history')).toBeInTheDocument();
  });

  it('renders checkmark for completed phases', () => {
    render(<LoadingState phases={allCompletedPhases} pipelineStart={now - 6000} autoExpand />);
    const phase0 = screen.getByTestId('phase-0');
    expect(phase0.textContent).toContain('✓');
  });

  // ── Collapsible accordion behavior ─────────────────────────────────────
  it('starts collapsed by default (no autoExpand)', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now} />);
    const region = document.getElementById('loading-state-content')!;
    expect(region.style.opacity).toBe('0');
    expect(region.style.maxHeight).toBe('0px');
  });

  it('auto-expands when autoExpand is true', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now} autoExpand />);
    const region = document.getElementById('loading-state-content')!;
    expect(region.style.opacity).toBe('1');
  });

  it('auto-collapses when autoCollapse becomes true', () => {
    const { rerender } = render(
      <LoadingState phases={activePhases} pipelineStart={now} autoExpand />
    );
    const region = document.getElementById('loading-state-content')!;
    expect(region.style.opacity).toBe('1');

    rerender(
      <LoadingState phases={activePhases} pipelineStart={now} autoExpand autoCollapse />
    );
    expect(region.style.opacity).toBe('0');
  });

  it('header remains visible when collapsed', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now} />);
    expect(screen.getByText('Preparing your moment in history')).toBeInTheDocument();
  });

  it('is system-controlled (locked) — no toggle button rendered', () => {
    render(<LoadingState phases={activePhases} pipelineStart={now} autoExpand />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
