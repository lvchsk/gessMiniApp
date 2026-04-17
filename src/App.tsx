import { useEffect, useState } from 'react';
import './App.css';
import MainMenu from './components/MainMenu';
import CafeMenu from './components/CafeMenu';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import RunnerCanvas from './components/RunnerCanvas';
import RunnerUI from './components/RunnerUI';

type AppState = 'menu' | 'cafe' | 'game' | 'runner';
const tg = window.Telegram?.WebApp;

export default function App() {
  const user = tg?.initDataUnsafe?.user;

  const [state, setState] = useState<AppState>('menu');
  const [score, setScore] = useState(0);
  const [runnerGameOver, setRunnerGameOver] = useState(false);

  useEffect(() => {
    tg?.ready()
    tg?.expand();

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('selectstart', preventDefault);
    document.addEventListener('dragstart', preventDefault);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
    };
  }, []);

  if (state === 'menu') {
    return <MainMenu user={user?.first_name} onStart={() => setState('cafe')} />;
  }

  if (state === 'cafe') {
    return (
      <CafeMenu
        onPlay={() => {
          setScore(0);
          setState('game');
        }}
        onRunnerPlay={() => {
          setScore(0);
          setRunnerGameOver(false);
          setState('runner');
        }}
        onBack={() => setState('menu')}
      />
    );
  }

  if (state === 'runner') {
    return (
      <div className='app_screen app_screen--runner app_screen--interactive'>
        <RunnerCanvas
          onScoreChange={setScore}
          onGameOverChange={setRunnerGameOver}
        />
        <RunnerUI
          score={score}
          isGameOver={runnerGameOver}
          onExit={() => {
            setRunnerGameOver(false);
            setState('cafe');
          }}
        />
      </div>
    );
  }

  return (
    <div className='app_screen app_screen--match3 app_screen--interactive'>
      <GameCanvas onScoreChange={setScore} />
      <GameUI
        score={score}
        onExit={() => setState('cafe')}
      />
    </div>
  );
}
