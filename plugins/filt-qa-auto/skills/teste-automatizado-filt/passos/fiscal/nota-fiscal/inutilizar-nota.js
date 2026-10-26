// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
module.exports = {
  // NF-e própria salva e NÃO autorizada (rejeitada): ⋮ › Inutilizar Documento → justificativa → confirmar.
  // args: { id, justificativa? } → { situacao (ID_SITUACAO_DOCUMENTO), status (NOTA_FISCAL_ELETRONICA.STATUS), avisos }
  async inutilizar(t, { id, justificativa = 'Inutilizacao de teste da automacao' }) {
    const { p, tela } = t;
    tela.exigirDfe();
    await tela.abrir(p, '/nota/nota-fiscal/form?id=' + id);
    await tela.semLoader(p);
    await tela.menuKebab(p, /^Inutilizar Documento$/);
    await tela.pronto(p, 1000);
    const d = await tela.dialogo(p);
    if (!d) throw new Error('Inutilizar Documento não abriu o diálogo da justificativa');
    const txt = d.locator('textarea, input[type=text]').last();
    await txt.click(); await txt.fill(justificativa); await p.keyboard.press('Tab');
    const avisos = [];
    for (const b of ['Inutilizar Documento', 'Inutilizar', 'Salvar', 'Confirmar', 'Sim']) {
      const dd = await tela.dialogo(p); if (!dd) break;
      if (await tela.temBotao(p, b, dd)) { await tela.botao(p, b, { escopo: dd }); await tela.pronto(p, 3000); avisos.push(...(await tela.textoDialogos(p)), ...(await tela.toasts(p))); }
    }
    for (const b of ['Fechar', 'Ok', 'OK']) { const dd = await tela.dialogo(p); if (dd && (await tela.temBotao(p, b, dd))) await tela.botao(p, b, { escopo: dd }); }
    const situacao = await t.banco.valor('select ID_SITUACAO_DOCUMENTO from NOTA_FISCAL where ID_NOTA_FISCAL = ?', [id]);
    const status = await t.banco.valor('select STATUS from NOTA_FISCAL_ELETRONICA where ID_NOTA_FISCAL = ?', [id]);
    return { situacao: situacao == null ? null : Number(situacao), status: status == null ? null : Number(status), avisos: avisos.map((x) => tela.limpo(x).slice(0, 300)) };
  },
};
