import assert from 'node:assert/strict';
import test from 'node:test';

function normalizeUrlCandidate(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }
  if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    try {
      const withProto = `https://${trimmed}`;
      new URL(withProto);
      return withProto;
    } catch {
      return null;
    }
  }
  return null;
}

function parsePortfolioReferences(input) {
  if (!input || typeof input !== 'string') return { urls: [], notes: [] };
  const tokens = input
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const urls = [];
  for (const token of tokens) {
    const normalized = normalizeUrlCandidate(token);
    if (normalized && !urls.includes(normalized)) {
      urls.push(normalized);
    }
  }

  const notes = [];
  const trimmedAll = input.trim();
  if (urls.length === 0 && trimmedAll) {
    notes.push(trimmedAll);
  }

  return { urls, notes };
}

test('normalizeUrlCandidate handles http, https, and raw domains correctly', () => {
  assert.equal(normalizeUrlCandidate('https://youtube.com/watch?v=123'), 'https://youtube.com/watch?v=123');
  assert.equal(normalizeUrlCandidate('http://drive.google.com/drive/folders/abc'), 'http://drive.google.com/drive/folders/abc');
  assert.equal(normalizeUrlCandidate('drive.google.com/folder/xyz'), 'https://drive.google.com/folder/xyz');
  assert.equal(normalizeUrlCandidate('youtu.be/sample'), 'https://youtu.be/sample');
  assert.equal(normalizeUrlCandidate('vimeo.com/98765'), 'https://vimeo.com/98765');
  assert.equal(normalizeUrlCandidate(''), null);
  assert.equal(normalizeUrlCandidate('just some notes without dot'), null);
});

test('parsePortfolioReferences parses comma, space, and newline delimited links', () => {
  const input = 'drive.google.com/123, https://youtu.be/456\nvimeo.com/789';
  const { urls, notes } = parsePortfolioReferences(input);
  assert.deepEqual(urls, [
    'https://drive.google.com/123',
    'https://youtu.be/456',
    'https://vimeo.com/789',
  ]);
  assert.equal(notes.length, 0);
});

test('parsePortfolioReferences preserves non-URL applicant notes', () => {
  const input = 'Previous wedding edits available on client request';
  const { urls, notes } = parsePortfolioReferences(input);
  assert.equal(urls.length, 0);
  assert.deepEqual(notes, ['Previous wedding edits available on client request']);
});
