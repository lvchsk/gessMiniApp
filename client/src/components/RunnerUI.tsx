import { useEffect, type KeyboardEvent } from 'react';
import { stopRunnerMusic } from '../audio/runnerMusic';
import {
  playRunnerShipmentMusic,
  stopRunnerShipmentMusic,
} from '../audio/runnerShipmentMusic';
import type { LeaderboardItem } from '../lib/backend';
import { RUNNER_END_EVENT } from '../runner/config';
import ResultLeaderboard from './ResultLeaderboard';
import './RunnerUI.styles.css';

interface Props {
  score: number;
  isGameOver: boolean;
  finalScore: number;
  showShipmentReward: boolean;
  resultMessage?: string | null;
  leaderboardItems: LeaderboardItem[];
  isLeaderboardLoading: boolean;
  onExit: () => void;
}

export default function RunnerUI({
  score,
  isGameOver,
  finalScore,
  showShipmentReward,
  resultMessage,
  leaderboardItems,
  isLeaderboardLoading,
  onExit,
}: Props) {
  useEffect(() => {
    if (!showShipmentReward) {
      return;
    }

    stopRunnerMusic();
    void playRunnerShipmentMusic();

    return () => {
      stopRunnerShipmentMusic();
    };
  }, [showShipmentReward]);

  const handleShipmentKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onExit();
    }
  };

  const handleBack = () => {
    if (isGameOver) {
      onExit();
      return;
    }

    window.dispatchEvent(new CustomEvent(RUNNER_END_EVENT));
  };

  return (
    <div className='runner_ui'>
      {!showShipmentReward ? (
        <div className='runner_ui__topbar'>
          <button className='runner_ui__back' onClick={handleBack}>
            Назад
          </button>
          <div className='runner_ui__score' aria-label={`Ничегошек: ${score}`}>
            <img
              className='runner_ui__score_icon'
              src='/assets/nichego_coin.svg'
              alt=''
              aria-hidden='true'
            />
            <span className='runner_ui__score_value'>{score}</span>
          </div>
        </div>
      ) : null}

      {isGameOver && showShipmentReward ? (
        <div
          role='button'
          tabIndex={0}
          className='runner_ui__shipment_overlay'
          aria-label='Вернуться в меню кафе'
          onClick={onExit}
          onKeyDown={handleShipmentKeyDown}
        >
          <div className='runner_ui__shipment_message'>
            поздравляю!
            <br />
            ты набрал 3500 ничегошек! отгрузки начнутся
          </div>
          <div className='runner_ui__shipment_sprite' aria-hidden='true'>
            <div className='runner_ui__shipment_sprite_track' />
          </div>
          <ResultLeaderboard
            className='runner_ui__shipment_leaderboard'
            game='runner'
            items={leaderboardItems}
            scoreLabel='ничегошек'
            isLoading={isLeaderboardLoading}
            showTopThree={false}
          />
        </div>
      ) : isGameOver ? (
        <div className='runner_ui__overlay'>
          <div className='runner_ui__card'>
            <div className='runner_ui__title'>Забег окончен</div>
            <div className='runner_ui__result' aria-label={`Итог: ${finalScore} ничегошек`}>
              <span>Итог:</span>
              <img
                className='runner_ui__result_icon'
                src='/assets/nichego_coin.svg'
                alt=''
                aria-hidden='true'
              />
              <span>{finalScore}</span>
            </div>
            {resultMessage ? <div className='runner_ui__result_note'>{resultMessage}</div> : null}
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
            <ResultLeaderboard
              game='runner'
              items={leaderboardItems}
              scoreLabel='ничегошек'
              isLoading={isLeaderboardLoading}
            />
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
