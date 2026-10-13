import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from './database.ts';
import { PropertyRepository } from '../property/property-repository.ts';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('openDatabase', () => {
  it('AC-STORE-1 creates nested folders and preserves properties after reopening', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'covertree-db-'));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, 'one', 'two', 'properties.db');
    const firstDatabase = openDatabase(databasePath);
    const firstRepository = new PropertyRepository(firstDatabase);
    const property = firstRepository.insert({
      street: '1 Main St',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      lat: 33.4,
      long: -112.1,
      weatherData: { temperature: 25 },
    });
    firstDatabase.close();

    const secondDatabase = openDatabase(databasePath);
    try {
      expect(new PropertyRepository(secondDatabase).findById(property.id)).toEqual(property);
    } finally {
      secondDatabase.close();
    }
  });

  it('AC-STORE-1 opens an in-memory database with no properties', () => {
    const database = openDatabase(':memory:');
    try {
      expect(new PropertyRepository(database).list({}, 'CREATED_AT_DESC')).toEqual([]);
    } finally {
      database.close();
    }
  });
});
