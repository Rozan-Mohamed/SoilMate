import clsx from 'clsx';
import { AnswerButton, type AnswerState } from './AnswerButton';
import { en } from '@/strings/en';
import type { Choice } from '@/api/types';

type Props = {
  choices: Choice[];
  stateOf: (choiceKey: string) => AnswerState;
  onSelect: (choiceKey: string) => void;
  /** stack = always one column (Game 1). columns = 3 across on desktop (Games 2 to 5). */
  layout?: 'stack' | 'columns';
};

// Choices are shown in EXACTLY the order the API sent them. Never re-shuffle here.
export function AnswerGrid({ choices, stateOf, onSelect, layout = 'stack' }: Props) {
  return (
    <div
      role="group"
      aria-label={en.game.answerGroup}
      className={clsx('grid gap-3', layout === 'columns' ? 'sm:grid-cols-3' : 'grid-cols-1')}
    >
      {choices.map((choice, i) => (
        <AnswerButton
          key={choice.key}
          choice={choice}
          state={stateOf(choice.key)}
          layout={layout === 'columns' ? 'tile' : 'row'}
          hotkey={i + 1}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
