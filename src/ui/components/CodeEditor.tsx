import { json, jsonParseLinter } from '@codemirror/lang-json';
import { forEachDiagnostic, linter, lintGutter, setDiagnosticsEffect } from '@codemirror/lint';
import type { Extension, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import ReactCodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import clsx from 'clsx';
import { AlertCircle, SquareArrowOutUpRight } from 'lucide-react';
import { isEmpty, pick } from 'ramda';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChecker } from '../store';
import { DEFAULT_UI_STRINGS, type Diagnostic, type Severity, type Spec, type UiStrings } from '../types';
import { groupBySource } from '../util';

const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'info', 'hint'];
const EXTENSIONS: Extension[] = [json(), linter(jsonParseLinter()), lintGutter()];

interface Props {
  spec: Spec;
  strings?: Partial<UiStrings>;
}

const CodeEditor: FC<Props> = ({ spec, strings: stringOverrides }) => {
  const { content, setContent, linters, setLinters, checking, setChecking, error, setError } = useChecker(
    useShallow(state => pick(['content', 'setContent', 'linters', 'setLinters', 'checking', 'setChecking', 'error', 'setError'], state)),
  );

  const [diagnostics, setDiagnostics] = useState<{ [key: string]: Diagnostic[] }>({});
  const codeMirrorRef = useRef<ReactCodeMirrorRef>(null);
  const strings = { ...DEFAULT_UI_STRINGS, ...(stringOverrides ?? {}) };

  useEffect(() => {
    setContent(spec.example);
    setLinters(spec.linters);
  }, [spec, setContent, setLinters]);

  return (
    <div className="flex h-full">
      <div className="w-[50%] min-w-[400px] overflow-auto">
        <ReactCodeMirror
          ref={codeMirrorRef}
          value={content}
          extensions={[...EXTENSIONS, ...linters.map(l => l.linter)]}
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
              setContent(viewUpdate.state.doc.toString());
              setChecking(true);
              setError(undefined);
            }
          }}
        />
      </div>
      <div className="flex-1 overflow-auto p-4 bg-sky-50 text-sm">
        {checking && <p>{strings.checking}</p>}
        {!checking && error && <div className="mb-4 p-4 bg-red-500 text-white rounded-sm shadow-lg">{error}</div>}
        {!checking && !error && isEmpty(linters) && <p>{strings.noMatchingRulesets}</p>}
        {!checking &&
          !error &&
          linters.map(linter => {
            const linterDiagnostics = diagnostics[linter.name];

            if (!linterDiagnostics) {
              return (
                <div key={linter.name}>
                  <div className="mb-4 p-4 bg-green-600 text-white rounded-sm shadow-lg">
                    [{linter.name}] {strings.noViolations}
                  </div>
                </div>
              );
            }

            const grouped = Object.groupBy(linterDiagnostics, d => d.severity);
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
                  [{linter.name}] {summary}
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
