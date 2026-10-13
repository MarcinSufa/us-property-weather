import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { SQLOutputValue } from 'node:sqlite';
import type {
  Property,
  PropertyAddress,
  PropertyFilter,
  PropertySort,
  UsState,
} from './property.ts';

export interface NewProperty extends PropertyAddress {
  lat: number;
  long: number;
  weatherData: Record<string, unknown>;
}

export class PropertyRepository {
  private readonly insertStatement;
  private readonly findByIdStatement;
  private readonly deleteByIdStatement;
  private readonly listAscendingStatement;
  private readonly listDescendingStatement;

  constructor(database: DatabaseSync) {
    this.insertStatement = database.prepare(`
      INSERT INTO property (id, street, city, state, zip_code, lat, long, weather_data)
      VALUES (:id, :street, :city, :state, :zipCode, :lat, :long, :weatherData)
      RETURNING *
    `);
    this.findByIdStatement = database.prepare('SELECT * FROM property WHERE id = :id');
    this.deleteByIdStatement = database.prepare('DELETE FROM property WHERE id = :id RETURNING *');
    this.listAscendingStatement = database.prepare(`
      SELECT * FROM property
      WHERE (:city IS NULL OR city = :city)
        AND (:state IS NULL OR state = :state)
        AND (:zipCode IS NULL OR zip_code = :zipCode)
      ORDER BY created_at ASC, rowid ASC
    `);
    this.listDescendingStatement = database.prepare(`
      SELECT * FROM property
      WHERE (:city IS NULL OR city = :city)
        AND (:state IS NULL OR state = :state)
        AND (:zipCode IS NULL OR zip_code = :zipCode)
      ORDER BY created_at DESC, rowid DESC
    `);
  }

  insert(row: NewProperty): Property {
    const result = this.insertStatement.get({
      id: randomUUID(),
      street: row.street,
      city: row.city,
      state: row.state,
      zipCode: row.zipCode,
      lat: row.lat,
      long: row.long,
      weatherData: JSON.stringify(row.weatherData),
    });
    if (result === undefined) {
      throw new Error('Insert did not return a property row');
    }
    return this.mapRow(result);
  }

  findById(id: string): Property | null {
    const result = this.findByIdStatement.get({ id });
    return result === undefined ? null : this.mapRow(result);
  }

  list(filter: PropertyFilter, sort: PropertySort): Property[] {
    const statement =
      sort === 'CREATED_AT_ASC' ? this.listAscendingStatement : this.listDescendingStatement;
    const rows = statement.all({
      city: filter.city ?? null,
      state: filter.state ?? null,
      zipCode: filter.zipCode ?? null,
    });
    return rows.map((row) => this.mapRow(row));
  }

  deleteById(id: string): Property | null {
    const result = this.deleteByIdStatement.get({ id });
    return result === undefined ? null : this.mapRow(result);
  }

  private mapRow(row: Record<string, SQLOutputValue>): Property {
    const id = row.id;
    if (typeof id !== 'string') {
      throw new Error('Invalid property row column: id');
    }
    const street = row.street;
    if (typeof street !== 'string') {
      throw new Error('Invalid property row column: street');
    }
    const city = row.city;
    if (typeof city !== 'string') {
      throw new Error('Invalid property row column: city');
    }
    const state = row.state;
    if (typeof state !== 'string') {
      throw new Error('Invalid property row column: state');
    }
    const zipCode = row.zip_code;
    if (typeof zipCode !== 'string') {
      throw new Error('Invalid property row column: zip_code');
    }
    const lat = row.lat;
    if (typeof lat !== 'number') {
      throw new Error('Invalid property row column: lat');
    }
    const long = row.long;
    if (typeof long !== 'number') {
      throw new Error('Invalid property row column: long');
    }
    const weatherDataJson = row.weather_data;
    if (typeof weatherDataJson !== 'string') {
      throw new Error('Invalid property row column: weather_data');
    }
    let weatherData: unknown;
    try {
      weatherData = JSON.parse(weatherDataJson);
    } catch {
      throw new Error('Invalid property row column: weather_data');
    }
    if (typeof weatherData !== 'object' || weatherData === null || Array.isArray(weatherData)) {
      throw new Error('Invalid property row column: weather_data');
    }
    const createdAt = row.created_at;
    if (typeof createdAt !== 'string') {
      throw new Error('Invalid property row column: created_at');
    }

    return {
      id,
      street,
      city,
      state: state as UsState,
      zipCode,
      lat,
      long,
      weatherData: weatherData as Record<string, unknown>,
      createdAt,
    };
  }
}
