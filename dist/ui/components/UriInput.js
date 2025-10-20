import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { pick } from 'ramda';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChecker } from '../store';
import { formatDocument, handleResponse } from '../util';
const UriInput = ({ spec }) => {
    const [uri, setUri] = useState('');
    const [fetching, setFetching] = useState(false);
    const { setContent, setLinters, setError, checking } = useChecker(useShallow(state => pick(['setContent', 'setLinters', 'setError', 'checking'], state)));
    const handleSubmit = event => {
        event.preventDefault();
        setFetching(true);
        fetch(uri)
            .then(response => handleResponse(response, uri))
            .then(responseText => spec.responseMapper //
            ? spec.responseMapper(responseText)
            : Promise.resolve({ content: responseText }))
            .then((input) => {
            setFetching(false);
            setContent(formatDocument(input.content));
            setLinters(input.linters ?? spec.linters);
        })
            .catch(error => {
            setFetching(false);
            if (error instanceof TypeError) {
                setError(`Possible network or CORS failure: "${error.message}". Check your browser console for more details.`);
            }
            else {
                setError(`Error: "${error.message}"`);
            }
        });
    };
    return (_jsx("div", { children: _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { type: "text", className: "w-96 px-1.5", placeholder: "Enter URL to load a document from remote location...", value: uri, onChange: event => setUri(event.target.value) }), _jsx("button", { type: "submit", className: "ml-2 px-2.5 py-1.5 text-sm font-semibold cursor-pointer", disabled: fetching || checking, children: "Load" })] }) }));
};
export default UriInput;
