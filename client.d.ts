declare module '*.css' {}

// Vite's `?raw` suffix imports a file's content as a string (used for example
// fixtures); `build-cli` implements the same behavior for CLI bundles.
declare module '*?raw' {
  const content: string;
  export default content;
}
