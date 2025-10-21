export declare enum DocumentTypes {
    FEATURE = "Feature",
    FEATURECOLLECTION = "FeatureCollection"
}
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
export type Position2D = [number, number];
export type Position3D = [number, number, number];
export type Position = Position2D | Position3D;
export type Coordinates = Position | Coordinates[];
//# sourceMappingURL=geospatial.d.ts.map