import { createHashRouter, Navigate } from 'react-router-dom';
import App from './App';
import type { Spec } from './types';

export const createRouter = (specs: Spec[]) => {
  return createHashRouter([
    {
      path: '/',
      element: <Navigate to={`/${specs[0].slug}`} />,
    },
    ...specs.map(spec => ({
      path: `/${spec.slug}`,
      element: <App spec={spec} specs={specs} />,
    })),
  ]);
};

export default createRouter;