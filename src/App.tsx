import { useState } from 'react';
import MainMenu from './components/MainMenu';
import CafeMenu from './components/CafeMenu';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import RunnerCanvas from './components/RunnerCanvas';
import RunnerUI from './components/RunnerUI';

type AppState = 'menu' | 'cafe' | 'game' | 'runner';

export default function App() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;

  const [state, setState] = useState<AppState>('menu');
  const [score, setScore] = useState(0);
  const [runnerGameOver, setRunnerGameOver] = useState(false);

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
      <div style={{ position: 'relative' }}>
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
    <div style={{ position: 'relative' }}>
      <GameCanvas onScoreChange={setScore} />
      <GameUI
        score={score}
        onExit={() => setState('cafe')}
      />
    </div>
  );
}
