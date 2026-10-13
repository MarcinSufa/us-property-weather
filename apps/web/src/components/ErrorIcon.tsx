type ErrorIconProps = {
  size?: number;
};

export function ErrorIcon({ size = 22 }: ErrorIconProps) {
  return (
    <svg
      aria-hidden="true"
      className="alert__icon"
      width={size}
      height={size}
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
  );
}
