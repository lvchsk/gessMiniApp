import './RunnerMenuPreview.styles.css';
import { useEffect, type KeyboardEvent } from 'react';
import { prepareRunnerMusic } from '../audio/runnerMusic';
import type { LeaderboardItem } from '../lib/backend';
import { warmRunnerGame } from '../runner/RunnerGameManager';
import ResultLeaderboard from './ResultLeaderboard';

interface Props {
  items: LeaderboardItem[];
  isLoading: boolean;
  onStart: () => void;
}

export default function RunnerMenuPreview({
  items,
  isLoading,
  onStart,
}: Props) {
  useEffect(() => {
    prepareRunnerMusic();

    const warmRunner = () => {
      warmRunnerGame();
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(warmRunner, { timeout: 600 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(warmRunner, 120);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onStart();
    }
  };

  return (
    <div
      role='button'
      tabIndex={0}
      className='runner_menu_preview'
      aria-label='Запустить раннер'
      onClick={onStart}
      onKeyDown={handleKeyDown}
    >
      <div className='runner_menu_preview__cabinet'>
        <img
          className='runner_menu_preview__image'
          src='/assets/runner_menu_preview.webp'
          alt=''
          aria-hidden='true'
        />
        <div className='runner_menu_preview__actions'>
          <button className='runner_menu_preview__action' type='button' onClick={onStart}>
            &gt;PLAY
          </button>
          <span
            className='runner_menu_preview__top_action'
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ResultLeaderboard
              className='runner_menu_preview__leaderboard'
              game='runner'
              items={items}
              isLoading={isLoading}
              showTopThree={false}
              topButtonLabel='>ТОП'
            />
          </span>
        </div>
      </div>
    </div>
  );
}
