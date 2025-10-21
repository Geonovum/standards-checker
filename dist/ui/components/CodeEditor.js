import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { forEachDiagnostic, linter, lintGutter, setDiagnosticsEffect } from '@codemirror/lint';
import ReactCodeMirror, { EditorSelection } from '@uiw/react-codemirror';
import clsx from 'clsx';
import { AlertCircle, SquareArrowOutUpRight } from 'lucide-react';
import { isEmpty, pick } from 'ramda';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChecker } from '../store.js';
import { groupBySource } from '../util.js';
const EXTENSIONS = [json(), linter(jsonParseLinter()), lintGutter()];
const CodeEditor = ({ spec }) => {
    const { content, setContent, linters, setLinters, checking, setChecking, error, setError } = useChecker(useShallow(state => pick(['content', 'setContent', 'linters', 'setLinters', 'checking', 'setChecking', 'error', 'setError'], state)));
    const [diagnostics, setDiagnostics] = useState({});
    const codeMirrorRef = useRef(null);
    useEffect(() => {
        setContent(spec.example);
        setLinters(spec.linters);
    }, [spec, setContent, setLinters]);
    return (_jsxs("div", { className: "flex h-full", children: [_jsx("div", { className: "w-[50%] min-w-[400px] overflow-auto", children: _jsx(ReactCodeMirror, { ref: codeMirrorRef, value: content, extensions: [...EXTENSIONS, ...linters.map(l => l.linter)], onUpdate: viewUpdate => {
                        viewUpdate.transactions.forEach(transaction => {
                            transaction.effects.forEach(effect => {
                                if (effect.is(setDiagnosticsEffect)) {
                                    const diagnostics = [];
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
                    } }) }), _jsxs("div", { className: "flex-1 overflow-auto p-4 bg-sky-50 text-sm", children: [checking && _jsx("p", { children: "Checking..." }), !checking && error && _jsx("div", { className: "mb-4 p-4 bg-red-500 text-white rounded-sm shadow-lg", children: error }), !checking && !error && isEmpty(linters) && _jsx("p", { children: "No matching rulesets found." }), !checking &&
                        !error &&
                        linters.map(linter => (_jsx("div", { children: !diagnostics[linter.name] ? (_jsxs("div", { className: "mb-4 p-4 bg-green-600 text-white rounded-sm shadow-lg", children: ["[", linter.name, "] No violations found."] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4 p-4 bg-red-500 text-white rounded-sm shadow-lg", children: ["[", linter.name, "] Found ", diagnostics[linter.name].length, " linting error(s)."] }), _jsx("ul", { children: diagnostics[linter.name].map((diagnostic, i) => (_jsx("li", { children: _jsxs("div", { className: clsx('diagnostic', {
                                                    'diagnostic-error': diagnostic.severity === 'error',
                                                    'diagnostic-warning': diagnostic.severity === 'warning',
                                                    'diagnostic-info': diagnostic.severity === 'info' || diagnostic.severity === 'hint',
                                                }), children: [_jsx(AlertCircle, { size: 28 }), _jsxs("div", { children: [_jsx("span", { children: diagnostic.message }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsxs("button", { className: "btn", onClick: () => codeMirrorRef.current?.view?.dispatch({
                                                                            selection: EditorSelection.single(diagnostic.from, diagnostic.to),
                                                                            scrollIntoView: true,
                                                                        }), children: ["Show in editor", _jsx(SquareArrowOutUpRight, { size: 12, strokeWidth: 2, className: "ml-1.5" })] }), diagnostic.documentationUrl && (_jsxs("a", { className: "btn", href: diagnostic.documentationUrl, target: "_blank", rel: "noopener noreferrer", children: ["Documentation", _jsx(SquareArrowOutUpRight, { size: 12, strokeWidth: 2, className: "ml-1.5" })] }))] })] })] }) }, i))) })] })) }, linter.name)))] })] }));
};
export default CodeEditor;
