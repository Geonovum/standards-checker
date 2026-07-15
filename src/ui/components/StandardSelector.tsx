import clsx from 'clsx';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { findStandard, resolveDefaultVersion, type Standard } from '../../standards';

interface Props {
  standards: Standard[];
  standard: Standard;
  className?: string;
}

// Navigate straight to the standard's default version, with no search — that
// swaps to the new standard (resetting the editor) and drops any `?url=`.
const StandardSelector: FC<Props> = ({ standards, standard, className }) => {
  const navigate = useNavigate();

  return (
    <select
      value={standard.slug}
      onChange={event => {
        const next = findStandard(standards, event.target.value);
        if (next) navigate(`/${next.slug}/${resolveDefaultVersion(next).id}`);
      }}
      className={clsx('max-w-56 truncate', className)}
    >
      {standards.map(option => (
        <option key={option.slug} value={option.slug}>
          {option.name}
        </option>
      ))}
    </select>
  );
};

export default StandardSelector;
