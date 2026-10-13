import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation } from 'urql';
import type { CreatePropertyInput } from '../graphql/generated/graphql.ts';
import {
  getFieldErrors,
  getFirstGraphqlErrorCode,
  type PropertyFieldError,
} from '../graphql/errors.ts';
import { CreatePropertyDocument } from '../graphql/operations.ts';
import { ErrorAlert } from './ErrorAlert.tsx';
import { ErrorIcon } from './ErrorIcon.tsx';
import { StateOptions } from './StateOptions.tsx';

type CreateField = 'street' | 'city' | 'state' | 'zipCode';
type PropertyFormValues = Omit<CreatePropertyInput, 'state'> & { state: string };
type CreateAlert = { title: string; body: string };

const initialValues: PropertyFormValues = { street: '', city: '', state: '', zipCode: '' };
const fieldIds: Record<CreateField, string> = {
  street: 'new-property-street',
  city: 'new-property-city',
  state: 'new-property-state',
  zipCode: 'new-property-zip',
};
const fieldOrder: CreateField[] = ['street', 'city', 'state', 'zipCode'];
const defaultError: CreateAlert = { title: 'Something went wrong', body: 'Nothing was saved.' };
const createErrorMessages: Partial<Record<string, CreateAlert>> = {
  LOCATION_NOT_FOUND: {
    title: 'The weather service does not know this location',
    body: 'Check the zip code and try again. Nothing was saved.',
  },
  WEATHER_UNAVAILABLE: {
    title: 'The weather service is not answering',
    body: 'Nothing was saved. Try again in a moment.',
  },
};

function isCreateField(field: string): field is CreateField {
  return field === 'street' || field === 'city' || field === 'state' || field === 'zipCode';
}

function toUsableFieldErrors(errors: PropertyFieldError[]) {
  return errors.filter((error): error is PropertyFieldError & { field: CreateField } =>
    isCreateField(error.field),
  );
}

function errorMessageFor(code: string | undefined): CreateAlert {
  return (code && createErrorMessages[code]) || defaultError;
}

export function PropertyForm() {
  const navigate = useNavigate();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<(PropertyFieldError & { field: CreateField })[]>(
    [],
  );
  const [alert, setAlert] = useState<CreateAlert>();
  const fieldRefs = useRef<Record<CreateField, HTMLInputElement | HTMLSelectElement | null>>({
    street: null,
    city: null,
    state: null,
    zipCode: null,
  });
  const pending = useRef(false);
  const [{ fetching }, createProperty] = useMutation(CreatePropertyDocument);

  useEffect(() => {
    const firstInvalidField = fieldOrder.find((field) =>
      fieldErrors.some((error) => error.field === field),
    );
    if (firstInvalidField) fieldRefs.current[firstInvalidField]?.focus();
  }, [fieldErrors]);

  const errorsFor = (field: CreateField) => fieldErrors.filter((error) => error.field === field);
  const errorProps = (field: CreateField) => {
    const errors = errorsFor(field);
    const describedBy = [
      ...(field === 'zipCode' ? [`${fieldIds.zipCode}-hint`] : []),
      ...errors.map((_, index) => `${fieldIds[field]}-error-${index}`),
    ];
    return {
      'aria-invalid': errors.length > 0 ? true : undefined,
      'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
    };
  };
  const renderFieldErrors = (field: CreateField) =>
    errorsFor(field).map((error, index) => (
      <p
        className="field__error new-property__error"
        id={`${fieldIds[field]}-error-${index}`}
        key={`${field}-${index}`}
      >
        <ErrorIcon size={14} />
        <span>{error.message}</span>
      </p>
    ));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    void submit();
  };

  const submit = async () => {
    pending.current = true;
    setFieldErrors([]);
    setAlert(undefined);

    try {
      const result = await createProperty({
        input: { ...values, state: values.state as CreatePropertyInput['state'] },
      });
      if (result.data?.createProperty) {
        void navigate(`/properties/${result.data.createProperty.id}`);
        return;
      }
      if (result.error) {
        const code = getFirstGraphqlErrorCode(result.error);
        const usableErrors =
          code === 'BAD_USER_INPUT' ? toUsableFieldErrors(getFieldErrors(result.error)) : [];
        if (usableErrors.length > 0) setFieldErrors(usableErrors);
        else setAlert(errorMessageFor(code));
      } else {
        setAlert(defaultError);
      }
    } catch {
      setAlert(defaultError);
    } finally {
      pending.current = false;
    }
  };

  return (
    <>
      {alert && <ErrorAlert title={alert.title} body={alert.body} />}
      <form
        className="card property-form"
        aria-label="Add property"
        aria-live="polite"
        aria-busy={fetching}
        onSubmit={onSubmit}
      >
        <div className="field">
          <label htmlFor={fieldIds.street}>Street</label>
          <input
            ref={(element) => {
              fieldRefs.current.street = element;
            }}
            id={fieldIds.street}
            type="text"
            required
            maxLength={200}
            autoComplete="address-line1"
            placeholder="15 Saguaro Blvd"
            value={values.street}
            readOnly={fetching}
            {...errorProps('street')}
            onChange={(event) => setValues({ ...values, street: event.target.value })}
          />
          {renderFieldErrors('street')}
        </div>
        <div className="field">
          <label htmlFor={fieldIds.city}>City</label>
          <input
            ref={(element) => {
              fieldRefs.current.city = element;
            }}
            id={fieldIds.city}
            type="text"
            required
            maxLength={100}
            autoComplete="address-level2"
            placeholder="Fountain Hills"
            value={values.city}
            readOnly={fetching}
            {...errorProps('city')}
            onChange={(event) => setValues({ ...values, city: event.target.value })}
          />
          {renderFieldErrors('city')}
        </div>
        <div className="new-property__address-fields">
          <div className="field">
            <label htmlFor={fieldIds.state}>State</label>
            <select
              ref={(element) => {
                fieldRefs.current.state = element;
              }}
              id={fieldIds.state}
              required
              autoComplete="address-level1"
              value={values.state}
              disabled={fetching}
              {...errorProps('state')}
              onChange={(event) => setValues({ ...values, state: event.target.value })}
            >
              <StateOptions emptyLabel="Select a state" />
            </select>
            {renderFieldErrors('state')}
          </div>
          <div className="field">
            <label htmlFor={fieldIds.zipCode}>Zip code</label>
            <input
              ref={(element) => {
                fieldRefs.current.zipCode = element;
              }}
              className="new-property__zip-input"
              id={fieldIds.zipCode}
              type="text"
              required
              inputMode="numeric"
              pattern="\d{5}"
              maxLength={5}
              autoComplete="postal-code"
              placeholder="85268"
              value={values.zipCode}
              readOnly={fetching}
              {...errorProps('zipCode')}
              onChange={(event) => setValues({ ...values, zipCode: event.target.value })}
            />
            <p className="field__hint" id={`${fieldIds.zipCode}-hint`}>
              5 digits. The weather lookup uses it.
            </p>
            {renderFieldErrors('zipCode')}
          </div>
        </div>
        <div className="new-property__actions">
          <button className="button button--primary" type="submit" disabled={fetching}>
            {fetching ? 'Saving…' : 'Add property'}
          </button>
          {fetching && (
            <span className="text-muted" role="status">
              Looking up the weather…
            </span>
          )}
          <Link className="button button--quiet" to="/">
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
