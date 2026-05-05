import type { LeaderboardItem } from '../lib/backend';
import ResultLeaderboard from './ResultLeaderboard';
import './GameUI.styles.css';

interface Props {
  score: number;
  isResultOpen: boolean;
  resultScore: number;
  resultMessage?: string | null;
  isSyncingResult: boolean;
  leaderboardItems: LeaderboardItem[];
  isLeaderboardLoading: boolean;
  onExitRequest: () => void;
  onResultClose: () => void;
}

export default function GameUI({
  score,
  isResultOpen,
  resultScore,
  resultMessage,
  isSyncingResult,
  leaderboardItems,
  isLeaderboardLoading,
  onExitRequest,
  onResultClose,
}: Props) {
  return (
    <div className='game_ui'>
      <div className='game_ui__topbar'>
        <button className='game_ui__back' onClick={onExitRequest}>
          Назад
        </button>
        <div className='game_ui__score' aria-label={`Кепок: ${score}`}>
          <img
            className='game_ui__score_icon'
            src='/assets/kepka_coin.svg'
            alt=''
            aria-hidden='true'
          />
          <span className='game_ui__score_value'>{score}</span>
        </div>
      </div>

      {isResultOpen ? (
        <div className='game_ui__overlay'>
          <div className='game_ui__card'>
            <div className='game_ui__result'>Передумал {resultScore} раз</div>
            {resultMessage ? <div className='game_ui__message'>{resultMessage}</div> : null}
            <button
              className='game_ui__confirm'
              onClick={onResultClose}
              disabled={isSyncingResult}
            >
              {isSyncingResult ? 'Сохраняем...' : 'В меню'}
            </button>
            <ResultLeaderboard
              game='match'
              items={leaderboardItems}
              isLoading={isLeaderboardLoading}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
