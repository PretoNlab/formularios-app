import { config } from "dotenv"
config({ path: ".env" })
async function main() {
  const apiKey = process.env.ABACATEPAY_API_KEY
  console.log("Key prefix:", apiKey?.substring(0, 10))
  const res = await fetch("https://api.abacatepay.com/v2/transparents/create", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      method: "PIX",
      data: {
        amount: 1000,
        description: "Teste",
      }
    }),
  })
  const json = await res.json()
  console.log("Status:", res.status)
  console.dir(json, { depth: null })
}
main()
