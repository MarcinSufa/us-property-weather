import { useMemo } from 'react';
import { useQuery } from 'urql';
import { Link, useSearchParams } from 'react-router';
import { PageTitle } from '../components/PageTitle.tsx';
import { ErrorAlert } from '../components/ErrorAlert.tsx';
import { PropertyFilters, type FilterValues } from '../components/PropertyFilters.tsx';
import { PropertyTable } from '../components/PropertyTable.tsx';
import { PropertiesDocument } from '../graphql/operations.ts';
import { getFieldErrors, getFirstGraphqlErrorCode } from '../graphql/errors.ts';
import type { PropertyFilter, PropertySort } from '../graphql/generated/graphql.ts';
import { US_STATE_CODES } from '../us-states.ts';
import './PropertyListPage.css';

const propertyQueryContext = { additionalTypenames: ['Property'] };

function getUrlFilters(searchParams: URLSearchParams) {
  const city = searchParams.get('city')?.trim();
  const stateValue = searchParams.get('state')?.trim();
  const zip = searchParams.get('zip')?.trim();
  const state = US_STATE_CODES.find((code) => code === stateValue);
  const filter: PropertyFilter = {
    ...(city ? { city } : {}),
    ...(state ? { state } : {}),
    ...(zip ? { zipCode: zip } : {}),
  };

  return {
    city: city ?? '',
    state: state ?? '',
    zip: zip ?? '',
    filter,
    hasFilters: Boolean(city || state || zip),
  };
}

function createSearchParamsWithFilters(
  current: URLSearchParams,
  values: FilterValues,
): URLSearchParams {
  const next = new URLSearchParams(current);
  const city = values.city.trim();
  const state = values.state.trim();
  const zip = values.zip.trim();
  if (city) next.set('city', city);
  else next.delete('city');
  if (US_STATE_CODES.some((code) => code === state)) next.set('state', state);
  else next.delete('state');
  if (zip) next.set('zip', zip);
  else next.delete('zip');
  return next;
}

function LoadingProperties() {
  return (
    <div className="card property-list__loading" aria-busy="true">
      <p role="status">Loading properties…</p>
      {[0, 1, 2].map((row) => (
        <div className="property-list__skeleton-row" key={row} aria-hidden="true">
          {[0, 1, 2, 3].map((bar) => (
            <div className="skeleton-bar" key={bar} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyProperties({
  hasFilters,
  summary,
  onClear,
}: {
  hasFilters: boolean;
  summary: string;
  onClear: () => void;
}) {
  if (hasFilters) {
    return (
      <section className="property-list__state-card">
        <div className="card empty-state property-list__filtered-empty">
          <h2 className="property-list__state-title">No properties match these filters</h2>
          <p className="property-list__state-detail">{summary}</p>
          <button className="button button--secondary" type="button" onClick={onClear}>
            Clear filters
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="property-list__state-card">
      <div className="card property-list__empty-content">
        <svg
          aria-hidden="true"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v10h13V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
        <h2 className="property-list__state-title">No properties yet</h2>
        <p>Add an address and the weather at that moment is saved with it.</p>
        <Link className="button button--primary" to="/properties/new">
          Add property
        </Link>
      </div>
    </section>
  );
}

function formatFilterSummary(filter: ReturnType<typeof getUrlFilters>): string {
  const parts: string[] = [];
  if (filter.city) parts.push(`City “${filter.city}”`);
  if (filter.state) parts.push(`state ${filter.state}`);
  if (filter.zip) parts.push(`zip code ${filter.zip}`);
  return parts.join(', ');
}

export function PropertyListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => getUrlFilters(searchParams), [searchParams]);
  const filterValues = useMemo(
    () => ({ city: urlFilters.city, state: urlFilters.state, zip: urlFilters.zip }),
    [urlFilters.city, urlFilters.state, urlFilters.zip],
  );
  const oldestFirst = searchParams.get('sort') === 'oldest';
  const sort: PropertySort = oldestFirst ? 'CREATED_AT_ASC' : 'CREATED_AT_DESC';
  const variables = useMemo(
    () => ({ ...(urlFilters.hasFilters ? { filter: urlFilters.filter } : {}), sort }),
    [urlFilters, sort],
  );
  const [{ data, error, fetching }, executeQuery] = useQuery({
    query: PropertiesDocument,
    variables,
    context: propertyQueryContext,
  });
  const errorCode = getFirstGraphqlErrorCode(error);
  const fieldErrors =
    errorCode === 'BAD_USER_INPUT'
      ? getFieldErrors(error).filter(
          (fieldError) =>
            fieldError.field === 'city' ||
            fieldError.field === 'state' ||
            fieldError.field === 'zipCode',
        )
      : [];
  const setFilters = (values: FilterValues) =>
    setSearchParams(createSearchParamsWithFilters(searchParams, values));
  const clearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('city');
    next.delete('state');
    next.delete('zip');
    setSearchParams(next);
  };
  const changeSort = (value: 'newest' | 'oldest') => {
    const next = new URLSearchParams(searchParams);
    if (value === 'oldest') next.set('sort', 'oldest');
    else next.delete('sort');
    setSearchParams(next);
  };

  const properties = data?.properties;
  const summary = formatFilterSummary(urlFilters);

  return (
    <main className="page-frame property-list">
      <PageTitle page="Properties" />
      <div className="property-list__heading">
        <h1 className="page-title">Properties</h1>
        {!fetching && properties && errorCode !== 'BAD_USER_INPUT' && (
          <p className="property-list__count">
            {properties.length} {properties.length === 1 ? 'property' : 'properties'}
          </p>
        )}
      </div>
      <PropertyFilters
        values={filterValues}
        sort={oldestFirst ? 'oldest' : 'newest'}
        errors={fieldErrors}
        onApply={setFilters}
        onClear={clearFilters}
        onSortChange={changeSort}
      />
      {fetching ? (
        <LoadingProperties />
      ) : error && (errorCode !== 'BAD_USER_INPUT' || fieldErrors.length === 0) ? (
        <section className="card property-list__state-card property-list__alert-card">
          <ErrorAlert
            title="Could not load properties"
            body="The server did not answer. Nothing was changed."
          />
          <div>
            <button
              className="button button--secondary"
              type="button"
              onClick={() => executeQuery({ requestPolicy: 'network-only' })}
            >
              Try again
            </button>
          </div>
        </section>
      ) : errorCode === 'BAD_USER_INPUT' ? null : properties && properties.length === 0 ? (
        <EmptyProperties
          hasFilters={urlFilters.hasFilters}
          summary={summary}
          onClear={clearFilters}
        />
      ) : properties ? (
        <PropertyTable properties={properties} />
      ) : null}
    </main>
  );
}
