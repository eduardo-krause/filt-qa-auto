// Ajudantes de tela para os componentes do Filt (Angular + PrimeNG). Valem para qualquer rotina.
// Os passos (pasta passos/) usam só estas funções e o Playwright — nada de esperas fixas longas:
// `pronto()` espera as chamadas de API terminarem.
const cfg = require('./config');
const rede = require('./rede');

const esperar = (p, ms) => p.waitForTimeout(ms);
const limpo = (s) => String(s || '').replace(/\s+/g, ' ').trim();

// Tela terminou de carregar (sem chamada de API aberta) + uma folga curta para o Angular desenhar.
async function pronto(p, folga = 400, opcoes) { await rede.ocioso(p, opcoes); if (folga) await esperar(p, folga); }

async function abrir(p, rota) {
  const base = cfg.lerSessao().base || new URL(p.url()).origin;
  const t0 = Date.now();
  await p.goto(base + rota, { waitUntil: 'domcontentloaded' });
  rede.esquecerAnteriores(p, t0);
  await pronto(p, 800);
}

// Loader de página do Filt (vs-loader, logo "filt" por cima da tela) que às vezes não some: espera até `ms`.
// → true se sumiu; false se continuou travado (quem chama decide recarregar e DEVE anotar — contorno é possível bug).
async function semLoader(p, ms = 20000) {
  const l = p.locator('vs-loader .filtz-loader-container:visible');
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (!(await l.count())) return true; await esperar(p, 500); }
  return false;
}

// Diálogo PrimeNG visível mais recente (ou null).
async function dialogo(p) { const d = p.locator('.p-dialog:visible, [role=alertdialog]:visible').last(); return (await d.count()) ? d : null; }
async function textoDialogos(p) { return (await p.locator('.p-dialog:visible, [role=alertdialog]:visible').allInnerTexts()).map((s) => limpo(s).slice(0, 500)); }
async function toasts(p) { return (await p.locator('.p-toast-message').allInnerTexts()).map(limpo); }
async function fecharToasts(p) { const x = p.locator('.p-toast-icon-close:visible, .p-toast-message button:visible'); const n = await x.count(); for (let i = 0; i < n; i++) await x.nth(0).click().catch(() => {}); }

// Botão pelo nome exato (no diálogo aberto, se houver e `noDialogo` não for false). qual: 'first' | 'last' | número.
// Espera até `espera` ms o botão aparecer (a tela costuma desenhar depois que as chamadas terminam).
async function botao(p, nome, { escopo, qual = 'first', noDialogo = true, force = false, espera = 30000 } = {}) {
  const t0 = Date.now(); let bts; let vis = [];
  while (true) {
    let alvo = escopo;
    if (!alvo && noDialogo) { const d = await dialogo(p); if (d && (await d.getByRole('button', { name: nome, exact: true }).count())) alvo = d; }
    bts = (alvo || p).getByRole('button', { name: nome, exact: true });
    const n = await bts.count();
    // só os visíveis contam (a tela costuma ter cópias escondidas)
    vis = [];
    for (let i = 0; i < n; i++) if (await bts.nth(i).isVisible()) vis.push(i);
    const precisa = typeof qual === 'number' ? qual + 1 : 1;
    if (vis.length >= precisa) break;
    if (Date.now() - t0 > espera) throw new Error(n ? `botão "${nome}" existe mas não está visível` : `botão "${nome}" não encontrado`);
    await esperar(p, 500);
  }
  const idx = qual === 'last' ? vis[vis.length - 1] : typeof qual === 'number' ? vis[qual] : vis[0];
  await bts.nth(idx).click({ force });
  await pronto(p);
}

async function temBotao(p, nome, escopo) { const b = (escopo || p).getByRole('button', { name: nome, exact: true }); const n = await b.count(); for (let i = 0; i < n; i++) if (await b.nth(i).isVisible()) return true; return false; }

// Clica o primeiro destes botões que existir no diálogo aberto (confirmações "Sim", "Confirmar"...).
async function confirmar(p, nomes = ['Sim', 'Confirmar']) {
  const d = await dialogo(p); if (!d) return null;
  for (const n of nomes) if (await temBotao(p, n, d)) { await botao(p, n, { escopo: d }); return n; }
  return null;
}

async function clicarTexto(p, texto, escopo) { await (escopo || p).getByText(texto, { exact: true }).first().click(); await pronto(p); }

// Input que vem logo depois do rótulo visível (padrão das telas do Filt).
function campo(escopo, rotulo, n = 0) { return escopo.locator(`label:visible:has-text("${rotulo}")`).nth(n).locator('xpath=following::input[1]'); }

// Digita substituindo o conteúdo. Campos com máscara (quantidade/moeda) recebem só dígitos.
async function digitar(p, inp, valor, { tab = true, atraso = 30 } = {}) {
  await inp.scrollIntoViewIfNeeded(); await inp.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  await p.keyboard.type(String(valor), { delay: atraso });
  if (tab) await p.keyboard.press('Tab');
  await esperar(p, 300);
}

// Máscaras: a tela lê a digitação "da direita" — 2 un com 3 casas = "2000"; R$ 100,00 = "10000".
const qtd = (q, casas = 0) => String(Math.round(Number(q) * 10 ** casas));
const moeda = (v, casas = 2) => String(Math.round(Number(v) * 10 ** casas));

// Campo de data (dd/mm/aaaa): digita e fecha o calendário.
async function data(p, inp, valor) { await inp.click(); await esperar(p, 200); await p.keyboard.press('Control+A'); await p.keyboard.type(valor, { delay: 30 }); await p.keyboard.press('Escape'); await esperar(p, 400); }

// Autocomplete: digita (até 12 letras) e escolhe a opção que contém `opcao` (padrão: o próprio texto).
async function autocomplete(p, inp, texto, opcao) {
  await inp.waitFor({ timeout: 30000 });
  const alvo = String(opcao || texto);
  const op = p.locator('.p-autocomplete-panel:visible li, .p-autocomplete-items li, li[role=option]:visible').filter({ hasText: alvo }).first();
  // até 3 tentativas: logo depois de abrir a tela o campo às vezes ainda não busca
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    await inp.click(); await inp.fill('');
    await p.keyboard.type(String(texto).slice(0, 12), { delay: 40 });
    await pronto(p, 600);
    await op.waitFor({ timeout: 5000 }).catch(() => {});
    if (await op.count()) break;
  }
  if (await op.count()) {
    // prefere a opção IGUAL ao texto ("30/60" não pode pegar "30/60/90"); algumas listas trazem o código colado na frente
    const todas = p.locator('.p-autocomplete-panel:visible li, .p-autocomplete-items li, li[role=option]:visible');
    const textos = (await todas.allInnerTexts()).map((x) => limpo(x));
    const i = textos.findIndex((x) => x === alvo || x.replace(/^\d+\s*(?=[A-Za-zÀ-ú0-9])/, '') === alvo || x.replace(/^\d+\s*-\s*/, '') === alvo);
    if (i >= 0) await todas.nth(i).click(); else await op.click();
  }
  else if (!(await inp.inputValue()).includes(alvo)) {
    const vistas = (await p.locator('.p-autocomplete-panel:visible li, li[role=option]:visible').allInnerTexts()).map(limpo).slice(0, 10);
    throw new Error(`opção "${alvo}" não encontrada no autocomplete (opções: ${vistas.join(' | ') || 'nenhuma'})`);
  }
  await pronto(p, 400);
}
const autocompleteRotulo = (p, escopo, rotulo, texto, opcao) => autocomplete(p, campo(escopo, rotulo), texto, opcao);

// Dropdown PrimeNG (p-dropdown) pelo rótulo.
async function dropdown(p, escopo, rotulo, opcao) {
  const lab = escopo.locator(`label:visible:has-text("${rotulo}")`).first();
  const id = await lab.getAttribute('for');
  const d = id ? escopo.locator(`p-dropdown#${id} .p-dropdown`).first() : lab.locator('xpath=following::*[contains(@class,"p-dropdown")][1]');
  await d.click(); await esperar(p, 600);
  await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').filter({ hasText: opcao }).first().click();
  await pronto(p);
}

// Ação do menu ⋮ do registro (ex.: "Alterar Validade", "Cancelar").
async function menuKebab(p, opcao) {
  await p.locator('button:has(i.pi-ellipsis-v), button:has(.pi-ellipsis-v), #dropdown-help, button.vs-btn-icon').last().click(); await esperar(p, 800);
  // carrinho do pedido usa dropdown do Bootstrap (a.dropdown-item); outras telas usam p-menu
  const itens = p.locator('.dropdown-menu.show a.dropdown-item, .p-menu:visible .p-menuitem, .p-tieredmenu:visible .p-menuitem, .p-menu-overlay:visible li, [role=menuitem]:visible');
  const textos = (await itens.allInnerTexts()).map(limpo).filter(Boolean);
  if (!opcao) { await p.keyboard.press('Escape'); return textos; }
  // texto = igual ao item; RegExp = casa com o item
  const i = textos.findIndex((t) => (opcao instanceof RegExp ? opcao.test(t) : t === opcao));
  if (i < 0) throw new Error(`opção "${opcao}" não está no menu ⋮ (tem: ${textos.join(' | ')})`);
  await itens.nth(i).click(); await pronto(p);
  return textos;
}

// Menu lateral: abre a rotina pelo texto do item (quando a rota não é conhecida).
async function menuLateral(p, ...caminho) {
  for (const t of caminho) { await p.locator('nav, aside, .layout-sidebar, body').getByText(t, { exact: true }).first().click(); await pronto(p, 600); }
}

// Salvar do registro, com a trava do DF-e (só emite se a conferência da sessão não achou PRODUÇÃO).
async function salvar(p) {
  if (/\/nota\/|conhecimento-de-transporte|\/pdv|manifesto|nfce|mdfe/i.test(p.url())) exigirDfe();
  await p.locator('button:has-text("Salvar")').first().click();
  await pronto(p, 1500);
  const d = await textoDialogos(p); const t = await toasts(p);
  const transm = d.find((x) => /Transmiss/i.test(x));
  if (transm && /Produ[cç][aã]o/i.test(transm) && !/Homologa[cç][aã]o/i.test(transm)) throw new Error('ALERTA: transmissão em ambiente de PRODUÇÃO na tela — parar e avisar a pessoa.');
  let status = 'desconhecido';
  if (d.some((x) => /Acerto Financeiro/.test(x))) status = 'acerto_financeiro';
  else if (d.some((x) => /sucesso|Transmiss/i.test(x)) || t.some((x) => /sucesso/i.test(x))) status = 'salvo';
  return { status, dialogos: d, toasts: t };
}

function exigirDfe() {
  const chk = cfg.lerSessao().dfe;
  if (!chk) throw new Error('BLOQUEADO: DF-e não conferido nesta sessão (o motor confere no início da suíte).');
  if (!chk.ok) throw new Error('BLOQUEADO: ' + chk.bloqueio);
}

// Retrato em texto da tela, usado como evidência quando um passo falha (sem print, para não gastar).
async function evidencia(p, desde) {
  const out = { url: p.url() };
  try {
    out.dialogos = await textoDialogos(p);
    out.toasts = await toasts(p);
    out.botoes = [...new Set((await p.getByRole('button').allInnerTexts()).map(limpo).filter(Boolean))].slice(0, 30);
    out.errosApi = rede.errosDesde(p, desde || 0).slice(-8);
    out.chamadasAbertas = rede.pendentes(p, 5000);
  } catch (e) { out.falhaAoLer = e.message.split('\n')[0]; }
  return out;
}

module.exports = {
  esperar, limpo, pronto, abrir, dialogo, textoDialogos, toasts, fecharToasts, botao, temBotao, confirmar, clicarTexto,
  campo, digitar, qtd, moeda, data, semLoader, autocomplete, autocompleteRotulo, dropdown, menuKebab, menuLateral, salvar, exigirDfe, evidencia,
};
