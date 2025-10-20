import type { Diagnostic } from './types';

export const groupBy = <T>(arr: T[], key: (i: T) => string): Record<string, T[]> =>
  arr.reduce((groups, item) => {
    (groups[key(item)] ||= []).push(item);
    return groups;
  }, {} as Record<string, T[]>);

export const handleResponse = (response: Response, uri: string) => {
  if (response.status !== 200) {
    return Promise.reject(`Error while fetching URI \`${uri}\` (status code \`${response.status}\`).`);
  }

  return response.text();
};

export const handleResponseJson = (response: Response, uri: string) => {
  if (response.status !== 200) {
    return Promise.reject(`Error while fetching URI \`${uri}\` (status code \`${response.status}\`).`);
  }

  return response.json();
};

export const groupBySource = (diagnostics: Diagnostic[]) => groupBy(diagnostics, d => d.source ?? '');

export const formatDocument = (content: string): string => {
  try {
    const doc = JSON.parse(content);
    return JSON.stringify(doc, undefined, 2);
  } catch {
    throw new Error('JSON document could not be parsed.');
  }
};