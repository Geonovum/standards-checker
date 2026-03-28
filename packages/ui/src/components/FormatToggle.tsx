import jsYaml from 'js-yaml';
import { pick } from 'ramda';
import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChecker } from '../store';
import { isJsonContent } from '../util';

const toYaml = (content: string): string => {
  const doc = JSON.parse(content);
  return jsYaml.dump(doc, { lineWidth: -1, noRefs: true });
};

const toJson = (content: string): string => {
  const doc = jsYaml.load(content);
  return JSON.stringify(doc, undefined, 2);
};

interface Props {
  className?: string;
}

const FormatToggle: FC<Props> = ({ className }) => {
  const { content, setContent } = useChecker(useShallow(state => pick(['content', 'setContent'], state)));
  const isJson = isJsonContent(content);

  const handleToggle = () => {
    try {
      setContent(isJson ? toYaml(content) : toJson(content));
    } catch {
      // Content is not valid JSON/YAML — ignore
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        className="px-2.5 py-1.5 text-sm font-semibold cursor-pointer"
        onClick={handleToggle}
      >
        {isJson ? 'YAML' : 'JSON'}
      </button>
    </div>
  );
};

export default FormatToggle;
