import { useEffect } from 'react';
import { playMenuMainMusic, stopMenuMainMusic } from '../audio/menuMainMusic';
import './CafeMenu.styles.css';

interface Props {
  onPlay: () => void;
  onRunnerPlay: () => void;
  onBack: () => void;
  playerName?: string;
  syncMessage?: string | null;
}

export default function CafeMenu({
  onPlay,
  onRunnerPlay,
  onBack,
  playerName,
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
    </div>
  );
}
