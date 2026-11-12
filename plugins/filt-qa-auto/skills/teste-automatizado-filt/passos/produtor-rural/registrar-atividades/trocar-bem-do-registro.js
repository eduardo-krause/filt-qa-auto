// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Registro CADASTRADO: lixeira da linha da máquina (confirma se pedir) › Adicionar outro bem (com Contador final) › Salvar.
  // args: { id, bem, contadorFinal, linha?: 0, filial? } → { removido: { dialogos, toasts }, adicionado (resultado do adicionarBem), toasts, registro (banco) }
  async trocarBem(t, { id, bem, contadorFinal, linha = 0, filial }) {
    const { p, tela } = t;
    await ap.abrirForm(t, { id, filial });
    await ap.card(p, 'Máquinas').locator('tr.table-body-line').nth(linha).locator('i.ph-trash').first().click(); await tela.pronto(p, 800);
    const dialogos = await tela.textoDialogos(p);
    if (dialogos.length) await tela.confirmar(p, ['Sim', 'Excluir', 'Remover', 'Confirmar']);
    await tela.pronto(p, 800);
    const removido = { dialogos, toasts: await tela.toasts(p) };
    const adicionado = await ap.adicionarBem(t, { bem, contadorFinal });
    const s = await tela.salvar(p);
    return { removido, adicionado, toasts: s.toasts, registro: await ap.lerRegistro(t, id) };
  },
};
