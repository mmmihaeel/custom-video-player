import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

let fullscreenElement: Element | null = null;
let pictureInPictureElement: Element | null = null;

function setFullscreenTarget(target: Element | null) {
  fullscreenElement = target;
}

function setPictureInPictureTarget(target: Element | null) {
  pictureInPictureElement = target;
}

beforeAll(() => {
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    value: MouseEvent
  });

  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: vi.fn(() => 1)
  });

  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value: vi.fn()
  });

  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement
  });

  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: vi.fn().mockImplementation(() => {
      setFullscreenTarget(null);
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    })
  });

  Object.defineProperty(document, 'pictureInPictureEnabled', {
    configurable: true,
    value: true
  });

  Object.defineProperty(document, 'pictureInPictureElement', {
    configurable: true,
    get: () => pictureInPictureElement
  });

  Object.defineProperty(document, 'exitPictureInPicture', {
    configurable: true,
    value: vi.fn().mockImplementation(() => {
      const currentVideo = pictureInPictureElement as HTMLVideoElement | null;
      setPictureInPictureTarget(null);
      currentVideo?.dispatchEvent(new Event('leavepictureinpicture'));
      return Promise.resolve();
    })
  });

  Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
    configurable: true,
    value: vi.fn().mockImplementation(function requestFullscreen(
      this: HTMLElement
    ) {
      setFullscreenTarget(this);
      document.dispatchEvent(new Event('fullscreenchange'));
      return Promise.resolve();
    })
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockImplementation(function play(this: HTMLMediaElement) {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: false,
        writable: true
      });
      this.dispatchEvent(new Event('play'));
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    })
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn().mockImplementation(function pause(this: HTMLMediaElement) {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: true,
        writable: true
      });
      this.dispatchEvent(new Event('pause'));
    })
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn()
  });

  Object.defineProperty(HTMLMediaElement.prototype, 'canPlayType', {
    configurable: true,
    value: vi.fn(() => '')
  });

  Object.defineProperty(HTMLVideoElement.prototype, 'requestPictureInPicture', {
    configurable: true,
    value: vi.fn().mockImplementation(function requestPictureInPicture(
      this: HTMLVideoElement
    ) {
      setPictureInPictureTarget(this);
      this.dispatchEvent(new Event('enterpictureinpicture'));
      return Promise.resolve({} as PictureInPictureWindow);
    })
  });
});

afterEach(() => {
  setFullscreenTarget(null);
  setPictureInPictureTarget(null);
  cleanup();
  vi.clearAllMocks();
});
