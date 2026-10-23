const esbuild = require('esbuild')
const {spawn} = require('node:child_process')
const options = {entryPoints: ['src/index.ts', 'src/service.ts'], outdir: 'dist', outExtension: {'.js': '.cjs'}, bundle: true, platform: 'node', target: 'node22', format: 'cjs', sourcemap: true}
async function main() {
  if (!process.argv.includes('--watch')) return esbuild.build(options)
  let child
  const context = await esbuild.context({...options, plugins: [{name: 'restart', setup(build) {
    build.onEnd(result => {if (!result.errors.length) {child?.kill(); child = spawn(process.execPath, ['dist/index.cjs'], {stdio: 'inherit', windowsHide: true})}})
  }}]})
  await context.watch()
  process.on('SIGINT', () => {child?.kill(); void context.dispose().then(() => process.exit())})
}
main().catch(error => {console.error(error); process.exitCode = 1})
