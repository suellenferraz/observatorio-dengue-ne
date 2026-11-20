import { resolve } from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": `http://localhost:${env.API_PORT ?? 3001}`,
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            // React e a interface vêm na abertura. Recharts fica num arquivo
            // separado, baixado só quando os gráficos entram na tela.
            groups: [
              {
                name: "react",
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 20,
              },
              {
                name: "recharts",
                test: /node_modules[\\/](recharts|d3-[^/]+|immer|decimal\.js-light|@reduxjs|react-redux|victory-vendor|react-is|tiny-invariant|redux|redux-thunk|eventemitter3|es-toolkit|reselect)[\\/]/,
                priority: 15,
                includeDependenciesRecursively: false,
              },
              {
                name: "ui",
                test: /node_modules[\\/](@base-ui|@floating-ui|clsx|use-sync-external-store)[\\/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
  }
})
