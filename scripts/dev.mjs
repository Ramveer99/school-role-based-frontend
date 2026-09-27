import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function run(command, args, name, color) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
    shell: true,
  })

  const prefix = (line) => `[${name}] ${line}`
  const paint = (stream) => {
    let buf = ''
    stream.on('data', (chunk) => {
      buf += chunk.toString()
      const parts = buf.split(/\r?\n/)
      buf = parts.pop() || ''
      for (const line of parts) {
        if (!line.trim()) continue
        console.log(`\x1b[${color}m${prefix(line)}\x1b[0m`)
      }
    })
  }
  paint(child.stdout)
  paint(child.stderr)

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`)
      process.exit(code)
    }
  })
  return child
}

const api = run('npm', ['--prefix', 'school-role-based-backend', 'run', 'dev'], 'api', '36')
const web = run('npx', ['vite'], 'web', '32')

const shutdown = () => {
  api.kill('SIGTERM')
  web.kill('SIGTERM')
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
