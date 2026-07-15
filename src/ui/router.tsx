import { createHashRouter, type RouteObject } from 'react-router-dom';
import type { Standard } from '../standards';
import App from './App';
import { LegacyRedirect, RootRedirect } from './redirects';
import { resolveVersion } from './resolve';
import type { UiConfig } from './types';

// The route table: a root redirect, one canonical `/{slug}/{versionId}` route
// per version, and a catch-all that maps legacy slugs to their new anchor.
export const buildRoutes = (standards: Standard[], config: UiConfig = {}): RouteObject[] => {
  // The redirects and this table dereference `standards[0]`; a clear throw beats a
  // cryptic "cannot read slug of undefined" from deep inside a redirect render.
  if (standards.length === 0) {
    throw new Error('mount()/createRouter() requires at least one standard.');
  }

  const { title, githubUrl, strings } = config;

  return [
    {
      path: '/',
      element: <RootRedirect standards={standards} />,
    },
    ...standards.flatMap(standard =>
      standard.versions.map(version => ({
        path: `/${standard.slug}/${version.id}`,
        element: (
          <App resolved={resolveVersion(standard, version)} standards={standards} title={title} githubUrl={githubUrl} strings={strings} />
        ),
      })),
    ),
    {
      path: '*',
      element: <LegacyRedirect standards={standards} />,
    },
  ];
};

export const createRouter = (standards: Standard[], config: UiConfig = {}) => createHashRouter(buildRoutes(standards, config));

export default createRouter;
