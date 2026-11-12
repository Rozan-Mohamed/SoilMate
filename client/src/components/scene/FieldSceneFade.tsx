'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FieldScene } from './FieldScene';

type Props = {
  /** illustrationKey: the problem scene. */
  problemKey?: string;
  /** illustrationFixedKey from the answer response. Only exists after a correct answer. */
  fixedKey?: string;
};

// Game 4: the fixed scene fades in over the problem scene (the worried cloud turns into a sun).
export function FieldSceneFade({ problemKey, fixedKey }: Props) {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <FieldScene sceneKey={problemKey} />
      {fixedKey && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 1 }}
        >
          <FieldScene sceneKey={fixedKey} healed />
        </motion.div>
      )}
    </div>
  );
}
