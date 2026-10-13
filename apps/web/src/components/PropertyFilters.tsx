import { useEffect, useState, type FormEvent } from 'react';
import type { PropertyFilter } from '../graphql/generated/graphql.ts';
import type { PropertyFieldError } from '../graphql/errors.ts';
import { US_STATES } from '../us-states.ts';

export type FilterValues = {
  city: string;
  state: string;
  zip: string;
};

type PropertyFiltersProps = {
  values: FilterValues;
  urlKey: string;
  sort: 'newest' | 'oldest';
  errors: PropertyFieldError[];
  onApply: (values: FilterValues) => void;
  onClear: () => void;
  onSortChange: (sort: 'newest' | 'oldest') => void;
};

const fieldIds = {
  city: 'property-filter-city',
  state: 'property-filter-state',
  zipCode: 'property-filter-zip',
} satisfies Record<keyof PropertyFilter, string>;

export function PropertyFilters({
  values,
  urlKey,
  sort,
  errors,
  onApply,
  onClear,
  onSortChange,
}: PropertyFiltersProps) {
  const [formValues, setFormValues] = useState(values);

  useEffect(() => {
    setFormValues(values);
  }, [urlKey, values]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(formValues);
  };

  const fieldErrorProps = (field: keyof PropertyFilter) => {
    const fieldErrors = errors.filter((error) => error.field === field);
    return {
      'aria-invalid': fieldErrors.length > 0 ? true : undefined,
      'aria-describedby':
        fieldErrors.length > 0
          ? fieldErrors.map((_, index) => `${fieldIds[field]}-error-${index}`).join(' ')
          : undefined,
    };
  };

  const renderErrors = (field: keyof PropertyFilter) =>
    errors
      .filter((error) => error.field === field)
      .map((error, index) => (
        <span
          className="field__error property-filter-error"
          id={`${fieldIds[field]}-error-${index}`}
          key={`${field}-${index}-${error.message}`}
          role="alert"
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5" />
            <path d="M12 16.5h.01" />
          </svg>
          {error.message}
        </span>
      ));

  return (
    <form className="card property-filters" onSubmit={onSubmit} aria-live="polite">
      <div className="field property-filters__city">
        <label htmlFor={fieldIds.city}>City</label>
        <input
          id={fieldIds.city}
          type="text"
          placeholder="Any city"
          maxLength={100}
          value={formValues.city}
          {...fieldErrorProps('city')}
          onChange={(event) => setFormValues({ ...formValues, city: event.target.value })}
        />
        {renderErrors('city')}
      </div>
      <div className="property-filters__mobile-address">
        <div className="field property-filters__state">
          <label htmlFor={fieldIds.state}>State</label>
          <select
            id={fieldIds.state}
            value={formValues.state}
            {...fieldErrorProps('state')}
            onChange={(event) => setFormValues({ ...formValues, state: event.target.value })}
          >
            <option value="">Any</option>
            {Object.entries(US_STATES).map(([code, name]) => (
              <option key={code} value={code}>
                {code} {name}
              </option>
            ))}
          </select>
          {renderErrors('state')}
        </div>
        <div className="field property-filters__zip">
          <label htmlFor={fieldIds.zipCode}>Zip code</label>
          <input
            className="property-filters__zip-input"
            id={fieldIds.zipCode}
            type="text"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            placeholder="5 digits"
            value={formValues.zip}
            {...fieldErrorProps('zipCode')}
            onChange={(event) => setFormValues({ ...formValues, zip: event.target.value })}
          />
          {renderErrors('zipCode')}
        </div>
      </div>
      <div className="property-filters__actions">
        <button className="button button--secondary" type="submit">
          Apply filters
        </button>
        <button className="button button--quiet" type="button" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="field property-filters__sort">
        <label htmlFor="property-filter-sort">Sort by created</label>
        <select
          id="property-filter-sort"
          value={sort}
          onChange={(event) => onSortChange(event.target.value === 'oldest' ? 'oldest' : 'newest')}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>
    </form>
  );
}
