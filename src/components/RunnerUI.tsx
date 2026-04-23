import './RunnerUI.styles.css';

interface Props {
  score: number;
  isGameOver: boolean;
  finalScore: number;
  resultMessage?: string | null;
  onExit: () => void;
}

export default function RunnerUI({
  score,
  isGameOver,
  finalScore,
  resultMessage,
  onExit,
}: Props) {
  return (
    <div className='runner_ui'>
      <div className='runner_ui__topbar'>
        <button className='runner_ui__back' onClick={onExit}>
          Назад
        </button>
        <div className='runner_ui__score'>Ничего: {score}</div>
      </div>

      {isGameOver ? (
        <div className='runner_ui__overlay'>
          <div className='runner_ui__card'>
            <div className='runner_ui__title'>Забег окончен</div>
            <div className='runner_ui__result'>Итог: {finalScore}</div>
            {resultMessage ? <div className='runner_ui__result_note'>{resultMessage}</div> : null}
            <div className='runner_ui__hint'>
              Нажми пробел, тапни по экрану или используй кнопку ниже, чтобы начать заново.
            </div>
            <div className='runner_ui__actions'>
              <button
                className='runner_ui__restart'
                onClick={() => window.dispatchEvent(new CustomEvent('runner:restart'))}
              >
                Играть снова
              </button>
              <button className='runner_ui__secondary' onClick={onExit}>
                В меню
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className='runner_ui__tips'>
          Коричневое препятствие: один точный прыжок. Высокая полосатая башня или плотная
          связка: прыжок и затем air jump.
        </div>
      )}
    </div>
  );
}
