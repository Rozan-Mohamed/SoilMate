import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  dismissAuthNotice,
  setAuthNotice,
  subscribeAuthNotice,
  takeAuthNotice,
} from './notice';

describe('auth notice storage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    dismissAuthNotice();
  });

  it('stores a one-time notice and clears it when taken', () => {
    setAuthNotice('We kept the farm saved on your account.');

    expect(window.sessionStorage.getItem('soilmate:notice')).toBe(
      'We kept the farm saved on your account.',
    );
    expect(takeAuthNotice()).toBe('We kept the farm saved on your account.');
    expect(takeAuthNotice()).toBeNull();
    expect(window.sessionStorage.getItem('soilmate:notice')).toBeNull();
  });

  it('ignores an empty notice', () => {
    setAuthNotice('');
    expect(window.sessionStorage.getItem('soilmate:notice')).toBeNull();
  });

  it('notifies subscribers when shown and dismissed', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthNotice(listener);

    setAuthNotice('Hello');
    dismissAuthNotice();
    unsubscribe();
    setAuthNotice('After unsubscribe');

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('reads and clears sessionStorage on the first client snapshot', async () => {
    vi.resetModules();
    const notice = await import('./notice');
    window.sessionStorage.setItem('soilmate:notice', 'Persisted');

    expect(notice.getAuthNoticeSnapshot()).toBe('Persisted');
    expect(window.sessionStorage.getItem('soilmate:notice')).toBeNull();
    expect(notice.getAuthNoticeSnapshot()).toBe('Persisted');

    notice.dismissAuthNotice();
    expect(notice.getAuthNoticeSnapshot()).toBeNull();
  });
});
