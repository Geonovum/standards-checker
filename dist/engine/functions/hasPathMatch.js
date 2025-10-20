export const hasPathMatch = async (paths, options) => {
    if (!options) {
        return;
    }
    const { pattern } = options;
    const regex = new RegExp(pattern);
    const hasMatch = Object.keys(paths).some(pathKey => regex.test(pathKey));
    if (!hasMatch) {
        return [
            {
                message: `No paths matching pattern "${pattern}" were found.`,
            },
        ];
    }
};
export default hasPathMatch;
