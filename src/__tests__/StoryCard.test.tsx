import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoryCard from '@/components/StoryCard';

const defaultProps = {
  story: 'The smoke rises above the battlefield...',
  date: new Date(2026, 2, 4), // March 4, 2026
  eventTitle: 'The Battle of Example',
  eventYear: '1865',
  mlaCitation: 'Smith, John. History of Wars. Oxford UP, 2020.',
  genre: null as string | null,
  onRandomHistory: vi.fn(),
  spinning: false,
  onTogglePlayPause: vi.fn(),
  onReplay: vi.fn(),
  onDownloadAudio: vi.fn(),
  audioPlaying: false,
  hasAudio: false,
  musicMuted: false,
  onToggleMusic: vi.fn(),
  autoExpand: true, // Most tests need the card expanded to see content
};

describe('StoryCard', () => {
  it('renders the story text', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.getByText(/The smoke rises above the battlefield/)).toBeInTheDocument();
  });

  it('renders the formatted date', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.getByText('March 4')).toBeInTheDocument();
  });

  it('renders event title and year', () => {
    render(<StoryCard {...defaultProps} />);
    // Event title appears in header (truncated) and body (full) — use getAllByText
    expect(screen.getAllByText(/The Battle of Example/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/1865/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders MLA citation', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.getByText(/Smith, John/)).toBeInTheDocument();
    expect(screen.getByText('Reference')).toBeInTheDocument();
  });

  it('hides event title section when null', () => {
    render(<StoryCard {...defaultProps} eventTitle={null} eventYear={null} />);
    expect(screen.queryByText('The Battle of Example')).not.toBeInTheDocument();
  });

  it('hides citation when null', () => {
    render(<StoryCard {...defaultProps} mlaCitation={null} />);
    expect(screen.queryByText('Reference')).not.toBeInTheDocument();
  });

  // Random History button tests
  it('renders Random History button', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.getByText('Random History')).toBeInTheDocument();
  });

  it('calls onRandomHistory when button clicked', () => {
    const onRandomHistory = vi.fn();
    render(<StoryCard {...defaultProps} onRandomHistory={onRandomHistory} />);
    fireEvent.click(screen.getByText('Random History'));
    expect(onRandomHistory).toHaveBeenCalledOnce();
  });

  it('disables button and shows Discovering... when spinning', () => {
    render(<StoryCard {...defaultProps} spinning={true} />);
    expect(screen.getByText('Discovering...')).toBeInTheDocument();
  });

  // Genre badge tests
  it('does not render genre badge when genre is null', () => {
    render(<StoryCard {...defaultProps} genre={null} />);
    expect(screen.queryByText('True Crime')).not.toBeInTheDocument();
  });

  it('renders genre badge when genre is provided', () => {
    render(<StoryCard {...defaultProps} genre="True Crime" />);
    expect(screen.getByText('True Crime')).toBeInTheDocument();
  });

  it('renders different genre badge text', () => {
    render(<StoryCard {...defaultProps} genre="Espionage & Spies" />);
    expect(screen.getByText('Espionage & Spies')).toBeInTheDocument();
  });

  // Audio controls — no audio state (auto-generating, only Random History visible)
  it('does not show audio controls when no audio', () => {
    render(<StoryCard {...defaultProps} hasAudio={false} />);
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    expect(screen.queryByText('Play')).not.toBeInTheDocument();
    expect(screen.queryByText('Download')).not.toBeInTheDocument();
    expect(screen.getByText('Random History')).toBeInTheDocument();
  });

  // Audio controls — after audio generated
  it('shows Pause button when audio is playing', () => {
    render(<StoryCard {...defaultProps} hasAudio={true} audioPlaying={true} />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.queryByText('Read to Me')).not.toBeInTheDocument();
  });

  it('shows Play button when audio is paused', () => {
    render(<StoryCard {...defaultProps} hasAudio={true} audioPlaying={false} />);
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('calls onTogglePlayPause when Pause button clicked', () => {
    const onTogglePlayPause = vi.fn();
    render(<StoryCard {...defaultProps} hasAudio={true} audioPlaying={true} onTogglePlayPause={onTogglePlayPause} />);
    fireEvent.click(screen.getByText('Pause'));
    expect(onTogglePlayPause).toHaveBeenCalledOnce();
  });

  it('calls onTogglePlayPause when Play button clicked', () => {
    const onTogglePlayPause = vi.fn();
    render(<StoryCard {...defaultProps} hasAudio={true} audioPlaying={false} onTogglePlayPause={onTogglePlayPause} />);
    fireEvent.click(screen.getByText('Play'));
    expect(onTogglePlayPause).toHaveBeenCalledOnce();
  });

  // Replay button
  it('shows Replay button when audio is available', () => {
    const { container } = render(<StoryCard {...defaultProps} hasAudio={true} />);
    const replayButton = container.querySelector('button[title="Replay from start"]');
    expect(replayButton).toBeInTheDocument();
  });

  it('calls onReplay when Replay button clicked', () => {
    const onReplay = vi.fn();
    const { container } = render(<StoryCard {...defaultProps} hasAudio={true} onReplay={onReplay} />);
    const replayButton = container.querySelector('button[title="Replay from start"]')!;
    fireEvent.click(replayButton);
    expect(onReplay).toHaveBeenCalledOnce();
  });

  // Download button tests
  it('does not show Download button when no audio', () => {
    render(<StoryCard {...defaultProps} hasAudio={false} />);
    expect(screen.queryByText('Download')).not.toBeInTheDocument();
  });

  it('shows Download button when audio is available', () => {
    render(<StoryCard {...defaultProps} hasAudio={true} />);
    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('calls onDownloadAudio when Download button clicked', () => {
    const onDownloadAudio = vi.fn();
    render(<StoryCard {...defaultProps} hasAudio={true} onDownloadAudio={onDownloadAudio} />);
    fireEvent.click(screen.getByText('Download'));
    expect(onDownloadAudio).toHaveBeenCalledOnce();
  });

  // Background music mute toggle tests
  it('renders music toggle button', () => {
    const { container } = render(<StoryCard {...defaultProps} />);
    const musicButton = container.querySelector('button[title*="background music"]');
    expect(musicButton).toBeInTheDocument();
  });

  it('shows "Mute" tooltip when music is not muted', () => {
    const { container } = render(<StoryCard {...defaultProps} musicMuted={false} />);
    const musicButton = container.querySelector('button[title="Mute background music"]');
    expect(musicButton).toBeInTheDocument();
  });

  it('shows "Unmute" tooltip when music is muted', () => {
    const { container } = render(<StoryCard {...defaultProps} musicMuted={true} />);
    const musicButton = container.querySelector('button[title="Unmute background music"]');
    expect(musicButton).toBeInTheDocument();
  });

  it('calls onToggleMusic when music button clicked', () => {
    const onToggleMusic = vi.fn();
    const { container } = render(<StoryCard {...defaultProps} onToggleMusic={onToggleMusic} />);
    const musicButton = container.querySelector('button[title*="background music"]')!;
    fireEvent.click(musicButton);
    expect(onToggleMusic).toHaveBeenCalledOnce();
  });

  // Full audio controls layout test
  it('shows all audio controls when hasAudio is true', () => {
    const { container } = render(<StoryCard {...defaultProps} hasAudio={true} audioPlaying={true} />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Random History')).toBeInTheDocument();
    const replayButton = container.querySelector('button[title="Replay from start"]');
    expect(replayButton).toBeInTheDocument();
    const musicButton = container.querySelector('button[title*="background music"]');
    expect(musicButton).toBeInTheDocument();
  });

  // Timing label tests
  it('renders timing label when provided', () => {
    render(<StoryCard {...defaultProps} timingLabel="Story 2.1s · Audio 3.4s · Total 5.5s" />);
    expect(screen.getByTestId('timing-label')).toBeInTheDocument();
    expect(screen.getByText('Story 2.1s · Audio 3.4s · Total 5.5s')).toBeInTheDocument();
  });

  it('does not render timing label when not provided', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.queryByTestId('timing-label')).not.toBeInTheDocument();
  });

  // ── Collapsible accordion behavior ─────────────────────────────────────
  it('starts collapsed when autoExpand is false', () => {
    render(<StoryCard {...defaultProps} autoExpand={false} />);
    const region = document.getElementById('story-card-content')!;
    expect(region.style.maxHeight).toBe('0px');
    expect(region.style.opacity).toBe('0');
  });

  it('shows date and event title in header when collapsed', () => {
    render(<StoryCard {...defaultProps} autoExpand={false} />);
    // Header is always visible — event title appears in both header and body
    expect(screen.getByText('March 4')).toBeInTheDocument();
    expect(screen.getAllByText(/The Battle of Example/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows "Loading narration…" when collapsed and no audio', () => {
    render(<StoryCard {...defaultProps} autoExpand={false} hasAudio={false} />);
    expect(screen.getByText('Loading narration…')).toBeInTheDocument();
  });

  it('does not show "Loading narration…" when expanded', () => {
    render(<StoryCard {...defaultProps} autoExpand={true} hasAudio={false} />);
    expect(screen.queryByText('Loading narration…')).not.toBeInTheDocument();
  });

  it('auto-expands when autoExpand changes to true', () => {
    const { rerender } = render(<StoryCard {...defaultProps} autoExpand={false} />);
    const region = document.getElementById('story-card-content')!;
    expect(region.style.opacity).toBe('0');

    rerender(<StoryCard {...defaultProps} autoExpand={true} />);
    expect(region.style.opacity).toBe('1');
  });

  it('is system-controlled (locked) — no toggle button for card header', () => {
    render(<StoryCard {...defaultProps} autoExpand={true} />);
    // The only buttons should be action buttons (music, audio, etc), not accordion toggle
    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { expanded: false })).not.toBeInTheDocument();
  });

  it('collapses when autoExpand changes to false', () => {
    const { rerender } = render(<StoryCard {...defaultProps} autoExpand={true} />);
    const region = document.getElementById('story-card-content')!;
    expect(region.style.opacity).toBe('1');

    rerender(<StoryCard {...defaultProps} autoExpand={false} />);
    expect(region.style.opacity).toBe('0');
  });
});
