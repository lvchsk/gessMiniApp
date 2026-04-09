import { useEffect, useRef } from 'react';
import { GameManager } from '../game/GameManager';
import './GameCanvas.styles.css';

interface Props {
  onScoreChange: (score: number) => void;
}

export default function GameCanvas({ onScoreChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const manager = new GameManager();
    manager.mount(ref.current, {
      onScoreChange
    });

    return () => {
      manager.destroy();
    };
  }, [onScoreChange]);

  return (
    <div className='game_canvas'>
      <div ref={ref} className='game_canvas__mount' />
    </div>
  );
}
