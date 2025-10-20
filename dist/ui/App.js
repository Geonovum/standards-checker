import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import CodeEditor from './components/CodeEditor';
import GitHubIcon from './components/GitHubIcon';
import SpecSelector from './components/SpecSelector';
import UriInput from './components/UriInput';
const App = ({ spec, specs }) => (_jsxs("div", { className: "flex flex-col h-screen", children: [_jsxs("header", { className: "flex justify-between items-center px-4 py-2 bg-slate-700 text-white", children: [_jsx("div", { children: _jsxs("h1", { className: "text-lg font-medium", children: [_jsx(Link, { to: "/", children: "Geonovum OGC Checker" }), ": ", spec.name] }) }), _jsx(UriInput, { spec: spec }), _jsxs("div", { className: "flex items-center", children: [_jsx(SpecSelector, { specs: specs, className: "mr-4" }), _jsx("a", { href: "https://github.com/Geonovum-labs/ogc-checker", target: "_blank", children: _jsx(GitHubIcon, {}) })] })] }), _jsx("div", { className: "flex-1 overflow-hidden", children: _jsx(CodeEditor, { spec: spec }) })] }));
export default App;
