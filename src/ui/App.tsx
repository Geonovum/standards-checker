import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { Spec } from './types';
import CodeEditor from './components/CodeEditor';
import GitHubIcon from './components/GitHubIcon';
import SpecSelector from './components/SpecSelector';
import UriInput from './components/UriInput';

interface Props {
  spec: Spec;
  specs: Spec[];
}

const App: FC<Props> = ({ spec, specs }) => (
  <div className="flex flex-col h-screen">
    <header className="flex justify-between items-center px-4 py-2 bg-slate-700 text-white">
      <div>
        <h1 className="text-lg font-medium">
          <Link to="/">Geonovum OGC Checker</Link>: {spec.name}
        </h1>
      </div>
      <UriInput spec={spec} />
      <div className="flex items-center">
        <SpecSelector specs={specs} className="mr-4" />
        <a href="https://github.com/Geonovum-labs/ogc-checker" target="_blank">
          <GitHubIcon />
        </a>
      </div>
    </header>
    <div className="flex-1 overflow-hidden">
      <CodeEditor spec={spec} />
    </div>
  </div>
);

export default App;
