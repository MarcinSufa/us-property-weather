import { Link } from 'react-router';
import type { PropertiesQuery } from '../graphql/generated/graphql.ts';
import { formatCreatedAt, formatWeather } from '../formatters.ts';

type PropertyRow = PropertiesQuery['properties'][number];

type PropertyTableProps = {
  properties: PropertyRow[];
};

const columns = ['Street', 'City', 'State', 'Zip code', 'Created', 'Weather at creation'] as const;

export function PropertyTable({ properties }: PropertyTableProps) {
  return (
    <div className="card property-table-card">
      <div className="property-table-scroll" role="region" aria-label="Property list" tabIndex={0}>
        <table className="property-table" role="table">
          <thead role="rowgroup">
            <tr role="row">
              {columns.map((column) => (
                <th key={column} scope="col" role="columnheader">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {properties.map((property) => (
              <tr key={property.id} role="row">
                <td role="cell" data-label="Street">
                  <Link to={`/properties/${property.id}`}>{property.street}</Link>
                </td>
                <td role="cell" data-label="City">
                  {property.city}
                </td>
                <td role="cell" data-label="State">
                  {property.state}
                </td>
                <td className="property-table__zip" role="cell" data-label="Zip code">
                  {property.zipCode}
                </td>
                <td role="cell" data-label="Created">
                  <time dateTime={property.createdAt}>{formatCreatedAt(property.createdAt)}</time>
                </td>
                <td role="cell" data-label="Weather at creation">
                  {formatWeather(
                    property.weatherData.temperature,
                    property.weatherData.weather_descriptions,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
