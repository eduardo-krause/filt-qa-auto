// Tela: Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N)
const { abrirForm, vencimento, digitarVencimento, dialogoJust, confirmarHabilitado, digitarJustificativa, TITULO_JUST } = require('./_apoio');

module.exports = {
  // Digita a nova data, lê o Confirmar com a Justificativa vazia e só com espaços, e clica Cancelar da janela.
  // args: { id, data, espacos = '   ' } → { antes, dialogo, titulo, confirmarVazio, confirmarEspacos, depois, textoDialogo }
  async cancelarAlteracaoVencimento(t, { id, data, espacos = '   ' }) {
    const { p, tela } = t;
    if (id) await abrirForm(p, id);
    const antes = (await vencimento(p)).valor;
    const r = await digitarVencimento(p, data);
    if (!r.dialogo) return { antes, dialogo: false, depois: (await vencimento(p)).valor };
    const d = dialogoJust(p);
    const textoDialogo = tela.limpo(await d.innerText());
    const confirmarVazio = await confirmarHabilitado(p);
    await digitarJustificativa(p, espacos);
    const confirmarEspacos = await confirmarHabilitado(p);
    await d.getByRole('button', { name: 'Cancelar' }).click(); await tela.pronto(p, 500);
    return { antes, dialogo: true, titulo: TITULO_JUST, textoDialogo, confirmarVazio, confirmarEspacos, dialogoFechou: !(await d.count()), depois: (await vencimento(p)).valor };
  },
};
