import type { PropertyFieldError } from '../graphql/errors.ts';
import { ErrorIcon } from './ErrorIcon.tsx';

type FieldErrorMessageProps = {
  controlId: string;
  errors: PropertyFieldError[];
  className?: string;
  iconSize?: number;
  element?: 'p' | 'span';
};

export function fieldErrorProps(controlId: string, errors: PropertyFieldError[], hintId?: string) {
  const describedBy = [
    ...(hintId ? [hintId] : []),
    ...errors.map((_, index) => `${controlId}-error-${index}`),
  ];

  return {
    'aria-invalid': errors.length > 0 ? true : undefined,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
  };
}

export function FieldErrorMessages({
  controlId,
  errors,
  className = '',
  iconSize = 16,
  element = 'span',
}: FieldErrorMessageProps) {
  const Message = element;

  return errors.map((error, index) => (
    <Message
      className={`field__error ${className}`.trim()}
      id={`${controlId}-error-${index}`}
      key={`${controlId}-${index}-${error.message}`}
    >
      <ErrorIcon size={iconSize} />
      {element === 'p' ? <span>{error.message}</span> : error.message}
    </Message>
  ));
}
