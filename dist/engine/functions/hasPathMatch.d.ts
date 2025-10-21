import type { RulesetFunction } from '@stoplight/spectral-core';
import { OpenAPIV3_0 } from '../openapi-types';
export interface Options {
    pattern: string;
}
export declare const hasPathMatch: RulesetFunction<OpenAPIV3_0.PathsObject, Options | undefined>;
export default hasPathMatch;
//# sourceMappingURL=hasPathMatch.d.ts.map