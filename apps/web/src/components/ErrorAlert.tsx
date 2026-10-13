import { ErrorIcon } from './ErrorIcon.tsx';

type ErrorAlertProps = {
  title: string;
  body: string;
};

export function ErrorAlert({ title, body }: ErrorAlertProps) {
  return (
    <div className="alert" role="alert">
      <ErrorIcon />
      <div>
        <h2 className="alert__title">{title}</h2>
        <p className="alert__body">{body}</p>
      </div>
    </div>
  );
}
