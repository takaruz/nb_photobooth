import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)],
  )
}

/**
 * Emit sw.js with the exact list of built + public files to precache,
 * so the app works offline after the first visit.
 */
function serviceWorker(): Plugin {
  return {
    name: 'nb-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const publicFiles = listFiles('public').map((f) => relative('public', f).split('\\').join('/'))
      const files = [...Object.keys(bundle), ...publicFiles].filter((f) => !f.endsWith('.map')).sort()
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 10)
      const source = readFileSync('pwa/sw.js', 'utf8')
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace('= __PRECACHE__', `= ${JSON.stringify(files)}`)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Relative asset paths so the build works at https://<user>.github.io/<repo>/
  base: './',
})
