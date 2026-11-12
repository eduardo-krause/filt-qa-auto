// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Abre o registro (qualquer status) e lê a tabela de Máquinas da tela e os mesmos dados no banco. Devolve também diálogos/toasts ao abrir (ex.: aviso de bloqueio).
  // args: { id, filial? } → { linhas (texto da tela), dialogos, toasts, botoes, registro (banco) }
  async lerBens(t, { id, filial }) {
    const { p, tela } = t;
    await ap.abrirForm(t, { id, filial });
    await tela.pronto(p, 800);
    const linhas = (await ap.card(p, 'Máquinas').locator('tr.table-body-line').allInnerTexts()).map(tela.limpo);
    const botoes = [...new Set((await p.getByRole('button').allInnerTexts()).map(tela.limpo).filter(Boolean))];
    return { linhas, dialogos: await tela.textoDialogos(p), toasts: await tela.toasts(p), botoes, registro: await ap.lerRegistro(t, id) };
  },
};
