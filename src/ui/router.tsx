import { createHashRouter, Navigate } from 'react-router-dom';
import App from './App';
import type { Spec, UiConfig } from './types';

export const createRouter = (specs: Spec[], config: UiConfig = {}) => {
  const { title, githubUrl, strings } = config;

  return createHashRouter([
    {
      path: '/',
      element: <Navigate to={`/${specs[0].slug}`} />,
    },
    ...specs.map(spec => ({
      path: `/${spec.slug}`,
      element: <App spec={spec} specs={specs} title={title} githubUrl={githubUrl} strings={strings} />,
    })),
  ]);
};

export default createRouter;
