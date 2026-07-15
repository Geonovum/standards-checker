import clsx from 'clsx';
import type { FC } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Standard, StandardVersion } from '../../standards';

interface Props {
  standard: Standard;
  version: StandardVersion;
  className?: string;
}

// Versions are stored ascending (old -> new); the dropdown shows them reversed
// (new -> old). Preserving `search` retains a `?url=`-loaded document across a
// version switch. Always rendered — even for a single-version standard — so the
// current version is always visible.
const VersionSelector: FC<Props> = ({ standard, version, className }) => {
  const navigate = useNavigate();
  const { search } = useLocation();

  return (
    <select
      value={version.id}
      onChange={event => navigate({ pathname: `/${standard.slug}/${event.target.value}`, search })}
      className={clsx('max-w-56 truncate', className)}
    >
      {standard.versions
        .slice()
        .reverse()
        .map(option => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
    </select>
  );
};

export default VersionSelector;
