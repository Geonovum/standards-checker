import { Navigate, useLocation } from 'react-router-dom';
import { buildLegacyIndex, findStandard, resolveDefaultVersion, type Standard } from '../standards';

// The canonical URL anchor is `/#/{standardSlug}/{versionId}`. These redirects
// always land there. Preserving `search` is what lets a legacy link like
// `/#/adr-20?url=x` carry `x` onto the resolved version.

export const RootRedirect = ({ standards }: { standards: Standard[] }) => {
  const { search } = useLocation();
  const standard = standards[0];
  return <Navigate to={{ pathname: `/${standard.slug}/${resolveDefaultVersion(standard).id}`, search }} replace />;
};

// Redirect legacy slugs to the new `{standard}/{version}` anchor:
//  - a known standard slug carrying an extra (unknown) version segment lands on
//    that standard's default version,
//  - a legacy slug (old `--ruleset` / old route, e.g. `adr-20`, or `adr` = Werkversie)
//    lands on its exact historical version,
//  - a bare standard slug lands on that standard's default version,
//  - anything else falls back to the first standard's default version.
export const LegacyRedirect = ({ standards }: { standards: Standard[] }) => {
  const { pathname, search } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const segment = segments[0] ?? '';
  const known = findStandard(standards, segment);

  // A stale/mistyped `/{standard}/{version}` on a real standard lands on its
  // default version rather than being reinterpreted through the legacy index —
  // without this, a standard whose slug is also a version's legacySlug (e.g.
  // `adr`) would route `/adr/9.9` to that legacy draft instead of the default.
  const legacy = known && segments.length > 1 ? undefined : buildLegacyIndex(standards).get(segment);

  let pathnameTo: string;
  if (legacy) {
    pathnameTo = `/${legacy.standard.slug}/${legacy.version.id}`;
  } else {
    const standard = known ?? standards[0];
    pathnameTo = `/${standard.slug}/${resolveDefaultVersion(standard).id}`;
  }

  return <Navigate to={{ pathname: pathnameTo, search }} replace />;
};
