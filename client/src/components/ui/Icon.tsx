import { Gamepad2 } from 'lucide-react';
import { ICON_MAP } from '@/assets/icon-map';

const warned = new Set<string>();

type IconProps = {
  name: string;
  className?: string;
  /** Provide for meaningful icons. Decorative icons stay hidden from screen readers. */
  label?: string;
};

// Renders the asset for an API icon key. A missing asset never crashes the game.
export function Icon({ name, className = 'size-6', label }: IconProps) {
  const Component = ICON_MAP[name];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };

  if (!Component) {
    if (process.env.NODE_ENV !== 'production' && !warned.has(name)) {
      warned.add(name);
      console.warn(`[Icon] no asset for key "${name}"`);
    }
    return <Gamepad2 className={className} {...a11y} />;
  }
  return (
    <span className="contents" {...a11y}>
      <Component className={className} />
    </span>
  );
}
