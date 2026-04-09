import { useState } from 'react';
import MainMenu from './components/MainMenu';
import CafeMenu from './components/CafeMenu';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';

type AppState = 'menu' | 'cafe' | 'game';

export default function App() {
  const [state, setState] = useState<AppState>('menu');
  const [score, setScore] = useState(0);

  if (state === 'menu') {
    return <MainMenu onStart={() => setState('cafe')} />;
  }

  if (state === 'cafe') {
    return (
      <CafeMenu
        onPlay={() => {
          setScore(0);
          setState('game');
        }}
        onBack={() => setState('menu')}
      />
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