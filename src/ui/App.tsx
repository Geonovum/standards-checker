import type { FC } from 'react';
import { Link } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import GitHubIcon from './components/GitHubIcon';
import SpecSelector from './components/SpecSelector';
import UriInput from './components/UriInput';
import type { Spec, UiStrings } from './types';

interface Props {
  spec: Spec;
  specs: Spec[];
  title?: string;
  githubUrl?: string;
  strings?: Partial<UiStrings>;
}

const App: FC<Props> = ({ spec, specs, title, githubUrl, strings }) => (
  <div className="flex flex-col h-screen">
    <header className="flex flex-col gap-2 px-4 py-2 bg-slate-700 text-white md:flex-row md:items-center md:gap-4">
      <div className="flex items-center justify-between gap-4 md:contents">
        <h1 className="min-w-0 truncate text-lg font-medium md:order-1">
          <Link to="/">{title ?? 'Checker'}</Link>: {spec.name}
        </h1>
        <div className="flex shrink-0 items-center md:order-3">
          <SpecSelector specs={specs} className="mr-4" />
          {githubUrl && (
            <a href={githubUrl} target="_blank">
              <GitHubIcon />
            </a>
          )}
        </div>
      </div>
      <UriInput spec={spec} className="w-full md:order-2 md:w-auto md:min-w-0 md:max-w-xl md:flex-1" />
    </header>
    <div className="flex-1 overflow-hidden">
      <CodeEditor spec={spec} strings={strings} />
    </div>
  </div>
);

export default App;
