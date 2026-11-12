// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Abre o registro e clica "Finalizar Aplicação". Não responde diálogo de confirmação sozinho: se aparecer, o texto vai em `dialogos`.
  // args: { id, filial? } → { toasts, dialogos, registro (status/horas/bens lidos do banco logo depois) }
  async finalizar(t, { id, filial }) {
    const { p, tela } = t;
    await ap.abrirForm(t, { id, filial });
    await p.locator('button:has-text("Finalizar Aplicação")').first().click();   // o nome acessível do botão não é só o texto (getByRole exato não acha)
    await tela.pronto(p, 1500);
    const toasts = await tela.toasts(p);
    const dialogos = (await p.locator('.p-dialog:visible, [role=alertdialog]:visible').allInnerTexts()).map(tela.limpo);   // texto inteiro, sem cortar
    const botoesDialogo = await p.locator('.p-dialog:visible button, [role=alertdialog]:visible button').allInnerTexts();
    const registro = await ap.lerRegistro(t, id);
    if (registro.STATUS !== 'CONCLUIDO' || dialogos.some((d) => !/^Vencimento de manuten/.test(d))) t.anotar(`finalizar ${id}: status ${registro.STATUS} | toasts ${JSON.stringify(toasts)} | diálogos ${JSON.stringify(dialogos)} | botões ${JSON.stringify(botoesDialogo.map(tela.limpo).filter(Boolean))}`);
    return { toasts, dialogos, botoesDialogo: botoesDialogo.map(tela.limpo).filter(Boolean), registro };
  },
};
