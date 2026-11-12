// Tela: Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N) › menu ⋮ (#dropdown-help) › Auditoria.
// Só lê. A auditoria v2 (app-auditoria-template) mostra abas, "Comparativo - <aba>", grupos (accordion) e duas caixas
// (app-auditoria-box) com dropdown "Versão" + Usuário/Data e hora/Operação + lista de campos (.auditoria-container li).
const { abrirForm } = require('./_apoio');

async function lerCaixa(box, tela) {
  const versao = tela.limpo(await box.locator('p-dropdown .p-dropdown-label').first().innerText());
  const info = (await box.locator('.span-rev-info').allInnerTexts()).map(tela.limpo);
  const campos = await box.locator('.auditoria-container li').evaluateAll((ls) => ls.map((li) => {
    const cs = getComputedStyle(li);
    const filhos = [...li.querySelectorAll('*')].map((x) => x.className && String(x.className)).filter(Boolean);
    return { texto: li.innerText.replace(/\s+/g, ' ').trim(), classe: String(li.className), filhos: [...new Set(filhos)].join(' | '), fundo: cs.backgroundColor, cor: cs.color, borda: cs.borderLeft, estilo: li.getAttribute('style') || '' };
  }));
  return { versao, usuario: info[0], dataHora: info[1], operacao: info[2], campos };
}

module.exports = {
  // args: { id, versoes?: [n1, n2] (número da versão em cada caixa, ex.: [1, 2]), pagina?: 'duplicata-pagar' | 'duplicata-receber' }
  // → { titulo, abas, comparativo, grupos, opcoesVersao, esquerda, direita, colunasApi, revisoesApi, errosApi }
  async lerAuditoria(t, { id, versoes, pagina = 'duplicata-pagar' }) {
    const { p, tela } = t;
    const rede = require('../../../motor/lib/rede');
    const api = { colunas: null, revisoes: null, schema: null };
    const ouvir = async (r) => {
      const u = r.url();
      if (!/auditoria2/.test(u)) return;
      try {
        const j = await r.json();
        if (/\/versions\?/.test(u)) api.revisoes = (j[0] || {}).versions;
        if (/\?revisionX=/.test(u)) { api.colunas = (j.columnList || []).length; api.schema = (j.table || {}).schemaName; api.valueX = j.valueX && { REV: j.valueX.REV, DATA_VENCIMENTO: j.valueX.DATA_VENCIMENTO, JUSTIFICATIVA_VENCIMENTO: j.valueX.JUSTIFICATIVA_VENCIMENTO }; api.valueY = j.valueY && { REV: j.valueY.REV, DATA_VENCIMENTO: j.valueY.DATA_VENCIMENTO, JUSTIFICATIVA_VENCIMENTO: j.valueY.JUSTIFICATIVA_VENCIMENTO }; }
      } catch (e) {}
    };
    p.on('response', ouvir);
    const ini = Date.now();
    try {
      if (pagina === 'duplicata-pagar') await abrirForm(p, id);
      else { await tela.abrir(p, `/financeiro/${pagina}/form?id=${id}`); await tela.semLoader(p); }
      await p.locator('#dropdown-help').click(); await tela.pronto(p, 400);
      const itensMenu = (await p.locator('.dropdown-menu.show a').allInnerTexts()).map(tela.limpo);
      await p.locator('.dropdown-menu.show a').filter({ hasText: 'Auditoria' }).first().click(); await tela.pronto(p, 1000);
      const d = p.locator('.p-dialog:visible').filter({ hasText: 'Auditoria' }).last();
      await d.waitFor({ timeout: 30000 }); await tela.pronto(p, 1000);
      const caixas = d.locator('app-auditoria-box');
      let opcoesVersao = [];
      if (versoes) {
        for (let i = 0; i < 2; i++) {
          await caixas.nth(i).locator('p-dropdown .p-dropdown').first().click(); await tela.pronto(p, 500);
          const ops = p.locator('li.p-dropdown-item:visible, li[role=option]:visible');
          opcoesVersao = (await ops.allInnerTexts()).map(tela.limpo);
          const k = opcoesVersao.findIndex((x) => x.startsWith(versoes[i] + ' - '));
          if (k < 0) throw new Error(`versão ${versoes[i]} não está no seletor (tem: ${opcoesVersao.join(' | ')})`);
          await ops.nth(k).click(); await tela.pronto(p, 1000);
        }
      } else if (await caixas.count()) {
        await caixas.first().locator('p-dropdown .p-dropdown').first().click(); await tela.pronto(p, 500);
        opcoesVersao = (await p.locator('li.p-dropdown-item:visible, li[role=option]:visible').allInnerTexts()).map(tela.limpo);
        await p.keyboard.press('Escape'); await tela.pronto(p, 300);
      }
      const out = {
        titulo: tela.limpo(await d.locator('.p-dialog-title').first().innerText()),
        abas: (await d.locator('.p-tabview-nav li[role=presentation]').allInnerTexts()).map(tela.limpo),
        comparativo: (await d.locator('.header-title').allInnerTexts()).map(tela.limpo),
        grupos: (await d.locator('app-auditoria-template .p-accordion-header-text').allInnerTexts()).map((x) => x.trim()),
        opcoesVersao,
        esquerda: (await caixas.count()) ? await lerCaixa(caixas.nth(0), tela) : null,
        direita: (await caixas.count()) > 1 ? await lerCaixa(caixas.nth(1), tela) : null,
        toasts: await tela.toasts(p), itensMenu,
      };
      out.colunasApi = api.colunas; out.schemaApi = api.schema; out.revisoesApi = api.revisoes; out.valoresApi = { x: api.valueX, y: api.valueY };
      out.errosApi = rede.errosDesde(p, ini).slice(-5);
      await tela.botao(p, 'Fechar', { escopo: d }).catch(() => {});
      return out;
    } finally { p.off('response', ouvir); }
  },
};
