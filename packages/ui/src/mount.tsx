import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { createRouter } from './router';
import type { Spec, UiConfig } from './types';

/**
 * Mount the checker UI into a DOM element.
 * This encapsulates React rendering so consumer apps don't need
 * react, react-dom, or react-router-dom as direct dependencies.
 */
export function mount(element: HTMLElement, specs: Spec[], config?: UiConfig) {
  const router = createRouter(specs, config);
  createRoot(element).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
