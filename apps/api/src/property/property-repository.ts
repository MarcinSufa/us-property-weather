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
  private readonly database: DatabaseSync;

  constructor(database: DatabaseSync) {
    this.database = database;
    this.insertStatement = database.prepare(`
      INSERT INTO property (id, street, city, state, zip_code, lat, long, weather_data)
      VALUES (:id, :street, :city, :state, :zipCode, :lat, :long, :weatherData)
      RETURNING *
    `);
    this.findByIdStatement = database.prepare('SELECT * FROM property WHERE id = :id');
    this.deleteByIdStatement = database.prepare('DELETE FROM property WHERE id = :id RETURNING *');
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
    const predicates: string[] = [];
    const parameters: Record<string, string> = {};
    if (filter.city !== undefined && filter.city !== null) {
      predicates.push('city = :city');
      parameters.city = filter.city;
    }
    if (filter.state !== undefined && filter.state !== null) {
      predicates.push('state = :state');
      parameters.state = filter.state;
    }
    if (filter.zipCode !== undefined && filter.zipCode !== null) {
      predicates.push('zip_code = :zipCode');
      parameters.zipCode = filter.zipCode;
    }
    const whereClause = predicates.length === 0 ? '' : `WHERE ${predicates.join(' AND ')}`;
    const orderByClause =
      sort === 'CREATED_AT_ASC'
        ? 'ORDER BY created_at ASC, rowid ASC'
        : 'ORDER BY created_at DESC, rowid DESC';
    const statement = this.database.prepare(
      `SELECT * FROM property ${whereClause} ${orderByClause}`,
    );
    const rows = statement.all(parameters);
    return rows.map((row) => this.mapRow(row));
  }

  deleteById(id: string): Property | null {
    const result = this.deleteByIdStatement.get({ id });
    return result === undefined ? null : this.mapRow(result);
  }

  private mapRow(row: Record<string, SQLOutputValue>): Property {
    const id = this.textColumn(row, 'id');
    const street = this.textColumn(row, 'street');
    const city = this.textColumn(row, 'city');
    const state = this.textColumn(row, 'state');
    const zipCode = this.textColumn(row, 'zip_code');
    const lat = this.numberColumn(row, 'lat');
    const long = this.numberColumn(row, 'long');
    const weatherDataJson = this.textColumn(row, 'weather_data');
    let weatherData: unknown;
    try {
      weatherData = JSON.parse(weatherDataJson);
    } catch {
      throw new Error('Invalid property row column: weather_data');
    }
    if (typeof weatherData !== 'object' || weatherData === null || Array.isArray(weatherData)) {
      throw new Error('Invalid property row column: weather_data');
    }
    const createdAt = this.textColumn(row, 'created_at');

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

  private textColumn(row: Record<string, SQLOutputValue>, name: string): string {
    const value = row[name];
    if (typeof value !== 'string') {
      throw new Error(`Invalid property row column: ${name}`);
    }
    return value;
  }

  private numberColumn(row: Record<string, SQLOutputValue>, name: string): number {
    const value = row[name];
    if (typeof value !== 'number') {
      throw new Error(`Invalid property row column: ${name}`);
    }
    return value;
  }
}
