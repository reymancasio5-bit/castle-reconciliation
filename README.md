# Castle Reconciliation

A public React workspace on GitHub Pages, backed by Google Sheets through Apps Script. Anyone with the website link can view, export, add, edit, import, and delete records. There is no visitor login, administrator role, or staff-management screen. Edits are attributed to Public visitor, not an identified person.

## Development

Use Node 24. Run npm ci, npm test, npm run typecheck, npm run build, npm run build:apps-script, and npm run test:build.

## Install the matching Apps Script backend

The old token-based Code.gs is incompatible with this website. Its GET response says "Use an authenticated POST read request." Replace it with the generated backend; adding Connection.html alone does not replace the old API.

1. Run npm run build:apps-script. Copy all three files from apps-script/dist into the existing Apps Script project: Code.gs, Connection.html, and appsscript.json. Enable manifest editing in Project Settings. The GitHub Actions build also provides these files as the castle-apps-script-install artifact.
2. Set SPREADSHEET_ID to the native Google workbook ID, DEFAULT_CURRENCY to CAD, and ALLOWED_ORIGIN to https://reymancasio5-bit.github.io. ADMIN_EMAIL and API_TOKEN are not used by this public integration. Do not put tokens in the frontend.
3. In the script editor, run setupWorkspace once as the deployment owner. It backs up the workbook, adds stable Payment IDs and support columns, creates metadata tabs, and preserves existing financial cells and formulas. The owner authorizes Google once so the script can access the workbook; website visitors do not authorize anything.
4. Deploy as a Web app, executing as Me, with access Anyone (including anonymous visitors). Use Manage deployments > Edit > New version to update an existing deployment. Saved editor code alone does not update a deployment. If Google requires a new deployment to change execution identity, copy its new /exec URL into public/config.json.
5. Open the website in a signed-out browser. It connects automatically. Verify a read, a reversible test edit, refresh, and export. The underlying Sheet does not need public sharing; the deployed script reads and writes it as its owner.

If connecting times out, verify that the /exec URL returns the Castle shared workspace page, not the old authenticated-POST JSON message; confirm ALLOWED_ORIGIN and that all three files were installed and deployed as a new version.

## Accounting behavior

Amounts with extra decimal places are accepted and rounded to the nearest cent (half-cents away from zero). Dollar prefixes, grouped thousands, and parenthesized negative amounts are supported. Original sheet amounts are preserved when unrelated fields are edited. Invalid amounts identify their source sheet, row, and column.

Revenue stays per payment row; aggregate Revenue remains undefined. Repeated reservation codes, different Revenue amounts, and negative adjustments are preserved. Castle receivables use each row's Split to Castle. Source transfers are references; actual receipts require bank amount and date.

Imports preview changes before saving. Ambiguous repeated payments or changed financial amounts require an explicit Payment ID. Saves enforce sheet revisions and a write lock. Deleted rows remain tombstones; new records append after them. App edits cannot overwrite formula cells. Public users can change rounding tolerance, but staff-role mutations are rejected.

## Deployment separation

GitHub Actions publishes the website and builds the Apps Script installation artifact. It does not deploy Apps Script. Both components must use this version for live operation. No accounting records or credentials belong in this repository.
