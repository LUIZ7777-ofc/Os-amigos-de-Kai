import test from 'node:test';
import assert from 'node:assert/strict';
import { createBanner, getBannerFilename } from '../src/banner.js';

const draft = {
  title: 'Evento da comunidade',
  description: 'Participe do evento neste fim de semana.',
  color: '#7C3AED',
  authorName: 'Meu servidor',
  footerText: 'Inscricoes abertas',
};

test('creates a PNG banner in the expected dimensions', () => {
  const image = createBanner(draft);

  assert.equal(image.toString('hex', 0, 8), '89504e470d0a1a0a');
  assert.equal(image.readUInt32BE(16), 1100);
  assert.equal(image.readUInt32BE(20), 430);
});

test('gives each distinct embed a stable, distinct attachment name', () => {
  assert.equal(getBannerFilename(draft), getBannerFilename({ ...draft }));
  assert.notEqual(
    getBannerFilename(draft),
    getBannerFilename({ ...draft, title: 'Novidades' }),
  );
  assert.notEqual(
    getBannerFilename(draft),
    getBannerFilename({ ...draft, color: '#25A55F' }),
  );
});
