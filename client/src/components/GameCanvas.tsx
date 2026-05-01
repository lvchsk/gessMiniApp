import { useEffect, useRef } from 'react';
import { playMatch3Music, stopMatch3Music } from '../audio/match3Music';
import { GameManager } from '../game/GameManager';
import './GameCanvas.styles.css';

interface Props {
  onScoreChange: (score: number) => void;
}

export default function GameCanvas({ onScoreChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    let isMounted = true;

    const tryStartMusic = async () => {
      const didStart = await playMatch3Music();
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

    const manager = new GameManager();
    manager.mount(ref.current, {
      onScoreChange
    });

    return () => {
      isMounted = false;
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      stopMatch3Music();
      manager.destroy();
    };
  }, [onScoreChange]);

  return (
    <div className='game_canvas'>
      <div ref={ref} className='game_canvas__mount' />
    </div>
  );
}
