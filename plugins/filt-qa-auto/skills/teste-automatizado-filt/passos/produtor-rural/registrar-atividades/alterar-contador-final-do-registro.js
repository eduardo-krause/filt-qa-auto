// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Registro CADASTRADO (depois do Editar): lápis da linha da máquina (edição na própria linha) › Contador final › ✓ › Salvar.
  // args: { id, contadorFinal, linha?: 0, salvar?: true, filial? } → { lido (contador inicial/final/total da linha), toasts, dialogos, registro (banco) }
  async alterarContadorFinal(t, { id, contadorFinal, linha = 0, salvar = true, filial }) {
    const { p, tela } = t;
    await ap.abrirForm(t, { id, filial });
    const tr = ap.card(p, 'Máquinas').locator('tr.table-body-line').nth(linha);
    await tr.locator('i.ph-pencil').first().click(); await tela.pronto(p, 600);
    const campo = tr.locator('p-inputnumber#contadorFinal input').first();
    await tela.digitar(p, campo, String(contadorFinal).replace('.', ',') + (String(contadorFinal).includes('.') ? '' : ',00'));
    const lido = { inicial: await tr.locator('p-inputnumber#contadorInicial input').first().inputValue(), final: await campo.inputValue(), total: await tr.locator('p-inputnumber#contadorTotal input').first().inputValue() };
    await tr.locator('i.ph-check').first().click(); await tela.pronto(p, 600);
    let toasts = await tela.toasts(p); let dialogos = await tela.textoDialogos(p);
    if (salvar) { const s = await tela.salvar(p); toasts = [...toasts, ...s.toasts]; dialogos = [...dialogos, ...s.dialogos]; }
    if (toasts.some((x) => !/salvo com sucesso/i.test(x)) || dialogos.some((d) => !/^Vencimento de manuten/.test(d))) t.anotar(`alterarContadorFinal ${id}: linha ${JSON.stringify(lido)} | toasts ${JSON.stringify(toasts)} | diálogos ${JSON.stringify(dialogos)}`);
    return { lido, toasts, dialogos, registro: await ap.lerRegistro(t, id) };
  },
};
