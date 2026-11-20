import { build } from "esbuild"
import { rm } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const entrada = join(root, "api/[...rota].ts")
const saida = join(root, "api/[...rota].js")

await build({
  entryPoints: [entrada],
  outfile: saida,
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  logLevel: "info",
})

if (process.env.VERCEL === "1") {
  await rm(entrada)
}
