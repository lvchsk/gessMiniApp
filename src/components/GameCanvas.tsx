import { useEffect, useRef } from 'react';
import { GameManager } from '../game/GameManager';

interface Props {
  onScoreChange: (score: number) => void;
}

export default function GameCanvas({ onScoreChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const managerRef = useRef<GameManager | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const manager = new GameManager();
    manager.mount(ref.current, {
      onScoreChange
    });

    managerRef.current = manager;

    return () => {
      manager.destroy();
    };
  }, [onScoreChange]);

  return <div ref={ref} />;
}