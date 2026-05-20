import { useState } from 'react';
import './CafeGuideOverlay.styles.css';
import { CAFE_GUIDE_STEPS } from './guideSteps';

interface Props {
  onComplete: () => void;
}

export default function CafeGuideOverlay({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = CAFE_GUIDE_STEPS[stepIndex];

  const handleAnswer = () => {
    if (stepIndex >= CAFE_GUIDE_STEPS.length - 1) {
      onComplete();
      return;
    }

    setStepIndex((currentStepIndex) => currentStepIndex + 1);
  };

  return (
    <div className='cafe_guide' role='dialog' aria-modal='true' aria-label='Гид по кафе'>
      <div className='cafe_guide__panel'>
        <img className='cafe_guide__asset' src={step.asset} alt='' aria-hidden='true' />
        <div className='cafe_guide__dialog'>
          <div className='cafe_guide__body'>{step.body}</div>
          <div className='cafe_guide__answers'>
            {step.answers.map((answer) => (
              <button
                className='cafe_guide__answer'
                type='button'
                key={`${step.id}-${answer}`}
                onClick={handleAnswer}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
