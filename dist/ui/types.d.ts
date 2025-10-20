import type { Extension } from '@uiw/react-codemirror';
import type { Diagnostic as CodemirrorDiagnostic } from '@codemirror/lint';
import type { RulesetDefinition } from '@stoplight/spectral-core';
export interface Spec {
    name: string;
    slug: string;
    example: string;
    linters: SpecLinter[];
    responseMapper?: SpecResponseMapper;
}
export interface SpecInput {
    content: string;
    linters?: SpecLinter[];
}
export type SpecLinter = {
    name: string;
    linter: Extension;
};
export type SpecResponseMapper = (responseText: string) => Promise<SpecInput>;
export type Severity = 'hint' | 'info' | 'warning' | 'error';
export type Diagnostic = CodemirrorDiagnostic & {
    documentationUrl?: string;
};
export type { RulesetDefinition };
export declare enum GeometryTypes {
    POINT = "Point",
    MULTIPOINT = "MultiPoint",
    LINESTRING = "LineString",
    MULTILINESTRING = "MultiLineString",
    POLYGON = "Polygon",
    MULTIPOLYGON = "MultiPolygon",
    POLYHEDRON = "Polyhedron",
    MULTIPOLYHEDRON = "MultiPolyhedron",
    PRISM = "Prism",
    MULTIPRISM = "MultiPrism",
    GEOMETRYCOLLECTION = "GeometryCollection"
}
export declare enum DocumentTypes {
    FEATURE = "Feature",
    FEATURECOLLECTION = "FeatureCollection"
}
//# sourceMappingURL=types.d.ts.map