export var GeometryTypes;
(function (GeometryTypes) {
    GeometryTypes["POINT"] = "Point";
    GeometryTypes["MULTIPOINT"] = "MultiPoint";
    GeometryTypes["LINESTRING"] = "LineString";
    GeometryTypes["MULTILINESTRING"] = "MultiLineString";
    GeometryTypes["POLYGON"] = "Polygon";
    GeometryTypes["MULTIPOLYGON"] = "MultiPolygon";
    GeometryTypes["GEOMETRYCOLLECTION"] = "GeometryCollection";
    GeometryTypes["POLYHEDRON"] = "Polyhedron";
    GeometryTypes["MULTIPOLYHEDRON"] = "MultiPolyhedron";
    GeometryTypes["PRISM"] = "Prism";
    GeometryTypes["MULTIPRISM"] = "MultiPrism";
    GeometryTypes["CIRCULARSTRING"] = "CircularString";
    GeometryTypes["COMPOUNDCURVE"] = "CompoundCurve";
    GeometryTypes["CURVEPOLYGON"] = "CurvePolygon";
    GeometryTypes["MULTICURVE"] = "MultiCurve";
    GeometryTypes["MULTISURFACE"] = "MultiSurface";
})(GeometryTypes || (GeometryTypes = {}));
export var DocumentTypes;
(function (DocumentTypes) {
    DocumentTypes["FEATURE"] = "Feature";
    DocumentTypes["FEATURECOLLECTION"] = "FeatureCollection";
})(DocumentTypes || (DocumentTypes = {}));
