import { cleanup, render, screen } from '@testing-library/react';
import type { EditorView } from '@uiw/react-codemirror';
import type { FC } from 'react';
import { act, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollbarWidth } from './hooks';

// jsdom implements neither ResizeObserver nor layout; stub an observer that
// records its instances so tests can drive the callback against controlled
// scroller dimensions.
class StubResizeObserver {
  static instances: StubResizeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(readonly callback: ResizeObserverCallback) {
    StubResizeObserver.instances.push(this);
  }
  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
}

const liveObservers = () => StubResizeObserver.instances.filter(observer => !observer.disconnected);

const makeView = (dims: { offsetWidth: number; clientWidth: number }) => {
  const scrollDOM = document.createElement('div');
  Object.defineProperty(scrollDOM, 'offsetWidth', { configurable: true, get: () => dims.offsetWidth });
  Object.defineProperty(scrollDOM, 'clientWidth', { configurable: true, get: () => dims.clientWidth });
  return { scrollDOM } as unknown as EditorView;
};

const fire = (observer: StubResizeObserver) => act(() => observer.callback([], observer as unknown as ResizeObserver));

const Probe: FC<{ view?: EditorView }> = ({ view }) => <div data-testid="width">{useScrollbarWidth(view)}</div>;

beforeEach(() => {
  StubResizeObserver.instances = [];
  vi.stubGlobal('ResizeObserver', StubResizeObserver);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useScrollbarWidth', () => {
  it('is 0 while there is no view, without observing anything', () => {
    render(<Probe />);

    expect(screen.getByTestId('width')).toHaveTextContent('0');
    expect(StubResizeObserver.instances).toHaveLength(0);
  });

  it('observes the view scroller and reports the scrollbar width when it fires', () => {
    const view = makeView({ offsetWidth: 748, clientWidth: 733 });
    render(<Probe view={view} />);

    const [observer] = liveObservers();
    expect(observer.observed).toEqual([view.scrollDOM]);

    fire(observer);
    expect(screen.getByTestId('width')).toHaveTextContent('15');
  });

  it('drops back to 0 when the scrollbar disappears', () => {
    const dims = { offsetWidth: 748, clientWidth: 733 };
    render(<Probe view={makeView(dims)} />);
    const [observer] = liveObservers();

    fire(observer);
    expect(screen.getByTestId('width')).toHaveTextContent('15');

    dims.clientWidth = 748;
    fire(observer);
    expect(screen.getByTestId('width')).toHaveTextContent('0');
  });

  it('keeps exactly one live observer under StrictMode double-mounting', () => {
    const view = makeView({ offsetWidth: 748, clientWidth: 733 });
    render(
      <StrictMode>
        <Probe view={view} />
      </StrictMode>,
    );

    const live = liveObservers();
    expect(live).toHaveLength(1);

    fire(live[0]);
    expect(screen.getByTestId('width')).toHaveTextContent('15');
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = render(<Probe view={makeView({ offsetWidth: 748, clientWidth: 733 })} />);
    expect(liveObservers()).toHaveLength(1);

    unmount();
    expect(liveObservers()).toHaveLength(0);
  });
});
