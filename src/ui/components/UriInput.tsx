import { pick } from 'ramda';
import { FC, SubmitEventHandler, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import type { VersionInput } from '../../standards';
import type { ResolvedVersion } from '../resolve';
import { useChecker } from '../store';
import { formatDocument, handleResponse } from '../util';

interface Props {
  resolved: ResolvedVersion;
  className?: string;
}

function fetchDocument(url: string, resolved: ResolvedVersion) {
  return fetch(url)
    .then(response => handleResponse(response, url))
    .then(responseText =>
      resolved.version.responseMapper //
        ? resolved.version.responseMapper(responseText)
        : Promise.resolve({ content: responseText }),
    );
}

const UriInput: FC<Props> = ({ resolved, className }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramUrl = searchParams.get('url') ?? '';
  const [inputUrl, setInputUrl] = useState(paramUrl);
  const [pendingUrl, setPendingUrl] = useState<string | null>(paramUrl || null);
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [prevParamUrl, setPrevParamUrl] = useState(paramUrl);
  const fetching = pendingUrl !== null && pendingUrl !== fetchedUrl;

  // React to external search param changes (e.g. address bar edit, back/forward,
  // or the `url` being dropped by a standard switch / title reset).
  if (paramUrl !== prevParamUrl) {
    setPrevParamUrl(paramUrl);
    if (paramUrl && paramUrl !== fetchedUrl) {
      setInputUrl(paramUrl);
      setPendingUrl(paramUrl);
    } else if (!paramUrl) {
      // The `url` param was removed externally: forget the loaded document so the
      // sync effect below won't re-add it, and clear the input box.
      setInputUrl('');
      setPendingUrl(null);
      setFetchedUrl(null);
    }
  }

  const { setContent, setConformanceClasses, setError } = useChecker(
    useShallow(state => pick(['setContent', 'setConformanceClasses', 'setError'], state)),
  );

  const onFetched = useCallback(
    (url: string, input: VersionInput) => {
      setContent(formatDocument(input.content));
      setConformanceClasses(input.rulesets ? resolved.toConformanceClasses(input.rulesets) : resolved.conformanceClasses);
      setFetchedUrl(url);
    },
    [resolved, setContent, setConformanceClasses],
  );

  // Sync search params with fetchedUrl (separate from fetch to avoid re-render loop)
  useEffect(() => {
    if (fetchedUrl && paramUrl !== fetchedUrl) {
      try {
        new URL(fetchedUrl);
        setSearchParams({ url: fetchedUrl }, { replace: true });
      } catch {
        // Invalid URL — don't update search params
      }
    }
  }, [fetchedUrl, paramUrl, setSearchParams]);

  const onFetchError = useCallback(
    (error: unknown) => {
      setPendingUrl(null);
      if (error instanceof TypeError) {
        setError(`Possible network or CORS failure: "${error.message}". ConformanceClass your browser console for more details.`);
      } else {
        setError(`Error: "${(error as Error).message}"`);
      }
    },
    [setError],
  );

  useEffect(() => {
    if (!pendingUrl || pendingUrl === fetchedUrl) return;
    // Guard against a stale result applying after this effect re-runs (a
    // version/standard switch changes `resolved`) or the component unmounts —
    // otherwise a slow fetch would clobber the editor and re-add `?url=` after
    // the user has already navigated or reset away.
    let cancelled = false;
    fetchDocument(pendingUrl, resolved).then(
      input => {
        if (!cancelled) onFetched(pendingUrl, input);
      },
      error => {
        if (!cancelled) onFetchError(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [pendingUrl, fetchedUrl, resolved, onFetched, onFetchError]);

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    setPendingUrl(inputUrl);
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
        <input
          type="text"
          className="flex-1 min-w-0 px-1.5"
          placeholder="Enter URL to load a document from remote location..."
          value={inputUrl}
          onChange={event => setInputUrl(event.target.value)}
        />
        <button type="submit" className="shrink-0 px-2.5 py-1.5 text-sm font-semibold cursor-pointer" disabled={fetching}>
          Load
        </button>
      </form>
    </div>
  );
};

export default UriInput;
