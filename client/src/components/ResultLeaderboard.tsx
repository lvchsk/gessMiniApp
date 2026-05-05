import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import type { BackendGame, LeaderboardItem } from '../lib/backend';
import './ResultLeaderboard.styles.css';

interface Props {
  game: BackendGame;
  items: LeaderboardItem[];
  isLoading: boolean;
  showTopThree?: boolean;
  className?: string;
}

const TITLE_LABEL_BY_GAME: Record<BackendGame, string> = {
  match: 'Топ кепок',
  runner: 'Топ ничегошек',
};

const TITLE_COIN_BY_GAME: Record<BackendGame, string> = {
  match: '/assets/kepka_coin.svg',
  runner: '/assets/nichego_coin.svg',
};

function getDisplayName(username: string): string {
  return Array.from(username).slice(0, 12).join('');
}

function formatLeaderboardScore(score: number): string {
  const normalizedScore = Math.max(0, Math.floor(score));

  if (normalizedScore < 10000) {
    return String(normalizedScore);
  }

  const thousands = Math.round((normalizedScore / 1000) * 10) / 10;

  return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
}

export default function ResultLeaderboard({
  game,
  items,
  isLoading,
  showTopThree = true,
  className,
}: Props) {
  const [isTopOpen, setIsTopOpen] = useState(false);
  const leaders = items.slice(0, 100);
  const topThree = leaders.slice(0, 3);
  const rootClassName = ['result_leaderboard', className].filter(Boolean).join(' ');

  const handleOpenTop = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsTopOpen(true);
  };

  const handleCloseTop = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsTopOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const topModal = isTopOpen ? (
    <div
      className='result_leaderboard__modal'
      role='dialog'
      aria-modal='true'
      onClick={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDown}
    >
      <div className='result_leaderboard__modal_header'>
        <div className='result_leaderboard__modal_title' aria-label={TITLE_LABEL_BY_GAME[game]}>
          <span>топ</span>
          <img
            className='result_leaderboard__modal_title_icon'
            src={TITLE_COIN_BY_GAME[game]}
            alt=''
            aria-hidden='true'
          />
        </div>
        <button
          className='result_leaderboard__close'
          type='button'
          aria-label='Закрыть топ-100'
          onClick={handleCloseTop}
        >
          Закрыть
        </button>
      </div>

      <div className='result_leaderboard__modal_list'>
        {isLoading ? (
          <div className='result_leaderboard__modal_empty'>Загрузка...</div>
        ) : leaders.length > 0 ? (
          leaders.map((item) => {
            const displayName = getDisplayName(item.username);
            const displayScore = formatLeaderboardScore(item.score);

            return (
              <div
                className='result_leaderboard__modal_item'
                key={`${game}-top-${item.rank}-${item.username}`}
              >
                <span className='result_leaderboard__modal_rank'>#{item.rank}</span>
                <span className='result_leaderboard__modal_name' title={item.username}>
                  {displayName}
                </span>
                <span
                  className='result_leaderboard__modal_score'
                  aria-label={`${item.score} ${TITLE_LABEL_BY_GAME[game]}`}
                >
                  <span>{displayScore}</span>
                  <img
                    className='result_leaderboard__score_icon'
                    src={TITLE_COIN_BY_GAME[game]}
                    alt=''
                    aria-hidden='true'
                  />
                </span>
              </div>
            );
          })
        ) : (
          <div className='result_leaderboard__modal_empty'>Лидеров пока нет</div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={rootClassName} onClick={(event) => event.stopPropagation()} onKeyDown={handleKeyDown}>
      {showTopThree ? (
        <div className='result_leaderboard__preview'>
          {isLoading ? (
            <div className='result_leaderboard__empty'>Загрузка...</div>
          ) : topThree.length > 0 ? (
            topThree.map((item, index) => {
              const displayName = getDisplayName(item.username);
              const displayScore = formatLeaderboardScore(item.score);

              return (
                <div className='result_leaderboard__preview_item' key={`${game}-${item.rank}-${item.username}`}>
                  <img
                    className='result_leaderboard__badge'
                    src={`/assets/leader_${index + 1}.svg`}
                    alt=''
                    aria-hidden='true'
                  />
                  <span className='result_leaderboard__name' title={item.username}>
                    {displayName}
                  </span>
                  <span
                    className='result_leaderboard__score'
                    aria-label={`${item.score} ${TITLE_LABEL_BY_GAME[game]}`}
                  >
                    <span>{displayScore}</span>
                    <img
                      className='result_leaderboard__score_icon'
                      src={TITLE_COIN_BY_GAME[game]}
                      alt=''
                      aria-hidden='true'
                    />
                  </span>
                </div>
              );
            })
          ) : (
            <div className='result_leaderboard__empty'>Лидеров пока нет</div>
          )}
        </div>
      ) : null}

      <button className='result_leaderboard__top_button' type='button' onClick={handleOpenTop}>
        топ-100
      </button>

      {topModal ? createPortal(topModal, document.body) : null}
    </div>
  );
}
