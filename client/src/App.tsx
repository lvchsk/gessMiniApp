import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import MainMenu from './components/MainMenu';
import CafeMenu from './components/CafeMenu';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import RunnerCanvas from './components/RunnerCanvas';
import RunnerMenuPreview from './components/RunnerMenuPreview';
import RunnerUI from './components/RunnerUI';
import {
  authenticateWithTelegram,
  fetchLeaderboard,
  startScoreSession,
  submitHighScore,
  type BackendGame,
  type BackendUser,
  type LeaderboardItem,
} from './lib/backend';
import { preloadAppAssets } from './lib/assetPreloader';
import { RUNNER_SHIPMENT_SCORE_THRESHOLD } from './runner/config';

type AppState = 'menu' | 'cafe' | 'game' | 'runnerPreview' | 'runner';
type ScoreSyncStatus = 'guest' | 'unchanged' | 'synced' | 'unverified';

interface ScoreSyncResult {
  status: ScoreSyncStatus;
  bestScore: number;
}

const tg = window.Telegram?.WebApp;
const LOCAL_DEV_DISPLAY_NAME = 'разработчик';
const LOCAL_DEV_REGISTRATION_DATE = 'local-dev';

const EMPTY_LEADERBOARDS: Record<BackendGame, LeaderboardItem[]> = {
  runner: [],
  match: [],
};

function getScoreSyncMessage(_game: BackendGame, status: ScoreSyncStatus): string {
  if (status === 'synced') {
    return 'новый рекорд!';
  }

  if (status === 'guest') {
    return 'Открой приложение внутри Telegram, чтобы результат попадал в лидерборд.';
  }

  if (status === 'unverified') {
    return 'Не удалось подтвердить игровую сессию.';
  }

  return '';
}

function withLocalResult(
  items: LeaderboardItem[],
  username: string | undefined,
  score: number,
): LeaderboardItem[] {
  if (!import.meta.env.DEV || !username) {
    return items;
  }

  const normalizedScore = Math.max(0, Math.floor(score));
  const localItem: LeaderboardItem = {
    rank: 0,
    username,
    registrationDate: LOCAL_DEV_REGISTRATION_DATE,
    score: normalizedScore,
  };

  return [localItem, ...items.filter((item) => item.username !== username)]
    .sort((left, right) => right.score - left.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

export default function App() {
  const telegramUser = tg?.initDataUnsafe?.user;

  const [state, setState] = useState<AppState>('menu');
  const [score, setScore] = useState(0);
  const [runnerGameOver, setRunnerGameOver] = useState(false);
  const [runnerSceneReady, setRunnerSceneReady] = useState(false);
  const [runnerFinalScore, setRunnerFinalScore] = useState(0);
  const [runnerResultMessage, setRunnerResultMessage] = useState<string | null>(null);
  const [matchResultOpen, setMatchResultOpen] = useState(false);
  const [matchResultScore, setMatchResultScore] = useState(0);
  const [matchResultMessage, setMatchResultMessage] = useState<string | null>(null);
  const [matchResultSyncing, setMatchResultSyncing] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [leaderboards, setLeaderboards] =
    useState<Record<BackendGame, LeaderboardItem[]>>(EMPTY_LEADERBOARDS);
  const [leaderboardsLoading, setLeaderboardsLoading] = useState(false);
  const [assetsProgress, setAssetsProgress] = useState(0);
  const [areAssetsReady, setAreAssetsReady] = useState(false);

  const bestScoresRef = useRef<Record<BackendGame, number>>({
    runner: 0,
    match: 0,
  });
  const pendingScoresRef = useRef<Record<BackendGame, number | null>>({
    runner: null,
    match: null,
  });
  const scoreSessionTokensRef = useRef<Record<BackendGame, string | null>>({
    runner: null,
    match: null,
  });
  const scoreSessionPromisesRef = useRef<Record<BackendGame, Promise<string | null> | null>>({
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
    let cancelled = false;

    void preloadAppAssets(({ progress }) => {
      if (!cancelled) {
        setAssetsProgress(progress);
      }
    }).then(() => {
      if (!cancelled) {
        setAssetsProgress(1);
        setAreAssetsReady(true);
      }
    }).catch((error) => {
      console.error('Failed to preload app assets', error);
    });

    return () => {
      cancelled = true;
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
        return;
      }

      try {
        const response = await authenticateWithTelegram(initData);

        if (cancelled) {
          return;
        }

        setSessionToken(response.token);
        setBackendUser(response.user);
      } catch (error) {
        console.error('Failed to authenticate with backend', error);
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

  useEffect(() => {
    scoreSessionTokensRef.current = {
      runner: null,
      match: null,
    };
    scoreSessionPromisesRef.current = {
      runner: null,
      match: null,
    };
  }, [sessionToken]);

  const beginScoreSession = useCallback(
    (game: BackendGame) => {
      scoreSessionTokensRef.current[game] = null;

      if (!sessionToken) {
        scoreSessionPromisesRef.current[game] = null;
        return;
      }

      const sessionPromise = startScoreSession(sessionToken, game)
        .then((scoreToken) => {
          if (scoreSessionPromisesRef.current[game] === sessionPromise) {
            scoreSessionTokensRef.current[game] = scoreToken;
          }

          return scoreToken;
        })
        .catch((error) => {
          console.error(`Failed to start ${game} score session`, error);

          if (scoreSessionPromisesRef.current[game] === sessionPromise) {
            scoreSessionTokensRef.current[game] = null;
          }

          return null;
        });

      scoreSessionPromisesRef.current[game] = sessionPromise;
    },
    [sessionToken],
  );

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
        const scoreSessionToken =
          scoreSessionTokensRef.current[game] ??
          (scoreSessionPromisesRef.current[game] ? await scoreSessionPromisesRef.current[game] : null);

        if (!scoreSessionToken) {
          pendingScoresRef.current[game] = null;

          return {
            status: 'unverified',
            bestScore: bestScoresRef.current[game],
          };
        }

        const response = await submitHighScore(sessionToken, game, nextScore, scoreSessionToken);

        pendingScoresRef.current[game] = null;
        scoreSessionTokensRef.current[game] = null;
        scoreSessionPromisesRef.current[game] = null;
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

  const displayName =
    backendUser?.username ||
    telegramUser?.first_name ||
    (import.meta.env.DEV ? LOCAL_DEV_DISPLAY_NAME : undefined);

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
    beginScoreSession('match');
    setState('game');
  };

  const handleOpenRunnerPreview = () => {
    void refreshLeaderboards();
    setState('runnerPreview');
  };

  const handleStartRunner = () => {
    setScore(0);
    setRunnerGameOver(false);
    setRunnerSceneReady(false);
    setRunnerFinalScore(0);
    setRunnerResultMessage(null);
    beginScoreSession('runner');
    setState('runner');
  };

  const handleRunnerSceneReady = useCallback(() => {
    setRunnerSceneReady(true);
  }, []);

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
    return (
      <MainMenu
        user={displayName}
        onStart={handleOpenCafe}
        isReady={areAssetsReady}
        loadingProgress={assetsProgress}
      />
    );
  }

  if (state === 'cafe') {
    return (
      <CafeMenu
        onPlay={handleOpenMatch3}
        onRunnerPlay={handleOpenRunnerPreview}
      />
    );
  }

  if (state === 'runnerPreview') {
    return (
      <RunnerMenuPreview
        items={leaderboards.runner}
        isLoading={leaderboardsLoading}
        onStart={handleStartRunner}
      />
    );
  }

  if (state === 'runner') {
    const runnerDisplayedFinalScore = runnerGameOver
      ? Math.max(0, Math.floor(score))
      : runnerFinalScore;
    const showRunnerShipmentReward =
      runnerGameOver && runnerDisplayedFinalScore >= RUNNER_SHIPMENT_SCORE_THRESHOLD;

    return (
      <div className='app_screen app_screen--runner app_screen--interactive'>
        <RunnerCanvas
          onScoreChange={setScore}
          onGameOverChange={setRunnerGameOver}
          onReady={handleRunnerSceneReady}
          isRunnerMusicMuted={showRunnerShipmentReward}
        />
        {!runnerSceneReady ? (
          <div className='runner_boot_cover' aria-hidden='true'>
            <div className='runner_boot_cover__cabinet'>
              <img
                className='runner_boot_cover__image'
                src='/assets/runner_menu_preview.webp'
                alt=''
              />
            </div>
          </div>
        ) : null}
        <RunnerUI
          score={score}
          isGameOver={runnerGameOver}
          finalScore={runnerDisplayedFinalScore}
          showShipmentReward={showRunnerShipmentReward}
          resultMessage={runnerResultMessage}
          leaderboardItems={withLocalResult(
            leaderboards.runner,
            displayName,
            runnerDisplayedFinalScore,
          )}
          isLeaderboardLoading={leaderboardsLoading}
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
        leaderboardItems={withLocalResult(leaderboards.match, displayName, matchResultScore)}
        isLeaderboardLoading={leaderboardsLoading}
        onExitRequest={handleMatchExitRequest}
        onResultClose={handleMatchResultClose}
      />
    </div>
  );
}
