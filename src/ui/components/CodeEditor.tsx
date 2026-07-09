import { forEachDiagnostic, lintGutter, setDiagnosticsEffect } from '@codemirror/lint';
import type { Extension, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import ReactCodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import clsx from 'clsx';
import { AlertCircle, SquareArrowOutUpRight } from 'lucide-react';
import { isEmpty, pick } from 'ramda';
import type { FC } from 'react';
import { useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { detectEncoding } from '../../encodings';
import { getLanguageExtensions } from '../encodings';
import { useChecker } from '../store';
import { DEFAULT_UI_STRINGS, type Diagnostic, type Severity, type SpecLinter, type UiStrings } from '../types';
import { formatDocument, groupBy, groupBySource } from '../util';
import FormatToggle from './FormatToggle';

const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'info', 'hint'];
const EXTENSIONS: Extension[] = [lintGutter()];

// Render the linter's conformance-class URI as a clickable source link (opens in
// a new tab) when it is a URL; otherwise just show the name in brackets. The
// brackets stay outside the link; the link itself is underlined (so it reads as
// a link) and drops the underline on hover. A small horizontal margin keeps the
// underline from colliding with the brackets.
const renderSource = (linter: SpecLinter) =>
  linter.href && /^https?:\/\//.test(linter.href) ? (
    <>
      [
      <a href={linter.href} target="_blank" rel="noopener noreferrer" className="mx-0.5 underline underline-offset-2 hover:no-underline">
        {linter.name}
      </a>
      ]
    </>
  ) : (
    <>[{linter.name}]</>
  );

// A self-contained loading indicator shown while a validation is in flight: a
// spinning ring (track + accent arc) beside the label, styled like the result
// cards so it sits naturally in the panel.
const LoadingIndicator: FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 rounded-sm bg-white p-4 text-slate-700 shadow-lg" role="status" aria-live="polite">
    <span aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
    <span className="font-medium">{label}</span>
  </div>
);

interface Props {
  strings?: Partial<UiStrings>;
}

// Content and linters come from the store; `App` owns setting them per
// standard/version (reload the example on a standard switch or an untouched
// version switch; retain edited content across a version switch).
const CodeEditor: FC<Props> = ({ strings: stringOverrides }) => {
  const { content, setContent, linters, checking, setChecking, error, setError } = useChecker(
    useShallow(state => pick(['content', 'setContent', 'linters', 'checking', 'setChecking', 'error', 'setError'], state)),
  );

  const [diagnostics, setDiagnostics] = useState<{ [key: string]: Diagnostic[] }>({});
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null);
  const strings = { ...DEFAULT_UI_STRINGS, ...(stringOverrides ?? {}) };
  const encodingId = useMemo(() => detectEncoding(content).id, [content]);

  const languageExtensions = useMemo(() => getLanguageExtensions(encodingId), [encodingId]);

  // A validation is in flight only when there's something to validate; with no
  // linters there's nothing to wait for (falls through to "no matching rulesets").
  const loading = checking && !isEmpty(linters);

  return (
    <div className="flex h-full">
      <div className="relative w-[50%] min-w-[400px] overflow-hidden">
        <ReactCodeMirror
          ref={codeMirrorRef}
          value={content}
          height="100%"
          style={{ height: '100%' }}
          extensions={[...EXTENSIONS, ...languageExtensions, ...linters.map(l => l.linter)]}
          onUpdate={viewUpdate => {
            viewUpdate.transactions.forEach(transaction => {
              transaction.effects.forEach(effect => {
                if (effect.is(setDiagnosticsEffect)) {
                  const diagnostics: Diagnostic[] = [];
                  forEachDiagnostic(viewUpdate.state, d => diagnostics.push(d));
                  setDiagnostics(groupBySource(diagnostics));
                  setChecking(false);
                }
              });
            });

            if (viewUpdate.docChanged) {
              const isPaste = viewUpdate.transactions.some(tr => tr.isUserEvent('input.paste'));
              const newContent = viewUpdate.state.doc.toString();
              // formatDocument only canonicalizes JSON; YAML pastes are preserved as-is.
              setContent(isPaste ? formatDocument(newContent) : newContent);
              setDiagnostics({});
              setChecking(true);
              setError(undefined);
            }
          }}
        />
        <FormatToggle className="absolute top-2 right-3 z-10" />
      </div>
      <div className="flex-1 overflow-auto p-4 bg-sky-50 text-sm">
        {/* Priority: a fetch/parse error, then the in-flight validation (only
            meaningful when there are linters), then "no matching rulesets",
            then the per-linter results. `loading` guards against showing the
            green "no violations" bars before the first lint result arrives. */}
        {error && <div className="mb-4 p-4 bg-red-500 text-white rounded-sm shadow-lg">{error}</div>}
        {!error && loading && <LoadingIndicator label={strings.checking} />}
        {!error && !loading && isEmpty(linters) && <p>{strings.noMatchingRulesets}</p>}
        {!error &&
          !loading &&
          linters.map(linter => {
            const linterDiagnostics = diagnostics[linter.name];

            if (!linterDiagnostics) {
              return (
                <div key={linter.name}>
                  <div className="mb-4 p-4 bg-green-600 text-white rounded-sm shadow-lg">
                    {renderSource(linter)} {strings.noViolations}
                  </div>
                </div>
              );
            }

            const grouped = groupBy(linterDiagnostics, d => d.severity);
            const counts = { error: 0, warning: 0, info: 0, hint: 0 };
            for (const d of linterDiagnostics) counts[d.severity as Severity] += 1;

            const hasErrors = counts.error > 0;
            const summary = strings.lintingSummary
              .replace('{total}', linterDiagnostics.length.toString())
              .replace('{errors}', counts.error.toString())
              .replace('{warnings}', counts.warning.toString())
              .replace('{hints}', counts.hint.toString())
              .replace('{info}', counts.info.toString());

            return (
              <div key={linter.name}>
                <div className={clsx('mb-4 p-4 rounded-sm shadow-lg', hasErrors ? 'bg-red-500 text-white' : 'bg-orange-400 text-white')}>
                  {renderSource(linter)} {summary}
                </div>
                {SEVERITY_ORDER.map(severity => {
                  const group = grouped[severity];
                  if (!group || group.length === 0) return null;

                  return (
                    <div key={severity} className="mb-4">
                      <h3
                        className={clsx('severity-group', {
                          'severity-group-error': severity === 'error',
                          'severity-group-warning': severity === 'warning',
                          'severity-group-info': severity === 'info',
                          'severity-group-hint': severity === 'hint',
                        })}
                      >
                        {strings[`severity${severity.charAt(0).toUpperCase()}${severity.slice(1)}` as keyof UiStrings]} ({group.length})
                      </h3>
                      <ul>
                        {group.map((diagnostic, i) => (
                          <li key={i}>
                            <div
                              className={clsx('diagnostic', {
                                'diagnostic-error': diagnostic.severity === 'error',
                                'diagnostic-warning': diagnostic.severity === 'warning',
                                'diagnostic-info': diagnostic.severity === 'info',
                                'diagnostic-hint': diagnostic.severity === 'hint',
                              })}
                            >
                              <AlertCircle size={28} />
                              <div>
                                <span>{diagnostic.message}</span>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    className="btn"
                                    onClick={() =>
                                      codeMirrorRef.current?.view?.dispatch({
                                        selection: EditorSelection.single(diagnostic.from, diagnostic.to),
                                        scrollIntoView: true,
                                      })
                                    }
                                  >
                                    {strings.showInEditor}
                                    <SquareArrowOutUpRight size={12} strokeWidth={2} className="ml-1.5" />
                                  </button>
                                  {diagnostic.documentationUrl && (
                                    <a className="btn" href={diagnostic.documentationUrl} target="_blank" rel="noopener noreferrer">
                                      {strings.documentation}
                                      <SquareArrowOutUpRight size={12} strokeWidth={2} className="ml-1.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CodeEditor;
