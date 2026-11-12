import { FieldScene } from './FieldScene';
import { SceneAnimation } from './SceneAnimation';

// Game 5: the weather scene, with the result animation on top once the answer is right.
export function FieldSceneEffect({
  sceneKey,
  animationKey,
}: {
  sceneKey?: string;
  animationKey?: string;
}) {
  return (
    <div className="relative">
      <FieldScene sceneKey={sceneKey} />
      {animationKey && (
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <SceneAnimation presetKey={animationKey} />
        </div>
      )}
    </div>
  );
}
