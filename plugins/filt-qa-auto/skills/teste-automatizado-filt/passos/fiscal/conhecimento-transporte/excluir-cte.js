// Tela: Movimentações Fiscais › Conhecimento de Transportes (/fiscal/conhecimento-de-transporte)
module.exports = {
  // Exclui o CT-e pelo ⋮ › Excluir do formulário (CT-e de entrada não tem Cancelar). args: { id } → { existe, avisos }
  async excluirCte(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/conhecimento-de-transporte/form?id=' + id);
    await tela.semLoader(p);
    await tela.menuKebab(p, 'Excluir');
    await tela.confirmar(p, ['Excluir', 'Sim', 'Confirmar']);
    await tela.pronto(p, 2000);
    const avisos = [...(await tela.toasts(p)), ...(await tela.textoDialogos(p))];
    const existe = Number(await t.banco.valor('select count(*) from CONHECIMENTO_TRANSPORTE where ID_CONHECIMENTO_TRANSPORTE = ?', [id]));
    return { existe, avisos: avisos.map((x) => tela.limpo(x).slice(0, 300)) };
  },
};
