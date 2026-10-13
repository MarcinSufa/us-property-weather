import { Link, Outlet, useLocation } from 'react-router';

export function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <header className="site-header">
        <nav className="site-header__inner" aria-label="Main navigation">
          <Link className="brand-link" to="/">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 11.5 12 4l9 7.5" />
              <path d="M5.5 10v10h13V10" />
              <path d="M10 20v-6h4v6" />
            </svg>
            <span>Properties</span>
          </Link>
          {pathname !== '/properties/new' && (
            <Link className="button button--primary" to="/properties/new">
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
              <span>Add property</span>
            </Link>
          )}
        </nav>
      </header>
      <Outlet />
    </>
  );
}
