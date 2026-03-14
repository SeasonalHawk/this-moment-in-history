import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StoryCard from '@/components/StoryCard';

const defaultProps = {
  story: 'The smoke rises above the battlefield...',
  date: new Date(2026, 2, 4), // March 4, 2026
  eventTitle: 'The Battle of Example',
  eventYear: '1865',
  mlaCitation: 'Smith, John. History of Wars. Oxford UP, 2020.',
  onSpin: vi.fn(),
  spinning: false,
  onReadToMe: vi.fn(),
  onStopReading: vi.fn(),
  onDownloadAudio: vi.fn(),
  audioLoading: false,
  audioPlaying: false,
  hasAudio: false,
  musicMuted: false,
  onToggleMusic: vi.fn(),
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
    expect(screen.getByText('The Battle of Example')).toBeInTheDocument();
    expect(screen.getByText('(1865)')).toBeInTheDocument();
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

  it('renders Spin Your Luck button', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.getByText('Spin Your Luck')).toBeInTheDocument();
  });

  it('calls onSpin when button clicked', () => {
    const onSpin = vi.fn();
    render(<StoryCard {...defaultProps} onSpin={onSpin} />);
    fireEvent.click(screen.getByText('Spin Your Luck'));
    expect(onSpin).toHaveBeenCalledOnce();
  });

  it('disables spin button and shows spinner when spinning', () => {
    render(<StoryCard {...defaultProps} spinning={true} />);
    expect(screen.getByText('Spinning...')).toBeInTheDocument();
  });

  // Audio button tests
  it('renders Read to Me button in idle state', () => {
    render(<StoryCard {...defaultProps} />);
    expect(screen.getByText('Read to Me')).toBeInTheDocument();
  });

  it('calls onReadToMe when Read to Me button clicked', () => {
    const onReadToMe = vi.fn();
    render(<StoryCard {...defaultProps} onReadToMe={onReadToMe} />);
    fireEvent.click(screen.getByText('Read to Me'));
    expect(onReadToMe).toHaveBeenCalledOnce();
  });

  it('shows loading state when audio is loading', () => {
    render(<StoryCard {...defaultProps} audioLoading={true} />);
    expect(screen.getByText('Loading audio...')).toBeInTheDocument();
  });

  it('shows Stop Reading button when audio is playing', () => {
    render(<StoryCard {...defaultProps} audioPlaying={true} />);
    expect(screen.getByText('Stop Reading')).toBeInTheDocument();
    expect(screen.queryByText('Read to Me')).not.toBeInTheDocument();
  });

  it('calls onStopReading when Stop Reading button clicked', () => {
    const onStopReading = vi.fn();
    render(<StoryCard {...defaultProps} audioPlaying={true} onStopReading={onStopReading} />);
    fireEvent.click(screen.getByText('Stop Reading'));
    expect(onStopReading).toHaveBeenCalledOnce();
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
});
