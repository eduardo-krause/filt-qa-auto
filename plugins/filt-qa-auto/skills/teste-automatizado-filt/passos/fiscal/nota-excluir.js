// Tela: Movimentações Fiscais › Nota Fiscal (/nota/nota-fiscal) — excluir nota (⋮ › Excluir)

module.exports = {
  // Exclui a nota pelo ⋮ › Excluir (confirmação "Excluir"). → { toasts, dialogos }
  async excluir(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/nota/nota-fiscal/form?id=' + id);
    await tela.semLoader(p);
    await tela.menuKebab(p, 'Excluir');
    await tela.confirmar(p, ['Excluir', 'Sim', 'Confirmar']);
    await tela.pronto(p, 1500);
    return { toasts: await tela.toasts(p), dialogos: await tela.textoDialogos(p) };
  },
};
