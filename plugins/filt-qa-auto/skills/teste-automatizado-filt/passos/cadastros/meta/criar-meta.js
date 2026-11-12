// Tela: ERP › Cadastros › Metas › Meta (/fiscal/meta, form /fiscal/meta/form)
// Ids do formulário (meta.form.component.html): #descricao; p-dropdown #tipoMetaOperacaoMetrificar / #tipoMetaOperacaoDeduzir
// (+ autocompletes #naturezaDeOperacao*, #tipoNaturezaOperacao*, #statusPedido*); #formula; p-dropdown #tipoMetaItem
// (+ #nivelGrupo = app-parametro-preco-nivel-grupo com diálogo "Níveis de Grupo", #marcaItem, #produto); #estabelecimentoMeta;
// #tipoResponsavelAtingirMeta (+ #grupoUsuario, #usuario); #tipoResponsavelMeta; #tipoVisualizador (+ #grupoUsuarioVisualizador,
// #usuarioVisualizador); #tipoCampoData; p-calendar #dataInicial/#dataFinal; #tipoPeriodo; métricas #valorMetrica{i}.
// Sem novas tentativas: controle que não responde vira erro com o que a tela mostrou (contorno é bug).

const limpo = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Escolhe a opção (texto igual) no p-dropdown aberto pelo clique no componente.
async function escolher(t, id, opcao) {
  const { p, tela } = t;
  const d = p.locator(`p-dropdown#${id} .p-dropdown`).first();
  await d.scrollIntoViewIfNeeded();
  await d.click();
  await tela.esperar(p, 500);
  const todas = p.locator('li.p-dropdown-item:visible, li[role=option]:visible');
  const vistas = (await todas.allInnerTexts()).map(limpo);
  const op = todas.filter({ hasText: new RegExp(`^\\s*${esc(opcao)}\\s*$`, 'i') }).first();
  if (!(await op.count())) throw new Error(`opção "${opcao}" não existe no dropdown #${id} (opções: ${vistas.join(' | ') || 'nenhuma'})`);
  await op.click();
  await tela.pronto(p, 400);
  return vistas;
}

// p-dropdown pelo id. `dependente`: seletor que tem que aparecer depois da escolha (ex.: '#nivelGrupo' para Item = Grupo).
// Defeito conhecido do form de Meta: numa meta nova o dropdown MOSTRA uma opção (Grupo, Global, Criador, Data de Criação)
// sem valor no formulário, e escolher a mesma opção não grava. Contorno: trocar para outra opção e voltar — sempre registrado
// em t.registro (via) e anotado como ATENÇÃO.
async function dd(t, id, opcao, dependente) {
  const { p, tela } = t;
  const host = p.locator(`p-dropdown#${id}`).first();
  const antes = limpo(await host.locator('.p-dropdown-label').innerText());
  const vistas = await escolher(t, id, opcao);
  const lido = limpo(await host.locator('.p-dropdown-label').innerText());
  if (lido.toLowerCase() !== String(opcao).toLowerCase()) throw new Error(`dropdown #${id}: escolhi "${opcao}" e ficou "${lido}"`);
  const vazio = /ng-invalid/.test((await host.getAttribute('class')) || '');
  const semDependente = dependente ? !(await p.locator(dependente).count()) : false;
  t.vias = t.vias || {};
  if (!vazio && !semDependente) { t.vias[id] = 'mouse'; return; }
  if (antes.toLowerCase() !== String(opcao).toLowerCase()) throw new Error(`dropdown #${id}: escolhi "${opcao}" e o formulário continuou ${vazio ? 'sem valor (ng-invalid)' : `sem o campo ${dependente}`}`);
  const outra = vistas.find((v) => v.toLowerCase() !== String(opcao).toLowerCase() && !/^selecione$/i.test(v));
  await escolher(t, id, outra);
  await escolher(t, id, opcao);
  t.vias[id] = 'troca-e-volta';
  t.anotar(`ATENÇÃO: dropdown ${id} mostrava "${antes}" sem valor no formulário; precisou trocar para outra opção ("${outra}") e voltar`);
  const vazio2 = /ng-invalid/.test((await host.getAttribute('class')) || '');
  const sem2 = dependente ? !(await p.locator(dependente).count()) : false;
  if (vazio2 || sem2) throw new Error(`dropdown #${id}: mesmo trocando para "${outra}" e voltando, "${opcao}" não ficou no formulário`);
}

// p-autocomplete (simples ou múltiplo) pelo inputId: digita e clica na opção que contém o texto (uma tentativa só).
async function ac(t, id, texto, opcao) {
  const { p, tela } = t;
  const inp = p.locator(`input#${id}`).first();
  await inp.waitFor({ state: 'visible', timeout: 20000 }).catch(() => { throw new Error(`campo #${id} não apareceu`); });
  await inp.scrollIntoViewIfNeeded();
  await inp.click();
  await p.keyboard.type(String(texto).slice(0, 20), { delay: 40 });
  await tela.pronto(p, 700);
  const alvo = String(opcao || texto);
  const itens = p.locator('.p-autocomplete-panel:visible li');
  await itens.first().waitFor({ timeout: 8000 }).catch(() => {});
  const textos = (await itens.allInnerTexts()).map(limpo);
  let i = textos.findIndex((x) => x === alvo || x.replace(/^\d+\s*-\s*/, '') === alvo);
  if (i < 0) i = textos.findIndex((x) => x.includes(alvo));
  if (i < 0) throw new Error(`opção "${alvo}" não encontrada no autocomplete #${id} (opções: ${textos.slice(0, 10).join(' | ') || 'nenhuma'})`);
  await itens.nth(i).click();
  await tela.pronto(p, 400);
}

// Chips (seleções) de um autocomplete múltiplo.
async function chips(p, id) {
  return (await p.locator(`p-autocomplete#${id} .p-autocomplete-token-label`).allInnerTexts()).map(limpo);
}

// Grupo por nível: abre o diálogo "Níveis de Grupo" e marca o nó do caminho (["DEFENSIVO"] ou ["DEFENSIVO","DEFENSIVO FILHO"]).
async function marcarGrupo(t, caminho) {
  const { p, tela } = t;
  await p.locator('#nivelGrupo button.nivel-grupo-button-add-chips').first().click();
  await tela.pronto(p, 600);
  const dlg = p.locator('.p-dialog:visible').filter({ hasText: 'Níveis de Grupo' }).last();
  await dlg.waitFor({ timeout: 15000 }).catch(() => { throw new Error('diálogo "Níveis de Grupo" não abriu'); });
  for (let n = 0; n < caminho.length; n++) {
    const nome = caminho[n];
    const conteudo = dlg.locator('.p-treenode-content').filter({
      has: p.locator('.p-treenode-label', { hasText: new RegExp(`^\\s*(\\d+\\s*-\\s*)?${esc(nome)}\\s*$`) }),
    }).filter({ visible: true }).first();
    if (!(await conteudo.count())) {
      const vistos = (await dlg.locator('.p-treenode-label:visible').allInnerTexts()).map(limpo).slice(0, 30);
      throw new Error(`nó "${nome}" não está na árvore de grupos (vistos: ${vistos.join(' | ')})`);
    }
    if (n < caminho.length - 1) {
      // nível de cima: só expande para achar o filho
      const filhoVisivel = await dlg.locator('.p-treenode-label:visible').filter({ hasText: caminho[n + 1] }).count();
      if (!filhoVisivel) { await conteudo.locator('.p-tree-toggler').first().click(); await tela.pronto(p, 500); }
    } else {
      await conteudo.locator('.p-checkbox-box').first().click();
      await tela.pronto(p, 300);
    }
  }
  await dlg.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await tela.pronto(p, 600);
  return (await p.locator('#nivelGrupo .p-chips-token-label, #nivelGrupo .p-chips-token').allInnerTexts()).map(limpo);
}

async function data(t, id, valor) {
  const { p, tela } = t;
  const inp = p.locator(`p-calendar#${id} input`).first();
  await inp.scrollIntoViewIfNeeded();
  await tela.data(p, inp, valor);
  const lido = await inp.inputValue();
  if (lido !== valor) throw new Error(`data #${id}: digitei "${valor}" e ficou "${lido}"`);
}

module.exports = {
  // Cria uma meta pela tela. args:
  //  { descricao,
  //    metrificar: { tipo:'Natureza de Operação'|'Tipo de Natureza de Operação', naturezas:[], tipos:[], status:[] },
  //    deduzir:    { tipo, naturezas:[], tipos:[] }               (opcional)
  //    formula: 'descrição',
  //    item: { tipo:'Grupo'|'Item'|'Marca', grupos:[['DEFENSIVO'],['DEFENSIVO','DEFENSIVO FILHO']], marcas:[], itens:[] },
  //    estabelecimentos: ['BASE KRAUSE'],
  //    atingir: { tipo:'Global'|'Coletiva'|'Individual', grupos:[], usuarios:[] },
  //    responsavel: 'Criador'|'Vendedor'|'Comprador'|'Todos',     (opcional)
  //    visualizador: { tipo:'Global'|'Coletiva'|'Individual', grupos:[], usuarios:[] },
  //    campoData: 'Data de Emissão', dataInicial:'dd/mm/aaaa', dataFinal:'dd/mm/aaaa', periodo:'Período',
  //    valores: [1000] (um por métrica gerada; se vier 1 valor só, vale para todas), salvar: true }
  //  → { status, toasts, dialogos, id (banco), metricas, lido }
  async criar(t, a) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/meta/form');
    await p.locator('input#descricao').waitFor({ timeout: 30000 });
    const lido = {};

    await tela.digitar(p, p.locator('input#descricao'), a.descricao);

    if (a.metrificar) {
      await dd(t, 'tipoMetaOperacaoMetrificar', a.metrificar.tipo);
      for (const n of a.metrificar.naturezas || []) await ac(t, 'naturezaDeOperacaoMetrificar', n);
      for (const n of a.metrificar.tipos || []) await ac(t, 'tipoNaturezaOperacaoMetrificar', n);
      for (const s of a.metrificar.status || []) await ac(t, 'statusPedidoMetrificar', s);
      lido.metrificar = [...(await chips(p, 'naturezaDeOperacaoMetrificar')), ...(await chips(p, 'tipoNaturezaOperacaoMetrificar'))];
    }
    if (a.deduzir) {
      await dd(t, 'tipoMetaOperacaoDeduzir', a.deduzir.tipo);
      for (const n of a.deduzir.naturezas || []) await ac(t, 'naturezaDeOperacaoDeduzir', n);
      for (const n of a.deduzir.tipos || []) await ac(t, 'tipoNaturezaOperacaoDeduzir', n);
    }
    if (a.formula) { await ac(t, 'formula', a.formula); lido.formula = await p.locator('input#formula').inputValue(); }

    if (a.item) {
      await dd(t, 'tipoMetaItem', a.item.tipo, { Grupo: '#nivelGrupo button', Marca: 'input#marcaItem', Item: 'input#produto' }[a.item.tipo]);
      if (a.item.grupos) for (const g of a.item.grupos) lido.grupos = await marcarGrupo(t, [].concat(g));
      for (const m of a.item.marcas || []) await ac(t, 'marcaItem', m);
      for (const i of a.item.itens || []) await ac(t, 'produto', i);
      if (a.item.marcas) lido.marcas = await chips(p, 'marcaItem');
      if (a.item.itens) lido.itens = await chips(p, 'produto');
    }

    for (const e of a.estabelecimentos || []) await ac(t, 'estabelecimentoMeta', e);
    lido.estabelecimentos = await chips(p, 'estabelecimentoMeta');

    if (a.atingir) {
      await dd(t, 'tipoResponsavelAtingirMeta', a.atingir.tipo, { Coletiva: 'input#grupoUsuario', Individual: 'input#usuario' }[a.atingir.tipo]);
      for (const g of a.atingir.grupos || []) await ac(t, 'grupoUsuario', g);
      for (const u of a.atingir.usuarios || []) await ac(t, 'usuario', u);
      lido.atingir = [...(await chips(p, 'grupoUsuario')), ...(await chips(p, 'usuario'))];
    }
    if (a.responsavel) await dd(t, 'tipoResponsavelMeta', a.responsavel);
    if (a.visualizador) {
      await dd(t, 'tipoVisualizador', a.visualizador.tipo, { Coletiva: 'input#grupoUsuarioVisualizador', Individual: 'input#usuarioVisualizador' }[a.visualizador.tipo]);
      for (const g of a.visualizador.grupos || []) await ac(t, 'grupoUsuarioVisualizador', g);
      for (const u of a.visualizador.usuarios || []) await ac(t, 'usuarioVisualizador', u);
    }
    if (a.campoData) await dd(t, 'tipoCampoData', a.campoData);
    if (a.dataInicial) await data(t, 'dataInicial', a.dataInicial);
    if (a.dataFinal) await data(t, 'dataFinal', a.dataFinal);
    if (a.periodo) await dd(t, 'tipoPeriodo', a.periodo);

    // métricas geradas pelo período
    const valores = p.locator('input[id^=valorMetrica]');
    const n = await valores.count();
    for (let i = 0; i < n && a.valores && a.valores.length; i++) {
      const v = a.valores.length === 1 ? a.valores[0] : a.valores[i];
      if (v === undefined) continue;
      await tela.digitar(p, p.locator(`input#valorMetrica${i}`), tela.moeda(v));
    }
    lido.metricas = [];
    for (let i = 0; i < n; i++) {
      lido.metricas.push({
        inicio: await p.locator(`p-calendar#dataInicialMetrica${i} input`).first().inputValue().catch(() => null),
        fim: await p.locator(`p-calendar#dataFinalMetrica${i} input`).first().inputValue().catch(() => null),
        valor: await p.locator(`input#valorMetrica${i}`).inputValue(),
      });
    }

    if (a.salvar === false) return { status: 'nao_salvo', lido };
    const s = await tela.salvar(p);
    // campos marcados inválidos pela tela: "Rótulo (#id) = valor mostrado"
    const obrig = await p.evaluate(() => {
      const vis = (e) => !!(e.offsetWidth || e.offsetHeight);
      const r = [...document.querySelectorAll('form .form-group .ng-invalid[id]')].filter(vis).map((e) => {
        const l = e.closest('.form-group').querySelector('label');
        return `${l ? l.innerText.trim() : '?'} (#${e.id}) = "${(e.querySelector('.p-dropdown-label') || e).innerText?.trim() || (e.value ?? '')}"`;
      });
      return [...new Set(r)];
    });
    const l = await t.banco.linha('select ID_META, DESCRICAO, DATA_INICIO_PERIODO, DATA_FIM_PERIODO from META where DESCRICAO = ? order by ID_META desc limit 1', [a.descricao]);
    return { vias: t.vias, status: s.status, toasts: s.toasts, dialogos: s.dialogos, invalidos: s.status === "salvo" ? [] : obrig, url: p.url(), id: l && l.ID_META, banco: l, lido };
  },
};
