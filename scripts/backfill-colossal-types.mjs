// One-off backfill: fixes existing Colossal opportunities that were
// mis-classified as OPEN_CALL because of a keyword-priority bug in
// lib/scrapers/sources/colossal.ts (now fixed there for future scrapes).
//
// Re-runs the corrected classification against the stored title +
// description for every Colossal-sourced opportunity currently marked
// OPEN_CALL, and updates only the ones that should actually be
// GRANT / AWARD / JOB / FUNDING / RESIDENCY instead. Does not touch any
// other source (e.g. ACA, which is correctly all RESIDENCY by design).
//
// Usage (from the project root, on a machine with real internet access —
// this won't work from a sandboxed environment without DB connectivity):
//
//   node --env-file=.env.local scripts/backfill-colossal-types.mjs
//
// (use --env-file=.env instead if you don't have a .env.local)

import pg from 'pg'

const TYPE_MAP = [
  ['fellowship', 'GRANT'],
  ['grant', 'GRANT'],
  ['funding', 'FUNDING'],
  ['award', 'AWARD'],
  ['prize', 'AWARD'],
  ['job', 'JOB'],
  ['residenc', 'RESIDENCY'],
  // 'open call' is intentionally not in this list — it's the fallback
  // default below, same as the corrected logic in colossal.ts.
]

function detectType(text) {
  const lower = text.toLowerCase()
  for (const [key, value] of TYPE_MAP) {
    if (lower.includes(key)) return value
  }
  return 'OPEN_CALL'
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/backfill-colossal-types.mjs')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  try {
    const { rows } = await client.query(
      `SELECT id, title, description FROM "Opportunity" WHERE "sourceName" = 'Colossal' AND type = 'OPEN_CALL'`
    )

    console.log(`Found ${rows.length} Colossal opportunities currently marked OPEN_CALL.\n`)

    const changes = { GRANT: 0, AWARD: 0, JOB: 0, FUNDING: 0, RESIDENCY: 0, OPEN_CALL: 0 }

    for (const row of rows) {
      const newType = detectType(`${row.title} ${row.description || ''}`)
      changes[newType] += 1
      if (newType !== 'OPEN_CALL') {
        await client.query(`UPDATE "Opportunity" SET type = $1 WHERE id = $2`, [newType, row.id])
        console.log(`  [${newType}] ${row.title}`)
      }
    }

    console.log('\nSummary:')
    console.table(changes)
    console.log(`\nUpdated ${rows.length - changes.OPEN_CALL} of ${rows.length} records. ${changes.OPEN_CALL} genuinely stay OPEN_CALL.`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
