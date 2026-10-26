// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal)
// NF-e própria autorizada: ⋮ › Cancelar Nota → motivo → Salvar (ID_SITUACAO_DOCUMENTO vira 3).
module.exports = {
  // args: { id, motivo? } → { situacao, eventos }
  async cancelar(t, { id, motivo = 'Cancelamento de teste da automacao' }) {
    const { p, tela } = t;
    tela.exigirDfe();
    await tela.abrir(p, '/nota/nota-fiscal/form?id=' + id);
    await tela.semLoader(p);
    await tela.menuKebab(p, /^Cancelar Nota$/);
    await tela.pronto(p, 1000);
    const d = await tela.dialogo(p);
    if (!d) throw new Error('Cancelar Nota não abriu o diálogo do motivo');
    const txt = d.locator('textarea, input[type=text]').first();
    await txt.click(); await txt.fill(motivo); await p.keyboard.press('Tab');
    const eventos = [];
    for (const b of ['Salvar', 'Confirmar', 'Cancelar Nota', 'Sim']) {
      const dd = await tela.dialogo(p); if (!dd) break;
      if (await tela.temBotao(p, b, dd)) { await tela.botao(p, b, { escopo: dd }); await tela.pronto(p, 2500); eventos.push(...(await tela.textoDialogos(p)), ...(await tela.toasts(p))); }
    }
    for (let k = 0; k < 30; k++) {
      const s = Number(await t.banco.valor('select ID_SITUACAO_DOCUMENTO from NOTA_FISCAL where ID_NOTA_FISCAL = ?', [id]));
      if (s === 3) break; await tela.esperar(p, 1000);
    }
    for (const b of ['Fechar', 'Ok', 'OK']) { const dd = await tela.dialogo(p); if (dd && (await tela.temBotao(p, b, dd))) await tela.botao(p, b, { escopo: dd }); }
    const situacao = Number(await t.banco.valor('select ID_SITUACAO_DOCUMENTO from NOTA_FISCAL where ID_NOTA_FISCAL = ?', [id]));
    return { situacao, eventos: eventos.map((e) => tela.limpo(e).slice(0, 300)) };
  },
};
