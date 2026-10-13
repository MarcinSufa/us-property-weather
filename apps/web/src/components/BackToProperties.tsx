import { Link } from 'react-router';
import './BackToProperties.css';

export function BackToProperties() {
  return (
    <Link className="back-to-properties" to="/">
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
        <path d="m15 5-7 7 7 7" />
      </svg>
      <span>All properties</span>
    </Link>
  );
}
