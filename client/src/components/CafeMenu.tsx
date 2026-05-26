import { useEffect, useState } from 'react';
import { prepareMatch3Music, stopMatch3Music } from '../audio/match3Music';
import { playMenuMainMusic, stopMenuMainMusic } from '../audio/menuMainMusic';
import {
  isGameMusicEnabled,
  MUSIC_PREFERENCE_CHANGE_EVENT,
  setGameMusicEnabled,
} from '../audio/musicPreference';
import { stopRunnerMusic } from '../audio/runnerMusic';
import { stopRunnerShipmentMusic } from '../audio/runnerShipmentMusic';
import {
  CafeGuideOverlay,
  isCafeGuideCompleted,
  markCafeGuideCompleted,
  resetCafeGuideCompletion,
} from '../cafeGuide';
import './CafeMenu.styles.css';

interface Props {
  onPlay: () => void;
  onRunnerPlay: () => void;
}

const MOSCOW_TIME_ZONE = 'Europe/Moscow';
const MOSCOW_UTC_OFFSET_MS = 3 * 60 * 60 * 1000;
const GOST_MENU_START_DAY = Date.UTC(2026, 4, 5) / 86_400_000;
const GOST_MENU_COUNT = 9;
const MUSIC_ON_ICON_SRC = '/assets/music_on.webp?v=2';
const MUSIC_OFF_ICON_SRC = '/assets/music_off.webp?v=2';

type CafePopup =
  | {
      kind: 'text';
      title: string;
    }
  | {
      kind: 'kepka';
      index: number;
    };

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

  return Date.UTC(year, month - 1, day) / 86_400_000;
}

function getDailyGostMenuIndex(date = new Date()): number {
  const daysSinceStart = getMoscowDayNumber(date) - GOST_MENU_START_DAY;
  const index = ((daysSinceStart % GOST_MENU_COUNT) + GOST_MENU_COUNT) % GOST_MENU_COUNT;

  return index + 1;
}

function getNextMoscowMidnightDelay(date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: MOSCOW_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  const nextMoscowMidnightUtcMs = Date.UTC(year, month - 1, day + 1) - MOSCOW_UTC_OFFSET_MS;

  return Math.max(1000, nextMoscowMidnightUtcMs - date.getTime());
}

function stopAllGameMusic(): void {
  stopMenuMainMusic();
  stopMatch3Music();
  stopRunnerMusic();
  stopRunnerShipmentMusic();
}

export default function CafeMenu({
  onPlay,
  onRunnerPlay,
}: Props) {
  const [popup, setPopup] = useState<CafePopup | null>(null);
  const [dailyGostIndex, setDailyGostIndex] = useState(getDailyGostMenuIndex);
  const [isMusicEnabled, setIsMusicEnabledState] = useState(isGameMusicEnabled);
  const [isGuideOpen, setIsGuideOpen] = useState(() => !isCafeGuideCompleted());
  const dailyGostAsset = `/assets/gost_menu_${dailyGostIndex}.svg`;
  const popupKepkaIndex = popup?.kind === 'kepka' ? popup.index : dailyGostIndex;
  const popupKepkaAsset = '/assets/kepka_menu_1.webp';
  const popupKepkaSpriteAsset = `/assets/kepka_menu_${popupKepkaIndex}_sprite.webp`;

  useEffect(() => {
    let timeoutId: number | undefined;

    const scheduleNextUpdate = () => {
      timeoutId = window.setTimeout(() => {
        setDailyGostIndex(getDailyGostMenuIndex());
        scheduleNextUpdate();
      }, getNextMoscowMidnightDelay());
    };

    scheduleNextUpdate();

    return () => {
      if (typeof timeoutId === 'number') {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    prepareMatch3Music();

    const tryStartMusic = async () => {
      const didStart = await playMenuMainMusic();
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

    return () => {
      isMounted = false;
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('keydown', handleUnlock);
      stopMenuMainMusic();
    };
  }, []);

  useEffect(() => {
    const handleMusicPreferenceChange = (event: Event) => {
      const nextEnabled = (event as CustomEvent<{ enabled: boolean }>).detail?.enabled;

      if (typeof nextEnabled === 'boolean') {
        setIsMusicEnabledState(nextEnabled);
      }
    };

    window.addEventListener(MUSIC_PREFERENCE_CHANGE_EVENT, handleMusicPreferenceChange);

    return () => {
      window.removeEventListener(MUSIC_PREFERENCE_CHANGE_EVENT, handleMusicPreferenceChange);
    };
  }, []);

  const handleMusicToggle = () => {
    const nextEnabled = !isMusicEnabled;

    setIsMusicEnabledState(nextEnabled);
    setGameMusicEnabled(nextEnabled);

    if (nextEnabled) {
      void playMenuMainMusic();
    } else {
      stopAllGameMusic();
    }
  };

  const handleGuideReplay = () => {
    resetCafeGuideCompletion();
    setPopup(null);
    setIsGuideOpen(true);
  };

  const handleGuideComplete = () => {
    markCafeGuideCompleted();
    setIsGuideOpen(false);
  };

  return (
    <div className='cafe_menu'>
      <button
        className='cafe_menu__guide_button'
        type='button'
        aria-label='Открыть гид'
        onClick={handleGuideReplay}
      >
        гид
      </button>
      <button
        className={`cafe_menu__music_toggle${isMusicEnabled ? '' : ' cafe_menu__music_toggle--off'}`}
        type='button'
        aria-label={isMusicEnabled ? 'Выключить музыку игры' : 'Включить музыку игры'}
        aria-pressed={isMusicEnabled}
        onClick={handleMusicToggle}
      >
        <img
          className='cafe_menu__music_toggle_sprite'
          src={isMusicEnabled ? MUSIC_ON_ICON_SRC : MUSIC_OFF_ICON_SRC}
          alt=''
        />
      </button>
      <button
        className='cafe_menu__hitbox cafe_menu__hitbox--runner'
        type='button'
        aria-label='Играть в раннер'
        onClick={onRunnerPlay}
      />
      <button
        className='cafe_menu__hitbox cafe_menu__hitbox--match'
        type='button'
        aria-label='Играть в 3 в ряд'
        onClick={onPlay}
      />
      <button
        className='cafe_menu__hitbox cafe_menu__hitbox--listik'
        type='button'
        aria-label='Открыть listik_meshok'
        onClick={() => setPopup({ kind: 'text', title: 'listik_meshok' })}
      />
      <button
        className='cafe_menu__guest_button cafe_menu__hitbox--kepka cafe_menu__guest_button--visual_hidden'
        type='button'
        aria-label={`Открыть меню ${dailyGostIndex}`}
        onClick={() => setPopup({ kind: 'kepka', index: dailyGostIndex })}
      >
        <img className='cafe_menu__guest_image' src={dailyGostAsset} alt='' />
      </button>

      {popup?.kind === 'text' ? (
        <button
          className='cafe_menu__popup'
          type='button'
          aria-label='Закрыть поп-ап'
          onClick={() => setPopup(null)}
        >
          <span className='cafe_menu__popup_title'>{popup.title}</span>
          <span className='cafe_menu__popup_hint'>тапни, чтобы закрыть</span>
        </button>
      ) : null}
      {popup?.kind === 'kepka' ? (
        <button
          className='cafe_menu__popup cafe_menu__popup--kepka'
          type='button'
          aria-label='Закрыть меню кепки'
          onClick={() => setPopup(null)}
        >
          <span className='cafe_menu__kepka_window'>
            <img className='cafe_menu__kepka_background' src={popupKepkaAsset} alt='' />
          </span>
          <img className='cafe_menu__kepka_sprite' src={popupKepkaSpriteAsset} alt='' />
        </button>
      ) : null}

      {isGuideOpen ? <CafeGuideOverlay onComplete={handleGuideComplete} /> : null}
    </div>
  );
}
