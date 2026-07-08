import { describe, expect, it } from 'vitest';
import { isBlank, isHoneypotTriggered, isValidEmail } from '../../src/lib/contact-form';

// RED (Wave 0): src/lib/contact-form.ts does not exist yet — it is built in
// Plan 03-02 Task 2. This import failure is the intended failing state for
// this task; do not stub or weaken these assertions to make them pass early.

describe('isHoneypotTriggered', () => {
  it('returns false for an empty value', () => {
    expect(isHoneypotTriggered('')).toBe(false);
  });

  it('returns false for a whitespace-only value', () => {
    expect(isHoneypotTriggered('   ')).toBe(false);
  });

  it('returns true for any non-empty value', () => {
    expect(isHoneypotTriggered('bot')).toBe(true);
  });
});

describe('isValidEmail', () => {
  it('accepts a well-formed email address', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  it('rejects a value missing the @ sign', () => {
    expect(isValidEmail('ab.co')).toBe(false);
  });

  it('rejects a value missing the domain dot', () => {
    expect(isValidEmail('a@bco')).toBe(false);
  });

  it('rejects a value containing spaces', () => {
    expect(isValidEmail('a @b.co')).toBe(false);
  });
});

describe('isBlank', () => {
  it('returns true for an empty value', () => {
    expect(isBlank('')).toBe(true);
  });

  it('returns true for a whitespace-only value', () => {
    expect(isBlank('   ')).toBe(true);
  });

  it('returns false for a real value', () => {
    expect(isBlank('hello')).toBe(false);
  });
});
