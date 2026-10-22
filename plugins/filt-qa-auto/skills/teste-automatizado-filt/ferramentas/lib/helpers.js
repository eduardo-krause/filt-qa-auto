// Helpers genéricos para os componentes do Filt (Angular + PrimeNG). Valem para qualquer tela.
const path = require('path');
const fs = require('fs');
const cfg = require('./cfg');

const esperar = (p, ms) => p.waitForTimeout(ms);

function pastaPrints() {
  const t = cfg.lerSessao().tarefa || 'geral';
  const d = cfg.pastaTarefa(t);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

// Container do campo a partir do texto do label. label com "=" na frente = texto exato.
function campo(scope, label) {
  const lab = label.startsWith('=')
    ? scope.locator(`label:visible:text-is("${label.slice(1)}")`).first()
    : scope.locator(`label:visible:has-text("${label}")`).first();
  return { lab, cont: lab.locator('xpath=ancestor::*[.//input or .//p-dropdown or .//textarea][1]') };
}

async function opcoesVisiveis(p) {
  const o = p.locator('li[role=option]:visible, li.p-dropdown-item:visible, li.p-multiselect-item:visible');
  const n = await o.count(); const t = [];
  for (let i = 0; i < Math.min(n, 15); i++) t.push((await o.nth(i).innerText()).trim());
  return { o, t };
}

// Autocomplete: digita e escolhe (pick = trecho do texto da opção; vazio = primeira). Texto vazio = abre pela seta.
async function ac(p, label, texto, pick, scope) {
  const { cont } = campo(scope || p, label);
  const inp = cont.locator('input:visible').first();
  await inp.scrollIntoViewIfNeeded();
  if (texto) { await inp.click(); await inp.fill(''); await p.keyboard.type(String(texto), { delay: 25 }); }
  else await cont.locator('button:visible, .p-autocomplete-dropdown:visible').last().click();
  await esperar(p, 2000);
  const { o, t } = await opcoesVisiveis(p);
  if (!t.length) return { ok: false, opcoes: [] };
  if (pick) await o.filter({ hasText: pick }).first().click(); else await o.first().click();
  await esperar(p, 1200);
  return { ok: true, opcoes: t };
}

// Dropdown PrimeNG (p-dropdown). pick undefined = só lista as opções.
async function dd(p, label, pick, scope) {
  const { lab, cont } = campo(scope || p, label);
  const id = await lab.getAttribute('for');
  const d = id ? (scope || p).locator(`p-dropdown#${id} .p-dropdown`).first() : cont.locator('.p-dropdown').first();
  await d.scrollIntoViewIfNeeded(); await d.click(); await esperar(p, 1000);
  const { o, t } = await opcoesVisiveis(p);
  if (pick !== undefined) { await o.filter({ hasText: pick }).first().click(); await esperar(p, 800); }
  else await p.keyboard.press('Escape');
  return { opcoes: t };
}

async function digitar(p, inp, valor) {
  await inp.scrollIntoViewIfNeeded();
  await inp.click({ clickCount: 3 }); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  await p.keyboard.type(String(valor)); await p.keyboard.press('Tab'); await esperar(p, 700);
}

// Campo texto/numérico simples.
async function texto(p, label, valor, scope) {
  const { cont } = campo(scope || p, label);
  await digitar(p, cont.locator('input:visible, textarea:visible').first(), valor);
}

// Campo de moeda: a máscara lê a digitação como centavos. casas=2 (R$) ou 5 (desconto unitário).
async function moeda(p, label, valor, casas = 2, scope) {
  const { cont } = campo(scope || p, label);
  await digitar(p, cont.locator('input:visible').first(), Math.round(Number(valor) * 10 ** casas));
}

// Moeda por id do input (útil em diálogos com labels repetidos).
async function moedaId(p, id, valor, casas = 2, scope) {
  await digitar(p, (scope || p).locator(`input#${id}`).first(), Math.round(Number(valor) * 10 ** casas));
}

async function dialogos(p) {
  return p.$$eval('.p-dialog', (a) => a.filter((x) => x.offsetParent).map((x) => x.innerText.trim().slice(0, 700)));
}

async function toasts(p) {
  return p.$$eval('.p-toast-message', (a) => a.map((x) => x.innerText.replace(/\s+/g, ' ').trim()));
}

// Painel vermelho "Campos obrigatórios": devolve a lista e fecha (ele cobre o botão Salvar).
async function obrigatorios(p, fechar = true) {
  const body = await p.innerText('body');
  const i = body.indexOf('Campos obrigatórios');
  if (i < 0) return [];
  const itens = body.slice(i + 19, i + 400).split('\n').map((s) => s.trim()).filter(Boolean)
    .filter((s) => !/^(Salvar|Novo|Nota Fiscal|Item)$/.test(s)).slice(0, 10);
  if (fechar) {
    const x = p.locator('.p-toast-icon-close:visible').first();
    if (await x.count()) await x.click().catch(() => {}); else await p.mouse.click(1565, 112);
    await esperar(p, 600);
  }
  return itens;
}

// Clica em Salvar do registro e diz o que aconteceu.
async function salvar(p) {
  // Trava de DF-e: em rotina fiscal, só salva depois de conferir que nenhum DF-e está em PRODUÇÃO
  // (checar_dfe.py / checar_dfe.py --producao ou o passo checar_dfe_tela para base sem acesso ao banco).
  if (/\/nota\/|conhecimento-de-transporte|\/pdv|manifesto|nfce|mdfe/i.test(p.url())) {
    const s = cfg.lerSessao(); const chk = s.ambiente === 'producao' ? s.dfe_producao : s.dfe_at;
    if (!chk) throw new Error('BLOQUEADO: confira o DF-e antes de salvar em rotina fiscal — python checar_dfe.py' + (s.ambiente === 'producao' ? ' --producao (ou node run.js checar_dfe_tela, se a base não tiver banco liberado)' : ''));
    if (chk.empresa && s.producao && s.ambiente === 'producao' && chk.empresa !== s.producao.empresa) throw new Error(`BLOQUEADO: a conferência do DF-e foi da base "${chk.empresa}", mas a sessão está em "${s.producao.empresa}". Conferir de novo.`);
    if (!chk.ok) throw new Error('BLOQUEADO: ' + chk.bloqueio);
  }
  await obrigatorios(p, true);
  await p.locator('button:has-text("Salvar")').first().click();
  await esperar(p, 6000);
  const d = await dialogos(p); const t = await toasts(p); const ob = await obrigatorios(p, false);
  let status = 'desconhecido';
  // DF-e NUNCA pode sair em produção (bases AT são backups de clientes)
  const transm = d.find((x) => /Transmiss/i.test(x)) || '';
  const body = transm ? await p.innerText('body') : '';
  if (transm && /Produ[cç][aã]o/i.test(body) && !/Homologa[cç][aã]o/i.test(body))
    return { status: 'ALERTA_DFE_PRODUCAO', aviso: 'Transmissão em ambiente de PRODUÇÃO detectada — parar e avisar o usuário imediatamente.', dialogos: d };
  if (d.some((x) => /Acerto Financeiro/.test(x))) status = 'acerto_financeiro';
  else if (ob.length) status = 'campos_obrigatorios';
  else if (d.some((x) => /sucesso|Transmiss/i.test(x)) || t.some((x) => /sucesso/i.test(x))) status = 'salvo';
  return { status, obrigatorios: ob, dialogos: d.map((x) => x.slice(0, 300)), toasts: t };
}

// Acerto financeiro: forma = Dinheiro | Duplicata | Cartão | Cheque | Crédito Devolução | Adiantamento.
async function acerto(p, forma) {
  const dlg = p.locator('.p-dialog:visible').last();
  const txt = await dlg.innerText();
  if (!forma) forma = /Dinheiro/.test(txt) ? 'Dinheiro' : 'Duplicata';
  await dlg.locator('text=' + forma).first().click(); await esperar(p, 2000);
  if (forma === 'Duplicata') {
    await ac(p, 'Forma Parcelamento', '', '', dlg);
    await dlg.locator('button:has-text("Gerar")').click(); await esperar(p, 1500);
  }
  await dlg.locator('button:has-text("Salvar")').first().click(); await esperar(p, 2000);
  await dlg.locator('button:has-text("Concluir")').click(); await esperar(p, 3000);
  return { forma, dialogos: await dialogos(p) };
}

// Modal "Documentos Referenciados" (Filtros → Notas → Itens NF).
// args: {pessoa, numero, itens:[{texto:'TESTE QA', qtd:2}]}
async function docRef(p, { pessoa, numero, itens = [] }) {
  let dlg = p.locator('.p-dialog:visible').last();
  if (!(await dlg.count()) || !/Documentos Referenciados/.test(await dlg.innerText())) {
    await p.locator('button:has-text("Adicionar Documento")').first().click(); await esperar(p, 2500);
    dlg = p.locator('.p-dialog:visible').last();
  }
  if (pessoa) await ac(p, 'Pessoa', pessoa, '', dlg);
  if (numero) await texto(p, '=Número', numero, dlg);
  const pesq = dlg.locator('button:has-text("Pesquisar")');
  if (await pesq.count()) await pesq.first().click(); else await dlg.locator('[class*=filter]').first().click();
  await esperar(p, 4000);
  const linha = dlg.locator(`tr:has-text("${numero}")`).first();
  if (!(await linha.count())) return { ok: false, motivo: 'documento não encontrado na busca', tela: (await dlg.innerText()).slice(-400) };
  await linha.locator('.p-checkbox-box, .p-radiobutton-box, td').first().click(); await esperar(p, 800);
  const prox = dlg.locator('button:has-text("Próximo")');
  if (await prox.count()) {
    await prox.click(); await esperar(p, 3000);
    for (const it of itens) {
      const row = dlg.locator(`tr:has-text("${it.texto}")`).first();
      const cb = row.locator('.p-checkbox-box').first();
      if (!(await cb.evaluate((e) => e.classList.contains('p-highlight')))) await cb.click();
      await esperar(p, 600);
      if (it.qtd !== undefined) await digitar(p, row.locator('input[type=text]').first(), it.qtd);
    }
  }
  await dlg.locator('button:has-text("Finalizar")').click(); await esperar(p, 3000);
  return { ok: true };
}

// Ações do menu ⋮ do registro (ex.: "Excluir", "Cancelar Nota").
async function menu(p, acao) {
  const kebab = p.locator('button:has(.pi-ellipsis-v), button[title*="Mais"], .pi-ellipsis-v').first();
  if (await kebab.count()) await kebab.click(); else await p.mouse.click(1507, 126);
  await esperar(p, 1200);
  const itens = await p.$$eval('[role=menuitem], .p-menuitem', (a) => a.filter((x) => x.offsetParent).map((x) => x.innerText.trim()));
  if (!acao) { await p.keyboard.press('Escape'); return { itens }; }
  await p.locator(`[role=menuitem]:has-text("${acao}"), .p-menuitem:has-text("${acao}")`).first().click();
  await esperar(p, 2000);
  return { itens, dialogos: await dialogos(p) };
}

// Retrato da tela: labels+valores, botões, diálogos, toasts, obrigatórios e tabelas. Print só se vier nome (a pessoa pediu).
async function retrato(p, nome) {
  const campos = await p.$$eval('label', (a) => a.filter((x) => x.offsetParent).map((l) => {
    let c = l.parentElement; for (let i = 0; i < 4 && c && !c.querySelector('input,textarea,.p-dropdown-label'); i++) c = c.parentElement;
    const i = c && c.querySelector('input:not([type=checkbox]),textarea'); const d = c && c.querySelector('.p-dropdown-label');
    return l.innerText.trim() + ' = ' + (i ? i.value : d ? d.innerText.trim() : '');
  }));
  const botoes = await p.$$eval('button', (a) => [...new Set(a.filter((x) => x.offsetParent).map((x) => x.innerText.trim()).filter(Boolean))]);
  const tabelas = await p.$$eval('table', (a) => a.filter((x) => x.offsetParent).map((t) => [...t.querySelectorAll('tr')].slice(0, 12).map((r) => r.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean)));
  let print = null;
  if (nome) { print = path.join(pastaPrints(), nome + '.png'); await p.screenshot({ path: print }); }
  return { url: p.url(), campos, botoes, dialogos: await dialogos(p), toasts: await toasts(p), obrigatorios: await obrigatorios(p, false), tabelas, print };
}

module.exports = { esperar, pastaPrints, campo, ac, dd, texto, moeda, moedaId, digitar, dialogos, toasts, obrigatorios, salvar, acerto, docRef, menu, retrato };
