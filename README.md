# Castle Reconciliation

A static React app for GitHub Pages, using a private Google Sheet through Google Apps Script. No Cloudflare backend is required.

## Development

Use Node 24. Run `npm ci`, `npm test`, `npm run typecheck`, and `npm run build`. Use `npm run dev` for local development.

## Google backend setup

1. Create an Apps Script project. Run `npm run build:apps-script`, then copy `Code.gs`, `Connection.html`, and `appsscript.json` from `apps-script/dist` into the project. Enable manifest editing in Project Settings.
2. Set script properties: `SPREADSHEET_ID` (your native Google Sheet), `ADMIN_EMAIL` (the owner account), `DEFAULT_CURRENCY` (`CAD`), and `ALLOWED_ORIGIN` (`https://reymancasio5-bit.github.io`).
3. The workbook needs the Reservation Payouts and Bundle Register tabs. Run `setupWorkspace_` once as the administrator. It creates a Drive backup, appends stable Payment IDs and support columns, creates metadata tabs, and protects settings. Existing financial cells and formulas are preserved.
4. Deploy as a Web app, executing as the user accessing the app, available to signed-in Google users. Users need Google authorization, workbook access, and a workspace role. Manage staff roles through Settings and share the sheet separately.
5. Set `appsScriptUrl` in `public/config.json` to the deployment `/exec` URL and commit. Under GitHub Settings > Pages select GitHub Actions.
6. Open the website, select Authorize Google, then Connect. Verify a read, a reversible test edit, refresh, and export before live accounting use.

## Accounting behavior

Revenue is shown and exported per payment row. Aggregate Revenue remains undefined until a total rule is agreed. Repeated reservation codes, different Revenue amounts, and negative adjustments are preserved. Castle receivables use each row's Split to Castle. Source transfers are references; actual receipts require bank amount and date.

Imports preview changes before saving. Ambiguous repeated payments or changed financial amounts require an explicit Payment ID. Mutations enforce Google identity, workspace role, and sheet revision. Deleted rows remain as tombstones; new records append after them. App edits cannot overwrite formula cells.

## Deployment status

Live operation requires the owner's Apps Script authorization, deployment URL, and an end-to-end Google connection test. An empty `appsScriptUrl` intentionally displays setup guidance. This repository contains no original workbooks, accounting records, or credentials. Tests use synthetic fixtures.
