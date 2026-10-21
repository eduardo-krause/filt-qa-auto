// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { limpo, observar } = require('../../_comum');

module.exports = {
  // Diálogo depois do Salvar ("Salvo com sucesso" com Emitir Boletos): emite (capturando o PDF) ou fecha.
  async posSalvar(t, { emitirBoletos = false, pastaPdf, prefixo } = {}) {
    const { p, tela } = t;
    const vazio = { eventos: [], errosApi: [], pdfs: [] };
    const dlg = await tela.dialogo(p);
    if (!dlg) return vazio;
    if (emitirBoletos && (await tela.temBotao(p, 'Emitir Boletos', dlg))) {
      const r = await observar(t, dlg.getByRole('button', { name: 'Emitir Boletos', exact: true }).first(), { minimo: 6000, pastaPdf, prefixo });
      // diálogo de emissão (Enviar por E-mail / Gerar PDF → Emitir)
      const d2 = await tela.dialogo(p);
      if (d2 && (await tela.temBotao(p, 'Emitir', d2))) {
        const email = d2.locator('.p-checkbox-box').first();
        if ((await email.getAttribute('aria-checked')) === 'true') { await email.click(); await tela.pronto(p); }
        const r2 = await observar(t, d2.getByRole('button', { name: 'Emitir', exact: true }).first(), { minimo: 8000, pastaPdf, prefixo });
        return { eventos: [...r.eventos, ...r2.eventos], errosApi: [...r.errosApi, ...r2.errosApi], pdfs: [...r.pdfs, ...r2.pdfs] };
      }
      return r;
    }
    for (const b of ['Fechar', 'Não', 'Ok', 'OK']) if (await tela.temBotao(p, b, dlg)) { await tela.botao(p, b, { escopo: dlg }); break; }
    return vazio;
  },
};
