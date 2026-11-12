// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Registro CADASTRADO (depois do Editar): troca Atividade e/ou Data inicial/final (dd/mm/aaaa) e Salva.
  // args: { id, atividade?, dataInicial?, dataFinal?, salvar?: true, filial? } → { toasts, dialogos, registro (banco) }
  async alterarCabecalho(t, { id, atividade, dataInicial, dataFinal, salvar = true, filial }) {
    const { p, tela } = t;
    await ap.abrirForm(t, { id, filial });
    if (atividade) await tela.autocomplete(p, p.locator('input#atividade'), atividade, atividade);
    if (dataInicial) await tela.data(p, p.locator('input[name=dataInicial]'), dataInicial);
    if (dataFinal) await tela.data(p, p.locator('input[name=dataFinal]'), dataFinal);
    let toasts = await tela.toasts(p); let dialogos = await tela.textoDialogos(p);
    if (salvar) { const s = await tela.salvar(p); toasts = [...toasts, ...s.toasts]; dialogos = [...dialogos, ...s.dialogos]; }
    return { toasts, dialogos, registro: await ap.lerRegistro(t, id) };
  },
};
