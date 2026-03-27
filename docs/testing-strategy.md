# Testing Strategy

The workspace combines fast validation with browser-level verification for interaction-heavy behavior.

## Automated Coverage

| Layer              | Scope                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| Utility tests      | time formatting, chapter normalization, chapter segmentation, and HLS quality mapping                |
| Demo smoke test    | validates that the demo shell renders and wires the package into the app surface                     |
| Playwright e2e     | verifies rendered controls, layered settings, keyboard shortcuts, touch seeking, and browser console |
| Linting            | catches API misuse, TypeScript issues, and hook rule regressions                                     |
| Type checking      | validates strict TypeScript contracts across the workspace                                           |
| Build verification | ensures the package and demo both produce production output                                          |

## Browser Verification

Browser checks verify:

- visual alignment of controls and tooltip
- timeline hover feedback and touch seeking behavior
- settings menu layout and selection state
- keyboard seek and volume shortcuts
- runtime console cleanliness during interaction

## Validation Command

```bash
pnpm validate
```

This runs:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Browser e2e runs separately:

```bash
pnpm test:e2e
```
