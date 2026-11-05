// Ajudantes dos complementos do cadastro de Pessoa (/fiscal/pessoa/form) — não vira passo.
// Cada complemento é um p-accordionTab com um p-tabView#dadosAdicionais-<i> (i = 0, 1...) e as abas Geral / Endereços / Produtor Rural.
// Nos args dos passos o complemento é contado a partir de 1 (como no toast "Complemento 1: ...").
// Campos de cada complemento: p-dropdown#indicadorInscricaoEstadual (aba Geral; id repetido em todos os complementos),
// input#inscricaoProdutor-<i> (aba Produtor Rural), input#perfilTributario, #emailPrincipal, #emailDocumentoEletronico.
// Quadro "Campos obrigatórios": app-validation-list .validation-list .list-group-item .message (um item por campo).
// Campo inválido: o .form-group do campo ganha a classe has-error + span.help-block com a mensagem.
const { limpo } = require('../../_comum');
const rede = require('../../../motor/lib/rede');

const tv = (p, n) => p.locator(`p-tabview#dadosAdicionais-${n - 1}`);
const card = (p, n) => p.locator('p-accordiontab').filter({ has: p.locator(`p-tabview#dadosAdicionais-${n - 1}`) }).first();

async function quantos(p) { return p.locator('p-tabview[id^="dadosAdicionais-"]').count(); }

// Espera o formulário carregar a pessoa (o documento chega depois da tela).
async function esperarPessoa(t) {
  const { p, tela } = t;
  const ident = p.locator('input#identificacao').first();
  await ident.waitFor({ timeout: 30000 });
  for (let i = 0; i < 80 && !(await ident.inputValue()); i++) await p.waitForTimeout(250);
  await tv(p, 1).waitFor({ state: 'attached', timeout: 30000 });
  await tela.pronto(p, 400);
}

async function abrirPessoa(t, id) {
  await t.tela.abrir(t.p, '/fiscal/pessoa/form?id=' + id);
  await esperarPessoa(t);
}

// Clica a aba do complemento pelo nome (Geral / Endereços / Produtor Rural — a tela mostra em caixa alta só por CSS).
async function abrirAba(t, n, nome) {
  const { p, tela } = t;
  const a = tv(p, n).locator('.p-tabview-nav li a').filter({ hasText: new RegExp(`^\\s*${nome}\\s*$`, 'i') }).first();
  if (!(await a.count())) throw new Error(`aba "${nome}" não encontrada no complemento ${n}`);
  await a.scrollIntoViewIfNeeded(); await a.click(); await tela.pronto(p, 300);
  const sel = await abaSelecionada(p, n);
  if (sel.toLowerCase() !== nome.toLowerCase()) throw new Error(`o clique na aba "${nome}" do complemento ${n} não a selecionou (selecionada: "${sel}")`);
}

async function abaSelecionada(p, n) {
  return limpo(await tv(p, n).locator('.p-tabview-nav li.p-highlight .p-tabview-title').first().textContent().catch(() => ''));
}

// Indicador inscrição estadual (dropdown da aba Geral) pelo clique. Sem contorno: se o clique não trocar, erro.
async function escolherIndicador(t, n, opcao) {
  const { p, tela } = t;
  await abrirAba(t, n, 'Geral');
  const d = tv(p, n).locator('p-dropdown#indicadorInscricaoEstadual .p-dropdown').first();
  await d.scrollIntoViewIfNeeded(); await d.click(); await tela.pronto(p, 300);
  const op = p.locator('li.p-dropdown-item:visible').filter({ hasText: new RegExp(`^\\s*${opcao}\\s*$`) }).first();
  await op.waitFor({ timeout: 5000 }).catch(() => {});
  if (!(await op.count())) {
    const vistas = (await p.locator('li.p-dropdown-item:visible').allInnerTexts()).map(limpo);
    throw new Error(`opção "${opcao}" não está no Indicador inscrição estadual do complemento ${n} (tem: ${vistas.join(' | ') || 'lista não abriu'})`);
  }
  await op.click(); await tela.pronto(p, 300);
  const v = limpo(await d.locator('.p-dropdown-label').innerText());
  if (v !== opcao) throw new Error(`o clique em "${opcao}" não trocou o Indicador inscrição estadual do complemento ${n} (ficou "${v}")`);
  return v;
}

// Inscrição produtor (aba Produtor Rural): digita e sai do campo (Tab, como o usuário faz para seguir no formulário).
async function informarInscricaoProdutor(t, n, valor) {
  const { p, tela } = t;
  await abrirAba(t, n, 'Produtor Rural');
  const inp = tv(p, n).locator(`input#inscricaoProdutor-${n - 1}`).first();
  if (!(await inp.count())) throw new Error(`campo "Inscrição produtor" (input#inscricaoProdutor-${n - 1}) não encontrado no complemento ${n}`);
  await tela.digitar(p, inp, String(valor));
  return inp.inputValue();
}

// Forma de recolhimento funrural (aba Produtor Rural; obrigatória quando há Inscrição produtor). Dropdown com painel no body.
async function escolherFunrural(t, n, opcao) {
  const { p, tela } = t;
  await abrirAba(t, n, 'Produtor Rural');
  const d = tv(p, n).locator('p-dropdown#opcaoFunrural .p-dropdown').first();
  if (limpo(await d.locator('.p-dropdown-label').innerText()) === opcao) return opcao;
  await d.scrollIntoViewIfNeeded(); await d.click(); await tela.pronto(p, 300);
  const op = p.locator('li.p-dropdown-item:visible').filter({ hasText: new RegExp(`^\\s*${opcao}\\s*$`, 'i') }).first();
  await op.waitFor({ timeout: 5000 }).catch(() => {});
  if (!(await op.count())) throw new Error(`opção "${opcao}" não está em Forma de recolhimento funrural (tem: ${(await p.locator('li.p-dropdown-item:visible').allInnerTexts()).map(limpo).join(' | ') || 'lista não abriu'})`);
  await op.click(); await tela.pronto(p, 300);
  const v = limpo(await d.locator('.p-dropdown-label').innerText());
  if (v.toLowerCase() !== opcao.toLowerCase()) throw new Error(`o clique em "${opcao}" não trocou a Forma de recolhimento funrural do complemento ${n} (ficou "${v}")`);
  return v;
}

// Recolhe / expande o card do complemento pelo botão de seta do cabeçalho.
async function cardAberto(p, n) {
  return card(p, n).evaluate((acc) => {
    const a = acc.querySelector('.p-accordion-header a');
    const c = acc.querySelector('.p-accordion-content, .p-toggleable-content');
    const vis = (e) => !!(e && (e.offsetParent || e.getClientRects().length) && e.getBoundingClientRect().height > 5);
    return (a ? a.getAttribute('aria-expanded') === 'true' : true) && vis(c);
  });
}
async function alternarCard(t, n, aberto) {
  const { p, tela } = t;
  if ((await cardAberto(p, n)) === aberto) return;
  const b = card(p, n).locator('.p-accordion-header .expandirRecolher button').first();
  await b.scrollIntoViewIfNeeded(); await b.click(); await tela.pronto(p, 500);
  if ((await cardAberto(p, n)) !== aberto) throw new Error(`o clique na seta não ${aberto ? 'expandiu' : 'recolheu'} o card do complemento ${n}`);
}

// Junta os toasts assim que aparecem (eles somem sozinhos).
async function observarToasts(p) {
  await p.evaluate(() => {
    window.__qaToasts = [];
    if (window.__qaObs) return;
    const pega = () => document.querySelectorAll('.p-toast-message').forEach((m) => {
      const s = m.innerText.replace(/\s+/g, ' ').trim();
      if (s && !window.__qaToasts.includes(s)) window.__qaToasts.push(s);
    });
    window.__qaObs = new MutationObserver(pega);
    window.__qaObs.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}
async function toastsVistos(p) {
  return p.evaluate(() => {
    const atuais = [...document.querySelectorAll('.p-toast-message')].map((m) => m.innerText.replace(/\s+/g, ' ').trim());
    const l = window.__qaToasts || [];
    for (const s of atuais) if (s && !l.includes(s)) l.push(s);
    return l;
  });
}

// Estado da validação na tela, sem clicar em nada (o foco fica onde o sistema deixou).
async function lerEstado(p) {
  const r = await p.evaluate(() => {
    const vis = (e) => !!(e && (e.offsetParent || e.getClientRects().length));
    const t = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const rgb = (c) => (String(c).match(/\d+(\.\d+)?/g) || []).map(Number);
    const vermelho = (c) => { const [r, g, b] = rgb(c); return r >= 150 && g < 110 && b < 110; };
    const lista = document.querySelector('.validation-list');
    const camposObrigatorios = lista && vis(lista) ? [...lista.querySelectorAll('.list-group-item')].filter(vis).map((x) => t(x.innerText)) : [];
    const a = document.activeElement;
    const complementos = [...document.querySelectorAll('p-tabview[id^="dadosAdicionais-"]')].map((tvw, i) => {
      const acc = tvw.closest('p-accordiontab');
      const hdA = acc && acc.querySelector('.p-accordion-header a');
      const cont = acc && acc.querySelector('.p-accordion-content, .p-toggleable-content');
      const sel = tvw.querySelector('.p-tabview-nav li.p-highlight .p-tabview-title');
      const liPr = [...tvw.querySelectorAll('.p-tabview-nav li')].find((li) => /produtor rural/i.test(li.innerText));
      const tit = liPr && (liPr.querySelector('.p-tabview-title') || liPr);
      const inp = tvw.querySelector(`input#inscricaoProdutor-${i}`);
      const fg = inp && inp.closest('.form-group');
      const hb = fg && fg.querySelector('.help-block');
      const painelPr = inp && inp.closest('.p-tabview-panel');
      const dd = tvw.querySelector('p-dropdown#indicadorInscricaoEstadual .p-dropdown-label');
      return {
        complemento: i + 1,
        cardExpandido: (hdA ? hdA.getAttribute('aria-expanded') === 'true' : true) && vis(cont) && cont.getBoundingClientRect().height > 5,
        abaSelecionada: sel ? t(sel.textContent) : null,
        conteudoProdutorVisivel: !!(painelPr && vis(painelPr) && !painelPr.hasAttribute('hidden')),
        indicador: dd ? t(dd.innerText) : null,
        tituloAbaProdutor: tit ? { cor: getComputedStyle(tit).color, classes: t((liPr.className || '') + ' ' + ((liPr.querySelector('a') || {}).className || '')), vermelho: vermelho(getComputedStyle(tit).color) } : null,
        campoInscricao: inp ? {
          valor: inp.value,
          ngInvalid: inp.classList.contains('ng-invalid'),
          hasError: !!(fg && fg.classList.contains('has-error')),
          mensagem: hb ? t(hb.innerText) : null,
          corMensagem: hb ? getComputedStyle(hb).color : null,
          corBorda: getComputedStyle(inp).borderColor,
          vermelho: !!(fg && fg.classList.contains('has-error')),
        } : null,
      };
    });
    return { camposObrigatorios, foco: a ? (a.id || a.tagName) : null, complementos };
  });
  r.url = p.url().replace(/^https?:\/\/[^/]+/, '');
  r.idUrl = (r.url.match(/[?&]id=(\d+)/) || [])[1] || null;
  return r;
}

// Clica Salvar (topo) e junta o que a tela mostrou. Não decide se salvou: quem chama confere no banco.
async function salvar(t, { espera = 2500 } = {}) {
  const { p, tela } = t;
  await observarToasts(p);
  const ini = Date.now();
  const b = p.locator('button[title="Salvar"]:visible').first();
  // O quadro "Campos obrigatórios" (canto superior direito) fica POR CIMA do botão Salvar em 1440/1600/1920 (o botão some atrás dele).
  // Aberto o quadro, a pessoa só alcança o Salvar fechando o quadro no X dele: o passo faz o mesmo e registra (via + ATENÇÃO).
  const coberto = () => b.evaluate((btn) => {
    const r = btn.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    if (el && btn.contains(el)) return null;
    if (!el) return 'nada';
    if (el.closest('.validation-list')) return 'quadro Campos obrigatórios';
    const toast = el.closest('.p-toast-message');
    if (toast) return 'toast: ' + toast.innerText.replace(/\s+/g, ' ').trim();
    return `${el.tagName}.${el.className}`;
  });
  let via = 'clique no Salvar';
  let cobertoPor = await coberto();
  // toast por cima do Salvar: a pessoa espera ele sumir (some sozinho em alguns segundos)
  if (cobertoPor && cobertoPor.startsWith('toast:')) {
    const t0 = Date.now(); const qual = cobertoPor;
    while (cobertoPor && cobertoPor.startsWith('toast:') && Date.now() - t0 < 15000) { await p.waitForTimeout(500); cobertoPor = await coberto(); }
    via = `esperou ${Math.round((Date.now() - t0) / 1000)}s o ${qual} sumir de cima do Salvar; `;
    t.anotar(`ATENÇÃO: o ${qual} ficou por cima do botão Salvar; foi preciso esperar ${Math.round((Date.now() - t0) / 1000)}s ele sumir para clicar`);
  }
  if (cobertoPor === 'quadro Campos obrigatórios') {
    const quadro = p.locator('.validation-list').first();
    const itensAntes = (await quadro.locator('.list-group-item').allInnerTexts()).map(limpo);
    await quadro.locator('.limpar a.pi-times').first().click(); await tela.pronto(p, 300);
    const ainda = await coberto();
    if (ainda) throw new Error(`fechei o quadro Campos obrigatórios no X, mas o Salvar continua coberto (${ainda})`);
    via = (via === 'clique no Salvar' ? '' : via) + 'fechou o quadro Campos obrigatórios (X) e clicou no Salvar';
    t.anotar(`ATENÇÃO: o quadro "Campos obrigatórios" (itens: ${itensAntes.join(', ')}) estava por cima do botão Salvar; foi preciso fechar o quadro no X para clicar Salvar`);
  } else if (cobertoPor) throw new Error(`botão Salvar coberto por ${cobertoPor}`);
  else if (via !== 'clique no Salvar') via += 'clicou no Salvar';
  await b.click();
  await tela.pronto(p, 300);
  await p.waitForTimeout(espera);   // toasts e o foco no campo (setTimeout do sistema) chegam logo depois
  const dialogos = (await p.locator('.p-dialog:visible, [role=alertdialog]:visible').allInnerTexts()).map((s) => limpo(s).slice(0, 300));
  const estado = await lerEstado(p);
  return { via, toasts: await toastsVistos(p), dialogos, errosApi: rede.errosDesde(p, ini), ...estado };
}

// Diálogo "Endereço" do complemento: preenche e salva o diálogo (não salva a pessoa).
// e = { tipo: 'Principal', cep?, logradouro, numero, bairro, cidade, uf, telefone }
async function preencherEndereco(t, dlg, e) {
  const { p, tela } = t;
  if (e.tipo) {
    const d = dlg.locator('p-dropdown#tipoEndereco .p-dropdown').first();
    const atual = limpo(await d.locator('.p-dropdown-label').innerText());
    // 1º endereço do complemento: a tela já traz "Principal" travado
    if (await d.evaluate((x) => x.classList.contains('p-disabled'))) {
      if (atual !== e.tipo) throw new Error(`Tipo de endereço travado em "${atual}" (pedido "${e.tipo}")`);
    } else if (atual !== e.tipo) {
    await d.click(); await tela.pronto(p, 300);
    const op = p.locator('li.p-dropdown-item:visible').filter({ hasText: new RegExp(`^\\s*${e.tipo}\\s*$`) }).first();
    if (!(await op.count())) throw new Error(`tipo de endereço "${e.tipo}" não está na lista (tem: ${(await p.locator('li.p-dropdown-item:visible').allInnerTexts()).map(limpo).join(' | ')})`);
    await op.click(); await tela.pronto(p, 300);
    const v = limpo(await d.locator('.p-dropdown-label').innerText());
    if (v !== e.tipo) throw new Error(`o clique não trocou o Tipo de endereço para "${e.tipo}" (ficou "${v}")`);
    }
  }
  if (e.cep) { await tela.digitar(p, dlg.locator('input[name=cep]').first(), e.cep); await tela.pronto(p, 800); }
  for (const [id, v] of [['logradouro', e.logradouro], ['numero', e.numero], ['bairro', e.bairro], ['telefonePrincipal', e.telefone]]) {
    if (v !== undefined && v !== null) await tela.digitar(p, dlg.locator(`input#${id}`).first(), v, { tab: false });
  }
  if (e.cidade) await escolherCidade(t, dlg, e.cidade, e.uf);
}

// Cidade é autocomplete: a linha mostra "<código><UF><nome>" (ex.: "1256SCChapecó"); escolhe a da UF pedida pelo clique.
async function escolherCidade(t, dlg, cidade, uf) {
  const { p, tela } = t;
  const inp = dlg.locator('input#cidade').first();
  await inp.click(); await inp.fill('');
  await p.keyboard.type(cidade.slice(0, 12), { delay: 50 });
  await tela.pronto(p, 600);
  const linhas = p.locator('.p-autocomplete-panel:visible li');
  await linhas.first().waitFor({ timeout: 8000 }).catch(() => {});
  const textos = (await linhas.allInnerTexts()).map(limpo);
  const alvo = new RegExp(`^\\d*\\s*${uf || '[A-Z]{2}'}\\s*${cidade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const i = textos.findIndex((x) => alvo.test(x));
  if (i < 0) throw new Error(`cidade "${cidade}/${uf}" não está no autocomplete (opções: ${textos.join(' | ') || 'nenhuma'})`);
  await linhas.nth(i).click(); await tela.pronto(p, 400);
  const v = await inp.inputValue();
  if (!v || !v.toLowerCase().includes(cidade.toLowerCase())) throw new Error(`o clique na cidade "${textos[i]}" não preencheu o campo (ficou "${v}")`);
  return v;
}

async function salvarDialogoEndereco(t, dlg) {
  const { p, tela } = t;
  await dlg.getByRole('button', { name: 'Salvar', exact: true }).click(); await tela.pronto(p, 500);
  await tela.confirmar(p, ['Sim']);
  if (await dlg.isVisible()) throw new Error(`diálogo de endereço não fechou no Salvar (tela: ${limpo(await dlg.innerText()).slice(0, 300)})`);
}

// Linhas da grade de endereços do complemento (aba Endereços).
async function lerEnderecos(t, n) {
  const { p } = t;
  await abrirAba(t, n, 'Endereços');
  return tv(p, n).locator('.p-tabview-panel:not([hidden]) table tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('td')].map((td) => td.innerText.replace(/\s+/g, ' ').trim()).slice(0, 7).join(' | ')));
}

// Perfil tributário do complemento (autocomplete aberto pela seta).
async function escolherPerfil(t, n, perfil) {
  const { p, tela } = t;
  await abrirAba(t, n, 'Geral');
  const ac = tv(p, n).locator('p-autocomplete#perfilTributario').first();
  await ac.locator('.p-autocomplete-dropdown').first().click();
  const ops = p.locator('.p-autocomplete-panel:visible li');
  await ops.first().waitFor({ timeout: 10000 }).catch(() => {});
  const textos = (await ops.allInnerTexts()).map(limpo);
  const i = textos.findIndex((o) => o === perfil || o.replace(/^\d+\s*/, '') === perfil);
  if (i < 0) throw new Error(`perfil "${perfil}" não está no Perfil tributário (tem: ${textos.join(' | ')})`);
  await ops.nth(i).click(); await tela.pronto(p, 300);
  const v = await ac.locator('input').first().inputValue();
  if (!v.includes(perfil)) throw new Error(`o clique no perfil "${perfil}" não preencheu o campo (ficou "${v}")`);
}

// Preenche o que a aba Geral pede no complemento novo: perfil, e-mails e indicador.
async function preencherGeral(t, n, { perfil, email, indicador }) {
  const { p, tela } = t;
  if (perfil) await escolherPerfil(t, n, perfil);
  if (email) {
    await abrirAba(t, n, 'Geral');
    for (const id of ['emailPrincipal', 'emailDocumentoEletronico']) await tela.digitar(p, tv(p, n).locator(`input#${id}`).first(), email);
  }
  if (indicador) await escolherIndicador(t, n, indicador);
}

module.exports = {
  tv, card, quantos, esperarPessoa, abrirPessoa, abrirAba, abaSelecionada, escolherIndicador, informarInscricaoProdutor, escolherFunrural,
  cardAberto, alternarCard, observarToasts, toastsVistos, lerEstado, salvar, preencherEndereco, escolherCidade,
  salvarDialogoEndereco, lerEnderecos, escolherPerfil, preencherGeral,
};
