import './GameUI.styles.css';

interface Props {
  score: number;
  isResultOpen: boolean;
  resultScore: number;
  resultMessage?: string | null;
  isSyncingResult: boolean;
  onExitRequest: () => void;
  onResultClose: () => void;
}

export default function GameUI({
  score,
  isResultOpen,
  resultScore,
  resultMessage,
  isSyncingResult,
  onExitRequest,
  onResultClose,
}: Props) {
  return (
    <div className='game_ui'>
      <div className='game_ui__topbar'>
        <button className='game_ui__back' onClick={onExitRequest}>
          Назад
        </button>
        <div className='game_ui__score'>Кепок: {score}</div>
      </div>

      {isResultOpen ? (
        <div className='game_ui__overlay'>
          <div className='game_ui__card'>
            <div className='game_ui__title'>Результат</div>
            <div className='game_ui__result'>Набрано кепок: {resultScore}</div>
            {resultMessage ? <div className='game_ui__message'>{resultMessage}</div> : null}
            <button
              className='game_ui__confirm'
              onClick={onResultClose}
              disabled={isSyncingResult}
            >
              {isSyncingResult ? 'Сохраняем...' : 'В меню'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
