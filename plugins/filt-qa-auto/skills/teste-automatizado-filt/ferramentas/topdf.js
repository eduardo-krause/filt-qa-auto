// uso: node topdf.js <arquivo.html> <saida.pdf>
const { chromium } = require(require('path').join(process.env.NODE_PATH, 'playwright'));
(async () => {
  const b = await chromium.launch(process.platform === 'win32' ? {} : { args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto(require('url').pathToFileURL(require('path').resolve(process.argv[2])).href);
  await p.waitForTimeout(800);
  await p.pdf({ path: process.argv[3], format: 'A4', printBackground: true,
    margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
  await b.close();
})();
