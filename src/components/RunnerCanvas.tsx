import { useEffect, useRef } from 'react';
import { playRunnerMusic, stopRunnerMusic } from '../audio/runnerMusic';
import { RunnerGameManager } from '../runner/RunnerGameManager';
import { RUNNER_TAP_EVENT } from '../runner/config';
import './RunnerCanvas.styles.css';

interface Props {
  onScoreChange: (score: number) => void;
  onGameOverChange: (isGameOver: boolean) => void;
}

export default function RunnerCanvas({ onScoreChange, onGameOverChange }: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let isMounted = true;

    const tryStartMusic = async () => {
      const didStart = await playRunnerMusic();
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

    const manager = new RunnerGameManager();
    manager.mount(mountRef.current, {
      onScoreChange,
      onGameOverChange,
    });

    return () => {
      isMounted = false;
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      stopRunnerMusic();
      manager.destroy();
    };
  }, [onGameOverChange, onScoreChange]);

  const handleTap = () => {
    window.dispatchEvent(new CustomEvent(RUNNER_TAP_EVENT));
  };

  return (
    <div className='runner_canvas'>
      <div className='runner_canvas__tap_zone' onPointerDown={handleTap}>
        <div ref={mountRef} className='runner_canvas__mount' />
      </div>
    </div>
  );
}
