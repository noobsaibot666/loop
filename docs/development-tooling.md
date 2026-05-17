# Development Tooling

## Google TypeScript Style

This project uses Google TypeScript Style (`gts`) for linting and formatting.
GTS wraps ESLint and Prettier with a shared TypeScript style baseline.

Commands:

```bash
npm run lint   # Check formatting and lint rules
npm run fix    # Apply automatic formatting and safe lint fixes
npm run clean  # Remove generated build output handled by GTS
```

The project is an ES module package (`"type": "module"`), so the local GTS
configuration uses CommonJS `.cjs` files:

- `eslint.config.cjs`
- `eslint.ignores.cjs`
- `prettier.config.cjs`

GTS changed many files during setup because `npm run fix` reformatted the
existing codebase to the configured Prettier style. Those edits are intended to
be formatting-only unless a lint error identifies a real code issue.

During setup, linting also caught one real issue: `server/index.js` referenced
`buildFallbackLoopWaypoints` without importing it. The import was added from
`shared/loop-quality.js`.

Run the normal verification before deploying tooling or formatting changes:

```bash
npm run lint
npm run build
npm run verify:loop-routes
```
