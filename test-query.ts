import { getFormById } from "./src/lib/db/queries/forms"
import { db } from "./src/lib/db/client"
import { forms } from "./src/lib/db/schema"

async function test() {
  const res = await getFormById("e7a9fbff-16f3-4583-84d2-826d1934999a")
  console.log(JSON.stringify(res, null, 2))
  process.exit(0)
}

test()
