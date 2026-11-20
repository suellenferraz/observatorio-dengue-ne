import { build } from "esbuild"
import { readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const entrada = join(root, "api/[...rota].ts")
const temporario = join(root, "api/rota.bundle.js")

await build({
  entryPoints: [entrada],
  outfile: temporario,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  logLevel: "info",
})

if (process.env.VERCEL === "1") {
  await writeFile(entrada, await readFile(temporario))
}

await rm(temporario)
