import './GameUI.styles.css';

interface Props {
  score: number;
  onExit: () => void;
}

export default function GameUI({ score, onExit }: Props) {
  return (
    <div className='game_ui'>
      <div className='game_ui__topbar'>
        <button className='game_ui__back' onClick={onExit}>
          Назад
        </button>
        <div className='game_ui__score'>Кепок: {score}</div>
      </div>
    </div>
  );
}
