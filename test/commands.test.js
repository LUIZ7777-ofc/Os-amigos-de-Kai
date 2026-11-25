import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommands } from '../src/commands.js';

test('registers embed and requested utility commands globally', () => {
  const commands = createCommands();

  assert.deepEqual(
    commands.map((command) => command.name),
    ['embed', 'ajuda', 'ping', 'servidor', 'usuario'],
  );
  assert.equal(commands.find((command) => command.name === 'usuario').options[0].required, false);
  assert.equal(commands.find((command) => command.name === 'embed').options[0].name, 'canal');
});
