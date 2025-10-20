import type { ValidateOptions, ValidateUrlOptions, ValidationResult } from './types';
/**
 * Validate JSON content against rulesets
 */
export declare function validate(options: ValidateOptions): Promise<ValidationResult>;
/**
 * Fetch and validate JSON from a URL
 */
export declare function validateUrl(options: ValidateUrlOptions): Promise<ValidationResult>;
/**
 * Format JSON content
 */
export declare function formatJson(content: string): string;
//# sourceMappingURL=validator.d.ts.map