export var GeometryTypes;
(function (GeometryTypes) {
    GeometryTypes["POINT"] = "Point";
    GeometryTypes["MULTIPOINT"] = "MultiPoint";
    GeometryTypes["LINESTRING"] = "LineString";
    GeometryTypes["MULTILINESTRING"] = "MultiLineString";
    GeometryTypes["POLYGON"] = "Polygon";
    GeometryTypes["MULTIPOLYGON"] = "MultiPolygon";
    GeometryTypes["POLYHEDRON"] = "Polyhedron";
    GeometryTypes["MULTIPOLYHEDRON"] = "MultiPolyhedron";
    GeometryTypes["PRISM"] = "Prism";
    GeometryTypes["MULTIPRISM"] = "MultiPrism";
    GeometryTypes["GEOMETRYCOLLECTION"] = "GeometryCollection";
})(GeometryTypes || (GeometryTypes = {}));
export var DocumentTypes;
(function (DocumentTypes) {
    DocumentTypes["FEATURE"] = "Feature";
    DocumentTypes["FEATURECOLLECTION"] = "FeatureCollection";
})(DocumentTypes || (DocumentTypes = {}));
