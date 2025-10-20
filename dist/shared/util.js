export const groupBy = (arr, key) => arr.reduce((groups, item) => {
    var _a;
    (groups[_a = key(item)] || (groups[_a] = [])).push(item);
    return groups;
}, {});
export const groupBySource = (diagnostics) => groupBy(diagnostics, diagnostic => diagnostic.source ?? '');
export const handleResponse = (response, uri) => {
    if (response.status !== 200) {
        return Promise.reject(`Error while fetching URI \`${uri}\` (status code \`${response.status}\`).`);
    }
    return response.text();
};
export const handleResponseJson = (response, uri) => {
    if (response.status !== 200) {
        return Promise.reject(`Error while fetching URI \`${uri}\` (status code \`${response.status}\`).`);
    }
    return response.json();
};
export const formatDocument = (content) => {
    try {
        const doc = JSON.parse(content);
        return JSON.stringify(doc, undefined, 2);
    }
    catch {
        throw new Error('JSON document could not be parsed.');
    }
};
