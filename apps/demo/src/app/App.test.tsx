import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.mock('@mmmihaeel/custom-video-player', () => ({
  VideoPlayer: () => <div data-testid="video-player">Player preview</div>
}));

describe('App', () => {
  it('renders the demo shell and integration content', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Custom Video Player' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Install and usage' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Edit props and remount' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Extensibility surface' })
    ).toBeInTheDocument();
  });
});
