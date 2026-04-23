import { forEachDiagnostic, lintGutter, setDiagnosticsEffect } from '@codemirror/lint';
import type { Extension, ReactCodeMirrorRef } from '@uiw/react-codemirror';
import ReactCodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import clsx from 'clsx';
import { AlertCircle, SquareArrowOutUpRight } from 'lucide-react';
import { isEmpty, pick } from 'ramda';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { detectEncoding } from '../../encodings';
import { getLanguageExtensions } from '../encodings';
import { useChecker } from '../store';
import { DEFAULT_UI_STRINGS, type Diagnostic, type Spec, type UiStrings } from '../types';
import { formatDocument, groupBySource } from '../util';
import FormatToggle from './FormatToggle';

const EXTENSIONS: Extension[] = [lintGutter()];

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
  const encodingId = useMemo(() => detectEncoding(content).id, [content]);

  const languageExtensions = useMemo(() => getLanguageExtensions(encodingId), [encodingId]);

  useEffect(() => {
    setContent(spec.example);
    setLinters(spec.linters);
  }, [spec, setContent, setLinters]);

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

            const lintCount = linterDiagnostics.length;
            const summary = strings.lintingErrorsSummary.replace('{count}', lintCount.toString());

            return (
              <div key={linter.name}>
                <div className="mb-4 p-4 bg-red-500 text-white rounded-sm shadow-lg">
                  [{linter.name}] {summary}
                </div>
                <ul>
                  {linterDiagnostics.map((diagnostic, i) => (
                    <li key={i}>
                      <div
                        className={clsx('diagnostic', {
                          'diagnostic-error': diagnostic.severity === 'error',
                          'diagnostic-warning': diagnostic.severity === 'warning',
                          'diagnostic-info': diagnostic.severity === 'info' || diagnostic.severity === 'hint',
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
    </div>
  );
};

export default CodeEditor;
