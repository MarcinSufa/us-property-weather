import type { DatabaseSync } from 'node:sqlite';

export function openDatabase(_path: string): DatabaseSync {
  throw new Error('not implemented');
}
