import { US_STATES } from '../us-states.ts';

type StateOptionsProps = {
  emptyLabel: string;
};

export function StateOptions({ emptyLabel }: StateOptionsProps) {
  return (
    <>
      <option value="">{emptyLabel}</option>
      {Object.entries(US_STATES).map(([code, name]) => (
        <option key={code} value={code}>
          {code} {name}
        </option>
      ))}
    </>
  );
}
