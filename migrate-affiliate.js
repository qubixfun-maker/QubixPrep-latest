// Run once:  node migrate-affiliate.js
// Adds the columns the new affiliate system needs. Safe to run twice. Deletes nothing.
const fs = require('fs')
const { neon } = require('@neondatabase/serverless')

function findUrl() {
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL
  for (const f of ['.env.local', '.env.production.local', '.env']) {
    if (!fs.existsSync(f)) continue
    const m = fs.readFileSync(f, 'utf8').match(/^NEON_DATABASE_URL=(.*)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return ''
}

;(async () => {
  const url = findUrl()
  if (!url) { console.error('NEON_DATABASE_URL not found in .env.local. Stop here and tell Claude.'); process.exit(1) }
  const sql = neon(url)
  const raw = (text) => (typeof sql.query === 'function' ? sql.query(text) : sql(text))

  await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS order_id text`
  await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS payment_id text`
  await sql`ALTER TABLE referrals ADD COLUMN IF NOT EXISTS credited_at timestamptz`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS referrals_order_id_uidx ON referrals (order_id) WHERE order_id IS NOT NULL`

  await sql`CREATE TABLE IF NOT EXISTS affiliate_audit (id serial PRIMARY KEY, admin_uid text, action text, detail text, created_at timestamptz DEFAULT now())`

  // The new "cancelled" status must be allowed. Remove any old rule that limits the status values.
  const checks = await sql`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid = 'referrals'::regclass AND contype = 'c'`
  for (const c of checks) {
    if (/status/i.test(c.def)) {
      console.log('Removing old status rule:', c.conname, c.def)
      await raw(`ALTER TABLE referrals DROP CONSTRAINT "${c.conname.replace(/"/g, '')}"`)
    }
  }

  const cols = await sql`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name IN ('affiliates','referrals','payouts','affiliate_audit') ORDER BY table_name, ordinal_position`
  console.log('\nTable layout now:')
  for (const c of cols) console.log(' ', c.table_name + '.' + c.column_name, '(' + c.data_type + ')')

  const s = await sql`SELECT status, COUNT(*)::int AS n FROM referrals GROUP BY status`
  console.log('\nReferrals by status:', JSON.stringify(s))
  console.log('\nDONE. The database is ready.')
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
