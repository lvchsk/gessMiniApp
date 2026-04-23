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
type ScoreSyncStatus = 'guest' | 'unchanged' | 'synced';

interface ScoreSyncResult {
  status: ScoreSyncStatus;
  bestScore: number;
}

const tg = window.Telegram?.WebApp;

const EMPTY_LEADERBOARDS: Record<BackendGame, LeaderboardItem[]> = {
  runner: [],
  match: [],
};

function getScoreSyncMessage(game: BackendGame, status: ScoreSyncStatus): string {
  if (status === 'synced') {
    return game === 'runner'
      ? 'Результат раннера сохранён и отправлен в лидерборд.'
      : 'Результат 3 в ряд сохранён и отправлен в лидерборд.';
  }

  if (status === 'guest') {
    return 'Открой приложение внутри Telegram, чтобы результат попадал в лидерборд.';
  }

  return 'Новый рекорд не побит, поэтому лидерборд не изменился.';
}

export default function App() {
  const telegramUser = tg?.initDataUnsafe?.user;

  const [state, setState] = useState<AppState>('menu');
  const [score, setScore] = useState(0);
  const [runnerGameOver, setRunnerGameOver] = useState(false);
  const [runnerFinalScore, setRunnerFinalScore] = useState(0);
  const [runnerResultMessage, setRunnerResultMessage] = useState<string | null>(null);
  const [matchResultOpen, setMatchResultOpen] = useState(false);
  const [matchResultScore, setMatchResultScore] = useState(0);
  const [matchResultMessage, setMatchResultMessage] = useState<string | null>(null);
  const [matchResultSyncing, setMatchResultSyncing] = useState(false);
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
    try {
      tg?.ready();
    } catch (error) {
      console.warn('Telegram WebApp ready() failed', error);
    }

    try {
      tg?.expand();
    } catch (error) {
      console.warn('Telegram WebApp expand() failed', error);
    }

    try {
      tg?.requestFullscreen?.();
    } catch (error) {
      console.warn('Telegram WebApp requestFullscreen() failed', error);
    }

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
            : 'Не удалось подключить профиль к backend.',
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

  const syncHighScore = useCallback(
    async (game: BackendGame, rawScore: number): Promise<ScoreSyncResult> => {
      const nextScore = Math.max(0, Math.floor(rawScore));

      if (!sessionToken) {
        return {
          status: 'guest',
          bestScore: bestScoresRef.current[game],
        };
      }

      if (nextScore <= bestScoresRef.current[game]) {
        return {
          status: 'unchanged',
          bestScore: bestScoresRef.current[game],
        };
      }

      const pendingScore = pendingScoresRef.current[game];
      if (pendingScore !== null && nextScore <= pendingScore) {
        return {
          status: 'unchanged',
          bestScore: pendingScore,
        };
      }

      pendingScoresRef.current[game] = nextScore;

      try {
        const response = await submitHighScore(sessionToken, game, nextScore);

        pendingScoresRef.current[game] = null;
        bestScoresRef.current[game] = response.bestScore;
        setBackendUser(response.user);
        await refreshLeaderboards();

        return {
          status: response.updated ? 'synced' : 'unchanged',
          bestScore: response.bestScore,
        };
      } catch (error) {
        pendingScoresRef.current[game] = null;
        throw error;
      }
    },
    [refreshLeaderboards, sessionToken],
  );

  useEffect(() => {
    if (state !== 'runner' || !runnerGameOver) {
      return;
    }

    const finalScore = Math.max(0, Math.floor(score));
    setRunnerFinalScore(finalScore);
    setRunnerResultMessage('Фиксируем результат...');

    void syncHighScore('runner', finalScore)
      .then((result) => {
        setRunnerResultMessage(getScoreSyncMessage('runner', result.status));
      })
      .catch((error) => {
        console.error('Failed to sync runner score', error);
        setRunnerResultMessage('Не удалось отправить результат раннера в backend.');
      });
  }, [runnerGameOver, score, state, syncHighScore]);

  const syncMessage =
    syncState === 'loading'
      ? 'Синхронизация профиля...'
      : syncState === 'guest'
        ? 'Открой приложение внутри Telegram, чтобы сохранять рекорды.'
        : syncState === 'error'
          ? authError || 'Backend недоступен.'
          : null;

  const displayName = backendUser?.username || telegramUser?.first_name;

  const handleOpenCafe = () => {
    void refreshLeaderboards();
    setState('cafe');
  };

  const handleOpenMatch3 = () => {
    setScore(0);
    setMatchResultOpen(false);
    setMatchResultScore(0);
    setMatchResultMessage(null);
    setMatchResultSyncing(false);
    setState('game');
  };

  const handleOpenRunner = () => {
    setScore(0);
    setRunnerGameOver(false);
    setRunnerFinalScore(0);
    setRunnerResultMessage(null);
    setState('runner');
  };

  const handleMatchExitRequest = () => {
    const finalScore = Math.max(0, Math.floor(score));

    setMatchResultScore(finalScore);
    setMatchResultOpen(true);
    setMatchResultSyncing(true);
    setMatchResultMessage('Фиксируем результат...');

    void syncHighScore('match', finalScore)
      .then((result) => {
        setMatchResultMessage(getScoreSyncMessage('match', result.status));
      })
      .catch((error) => {
        console.error('Failed to sync match-3 score', error);
        setMatchResultMessage('Не удалось отправить результат 3 в ряд в backend.');
      })
      .finally(() => {
        setMatchResultSyncing(false);
      });
  };

  const handleMatchResultClose = () => {
    setMatchResultOpen(false);
    setState('cafe');
  };

  const handleRunnerExit = () => {
    setRunnerGameOver(false);
    setRunnerFinalScore(0);
    setRunnerResultMessage(null);
    setState('cafe');
  };

  if (state === 'menu') {
    return <MainMenu user={displayName} onStart={handleOpenCafe} />;
  }

  if (state === 'cafe') {
    return (
      <CafeMenu
        onPlay={handleOpenMatch3}
        onRunnerPlay={handleOpenRunner}
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
          finalScore={runnerFinalScore}
          resultMessage={runnerResultMessage}
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
        isResultOpen={matchResultOpen}
        resultScore={matchResultScore}
        resultMessage={matchResultMessage}
        isSyncingResult={matchResultSyncing}
        onExitRequest={handleMatchExitRequest}
        onResultClose={handleMatchResultClose}
      />
    </div>
  );
}
