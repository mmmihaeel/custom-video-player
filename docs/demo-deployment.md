# Demo Deployment Notes

The demo application is deployed to GitHub Pages from `apps/demo` as the public package showcase.

## Deployment Requirements

| Requirement          | Notes                                                    |
| -------------------- | -------------------------------------------------------- |
| GitHub Pages enabled | Repository Pages source should use GitHub Actions        |
| Workflow permissions | The deploy workflow needs Pages and id-token permissions |
| Main branch access   | Deployment runs from pushes to `main`                    |

## Workflow Summary

| Step     | Action                                                             |
| -------- | ------------------------------------------------------------------ |
| Install  | Restore repository dependencies with a frozen lockfile             |
| Validate | Run formatting, linting, type checks, tests, and production builds |
| Browser  | Run the Playwright smoke suite before publishing                   |
| Upload   | Publish `apps/demo/dist` as the Pages artifact                     |
| Deploy   | Use the official GitHub Pages actions to release the artifact      |

## Local Verification

```bash
pnpm install
pnpm validate
pnpm test:e2e
pnpm preview
```
