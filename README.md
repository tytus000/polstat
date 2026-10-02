# Polstat

A Polish-language proof of concept focused on **central state budget spending**. It shows how much the budget spent, what functions it funded, the economic type of expenditure, and how spending changed over time. The public interface does not display revenue, deficit, debt, interest rates, or chat.

The live URL is [polstat.vercel.app](https://polstat.vercel.app). Check the deployment before assuming it contains the latest local version.

## Run locally

Requires Node 24 and Python 3.12+.

~~~sh
npm ci
python -m pip install openpyxl==3.1.5
python scripts/refresh_data.py
npm test
npm run dev
~~~

The checked-in snapshot allows a build without fetching source files.

## Data

The importer in scripts/refresh_data.py reads the latest [Ministry of Finance operational monthly report](https://www.gov.pl/web/finanse/sprawozdania-operatywne-miesieczne) for every year from 2018 onward. It extracts:

- cumulative and monthly central-budget spending from tables 1 and 6;
- seven economic spending categories from table 6;
- spending by official budget function (*dział*) and original/amended plans from table 7, for the latest reported period of each year.

The importer reconciles independent totals, checks month continuity, and determines the varying scale of historical functional sheets by matching their total to table 1. The 2019 source contains an approximately 1.15 million PLN difference between its total and category/function sums. The snapshot retains that difference explicitly.

The snapshot is src/data/snapshot.json. Public CSV exports are in public/data/:

- wydatki-miesiecznie.csv: calculated single-month spending;
- wydatki-narastajaco.csv: published cumulative spending and economic categories;
- wydatki-dzialy.csv: functional spending, one row per function and year-end/latest period.

All records carry a period, unit, source attachment URL, and reported-actual status. A date embedded in the attachment filename is stored as `sourceFileDate`. It is not treated as the publication date; `publishedAt` remains null because the Ministry's page does not identify an unambiguous publication date for each attachment. No preliminary estimates enter the series. The functional categories describe **another classification of the same central-budget total**; they are not added to the economic categories. A central-budget transfer to another entity counts here, but that entity's subsequent spending does not.

## Updates and deployment

The GitHub workflow checks official sources daily, validates the import, runs tests and build, then commits a changed snapshot to main. Failed validation leaves the previous snapshot untouched. Vercel can deploy main automatically once its GitHub integration is connected to tytus000/polstat.

The site is a Vite static build (build command: npm run build, output: dist). The /metodologia path rewrites to the app entry point. No runtime service credentials are needed for this spending-only PoC.
