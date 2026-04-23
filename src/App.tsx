import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import MainMenu from './components/MainMenu';
import CafeMenu from './components/CafeMenu';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import RunnerCanvas from './components/RunnerCanvas';
import RunnerUI from './components/RunnerUI';
import {
  authenticateWithTelegram,
  fetchLeaderboard,
  submitHighScore,
  type BackendGame,
  type BackendUser,
  type LeaderboardItem,
} from './lib/backend';

type AppState = 'menu' | 'cafe' | 'game' | 'runner';
type SyncState = 'idle' | 'loading' | 'ready' | 'guest' | 'error';

const tg = window.Telegram?.WebApp;

const EMPTY_LEADERBOARDS: Record<BackendGame, LeaderboardItem[]> = {
  runner: [],
  match: [],
};

export default function App() {
  const telegramUser = tg?.initDataUnsafe?.user;

  const [state, setState] = useState<AppState>('menu');
  const [score, setScore] = useState(0);
  const [runnerGameOver, setRunnerGameOver] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [authError, setAuthError] = useState<string | null>(null);
  const [leaderboards, setLeaderboards] =
    useState<Record<BackendGame, LeaderboardItem[]>>(EMPTY_LEADERBOARDS);
  const [leaderboardsLoading, setLeaderboardsLoading] = useState(false);

  const bestScoresRef = useRef<Record<BackendGame, number>>({
    runner: 0,
    match: 0,
  });
  const pendingScoresRef = useRef<Record<BackendGame, number | null>>({
    runner: null,
    match: null,
  });

  useEffect(() => {
    tg?.ready();
    tg?.expand();
    tg?.requestFullscreen?.();

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

  useEffect(() => {
    if (!backendUser) {
      return;
    }

    bestScoresRef.current = {
      runner: backendUser.scoreRunner,
      match: backendUser.scoreMatch,
    };
  }, [backendUser]);

  const refreshLeaderboards = useCallback(async () => {
    setLeaderboardsLoading(true);

    try {
      const [runner, match] = await Promise.all([
        fetchLeaderboard('runner'),
        fetchLeaderboard('match'),
      ]);

      setLeaderboards({
        runner,
        match,
      });
    } catch (error) {
      console.error('Failed to load leaderboards', error);
    } finally {
      setLeaderboardsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrapBackend = async () => {
      await refreshLeaderboards();

      const initData = tg?.initData?.trim();

      if (!initData) {
        if (!cancelled) {
          setSyncState('guest');
        }
        return;
      }

      if (!cancelled) {
        setSyncState('loading');
        setAuthError(null);
      }

      try {
        const response = await authenticateWithTelegram(initData);

        if (cancelled) {
          return;
        }

        setSessionToken(response.token);
        setBackendUser(response.user);
        setSyncState('ready');
      } catch (error) {
        console.error('Failed to authenticate with backend', error);

        if (cancelled) {
          return;
        }

        setSyncState('error');
        setAuthError(
          error instanceof Error
            ? error.message
            : 'Не удалось подключить профиль к backend',
        );
      }
    };

    void bootstrapBackend();

    return () => {
      cancelled = true;
    };
  }, [refreshLeaderboards]);

  useEffect(() => {
    if (state === 'cafe') {
      void refreshLeaderboards();
    }
  }, [refreshLeaderboards, state]);

  const persistHighScore = useCallback(
    async (game: BackendGame, rawScore: number) => {
      const nextScore = Math.max(0, Math.floor(rawScore));

      if (!sessionToken || nextScore <= 0) {
        return;
      }

      if (nextScore <= bestScoresRef.current[game]) {
        return;
      }

      const pendingScore = pendingScoresRef.current[game];
      if (pendingScore !== null && nextScore <= pendingScore) {
        return;
      }

      pendingScoresRef.current[game] = nextScore;

      try {
        const response = await submitHighScore(sessionToken, game, nextScore);

        pendingScoresRef.current[game] = null;
        bestScoresRef.current[game] = response.bestScore;
        setBackendUser(response.user);
        await refreshLeaderboards();
      } catch (error) {
        pendingScoresRef.current[game] = null;
        console.error(`Failed to sync ${game} score`, error);
      }
    },
    [refreshLeaderboards, sessionToken],
  );

  useEffect(() => {
    if (state === 'runner' && runnerGameOver) {
      void persistHighScore('runner', score);
    }
  }, [persistHighScore, runnerGameOver, score, state]);

  const syncMessage =
    syncState === 'loading'
      ? 'Синхронизация профиля...'
      : syncState === 'guest'
        ? 'Открой приложение внутри Telegram, чтобы сохранять рекорды.'
        : syncState === 'error'
          ? authError || 'Backend недоступен.'
          : null;

  const displayName = telegramUser?.first_name || backendUser?.username;

  const handleOpenCafe = () => {
    void refreshLeaderboards();
    setState('cafe');
  };

  const handleMatchExit = () => {
    void persistHighScore('match', score);
    setState('cafe');
  };

  const handleRunnerExit = () => {
    void persistHighScore('runner', score);
    setRunnerGameOver(false);
    setState('cafe');
  };

  if (state === 'menu') {
    return <MainMenu user={displayName} onStart={handleOpenCafe} />;
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
        playerName={backendUser?.username || displayName}
        leaderboards={leaderboards}
        isLeaderboardsLoading={leaderboardsLoading}
        syncMessage={syncMessage}
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
          onExit={handleRunnerExit}
        />
      </div>
    );
  }

  return (
    <div className='app_screen app_screen--match3 app_screen--interactive'>
      <GameCanvas onScoreChange={setScore} />
      <GameUI
        score={score}
        onExit={handleMatchExit}
      />
    </div>
  );
}
