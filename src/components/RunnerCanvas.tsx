import { useEffect, useRef } from 'react';
import { RunnerGameManager } from '../runner/RunnerGameManager';
import './RunnerCanvas.styles.css';

interface Props {
  onScoreChange: (score: number) => void;
  onGameOverChange: (isGameOver: boolean) => void;
}

export default function RunnerCanvas({ onScoreChange, onGameOverChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const manager = new RunnerGameManager();
    manager.mount(ref.current, {
      onScoreChange,
      onGameOverChange,
    });

    return () => {
      manager.destroy();
    };
  }, [onGameOverChange, onScoreChange]);

  return <div ref={ref} className='runner_canvas' />;
}
