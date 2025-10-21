import { jsx as _jsx } from "react/jsx-runtime";
import { createHashRouter, Navigate } from 'react-router-dom';
import App from './App.js';
export const createRouter = (specs) => {
    return createHashRouter([
        {
            path: '/',
            element: _jsx(Navigate, { to: `/${specs[0].slug}` }),
        },
        ...specs.map(spec => ({
            path: `/${spec.slug}`,
            element: _jsx(App, { spec: spec, specs: specs }),
        })),
    ]);
};
export default createRouter;
