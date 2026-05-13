import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const distDir = resolve(root, 'dist')
const siteDir = resolve(root, 'site')
const productRepos = [
  {
    name: 'baby-future',
    repoDir: process.env.BABY_FUTURE_DIR
      ? resolve(root, process.env.BABY_FUTURE_DIR)
      : resolve(root, '..', 'baby-future'),
    basePath: '/baby-future/',
  },
  {
    name: 'image-story',
    repoDir: process.env.IMAGE_STORY_DIR
      ? resolve(root, process.env.IMAGE_STORY_DIR)
      : resolve(root, '..', 'image-story'),
    basePath: '/image-story/',
  },
]

const run = (command, cwd, extraEnv = {}) => {
  execSync(command, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  })
}

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

cpSync(siteDir, distDir, { recursive: true })

for (const product of productRepos) {
  if (!existsSync(product.repoDir)) {
    throw new Error(`Missing repository: ${product.repoDir}`)
  }

  if (!existsSync(resolve(product.repoDir, 'node_modules'))) {
    run('npm install', product.repoDir)
  }

  run('npm run build', product.repoDir, { VITE_BASE_PATH: product.basePath })

  const productDist = resolve(product.repoDir, 'dist')
  const targetDir = resolve(distDir, product.name)

  rmSync(targetDir, { recursive: true, force: true })
  cpSync(productDist, targetDir, { recursive: true })
}

const root404 = resolve(distDir, '404.html')
const rootIndex = resolve(distDir, 'index.html')
if (existsSync(rootIndex)) {
  writeFileSync(root404, readFileSync(rootIndex))
}

const builtDirs = readdirSync(distDir)
console.log('Built Pages output:', builtDirs.join(', '))
