import pg from "pg"
import { createRequire } from "module"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
require("dotenv").config({ path: resolve(__dirname, "../.env"), override: true })

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
const c = await pool.connect()

await c.query(`
  ALTER TABLE public.weekly_scores
    ADD COLUMN IF NOT EXISTS ai_summary              text,
    ADD COLUMN IF NOT EXISTS ai_summary_generated_at timestamptz;
`)

console.log("✓ weekly_scores.ai_summary columns added")
c.release()
await pool.end()
