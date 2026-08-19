import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const testPath = "mindmaps/physiology/1782383336643-34433.png"

console.log("Testing DELETE on: " + testPath)
const res = await fetch(SUPABASE_URL + "/storage/v1/object/mindmaps/" + testPath, {
  method: "DELETE",
  headers: { "Authorization": "Bearer " + SUPABASE_ANON_KEY },
})
console.log("Status: " + res.status)
const body = await res.text()
console.log("Response: " + body)
