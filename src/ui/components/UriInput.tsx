import { pick } from 'ramda';
import { FC, SubmitEventHandler, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useChecker } from '../store';
import { Spec, SpecInput } from '../types';
import { formatDocument, handleResponse } from '../util';

interface Props {
  spec: Spec;
  className?: string;
}

function fetchDocument(url: string, spec: Spec) {
  return fetch(url)
    .then(response => handleResponse(response, url))
    .then(responseText =>
      spec.responseMapper //
        ? spec.responseMapper(responseText)
        : Promise.resolve({ content: responseText }),
    );
}

const UriInput: FC<Props> = ({ spec, className }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramUrl = searchParams.get('url') ?? '';
  const [inputUrl, setInputUrl] = useState(paramUrl);
  const [pendingUrl, setPendingUrl] = useState<string | null>(paramUrl || null);
  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [prevParamUrl, setPrevParamUrl] = useState(paramUrl);
  const fetching = pendingUrl !== null && pendingUrl !== fetchedUrl;

  // React to external search param changes (e.g. address bar edit, back/forward)
  if (paramUrl !== prevParamUrl) {
    setPrevParamUrl(paramUrl);
    if (paramUrl && paramUrl !== fetchedUrl) {
      setInputUrl(paramUrl);
      setPendingUrl(paramUrl);
    }
  }

  const { setContent, setLinters, setError, checking } = useChecker(
    useShallow(state => pick(['setContent', 'setLinters', 'setError', 'checking'], state)),
  );

  const onFetched = useCallback(
    (url: string, input: SpecInput) => {
      setContent(formatDocument(input.content));
      setLinters(input.linters ?? spec.linters);
      setFetchedUrl(url);
    },
    [spec.linters, setContent, setLinters],
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
        setError(`Possible network or CORS failure: "${error.message}". Check your browser console for more details.`);
      } else {
        setError(`Error: "${(error as Error).message}"`);
      }
    },
    [setError],
  );

  useEffect(() => {
    if (pendingUrl && pendingUrl !== fetchedUrl) {
      fetchDocument(pendingUrl, spec).then(input => onFetched(pendingUrl, input), onFetchError);
    }
  }, [pendingUrl, fetchedUrl, spec, onFetched, onFetchError]);

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
        <button type="submit" className="shrink-0 px-2.5 py-1.5 text-sm font-semibold cursor-pointer" disabled={fetching || checking}>
          Load
        </button>
      </form>
    </div>
  );
};

export default UriInput;
