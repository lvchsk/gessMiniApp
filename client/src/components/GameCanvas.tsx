import { useEffect, useRef, useState } from 'react';
import { playMatch3Music, stopMatch3Music } from '../audio/match3Music';
import { GameManager } from '../game/GameManager';
import './GameCanvas.styles.css';

interface Props {
  onScoreChange: (score: number) => void;
}

const MOSCOW_TIME_ZONE = 'Europe/Moscow';
const MS_PER_DAY = 86_400_000;
const APRIL_FIRST_START_DAY = Date.UTC(2026, 3, 1) / MS_PER_DAY;

function getMoscowDayNumber(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MOSCOW_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function getDaysSinceAprilFirst(date = new Date()): number {
  return Math.max(0, getMoscowDayNumber(date) - APRIL_FIRST_START_DAY);
}

export default function GameCanvas({ onScoreChange }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [daysSinceAprilFirst, setDaysSinceAprilFirst] = useState(getDaysSinceAprilFirst);

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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setDaysSinceAprilFirst(getDaysSinceAprilFirst());
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className='game_canvas'>
      <div ref={ref} className='game_canvas__mount' />
      <div
        className='game_canvas__days_counter'
        aria-label={`Дней с 1 апреля: ${daysSinceAprilFirst}`}
      >
        {daysSinceAprilFirst}
      </div>
    </div>
  );
}
