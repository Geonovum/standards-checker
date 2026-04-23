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
    <header className="flex justify-between items-center px-4 py-2 bg-slate-700 text-white">
      <div>
        <h1 className="text-lg font-medium">
          <Link to="/">{title ?? 'Checker'}</Link>: {spec.name}
        </h1>
      </div>
      <UriInput spec={spec} />
      <div className="flex items-center">
        <SpecSelector specs={specs} className="mr-4" />
        {githubUrl && (
          <a href={githubUrl} target="_blank">
            <GitHubIcon />
          </a>
        )}
      </div>
    </header>
    <div className="flex-1 overflow-hidden">
      <CodeEditor spec={spec} strings={strings} />
    </div>
  </div>
);

export default App;
