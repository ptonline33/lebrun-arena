import { writeFileSync } from "node:fs";
import { fetchLebrunMatches } from "../lib/youtube.ts";

const t0 = Date.now();
console.log("Starting Lebrun scrape…");
const matches = await fetchLebrunMatches();
writeFileSync("data/matches.json", JSON.stringify(matches, null, 2) + "\n");
console.log(
  `Done: ${matches.length} matches => data/matches.json (${Math.round((Date.now() - t0) / 1000)}s)`,
);
const byKind = matches.reduce((a, m) => ((a[m.kind] = (a[m.kind] || 0) + 1), a), {});
console.log("byKind:", byKind);