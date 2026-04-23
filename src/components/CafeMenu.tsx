import { useEffect } from 'react';
import type { LeaderboardItem } from '../lib/backend';
import { playMenuMainMusic, stopMenuMainMusic } from '../audio/menuMainMusic';
import './CafeMenu.styles.css';

interface Props {
  onPlay: () => void;
  onRunnerPlay: () => void;
  onBack: () => void;
  playerName?: string;
  leaderboards: {
    runner: LeaderboardItem[];
    match: LeaderboardItem[];
  };
  isLeaderboardsLoading: boolean;
  syncMessage?: string | null;
}

function renderLeaderboardItems(items: LeaderboardItem[]) {
  if (items.length === 0) {
    return <li className='cafe_menu__leaderboard_empty'>Пока пусто</li>;
  }

  return items.map((item) => (
    <li
      key={`${item.rank}-${item.username}-${item.registrationDate}`}
      className='cafe_menu__leaderboard_item'
    >
      <span className='cafe_menu__leaderboard_rank'>#{item.rank}</span>
      <span className='cafe_menu__leaderboard_name'>{item.username}</span>
      <span className='cafe_menu__leaderboard_score'>{item.score}</span>
    </li>
  ));
}

export default function CafeMenu({
  onPlay,
  onRunnerPlay,
  onBack,
  playerName,
  leaderboards,
  isLeaderboardsLoading,
  syncMessage,
}: Props) {
  useEffect(() => {
    let isMounted = true;

    const tryStartMusic = async () => {
      const didStart = await playMenuMainMusic();
      if (didStart && isMounted) {
        window.removeEventListener('pointerdown', handleUnlock);
        window.removeEventListener('keydown', handleUnlock);
      }
    };

    const handleUnlock = () => {
      void tryStartMusic();
    };

    void tryStartMusic();
    window.addEventListener('pointerdown', handleUnlock, { passive: true });
    window.addEventListener('keydown', handleUnlock);

    return () => {
      isMounted = false;
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      stopMenuMainMusic();
    };
  }, []);

  return (
    <div className='cafe_menu'>
      <div className='cafe_menu__actions'>
        <button
          className='menu_button menu_button--primary cafe_menu__button cafe_menu__button--left'
          onClick={onPlay}
        >
          Играть
        </button>
        <button
          className='menu_button menu_button--secondary cafe_menu__button cafe_menu__button--right'
          onClick={onRunnerPlay}
        >
          Играть
        </button>
      </div>

      <button className='menu_button menu_button--ghost cafe_menu__back' onClick={onBack}>
        Назад
      </button>

      <div className='cafe_menu__status'>
        <div className='cafe_menu__player'>Игрок: {playerName || 'гость'}</div>
        {syncMessage ? <div className='cafe_menu__sync'>{syncMessage}</div> : null}
      </div>

      <div className='cafe_menu__leaderboards'>
        <section className='cafe_menu__leaderboard_card'>
          <div className='cafe_menu__leaderboard_title'>Топ-10 раннер</div>
          {isLeaderboardsLoading ? (
            <div className='cafe_menu__leaderboard_loading'>Загрузка...</div>
          ) : (
            <ol className='cafe_menu__leaderboard_list'>{renderLeaderboardItems(leaderboards.runner)}</ol>
          )}
        </section>

        <section className='cafe_menu__leaderboard_card'>
          <div className='cafe_menu__leaderboard_title'>Топ-10 кепок</div>
          {isLeaderboardsLoading ? (
            <div className='cafe_menu__leaderboard_loading'>Загрузка...</div>
          ) : (
            <ol className='cafe_menu__leaderboard_list'>{renderLeaderboardItems(leaderboards.match)}</ol>
          )}
        </section>
      </div>
    </div>
  );
}
