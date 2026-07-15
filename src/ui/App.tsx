import type { FC } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resolveDefaultVersion, type Standard } from '../standards';
import CodeEditor from './components/CodeEditor';
import GitHubIcon from './components/GitHubIcon';
import StandardSelector from './components/StandardSelector';
import UriInput from './components/UriInput';
import VersionSelector from './components/VersionSelector';
import type { ResolvedVersion } from './resolve';
import { useChecker } from './store';
import type { UiStrings } from './types';

interface Props {
  resolved: ResolvedVersion;
  standards: Standard[];
  title?: string;
  githubUrl?: string;
  strings?: Partial<UiStrings>;
}

const App: FC<Props> = ({ resolved, standards, title, githubUrl, strings }) => {
  // Decide the editor content when the addressed standard/version changes:
  // - Standard changed (or first load / deep-link): reset to the landed
  //   version's example.
  // - Same standard, version changed: reload the new example only when the
  //   editor is untouched; retain the user's edits when it is dirty.
  // Driven from the store so it survives remount, reconcile, and StrictMode's
  // double-invoke. Checks always follow the addressed version.
  useEffect(() => {
    const state = useChecker.getState();
    const standardChanged = state.activeStandard !== resolved.standard.slug;
    const dirty = state.content !== state.pristineExample;
    if (standardChanged || !dirty) {
      state.loadExample(resolved.version.example, resolved.standard.slug);
    }
    state.setConformanceClasses(resolved.conformanceClasses);
    // Re-enter the checking state for the newly addressed version and drop any
    // stale fetch error. A dirty version switch keeps the editor content, so no
    // editor `docChanged` fires to reset these — without it the new version's
    // conformance classes would render against the previous run's diagnostics as
    // false green "no violations" bars until its linters report. A version with
    // no rulesets has nothing to check, so it falls straight through.
    state.setChecking(resolved.conformanceClasses.length > 0);
    state.setError(undefined);
  }, [resolved]);

  // Clicking the site title returns to the app home (the first standard's default
  // version) and fully resets: reload that example and drop any loaded `?url=`.
  // The search-less <Link> target drops the param (UriInput clears its input in
  // response); loadExample covers the case where we're already on the home route,
  // where `resolved` — and so the sync effect above — doesn't change.
  const home = standards[0];
  const homeVersion = resolveDefaultVersion(home);
  const resetToHome = () => useChecker.getState().loadExample(homeVersion.example, home.slug);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex flex-col gap-2 px-4 py-2 bg-slate-700 text-white md:flex-row md:items-center md:gap-4">
        <div className="flex items-center justify-between gap-4 md:contents">
          <h1 className="min-w-0 truncate text-lg font-medium md:order-1">
            <Link to={`/${home.slug}/${homeVersion.id}`} onClick={resetToHome}>
              {title ?? 'Checker'}
            </Link>
            : {resolved.standard.name}
          </h1>
          <div className="flex shrink-0 items-center gap-2 md:order-3">
            <StandardSelector standards={standards} standard={resolved.standard} />
            <VersionSelector standard={resolved.standard} version={resolved.version} />
            {githubUrl && (
              <a href={githubUrl} target="_blank" className="ml-1 flex items-center">
                <GitHubIcon />
              </a>
            )}
          </div>
        </div>
        <UriInput resolved={resolved} className="w-full md:order-2 md:mx-auto md:w-auto md:min-w-0 md:max-w-xl md:flex-1" />
      </header>
      <div className="flex-1 overflow-hidden">
        <CodeEditor strings={strings} />
      </div>
    </div>
  );
};

export default App;
