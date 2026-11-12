// Tela: Cadastros › Financeiro › Movimentação automática OFX (/financeiro/movimentacao-automatica-ofx) — ajudantes (não é cenário)
const { limpo } = require('../../_comum');

const ROTA = '/financeiro/movimentacao-automatica-ofx';
const TIPOS = { C: 0, D: 1 }; // ordem dos rádios no form: Crédito, Débito

// Autocomplete do form pelo id do input: digita e clica a opção que contém o texto. Sem repetir: se não achar, erro.
async function ac(t, id, texto) {
  const { p, tela } = t;
  const inp = p.locator(`input#${id}`).first();
  await inp.scrollIntoViewIfNeeded();
  await inp.click(); await inp.fill('');
  await p.keyboard.type(String(texto), { delay: 40 });
  await tela.pronto(p, 700);
  const ops = p.locator('.p-autocomplete-panel:visible li[role=option], .p-autocomplete-panel:visible li');
  await ops.first().waitFor({ timeout: 8000 }).catch(() => {});
  const textos = (await ops.allInnerTexts()).map(limpo);
  let i = textos.findIndex((x) => x === texto || x.endsWith(' ' + texto) || x.endsWith('| ' + texto));
  if (i < 0) i = textos.findIndex((x) => x.includes(texto));
  if (i < 0) throw new Error(`autocomplete ${id}: opção "${texto}" não apareceu (opções: ${textos.slice(0, 8).join(' | ') || 'nenhuma'})`);
  await ops.nth(i).click();
  await tela.pronto(p, 400);
}

async function clicarTipo(t, tipo) {
  const { p, tela } = t;
  await p.locator('p-radiobutton[name="tipo"]').nth(TIPOS[tipo]).locator('.p-radiobutton-box').click();
  await tela.pronto(p, 400);
}

async function marcados(p) {
  return p.evaluate(() => [...document.querySelectorAll('p-radiobutton[name="tipo"]')].filter((r) => r.querySelector('.p-radiobutton-box.p-highlight, input:checked'))
    .map((r) => (r.querySelector('label') || {}).textContent?.trim()));
}

// Lê o form inteiro (sem alterar).
async function lerForm(p) {
  return p.evaluate(() => {
    const vis = (e) => !!(e && e.getClientRects().length);
    const val = (id) => { const e = document.querySelector(`input#${id}`); return e ? e.value.trim() : null; };
    const tit = document.querySelector('.header-principal .header-title') || document.querySelector('header-form');
    const titHeader = [...document.querySelectorAll('header-form *')].find((e) => vis(e) && e.children.length === 0 && /Movimenta/i.test(e.textContent));
    const radios = [...document.querySelectorAll('p-radiobutton[name="tipo"]')];
    const tipo = radios.filter((r) => r.querySelector('.p-radiobutton-box.p-highlight, input:checked')).map((r) => (r.querySelector('label') || {}).textContent?.trim()).join(',') || null;
    const chk = document.querySelector('#geraLancamentoConciliado .p-checkbox-box');
    const padroes = [];
    for (let i = 0; document.querySelector(`#condicao${i}`); i++) {
      padroes.push([((document.querySelector(`#condicao${i} .p-dropdown-label`) || {}).textContent || '').trim(), val(`texto${i}`)]);
    }
    const campos = [...document.querySelectorAll('form#form label, form#form vs-fieldset .header > span:first-child')].filter(vis)
      .map((l) => { const r = l.getBoundingClientRect(); return { rotulo: l.textContent.replace(/\s+/g, ' ').trim(), x: Math.round(r.x), y: Math.round(r.y) }; })
      .filter((c) => c.rotulo);
    const secPad = [...document.querySelectorAll('.header-padroes .header-title')].find(vis);
    const todoTexto = document.querySelector('form#form') ? document.querySelector('form#form').innerText : '';
    return {
      titulo: titHeader ? titHeader.textContent.trim() : null,
      tituloCard: tit ? tit.innerText.replace(/\s+/g, ' ').trim() : null,
      descricao: val('descricao'), conta: val('configuracaoPortador'), credito: val('planoContaAnaliticaCredito'),
      debito: val('planoContaAnaliticaDebito'), centro: val('centroResultadoDetalhe'), tipo,
      conciliado: chk ? /p-highlight/.test(chk.className) || chk.getAttribute('aria-checked') === 'true' : null,
      padroes, campos,
      temClassificacaoFinanceira: /Classifica[cç][aã]o financeira/i.test(todoTexto),
      secaoPadroes: secPad ? secPad.textContent.trim() : null,
      secaoPadroesY: secPad ? Math.round(secPad.getBoundingClientRect().y + window.scrollY) : null,
    };
  });
}

// Painel vermelho "Campos obrigatórios" (lista de campos) — null se não apareceu.
async function obrigatorios(p) {
  return p.evaluate(() => {
    const tit = [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && /Campos? obrigat[oó]rios?/i.test((e.textContent || '').trim()) && (e.textContent || '').trim().length < 40 && e.getClientRects().length);
    if (!tit) return null;
    let b = tit; for (let i = 0; i < 4 && b.parentElement; i++) { b = b.parentElement; if (b.innerText.replace(tit.textContent, '').trim()) break; }
    return b.innerText.split(/\n/).map((x) => x.trim()).filter((x) => x && x !== tit.textContent.trim());
  });
}

module.exports = { ROTA, TIPOS, ac, clicarTipo, marcados, lerForm, obrigatorios, limpo };
