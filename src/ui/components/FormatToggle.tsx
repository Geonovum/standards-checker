import clsx from 'clsx';
import { pick } from 'ramda';
import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ENCODINGS, convertContent, detectEncoding, type Encoding } from '../../encodings';
import { useChecker } from '../store';

interface Props {
  className?: string;
}

const FormatToggle: FC<Props> = ({ className }) => {
  const { content, setContent } = useChecker(useShallow(state => pick(['content', 'setContent'], state)));
  const active = detectEncoding(content);

  const switchTo = (target: Encoding) => {
    if (target.id === active.id) return;
    try {
      setContent(convertContent(active, target, content));
    } catch {
      // Source content isn't valid under the active encoding — leave it alone.
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Input format"
      className={clsx(
        'inline-flex rounded-md bg-white p-0.5 font-mono text-xs font-semibold tracking-wider uppercase shadow-sm ring-1 ring-slate-200',
        className,
      )}
    >
      {ENCODINGS.map(encoding => {
        const isActive = encoding.id === active.id;
        return (
          <button
            key={encoding.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => switchTo(encoding)}
            className={clsx(
              'rounded px-2 py-0.5 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60',
              isActive ? 'bg-slate-100 text-slate-700 cursor-default' : 'bg-transparent text-slate-400 hover:text-slate-700 cursor-pointer',
            )}
          >
            {encoding.label}
          </button>
        );
      })}
    </div>
  );
};

export default FormatToggle;
