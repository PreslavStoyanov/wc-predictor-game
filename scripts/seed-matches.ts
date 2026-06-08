/**
 * Seed all 72 WC 2026 group stage matches.
 * Run: npx ts-node --skip-project scripts/seed-matches.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All times are UTC (ET + 4h for EDT)
const matches = [
  // ── GROUP A ──────────────────────────────────────────
  { home: "Mexico",       away: "South Africa", date: "2026-06-11T19:00:00Z", group: "Group A" },
  { home: "South Korea",  away: "Czechia",       date: "2026-06-12T02:00:00Z", group: "Group A" },
  { home: "Czechia",      away: "South Africa",  date: "2026-06-18T16:00:00Z", group: "Group A" },
  { home: "Mexico",       away: "South Korea",   date: "2026-06-19T01:00:00Z", group: "Group A" },
  { home: "Czechia",      away: "Mexico",        date: "2026-06-25T01:00:00Z", group: "Group A" },
  { home: "South Africa", away: "South Korea",   date: "2026-06-25T01:00:00Z", group: "Group A" },

  // ── GROUP B ──────────────────────────────────────────
  { home: "Canada",                  away: "Bosnia and Herzegovina", date: "2026-06-12T19:00:00Z", group: "Group B" },
  { home: "Qatar",                   away: "Switzerland",            date: "2026-06-13T19:00:00Z", group: "Group B" },
  { home: "Switzerland",             away: "Bosnia and Herzegovina", date: "2026-06-18T19:00:00Z", group: "Group B" },
  { home: "Canada",                  away: "Qatar",                  date: "2026-06-18T22:00:00Z", group: "Group B" },
  { home: "Switzerland",             away: "Canada",                 date: "2026-06-24T19:00:00Z", group: "Group B" },
  { home: "Bosnia and Herzegovina",  away: "Qatar",                  date: "2026-06-24T19:00:00Z", group: "Group B" },

  // ── GROUP C ──────────────────────────────────────────
  { home: "Brazil",   away: "Morocco",  date: "2026-06-13T22:00:00Z", group: "Group C" },
  { home: "Haiti",    away: "Scotland", date: "2026-06-14T01:00:00Z", group: "Group C" },
  { home: "Scotland", away: "Morocco",  date: "2026-06-19T22:00:00Z", group: "Group C" },
  { home: "Brazil",   away: "Haiti",    date: "2026-06-20T01:00:00Z", group: "Group C" },
  { home: "Scotland", away: "Brazil",   date: "2026-06-24T22:00:00Z", group: "Group C" },
  { home: "Morocco",  away: "Haiti",    date: "2026-06-24T22:00:00Z", group: "Group C" },

  // ── GROUP D ──────────────────────────────────────────
  { home: "USA",       away: "Paraguay",  date: "2026-06-13T01:00:00Z", group: "Group D" },
  { home: "Australia", away: "Türkiye",   date: "2026-06-13T04:00:00Z", group: "Group D" },
  { home: "USA",       away: "Australia", date: "2026-06-19T19:00:00Z", group: "Group D" },
  { home: "Türkiye",   away: "Paraguay",  date: "2026-06-20T04:00:00Z", group: "Group D" },
  { home: "Türkiye",   away: "USA",       date: "2026-06-26T02:00:00Z", group: "Group D" },
  { home: "Paraguay",  away: "Australia", date: "2026-06-26T02:00:00Z", group: "Group D" },

  // ── GROUP E ──────────────────────────────────────────
  { home: "Germany",     away: "Curaçao",     date: "2026-06-14T17:00:00Z", group: "Group E" },
  { home: "Ivory Coast", away: "Ecuador",     date: "2026-06-14T23:00:00Z", group: "Group E" },
  { home: "Germany",     away: "Ivory Coast", date: "2026-06-20T20:00:00Z", group: "Group E" },
  { home: "Ecuador",     away: "Curaçao",     date: "2026-06-21T00:00:00Z", group: "Group E" },
  { home: "Ecuador",     away: "Germany",     date: "2026-06-25T20:00:00Z", group: "Group E" },
  { home: "Curaçao",     away: "Ivory Coast", date: "2026-06-25T20:00:00Z", group: "Group E" },

  // ── GROUP F ──────────────────────────────────────────
  { home: "Netherlands", away: "Japan",       date: "2026-06-14T20:00:00Z", group: "Group F" },
  { home: "Sweden",      away: "Tunisia",     date: "2026-06-15T02:00:00Z", group: "Group F" },
  { home: "Netherlands", away: "Sweden",      date: "2026-06-20T17:00:00Z", group: "Group F" },
  { home: "Tunisia",     away: "Japan",       date: "2026-06-21T04:00:00Z", group: "Group F" },
  { home: "Japan",       away: "Sweden",      date: "2026-06-25T23:00:00Z", group: "Group F" },
  { home: "Tunisia",     away: "Netherlands", date: "2026-06-25T23:00:00Z", group: "Group F" },

  // ── GROUP G ──────────────────────────────────────────
  { home: "Belgium",     away: "Egypt",       date: "2026-06-15T19:00:00Z", group: "Group G" },
  { home: "Iran",        away: "New Zealand", date: "2026-06-16T01:00:00Z", group: "Group G" },
  { home: "Belgium",     away: "Iran",        date: "2026-06-21T19:00:00Z", group: "Group G" },
  { home: "New Zealand", away: "Egypt",       date: "2026-06-22T01:00:00Z", group: "Group G" },
  { home: "Egypt",       away: "Iran",        date: "2026-06-27T03:00:00Z", group: "Group G" },
  { home: "New Zealand", away: "Belgium",     date: "2026-06-27T03:00:00Z", group: "Group G" },

  // ── GROUP H ──────────────────────────────────────────
  { home: "Spain",       away: "Cape Verde",   date: "2026-06-15T16:00:00Z", group: "Group H" },
  { home: "Saudi Arabia",away: "Uruguay",      date: "2026-06-15T22:00:00Z", group: "Group H" },
  { home: "Spain",       away: "Saudi Arabia", date: "2026-06-21T16:00:00Z", group: "Group H" },
  { home: "Uruguay",     away: "Cape Verde",   date: "2026-06-21T22:00:00Z", group: "Group H" },
  { home: "Cape Verde",  away: "Saudi Arabia", date: "2026-06-27T00:00:00Z", group: "Group H" },
  { home: "Uruguay",     away: "Spain",        date: "2026-06-27T00:00:00Z", group: "Group H" },

  // ── GROUP I ──────────────────────────────────────────
  { home: "France",  away: "Senegal", date: "2026-06-16T19:00:00Z", group: "Group I" },
  { home: "Iraq",    away: "Norway",  date: "2026-06-16T22:00:00Z", group: "Group I" },
  { home: "France",  away: "Iraq",    date: "2026-06-22T21:00:00Z", group: "Group I" },
  { home: "Norway",  away: "Senegal", date: "2026-06-23T00:00:00Z", group: "Group I" },
  { home: "Norway",  away: "France",  date: "2026-06-26T19:00:00Z", group: "Group I" },
  { home: "Senegal", away: "Iraq",    date: "2026-06-26T19:00:00Z", group: "Group I" },

  // ── GROUP J ──────────────────────────────────────────
  { home: "Argentina", away: "Algeria", date: "2026-06-17T01:00:00Z", group: "Group J" },
  { home: "Austria",   away: "Jordan",  date: "2026-06-17T04:00:00Z", group: "Group J" },
  { home: "Argentina", away: "Austria", date: "2026-06-22T17:00:00Z", group: "Group J" },
  { home: "Jordan",    away: "Algeria", date: "2026-06-23T03:00:00Z", group: "Group J" },
  { home: "Algeria",   away: "Austria", date: "2026-06-28T02:00:00Z", group: "Group J" },
  { home: "Jordan",    away: "Argentina",date: "2026-06-28T02:00:00Z", group: "Group J" },

  // ── GROUP K ──────────────────────────────────────────
  { home: "Portugal",                   away: "DR Congo",    date: "2026-06-17T17:00:00Z", group: "Group K" },
  { home: "Uzbekistan",                 away: "Colombia",    date: "2026-06-18T02:00:00Z", group: "Group K" },
  { home: "Portugal",                   away: "Uzbekistan",  date: "2026-06-23T17:00:00Z", group: "Group K" },
  { home: "Colombia",                   away: "DR Congo",    date: "2026-06-24T02:00:00Z", group: "Group K" },
  { home: "Colombia",                   away: "Portugal",    date: "2026-06-27T23:30:00Z", group: "Group K" },
  { home: "DR Congo",                   away: "Uzbekistan",  date: "2026-06-27T23:30:00Z", group: "Group K" },

  // ── GROUP L ──────────────────────────────────────────
  { home: "England", away: "Croatia", date: "2026-06-17T20:00:00Z", group: "Group L" },
  { home: "Ghana",   away: "Panama",  date: "2026-06-17T23:00:00Z", group: "Group L" },
  { home: "England", away: "Ghana",   date: "2026-06-23T20:00:00Z", group: "Group L" },
  { home: "Panama",  away: "Croatia", date: "2026-06-23T23:00:00Z", group: "Group L" },
  { home: "Panama",  away: "England", date: "2026-06-27T21:00:00Z", group: "Group L" },
  { home: "Croatia", away: "Ghana",   date: "2026-06-27T21:00:00Z", group: "Group L" },
];

async function seed() {
  console.log(`Seeding ${matches.length} group stage matches...`);

  const rows = matches.map((m) => ({
    home_team: m.home,
    away_team: m.away,
    match_date: m.date,
    stage: "Group Stage",
    group_label: m.group,
  }));

  const { error } = await supabase.from("matches").insert(rows);

  if (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Done! 72 group stage matches inserted.");
}

seed();
