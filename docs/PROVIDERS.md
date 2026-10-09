# Data access, licensing and ongoing operation

Reviewed on **2026-10-09**. Documentation was checked against the primary sources below. This is an access/readiness record, not a claim of a commercial redistribution license or a live integration. No provider credentials were supplied or read, and no provider is preconnected to the export. Source links can be opened by the reader; there are no third-party widgets or trackers embedded in the page.

| Source | What was verified | Delivered integration and limitations |
| --- | --- | --- |
| [Binance market data documentation](https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints) | Official market-data endpoint documentation is reachable. | Documentation link only. No exchange scan, listings verification, rate-limit allocation or regional entitlement was tested. An external adapter must verify market-data terms and use a source available in its region. |
| [DEX Screener API reference](https://docs.dexscreener.com/api/reference) | Public endpoint shapes and rate-limit documentation are available. | No live API response is used. [API terms](https://docs.dexscreener.com/api/api-terms-and-conditions) include competition and redistribution restrictions. This terminal must not assume that publicly accessible data may be redistributed in a competing product; obtain applicable permission before integration. |
| [GMGN documented chart integration](https://docs.gmgn.ai/index/cooperation-api-integrate-gmgn-price-chart) | Official documentation describes a chart embed. | A chart embed is not proof of bulk wallet/research API access. No embed, scraper, undocumented endpoint or authorized wallet-data feed is installed. Seek documented authorized access for the intended server-side use. |
| FOMO | The brief does not identify which FOMO product or API. | Unsupported. No product, endpoint or authorization is invented. Public-wallet import works locally without it. |
| [SEC EDGAR APIs](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) | Official filings API documentation is available. | No individual filing or financial statement is ingested. The external adapter must follow the SEC's fair-access/User-Agent requirements and record the actual filing URL and date. Filings are not a stock quote feed. |
| [FRED DFII10](https://fred.stlouisfed.org/series/DFII10) and [FRED API terms](https://fred.stlouisfed.org/docs/api/terms_of_use.html) | The 10-year real-yield series and API terms are reachable. | No current macro value is claimed. Automated API access requires separate configuration; individual series may carry rights held by another owner. Review series-specific terms. |
| [Federal Reserve FOMC calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) | The site links the official policy calendar. | No event calendar is fetched or scheduled. Event times and actual policy/news interpretation are not synthesized. |
| [Nasdaq trading schedule](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule) | Official regular-session hours are 09:30–16:00 Eastern; extended sessions are separate. | Static session context only. The terminal does not determine today’s holiday status or ingest a session calendar. |
| US equity and XAU/USD quote vendors | No specific licensed vendor is prescribed by the brief. | Not connected. Choose a provider with the required session coverage, quote delays and display/redistribution rights. Never label a delayed entitlement as live. GC futures and GLD ETF are distinct proxies, not XAU/USD spot. |
| On-chain RPC/indexer | No endpoint or indexing contract is configured. | No historical wallet performance, token safety scan or real relationship discovery is performed. The UI labels all imported-wallet metrics unknown. |
| AI model provider | None configured. | No external model requests. Example explanations are editorial copy; production AI may summarize attached primary evidence and must preserve unknowns. |

Access to documentation was confirmed; API credentials, commercial entitlements, live response compatibility and vendor billing were not tested. Configuration alone does not grant licensing rights. The production operator must verify permission for its particular public display, region, caching and redistribution use before publishing a real snapshot.

## Ongoing costs

The default static demo makes no paid provider/model requests. Costs start with whichever external services the operator chooses:

- Static hosting, IPFS pinning, gateway bandwidth and domain/DNS renewal.
- Backend compute or serverless invocations; scheduled scans increase request and compute volume even with no visitors.
- Persistent storage, durable signal journals, backups and observability.
- Market data subscriptions and public display/redistribution entitlements, especially real-time US equities and gold.
- Chain RPC/archive access, DEX indexing, transaction history and token-risk/relationship analysis.
- Optional AI inference, priced by the selected provider and usage.
- Email/SMS/push delivery, retry traffic and any subscriber management service.

No subscription is bought, account is registered or recurring spend is authorized by this frontend. Dollar estimates would require the selected vendors, scan universe, frequency, retention, recipients and licensing terms; none are guessed here. The application can remain a local demo without those services.
