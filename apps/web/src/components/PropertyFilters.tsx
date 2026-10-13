import { useEffect, useState, type FormEvent } from 'react';
import type { PropertyFilter } from '../graphql/generated/graphql.ts';
import type { PropertyFieldError } from '../graphql/errors.ts';
import { FieldErrorMessages, fieldErrorProps } from './FieldErrors.tsx';
import { StateOptions } from './StateOptions.tsx';

export type FilterValues = {
  city: string;
  state: string;
  zip: string;
};

type PropertyFiltersProps = {
  values: FilterValues;
  sort: 'newest' | 'oldest';
  errors: PropertyFieldError[];
  onApply: (values: FilterValues) => void;
  onClear: () => void;
  onSortChange: (sort: 'newest' | 'oldest') => void;
};

type FilterField = keyof PropertyFilter;

const fieldIds = {
  city: 'property-filter-city',
  state: 'property-filter-state',
  zipCode: 'property-filter-zip',
} satisfies Record<FilterField, string>;

export function PropertyFilters({
  values,
  sort,
  errors,
  onApply,
  onClear,
  onSortChange,
}: PropertyFiltersProps) {
  const [formValues, setFormValues] = useState(values);

  useEffect(() => {
    setFormValues(values);
  }, [values]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(formValues);
  };

  const errorsFor = (field: FilterField) => errors.filter((error) => error.field === field);

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
          {...fieldErrorProps(fieldIds.city, errorsFor('city'))}
          onChange={(event) => setFormValues({ ...formValues, city: event.target.value })}
        />
        <FieldErrorMessages
          controlId={fieldIds.city}
          errors={errorsFor('city')}
          className="property-filter-error"
        />
      </div>
      <div className="property-filters__mobile-address">
        <div className="field property-filters__state">
          <label htmlFor={fieldIds.state}>State</label>
          <select
            id={fieldIds.state}
            value={formValues.state}
            {...fieldErrorProps(fieldIds.state, errorsFor('state'))}
            onChange={(event) => setFormValues({ ...formValues, state: event.target.value })}
          >
            <StateOptions emptyLabel="Any" />
          </select>
          <FieldErrorMessages
            controlId={fieldIds.state}
            errors={errorsFor('state')}
            className="property-filter-error"
          />
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
            {...fieldErrorProps(fieldIds.zipCode, errorsFor('zipCode'))}
            onChange={(event) => setFormValues({ ...formValues, zip: event.target.value })}
          />
          <FieldErrorMessages
            controlId={fieldIds.zipCode}
            errors={errorsFor('zipCode')}
            className="property-filter-error"
          />
        </div>
      </div>
      <div className="property-filters__actions">
        <button className="button button--secondary" type="submit">
          Apply filters
        </button>
        <button
          className="button button--quiet"
          type="button"
          onClick={() => {
            setFormValues({ city: '', state: '', zip: '' });
            onClear();
          }}
        >
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
