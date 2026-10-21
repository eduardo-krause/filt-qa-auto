// Ajudantes dos passos (fora das pastas de área: o motor não registra este arquivo como passo).
const fs = require('fs');
const path = require('path');

const limpo = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Clica no alvo e junta tudo o que a tela mostrou (toasts, diálogos) até as chamadas de API terminarem — as
// mensagens de boleto aparecem em toast e somem. Opcional: salva os PDFs que passarem pela rede em `pastaPdf`.
// devolve { eventos: ['TOAST: ...', 'DIALOGO: ...'], errosApi: [...], pdfs: [arquivos] }
async function observar(t, alvo, { minimo = 3000, limite = 180000, pastaPdf, prefixo = 'boleto' } = {}) {
  const { p, tela } = t;
  const vistos = new Set(); const eventos = []; const pdfs = [];
  const coleta = async () => {
    for (const pg of p.context().pages()) {
      const r = await pg.evaluate(() => ({
        toasts: [...document.querySelectorAll('.p-toast-message')].map((x) => x.innerText),
        dialogos: [...document.querySelectorAll('.p-dialog, [role=alertdialog]')].filter((d) => d.offsetParent).map((d) => d.innerText.slice(0, 900)),
      })).catch(() => ({ toasts: [], dialogos: [] }));
      for (const x of [...r.toasts.map((v) => 'TOAST: ' + limpo(v)), ...r.dialogos.map((v) => 'DIALOGO: ' + limpo(v))]) if (!vistos.has(x)) { vistos.add(x); eventos.push(x); }
    }
  };
  const ctx = p.context();
  const onResp = async (r) => {
    if (!pastaPdf || !/pdf/i.test(r.headers()['content-type'] || '')) return;
    const b = await r.body().catch(() => null); if (!b) return;
    fs.mkdirSync(pastaPdf, { recursive: true });
    const f = path.join(pastaPdf, `${prefixo}_${pdfs.length}.pdf`); fs.writeFileSync(f, b); pdfs.push(f);
  };
  ctx.on('response', onResp);
  const ini = Date.now();
  try {
    await alvo.click();
    let fim = false; let erro = null;
    const espera = tela.pronto(p, 800, { limite }).catch((e) => { erro = e; }).finally(() => { fim = true; });
    while (!fim || Date.now() - ini < minimo) { await coleta(); await p.waitForTimeout(400); }
    await espera; await coleta();
    if (erro) throw erro;
  } finally { ctx.off('response', onResp); }
  const ev = await tela.evidencia(p, ini);
  // abas extras (PDF aberto em nova aba) são fechadas para não acumular
  for (const pg of ctx.pages()) if (pg !== p) await pg.close().catch(() => {});
  return { eventos, errosApi: ev.errosApi || [], pdfs };
}

// Dropdown PrimeNG pelo rótulo (container do rótulo, como no validador), com até 3 aberturas e, se o clique
// não trocar o valor, teclado (setas) como último recurso. Devolve o texto que ficou selecionado.
// Como trocou fica em dropdown.ultimo = { rotulo, opcao, via: 'mouse'|'teclado', cliques } e, se precisou do teclado,
// vira anotação no resultado (o clique não funcionar pode ser bug da tela — não pode ficar escondido).
async function dropdown(t, escopo, rotulo, opcao) {
  const { p, tela } = t;
  const lab = escopo.locator('label:visible').filter({ hasText: new RegExp(`^\\s*${rotulo.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\s*\\*?\\s*$`) }).first();
  const id = await lab.getAttribute('for').catch(() => null);
  let d = id ? escopo.locator(`p-dropdown#${id} .p-dropdown`).first() : null;
  if (!d || !(await d.count())) d = lab.locator('xpath=ancestor::*[.//p-dropdown][1]').locator('.p-dropdown').first();
  const ops = p.locator('li.p-dropdown-item:visible, li[role=option]:visible');
  const atual = async () => limpo(await d.locator('.p-dropdown-label').innerText().catch(() => ''));
  for (let i = 0; i < 3; i++) {
    await d.scrollIntoViewIfNeeded(); await d.click(); await tela.pronto(p, 800);
    const op = ops.filter({ hasText: opcao }).first();
    if (await op.count()) { await op.click(); await tela.pronto(p); if ((await atual()).includes(opcao)) { dropdown.ultimo = { rotulo, opcao, via: 'mouse', cliques: i + 1 }; return atual(); } }
    await p.keyboard.press('Escape'); await tela.pronto(p, 300);
  }
  // teclado: foca o input escondido do dropdown e percorre as opções
  const inp = d.locator('input').first();
  await inp.focus();
  for (let i = 0; i < 25 && !(await atual()).includes(opcao); i++) { await p.keyboard.press('ArrowDown'); await tela.pronto(p, 200); }
  const v = await atual();
  if (!v.includes(opcao)) throw new Error(`dropdown "${rotulo}": opção "${opcao}" não ficou selecionada nem pelo clique (3x) nem pelo teclado (valor: "${v}")`);
  dropdown.ultimo = { rotulo, opcao, via: 'teclado', cliques: 3 };
  t.anotar(`ATENÇÃO: dropdown "${rotulo}" — o clique do mouse não trocou para "${opcao}" (3 tentativas); valor trocado pelo teclado`);
  return v;
}

module.exports = { limpo, observar, dropdown };
