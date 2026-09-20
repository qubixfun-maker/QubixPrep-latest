// Deletes every question in the `questions` table - across BOTH stores it lives in
// (Neon and Supabase, same as /api/questions itself reads/writes/deletes from both).
// This covers every generation path: the manual AI QBank Generator, the textbook-driven
// bulk generator, and QBank from Notes - since they all write into this one shared table.
// Dry run by default - shows what WOULD be deleted, per subject, with no writes.
//
// Usage:
//   node delete-all-qbank.mjs            (dry run - just lists what would be deleted)
//   node delete-all-qbank.mjs --apply    (actually deletes)

import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { neon } from '@neondatabase/serverless'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv[2] !== '--apply'

function getNeon() {
  const url = process.env.NEON_DATABASE_URL
  return url ? neon(url) : null
}
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key ? createClient(url, key) : null
}

const sql = getNeon()
const supabase = getSupabase()

if (!sql && !supabase) {
  console.error("Neither NEON_DATABASE_URL nor Supabase env vars found in .env.local - nothing to connect to.")
  process.exit(1)
}

function countBySubject(rows) {
  const counts = new Map()
  for (const r of rows) {
    const key = r.subject_id || '(no subject_id)'
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

let neonRows = []
if (sql) {
  neonRows = await sql`SELECT id, subject_id FROM questions`
  console.log(`Neon: ${neonRows.length} question(s) found\n`)
  for (const [subjectId, count] of countBySubject(neonRows)) {
    console.log(`  [Neon] ${subjectId} — ${count} question(s)`)
  }
} else {
  console.log("Neon: not configured (NEON_DATABASE_URL missing) - skipping.\n")
}

let sbRows = []
if (supabase) {
  const { data, error } = await supabase.from('questions').select('id, subject_id').range(0, 19999)
  if (error) {
    console.log(`Supabase: query failed - ${error.message}\n`)
  } else {
    sbRows = data || []
    console.log(`\nSupabase: ${sbRows.length} question(s) found\n`)
    for (const [subjectId, count] of countBySubject(sbRows)) {
      console.log(`  [Supabase] ${subjectId} — ${count} question(s)`)
    }
  }
} else {
  console.log("\nSupabase: not configured - skipping.")
}

const totalCount = neonRows.length + sbRows.length

if (!DRY_RUN) {
  if (sql && neonRows.length > 0) {
    await sql`DELETE FROM questions`
    console.log(`\n[Neon] Deleted all ${neonRows.length} question(s).`)
  }
  if (supabase && sbRows.length > 0) {
    const { error } = await supabase.from('questions').delete().gt('id', 0)
    if (error) {
      console.log(`\n[Supabase] Delete failed - ${error.message}`)
    } else {
      console.log(`[Supabase] Deleted all ${sbRows.length} question(s).`)
    }
  }
}

console.log(`\nWould delete: ${totalCount} question(s) total (${neonRows.length} Neon + ${sbRows.length} Supabase)`)
console.log(DRY_RUN ? '\nDRY RUN - nothing deleted. Re-run with --apply to actually delete.' : '\nDone - all QBank questions deleted from both stores.')
