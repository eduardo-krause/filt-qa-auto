// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Abre o registro CONCLUÍDO e clica "Editar" (volta para Cadastrado desfazendo as movimentações). Não responde diálogo sozinho.
  // args: { id, filial? } → { toasts, dialogos, botoes (da tela depois do clique), registro (banco logo depois) }
  async editar(t, { id, filial }) {
    const { p, tela } = t;
    await ap.abrirForm(t, { id, filial });
    await tela.botao(p, 'Editar', { noDialogo: false });
    await tela.pronto(p, 1500);
    const botoes = [...new Set((await p.getByRole('button').allInnerTexts()).map(tela.limpo).filter(Boolean))];
    return { toasts: await tela.toasts(p), dialogos: await tela.textoDialogos(p), botoes, registro: await ap.lerRegistro(t, id) };
  },
};
