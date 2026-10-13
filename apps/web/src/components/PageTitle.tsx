import { useEffect } from 'react';

type PageTitleProps = {
  page: string;
};

export function PageTitle({ page }: PageTitleProps) {
  useEffect(() => {
    document.title = `${page} - CoverTree`;
  }, [page]);

  return null;
}
