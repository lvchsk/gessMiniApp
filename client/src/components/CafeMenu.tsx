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
import { preloadGameAssetsInBackground } from '../lib/assetPreloader';
import './CafeMenu.styles.css';

interface Props {
  onPlay: () => void;
  onRunnerPlay: () => void;
}

const MOSCOW_TIME_ZONE = 'Europe/Moscow';
const KEPKA_MENU_START_DAY = Date.UTC(2026, 4, 5) / 86_400_000;
const KEPKA_MENU_COUNT = 10;

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

function getDailyKepkaMenuName(): string {
  const daysSinceStart = getMoscowDayNumber() - KEPKA_MENU_START_DAY;
  const index = ((daysSinceStart % KEPKA_MENU_COUNT) + KEPKA_MENU_COUNT) % KEPKA_MENU_COUNT;

  return `kepka_menu_${index}`;
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
  const [popupTitle, setPopupTitle] = useState<string | null>(null);
  const [isMusicEnabled, setIsMusicEnabledState] = useState(isGameMusicEnabled);
  const [isGuideOpen, setIsGuideOpen] = useState(() => !isCafeGuideCompleted());

  useEffect(() => {
    let isMounted = true;

    void preloadGameAssetsInBackground();
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
    setPopupTitle(null);
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
          src={isMusicEnabled ? '/assets/music_on.png' : '/assets/music_off.png'}
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
        onClick={() => setPopupTitle('listik_meshok')}
      />
      <button
        className='cafe_menu__hitbox cafe_menu__hitbox--kepka'
        type='button'
        aria-label='Открыть ежедневное меню кепки'
        onClick={() => setPopupTitle(getDailyKepkaMenuName())}
      />

      {popupTitle ? (
        <button
          className='cafe_menu__popup'
          type='button'
          aria-label='Закрыть поп-ап'
          onClick={() => setPopupTitle(null)}
        >
          <span className='cafe_menu__popup_title'>{popupTitle}</span>
          <span className='cafe_menu__popup_hint'>тапни, чтобы закрыть</span>
        </button>
      ) : null}

      {isGuideOpen ? <CafeGuideOverlay onComplete={handleGuideComplete} /> : null}
    </div>
  );
}
