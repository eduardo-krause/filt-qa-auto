// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Boleto híbrido"
// API: POST /retorno-boleto/aprovar { ids: [ID_RETORNO_BOLETO...] } → resultado (itens baixados / não baixados)
// Modais: "Confirmar aprovação dos recebimentos" (Voltar/Cancelar + Confirmar) e "Resultado da aprovação" (Fechar).
const { limpo } = require('../../_comum');
const { escopo, acharLinha, abrirMenuLinha, lerGrid, lerRodape, botoesDoDialogo, observarToasts } = require('./_apoio');

const textoDialogo = async (d) => (await d.innerText()).replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim();
const tabelaDialogo = (d) => d.evaluate((el) => [...el.querySelectorAll('table')].map((tb) => ({
  cabecalho: [...tb.querySelectorAll('thead th')].map((x) => x.innerText.trim()),
  linhas: [...tb.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((x) => x.innerText.replace(/\s+/g, ' ').trim())),
})));

module.exports = {
  // Seleciona e abre a confirmação de aprovação; lê o modal; executa a ação; lê o resultado (se confirmou).
  // args: { nossosNumeros: ['000312...'], modo: 'individual' (⋮ → Aprovar recebimento, 1 nosso número) | 'lote' (marca as
  //         caixas das linhas e clica em Aprovar selecionados), acao: 'cancelar' | 'confirmar', selecionarTodos?: true (lote pela caixa
  //         do cabeçalho em vez das linhas) }
  // devolve { selecao: {contador, aprovar, marcadas}, confirmacao: {titulo, texto, tabelas, botoes}, acao, depoisCancelar?,
  //           durante?: [estados dos botões enquanto processa], resultado?: {titulo, texto, tabelas, botoes}, toasts, errosApi,
  //           api?: {status, corpoEnviado, corpo}, depois: {contador, aprovar, marcadas, linhas: [{nosso, situacao, selecao}]} }
  async aprovarRetornos(t, { nossosNumeros = [], modo = 'lote', acao = 'cancelar', selecionarTodos = false }) {
    const { p, tela } = t;
    if (!['cancelar', 'confirmar'].includes(acao)) throw new Error(`acao inválida: ${acao} (use cancelar|confirmar)`);
    const e = escopo(p);
    const marcadas = async () => (await lerGrid(p)).linhas.filter((l) => l._selecao && l._selecao.marcada).map((l) => l['Nosso número']);
    const out = { modo, acao };

    // 1) selecionar / abrir a confirmação
    if (modo === 'individual') {
      if (nossosNumeros.length !== 1) throw new Error('modo individual: informe exatamente 1 nosso número');
      const linha = await acharLinha(t, nossosNumeros[0]);
      const { itens, menu } = await abrirMenuLinha(t, linha);
      const i = itens.findIndex((x) => x === 'Aprovar recebimento');
      if (i < 0) { await p.keyboard.press('Escape'); return { ...out, naoDisponivel: `"Aprovar recebimento" não está no menu (tem: ${itens.join(' | ')})` }; }
      out.selecao = { ...(await lerRodape(p)), marcadas: await marcadas() };
      await menu.nth(i).click(); await tela.pronto(p, 600);
    } else {
      if (selecionarTodos) {
        await e.locator('table thead th').first().locator('.p-checkbox-box').first().click(); await tela.pronto(p, 300);
      } else {
        for (const n of nossosNumeros) {
          const linha = await acharLinha(t, n);
          const box = linha.locator('td').first().locator('.p-checkbox-box').first();
          const antes = await box.getAttribute('class');
          await box.click(); await tela.pronto(p, 300);
          const depois = await box.getAttribute('class');
          if (antes === depois || !/p-highlight/.test(depois || '')) throw new Error(`a caixa de seleção do nosso número ${n} não marcou pelo clique (classe: ${depois})`);
        }
      }
      out.selecao = { ...(await lerRodape(p)), marcadas: await marcadas() };
      const ap = e.getByRole('button', { name: /Aprovar selecionados/i }).first();
      if (!(await ap.isEnabled())) return { ...out, naoDisponivel: 'botão Aprovar selecionados desabilitado depois da seleção' };
      await ap.click(); await tela.pronto(p, 600);
    }

    // 2) modal de confirmação
    const conf = p.locator('.p-dialog:visible').filter({ hasText: /Confirmar aprova/i }).last();
    await conf.waitFor({ timeout: 15000 }).catch(() => {});
    if (!(await conf.count())) return { ...out, semModal: true, toasts: await tela.toasts(p), dialogos: await tela.textoDialogos(p) };
    out.confirmacao = {
      titulo: limpo(await conf.locator('.p-dialog-header').first().innerText().catch(() => '')),
      texto: await textoDialogo(conf), tabelas: await tabelaDialogo(conf), botoes: await botoesDoDialogo(conf),
      links: await conf.locator('a').evaluateAll((as) => as.map((a) => `${a.innerText.trim()} → ${a.getAttribute('href')}`)),
    };

    // 3) ação
    if (acao === 'cancelar') {
      const b = conf.getByRole('button', { name: /^(Cancelar|Voltar)$/ }).first();
      if (!(await b.count())) throw new Error('modal de confirmação sem botão Cancelar/Voltar');
      out.botaoUsado = limpo(await b.innerText());
      await b.click(); await tela.pronto(p, 500);
      out.depoisCancelar = { modalFechou: !(await conf.isVisible().catch(() => false)), dialogos: await tela.textoDialogos(p) };
    } else {
      const b = conf.getByRole('button', { name: /^Confirmar( aprovação)?$/ }).first();
      if (!(await b.count())) throw new Error('modal de confirmação sem botão Confirmar');
      out.botaoUsado = limpo(await b.innerText());
      const api = {};
      const onResp = async (r) => {
        if (!/\/retorno-boleto\/aprovar/.test(r.url())) return;
        api.status = r.status();
        try { api.corpoEnviado = JSON.parse(r.request().postData() || 'null'); } catch (x) { api.corpoEnviado = r.request().postData(); }
        api.corpo = (await r.text().catch(() => '')).slice(0, 1500);
      };
      p.on('response', onResp);
      // enquanto processa: estado dos botões do modal e do loader
      const durante = [];
      let obs;
      try {
        obs = await observarToasts(t, async () => {
          await b.click();
          for (let i = 0; i < 6; i++) {
            const vis = await conf.isVisible().catch(() => false);
            durante.push({ ms: i * 150, modalVisivel: vis, botoes: vis ? await botoesDoDialogo(conf).catch(() => null) : null, loader: await p.locator('vs-loader .filtz-loader-container:visible, .loader:visible').count() });
            if (!vis) break;
            await p.waitForTimeout(150);
          }
        }, { minimo: 2000 });
      } finally { p.off('response', onResp); }
      out.durante = durante; out.api = api; out.toasts = obs.toasts; out.errosApi = obs.errosApi;
      const res = p.locator('.p-dialog:visible').filter({ hasText: /Resultado da aprova/i }).last();
      await res.waitFor({ timeout: 60000 }).catch(() => {});
      if (await res.count()) {
        out.resultado = { titulo: limpo(await res.locator('.p-dialog-header').first().innerText().catch(() => '')), texto: await textoDialogo(res), tabelas: await tabelaDialogo(res), botoes: await botoesDoDialogo(res) };
        const f = res.getByRole('button', { name: 'Fechar', exact: true }).first();
        if (await f.count()) { await f.click(); await tela.pronto(p, 800); out.resultado.fechou = !(await res.isVisible().catch(() => false)); }
      } else out.resultado = null;
    }

    // 4) depois: contador, seleção e situação das linhas envolvidas
    const linhas = [];
    for (const n of nossosNumeros) {
      const l = await acharLinha(t, n).catch(() => null);
      if (!l) { linhas.push({ nosso: n, naGrade: false }); continue; }
      const box = l.locator('td').first().locator('.p-checkbox-box').first();
      linhas.push({ nosso: n, situacao: limpo(await l.locator('.status-label, [class*=situacao-]').first().innerText().catch(() => '')), selecaoClasse: await box.getAttribute('class').catch(() => null) });
    }
    out.depois = { ...(await lerRodape(p)), marcadas: await marcadas(), linhas, toasts: await tela.toasts(p) };
    return out;
  },
};
