import './MainMenu.styles.css';

interface Props {
  onStart: () => void;
  isReady: boolean;
  loadingProgress: number;
  user?: string;
}

export default function MainMenu({
  onStart,
  isReady,
  loadingProgress,
  user,
}: Props) {
  const loadingPercent = Math.min(100, Math.max(0, Math.round(loadingProgress * 100)));

  return (
    <div className={`container${isReady ? ' container--ready' : ' container--loading'}`}>
      <button
        className='main_menu__start_hitbox'
        type='button'
        onClick={onStart}
        aria-label='Играть'
        disabled={!isReady}
      >
        <span className='main_menu__sr_only'>Играть</span>
      </button>
      <h1 className='main_menu__greeting'>
        <span className='main_menu__greeting_label'>Привет,</span>
        {user ? <span className='main_menu__greeting_name'>{user}</span> : null}
      </h1>
      {!isReady ? (
        <div className='main_menu__loader' role='status' aria-live='polite'>
          <div className='main_menu__loader_label'>Загрузка {loadingPercent}%</div>
          <div className='main_menu__loader_track' aria-hidden='true'>
            <div
              className='main_menu__loader_bar'
              style={{ transform: `scaleX(${loadingProgress})` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
