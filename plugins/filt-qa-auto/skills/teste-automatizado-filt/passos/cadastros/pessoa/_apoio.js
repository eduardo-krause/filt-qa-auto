// Ajudantes da modal "Consulta CPF/CNPJ - Receita Federal" do cadastro de Pessoa (não vira passo).
// Componente: fiscal/pessoa/consultaReceitaFederal (p-dialog styleClass "consulta-receita-federal"); a espera da consulta e o
// aviso de dados inválidos são p-dialog "consulta-receita-federal-auxiliar" (títulos "Consulta Receita Federal" e "Aviso").
const { limpo } = require('../../_comum');

const TITULO = 'Consulta CPF/CNPJ - Receita Federal';
const modal = (p) => p.locator('.p-dialog.consulta-receita-federal:visible').first();
const auxiliar = (p, titulo) => p.locator('.p-dialog.consulta-receita-federal-auxiliar:visible').filter({ has: p.locator('.p-dialog-header', { hasText: titulo }) }).first();

// Estado de um input (ou do input dentro do componente PrimeNG) + o rótulo dele.
async function estado(loc) {
  if (!(await loc.count())) return { existe: false };
  return loc.first().evaluate((e) => {
    const lab = e.id && document.querySelector(`label[for="${e.id}"]`);
    const comp = e.closest('p-calendar, p-autocomplete, p-dropdown');
    return {
      existe: true,
      rotulo: lab ? lab.innerText.replace(/\s+/g, ' ').trim() : null,
      obrigatorio: !!(lab && (lab.querySelector('.campo-obrigatorio') || /\*\s*$/.test(lab.innerText))),
      valor: e.value,
      desabilitado: e.disabled || !!(comp && comp.querySelector('.p-disabled')),
      somenteLeitura: e.readOnly,
      title: e.getAttribute('title'),
      placeholder: e.getAttribute('placeholder'),
    };
  });
}

async function estadoBotao(escopo, nome) {
  const b = escopo.getByRole('button', { name: nome, exact: true }).first();
  if (!(await b.count())) return { existe: false };
  return { existe: true, visivel: await b.isVisible(), habilitado: await b.isEnabled() };
}

// Texto do tooltip PrimeNG (pTooltip não vira atributo: só aparece ao passar o mouse). null = nenhum tooltip apareceu.
async function dica(p, loc) {
  try {
    await loc.scrollIntoViewIfNeeded({ timeout: 3000 });
    await loc.hover({ timeout: 3000 });
    const tip = p.locator('.p-tooltip:visible').last();
    await tip.waitFor({ timeout: 700 }).catch(() => {});
    const txt = (await tip.count()) ? limpo(await tip.innerText()) : null;
    await p.mouse.move(2, 2); await p.waitForTimeout(80);
    return txt;
  } catch (e) { return null; }
}

// Campos (rótulo + input readonly) de "Dados retornados" na aba visível da modal.
async function camposRetornados(p, m, { dicas = true } = {}) {
  const grupos = m.locator('.card-dados-retornados .form-group');
  const n = await grupos.count(); const out = [];
  for (let i = 0; i < n; i++) {
    const g = grupos.nth(i);
    const rotulo = limpo(await g.locator('label').first().innerText().catch(() => ''));
    const inp = g.locator('input, textarea').first();
    const e = await inp.evaluate((x) => ({ valor: x.value, desabilitado: x.disabled, somenteLeitura: x.readOnly, title: x.getAttribute('title') }));
    out.push({ rotulo, ...e, ...(dicas ? { dica: e.valor ? await dica(p, inp) : null } : {}) });
  }
  return out;
}

async function abaRetornada(p, m, nome) {
  await m.locator('.p-selectbutton .p-button, p-selectbutton .p-button').filter({ hasText: nome }).first().click();
  await p.waitForTimeout(300);
}

// Linhas da grade de IEs da modal.
async function gradeIes(p, m, { dicas = true } = {}) {
  const tab = m.locator('.grid-inscricoes table').first();
  const cab = (await tab.locator('thead th').allInnerTexts()).map(limpo);
  const linhas = tab.locator('tbody tr'); const n = await linhas.count(); const out = [];
  for (let i = 0; i < n; i++) {
    const tr = linhas.nth(i);
    const tds = tr.locator('td'); const nt = await tds.count();
    if (nt < cab.length) { out.push({ vazia: limpo(await tr.innerText()) }); continue; }
    const linha = { celulas: {}, dicas: {} };
    for (let j = 0; j < nt; j++) {
      const nome = cab[j] || String(j);
      if (j === 0) {
        linha.principal = await tds.nth(0).evaluate((td) => {
          const box = td.querySelector('.p-checkbox-box'); const inp = td.querySelector('input');
          return { marcado: !!(box && box.classList.contains('p-highlight')) || !!(inp && inp.checked), desabilitado: !!(box && box.classList.contains('p-disabled')) || !!(inp && inp.disabled), somenteLeitura: !!(inp && inp.readOnly) || !!td.querySelector('p-checkbox[ng-reflect-readonly="true"]') };
        });
        continue;
      }
      const v = limpo(await tds.nth(j).innerText());
      linha.celulas[nome] = v;
      if (dicas && v) linha.dicas[nome] = await dica(p, tds.nth(j));
    }
    out.push(linha);
  }
  return { cabecalho: cab, linhas: out };
}

// Diálogos e toasts visíveis agora (texto exato, sem a modal principal).
async function avisos(p) {
  return p.evaluate(() => {
    const vis = (d) => !!(d.offsetParent || d.getClientRects().length);
    const dialogos = [...document.querySelectorAll('.p-dialog, [role=alertdialog]')].filter(vis)
      .filter((d) => !d.classList.contains('consulta-receita-federal'))
      .map((d) => d.innerText.replace(/[ \t]+/g, ' ').replace(/\n+/g, ' | ').trim());
    const toasts = [...document.querySelectorAll('.p-toast-message')].map((x) => x.innerText.replace(/\s+/g, ' ').trim());
    return { dialogos, toasts };
  });
}

// Vai juntando, sem repetir, os avisos que aparecem (toast some sozinho).
function coletor(p) {
  const vistos = new Set(); const lista = [];
  return {
    lista,
    async coletar() {
      const a = await avisos(p).catch(() => ({ dialogos: [], toasts: [] }));
      for (const x of [...a.dialogos.map((v) => 'DIALOGO: ' + v), ...a.toasts.map((v) => 'TOAST: ' + v)]) if (!vistos.has(x)) { vistos.add(x); lista.push(x); }
    },
  };
}

// Filtros da modal (CPF/CNPJ, data, UF) + botões.
async function filtros(m) {
  return {
    cpfCnpj: await estado(m.locator('#consultaIdentificacao')),
    dataNascimento: await estado(m.locator('#consultaDataNascimento')),
    uf: await estado(m.locator('#consultaUf')),
    pesquisarDados: await estadoBotao(m, 'Pesquisar dados'),
    cancelar: await estadoBotao(m, 'Cancelar'),
    retornarDados: await estadoBotao(m, 'Retornar dados'),
  };
}

// Linhas do painel do autocomplete de UF (aberto agora).
const painelUf = (p) => p.locator('.consulta-receita-federal-uf-painel:visible li, .p-autocomplete-panel:visible li');
async function opcoesUf(p) {
  return painelUf(p).evaluateAll((ls) => ls.map((l) => ({ texto: l.innerText.replace(/\s+/g, ' ').trim(), sigla: (l.querySelector('.autocomplete-id') || {}).innerText || null })));
}

// Escolhe a UF pela sigla (ou nome) digitando no campo e clicando na linha. Não contorna: se o clique não preencher, devolve via 'falhou'.
async function escolherUf(p, m, uf, { digitar = true } = {}) {
  const inp = m.locator('#consultaUf');
  if (digitar) { await inp.click(); await inp.fill(''); await p.keyboard.type(String(uf), { delay: 60 }); }
  await painelUf(p).first().waitFor({ timeout: 8000 }).catch(() => {});
  const ops = await opcoesUf(p);
  const alvo = String(uf).trim().toUpperCase();
  const i = ops.findIndex((o) => (o.sigla || '').trim().toUpperCase() === alvo || o.texto.toUpperCase() === alvo || o.texto.toUpperCase().endsWith(' ' + alvo));
  if (i < 0) return { opcoes: ops.map((o) => o.texto), escolhida: null, valor: await inp.inputValue(), via: 'nenhuma' };
  await painelUf(p).nth(i).click(); await p.waitForTimeout(400);
  const valor = await inp.inputValue();
  return { opcoes: ops.map((o) => o.texto), escolhida: ops[i].texto, valor, via: valor ? 'mouse' : 'falhou' };
}

// Rótulo → valor de todos os campos visíveis dentro do escopo (input, dropdown, multiselect, chips, checkbox, switch).
// ignorar: seletor de partes do escopo a pular (ex.: os complementos).
async function lerRotulos(escopo, ignorar) {
  return escopo.evaluate((raiz, ign) => {
    const vis = (e) => !!(e.offsetParent || e.getClientRects().length);
    const t = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const sel = 'input:not([type=hidden]),textarea,.p-dropdown-label,.p-multiselect-label,.p-autocomplete-token,.p-checkbox,.p-inputswitch';
    return [...raiz.querySelectorAll('label')].filter(vis).filter((l) => !(ign && l.closest(ign))).map((l) => {
      let c = l.parentElement; for (let i = 0; i < 4 && c && !c.querySelector(sel); i++) c = c.parentElement;
      const r = { rotulo: t(l.innerText) };
      if (!c) return r;
      const tokens = [...c.querySelectorAll('.p-autocomplete-token-label, .p-autocomplete-token .p-autocomplete-token-label')].map((x) => t(x.innerText));
      const dd = c.querySelector('.p-dropdown-label, .p-multiselect-label');
      const inp = c.querySelector('input:not([type=hidden]):not([type=checkbox]):not([role=checkbox]),textarea');
      const chk = c.querySelector('.p-checkbox-box, .p-inputswitch');
      if (tokens.length) r.valor = tokens.join(', ');
      else if (dd) r.valor = t(dd.innerText);
      else if (inp) r.valor = inp.value;
      else if (chk) r.valor = chk.classList.contains('p-highlight') || chk.classList.contains('p-inputswitch-checked') ? 'marcado' : 'desmarcado';
      const alvo = inp || c.querySelector('.p-dropdown, .p-multiselect, .p-autocomplete, .p-checkbox-box');
      if (alvo) r.desabilitado = !!(alvo.disabled || alvo.classList.contains('p-disabled') || (alvo.closest('.p-disabled')));
      if (inp && inp.readOnly) r.somenteLeitura = true;
      return r;
    });
  }, ignorar || null);
}

// Um complemento: card "Complemento principal"/"Definir como principal" com abas Geral, Endereços e Produtor Rural
// (p-tabView#dadosAdicionais-N). Lê as três abas e volta para Geral.
async function lerComplemento(p, tv) {
  const card = tv.locator('xpath=ancestor::p-accordiontab[1]');
  const cab = limpo(await card.locator('.p-accordion-header').first().innerText().catch(() => ''));
  const c = { cabecalho: cab, principal: /principal/i.test(cab) && !/definir como principal/i.test(cab), inativo: /inativo/i.test(cab) };
  const aba = async (nome) => {
    const li = tv.locator('.p-tabview-nav li').filter({ hasText: new RegExp(`^\\s*${nome}\\s*$`, 'i') }).first();
    await li.click(); await p.waitForTimeout(400);
    return tv.locator('.p-tabview-panel:not([hidden])').first();
  };
  c.geral = await lerRotulos(await aba('Geral'));
  const end = await aba('Endereços');
  c.enderecos = await end.locator('table').first().evaluate((tab) => {
    const t = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const cab = [...tab.querySelectorAll('thead th')].map((x) => t(x.innerText));
    return [...tab.querySelectorAll('tbody tr')].map((tr) => {
      const tds = [...tr.querySelectorAll('td')];
      if (tds.length < 2) return { vazia: t(tr.innerText) };
      const o = {}; tds.forEach((td, i) => { o[cab[i] || 'col' + i] = t(td.innerText) || (td.querySelector('.p-highlight, .pi-check, [class*=check]') ? 'marcado' : ''); });
      return o;
    });
  }).catch((e) => [{ erro: 'tabela de endereços não lida: ' + e.message.split('\n')[0] }]);
  // a grade não mostra Complemento nem Telefone Comercial: abre cada endereço pelo lápis (o <a> é display:contents, clicar no ícone), lê e sai pelo Cancelar
  const linhas = end.locator('table tbody tr:visible');
  for (let i = 0; i < c.enderecos.length; i++) {
    if (c.enderecos[i].vazia || c.enderecos[i].erro) continue;
    const tr = linhas.nth(i); await tr.hover().catch(() => {});
    const lapis = tr.locator('td.table-body-actions app-editar i').first();
    if (!(await lapis.count())) { c.enderecos[i].detalhe = 'sem lápis de editar'; continue; }
    await lapis.click(); await p.waitForTimeout(600);
    const dlg = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: /^\s*Endereço\s*$/ }) }).last();
    if (!(await dlg.count())) { c.enderecos[i].detalhe = 'diálogo Endereço não abriu no lápis'; continue; }
    c.enderecos[i].detalhe = (await lerRotulos(dlg)).filter((x) => x.valor !== undefined);
    await dlg.getByRole('button', { name: 'Cancelar', exact: true }).click(); await p.waitForTimeout(400);
    if (await dlg.count()) c.enderecos[i].fechouNoCancelar = false;
  }
  c.produtorRural = await lerRotulos(await aba('Produtor Rural'));
  await aba('Geral');
  return c;
}

// Cadastro aberto na tela: seção Pessoa + cada complemento (Geral, Endereços com o detalhe de cada um, Produtor Rural).
async function lerCadastro(p) {
  const pessoa = await lerRotulos(p.locator('p-accordiontab.accordion-pessoa').first());
  const tvs = p.locator('p-tabview[id^="dadosAdicionais-"]');
  const n = await tvs.count(); const complementos = [];
  for (let i = 0; i < n; i++) complementos.push({ indice: i, ...(await lerComplemento(p, tvs.nth(i))) });
  return { pessoa, complementos };
}

// Clica Salvar do cadastro de Pessoa e lê as mensagens: avisos (diálogos/toasts), quadro "Campos obrigatórios",
// campos inválidos visíveis (rótulos, sem repetir) e textos de erro. Se o botão não aceitar o clique, devolve quem cobre
// (não clica à força). devolve { avisos, quadroObrigatorios, invalidos, textosErro, url, idUrl, salvarBloqueado? }
async function salvarPessoa(t, { esperaAvisos = 4000 } = {}) {
  const { p, tela } = t; const r = {};
  const bt = p.getByRole('button', { name: 'Salvar', exact: true }).first();
  const livre = await bt.click({ trial: true, timeout: 5000 }).then(() => null).catch((e) => e.message.split('\n').filter((l) => /intercepts|not (visible|enabled|stable)/i.test(l)).slice(0, 2).join(' ') || e.message.split('\n')[0]);
  const col = coletor(p);
  if (livre) { r.salvarBloqueado = livre; t.anotar('ATENÇÃO: botão Salvar não aceita o clique — ' + livre); }
  else {
    await bt.click();
    const ini = Date.now();
    while (Date.now() - ini < esperaAvisos) { await col.coletar(); await p.waitForTimeout(300); }
    await tela.pronto(p, 500); await col.coletar();
  }
  r.avisos = col.lista;
  r.invalidos = [...new Set(await p.evaluate(() => {
    const vis = (e) => !!(e.offsetParent || e.getClientRects().length);
    const rot = (e) => { const id = e.id || (e.querySelector('input') || {}).id; const l = id && document.querySelector(`label[for="${id}"]`); return l ? l.innerText.trim() : (e.getAttribute('validationlabel') || e.getAttribute('name') || e.tagName); };
    return [...document.querySelectorAll('.ng-invalid:not(form):not(ng-form)')].filter(vis).filter((e) => !e.querySelector('.ng-invalid')).map(rot);
  }))];
  // quadro "Campos obrigatórios" do Filt (canto superior direito; não é p-dialog nem p-toast): texto completo + classe
  r.quadroObrigatorios = await p.evaluate(() => {
    const vis = (e) => !!(e.offsetParent || e.getClientRects().length);
    const cab = [...document.querySelectorAll('body *')].filter((e) => vis(e) && e.children.length === 0 && /^\s*Campos obrigatórios\s*$/.test(e.textContent))[0];
    if (!cab) return null;
    let c = cab; for (let i = 0; i < 5 && c.parentElement && c.innerText.trim() === cab.innerText.trim(); i++) c = c.parentElement;
    return { classe: String(c.className || ''), texto: c.innerText.replace(/[ \t]+/g, ' ').replace(/\n+/g, ' | ').trim() };
  });
  r.textosErro = (await p.locator('.p-error:visible, .invalid-feedback:visible, .p-invalid:visible small, .validation-message:visible, .tooltip-validation:visible').allInnerTexts()).map(limpo).filter(Boolean);
  r.url = p.url().replace(/^https?:\/\/[^/]+/, '');
  r.idUrl = (r.url.match(/[?&]id=(\d+)/) || [])[1] || null;
  return r;
}

module.exports = { salvarPessoa, lerComplemento, lerCadastro, lerRotulos, TITULO, modal, auxiliar, estado, estadoBotao, dica, camposRetornados, abaRetornada, gradeIes, avisos, coletor, filtros, painelUf, opcoesUf, escolherUf };
