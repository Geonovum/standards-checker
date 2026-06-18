import clsx from 'clsx';
import type { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Spec } from '../types';

interface Props {
  specs: Spec[];
  className?: string;
}

const SpecSelector: FC<Props> = ({ specs, className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <select value={location.pathname} onChange={event => navigate(event.target.value)} className={clsx('max-w-56 truncate', className)}>
      {specs.map(spec => (
        <option key={spec.slug} value={`/${spec.slug}`}>
          {spec.name}
        </option>
      ))}
    </select>
  );
};

export default SpecSelector;
