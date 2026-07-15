import type { EditorView } from '@uiw/react-codemirror';
import { useEffect, useState } from 'react';

/**
 * Width the vertical scrollbar takes out of a CodeMirror scroller, in pixels
 * (0 with overlay scrollbars). Pass the `EditorView` once it exists (e.g. via
 * ReactCodeMirror's `onCreateEditor`). A ResizeObserver keeps the value in
 * sync: the scroller's content box shrinks/grows by exactly the scrollbar
 * width when it appears or disappears, which CodeMirror's own update cycle
 * doesn't report.
 */
export const useScrollbarWidth = (view: EditorView | undefined): number => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!view) return;
    const observer = new ResizeObserver(() => setWidth(view.scrollDOM.offsetWidth - view.scrollDOM.clientWidth));
    observer.observe(view.scrollDOM);
    return () => observer.disconnect();
  }, [view]);

  return width;
};
