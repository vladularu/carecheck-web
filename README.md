# CareCheck TVoeD

CareCheck TVoeD is a local-first React app for planning shifts, checking working-time rules, and preparing monthly reports for TVoeD-P-oriented care work.

The app focuses on practical month-by-month workflows:

- capture and review shifts
- compare target and actual hours
- calculate shift premiums and salary-relevant totals
- check working-time compliance
- compare team fairness for night, weekend, and holiday duties
- speed up planning with recurring sequences, monthly templates, day copy/move, and import
- export monthly reports as CSV/XLSX
- print or save a monthly report as PDF through the browser
- back up and restore local profile, shifts, and templates

## Current Release

Latest tagged release: `v1.7.0`

Release focus:

- comfort planning directly in the shift planner
- recurring shift sequences based on existing shift templates
- local monthly templates that can be applied to other months
- day-level copy and move workflow
- optional CSV import for existing schedules
- conflict preview for occupied days, duplicates, and time overlaps
- shift-list search and type filtering
- iPhone-first planning tools while preserving the classic desktop overview
- statistics, tariff, and compliance calculation logic unchanged

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Vitest
- ESLint
- XLSX export via `xlsx`

## Getting Started

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm.cmd run dev
```

Create a production build:

```powershell
npm.cmd run build
```

Preview the production build locally:

```powershell
npm.cmd run preview
```

On Windows/PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

## Quality Checks

Run lint:

```powershell
npm.cmd run lint
```

Run tests once:

```powershell
npm.cmd run test:run
```

Run the full local release check:

```powershell
npm.cmd run lint
npm.cmd run test:run
npm.cmd run build
```

## App Routes

- `/` - Dashboard
- `/plan` - shift planner
- `/gehalt` - salary and tariff overview
- `/pruefung` - compliance checks
- `/kalender` - calendar and day details
- `/bericht` - monthly report and print view
- `/jahr` - yearly analysis and CSV export
- `/fairness` - team fairness and duty distribution review
- `/profil` - profile, templates, and backup

## Project Structure

```text
src/
  components/     Shared UI, navigation, dashboard, calendar, profile parts
  context/        App-wide state and persistence wiring
  data/           Demo data and default shift templates
  pages/          Route-level views
  services/       Calculation, compliance, export, storage, tariff, holiday logic
  styles/         Responsive foundation
  types/          Shared domain types
docs/
  CHANGELOG.md
  CARECHECK_DESIGN_GUIDE.md
  ROADMAP.md
  TODO.md
  V1.7.0_PLANNING_COMFORT_AUDIT.md
  V1.6.0_FAIRNESS_AUDIT.md
  V1.5.0_RULE_TRANSPARENCY_AUDIT.md
  V1.4.0_YEARLY_ANALYSIS_AUDIT.md
  V1.3.0_TVOED_P_MODULE_AUDIT.md
  V1.2.9_REPORTING_EXPORT_AUDIT.md
```

## Development Rules

- Keep statistics, tariff, export, and compliance logic covered by tests.
- Preserve the classic desktop layout while improving mobile behavior.
- Prioritize iPhone-sized viewports for responsive QA.
- Do not overwrite unrelated local changes.
- After implementation changes, run lint, tests, and build before committing.

## Release Workflow

Typical flow:

1. Create or update a feature branch.
2. Run:

```powershell
npm.cmd run lint
npm.cmd run test:run
npm.cmd run build
```

3. Push the branch.
4. Open a pull request into `main`.
5. Merge after checks pass.
6. Tag the release, for example:

```powershell
git tag -a v1.7.0 -m "Release v1.7.0 Planung und Komfort"
git push origin v1.7.0
```

7. Create a GitHub Release from the tag.

For the current release, use:

```powershell
git tag -a v1.7.0 -m "Release v1.7.0 Planung und Komfort"
git push origin v1.7.0
```

## Deployment

No deployment target is currently configured in the repository.

Checked after `v1.2.8`:

- GitHub Pages: not configured
- GitHub Deployments: none found

Possible next targets are GitHub Pages, Vercel, Netlify, or a custom static host.
