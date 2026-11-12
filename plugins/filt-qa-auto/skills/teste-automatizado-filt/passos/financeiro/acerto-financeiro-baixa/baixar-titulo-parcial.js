// Tela: Financeiro › Acerto Financeiro/Baixa (/financeiro/acerto-financeiro-baixa)

// Confirmações (não o diálogo do acerto) que falam de banco/boleto: o passo para e devolve o texto,
// nunca aceita sozinho algo que pode mandar pedido ao banco.
async function avisoBanco(p, tela) {
  const textos = (await p.locator('.p-confirm-dialog:visible, [role=alertdialog]:visible').allInnerTexts()).map(tela.limpo);
  return textos.find((x) => /banco|boleto|baixa banc|remessa/i.test(x)) || null;
}

module.exports = {
  // Baixa PARCIAL em Dinheiro de um título a receber. args: { pessoa, titulo: '99-1/1' (NUMERO_DOCUMENTO completo), valor: 40 }
  // Filtra pela pessoa e pelo número (input#numeroDuplicata), marca a linha e troca "Valor a Receber"
  // (input#valorAcertar<ID_DOCUMENTO_FINANCEIRO>) para `valor` antes de Baixar.
  // → { VALOR_DOCUMENTO_FINANCEIRO, VALOR_BAIXADO, STATUS, SITUACAO_DOCUMENTO, valorNaTela, via, toasts, dialogos }
  async baixarParcial(t, { pessoa, titulo, valor }) {
    const { p, tela } = t;
    const doc = await t.banco.linha("select ID_DOCUMENTO_FINANCEIRO from DOCUMENTO_FINANCEIRO where NUMERO_DOCUMENTO = ? and PAGAR_RECEBER = 'RECEBER' order by ID_DOCUMENTO_FINANCEIRO desc", [titulo]);
    if (!doc) throw new Error(`título ${titulo} não existe no banco`);
    const id = doc.ID_DOCUMENTO_FINANCEIRO;
    const vistos = { toasts: [], dialogos: [] };
    const guardar = async () => { vistos.toasts.push(...(await tela.toasts(p))); vistos.dialogos.push(...(await tela.textoDialogos(p))); };

    await tela.abrir(p, '/financeiro/acerto-financeiro-baixa');
    await tela.autocompleteRotulo(p, p, 'Pessoa', pessoa);
    await tela.digitar(p, p.locator('input#numeroDuplicata'), titulo.split('-')[0], { tab: false });
    await tela.botao(p, 'Filtrar', { noDialogo: false, qual: 'last' });
    await tela.confirmar(p, ['Sim']);
    await tela.pronto(p, 800);

    const linha = p.locator('tbody tr').filter({ hasText: titulo }).first();
    await linha.waitFor({ timeout: 20000 }).catch(() => {});
    if (!(await linha.count())) throw new Error(`título ${titulo} não aparece na baixa de ${pessoa}`);
    await linha.scrollIntoViewIfNeeded();
    await linha.locator('.p-checkbox-box').first().click(); await tela.pronto(p);

    // Valor a Receber da linha: digitação pelo mouse (clique no campo) + máscara da direita
    const inp = p.locator(`input#valorAcertar${id}`);
    if (!(await inp.count())) throw new Error(`campo "Valor a Receber" (input#valorAcertar${id}) não aparece na linha do título ${titulo}`);
    await tela.digitar(p, inp, tela.moeda(valor));
    await tela.pronto(p);
    const valorNaTela = tela.limpo(await inp.inputValue());
    const esperado = 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    t.confere('Valor a Receber trocado pelo campo da linha', valorNaTela, esperado);
    await guardar();

    await tela.botao(p, 'Baixar', { noDialogo: false });
    let aviso = await avisoBanco(p, tela);
    if (aviso) throw new Error('PARADO antes de aceitar aviso de banco/boleto: ' + aviso);
    await guardar();
    const dlg = await tela.dialogo(p);
    if (!dlg) throw new Error('diálogo do acerto não abriu depois de Baixar');
    await dlg.getByText('Dinheiro', { exact: true }).first().click(); await tela.pronto(p);
    if (await tela.temBotao(p, 'Salvar', dlg)) await tela.botao(p, 'Salvar', { escopo: dlg });
    aviso = await avisoBanco(p, tela);
    if (aviso) throw new Error('PARADO antes de aceitar aviso de banco/boleto: ' + aviso);
    await guardar();
    await tela.botao(p, 'Concluir', { escopo: dlg });
    await tela.pronto(p, 1500, { limite: 180000 });
    aviso = await avisoBanco(p, tela);
    await guardar();
    if (aviso) throw new Error('PARADO depois do Concluir: aviso de banco/boleto aberto (não respondido): ' + aviso);
    // "Recibo — Deseja imprimir o recibo?" → Não
    const rec = await tela.dialogo(p);
    if (rec && /recibo/i.test(await rec.innerText()) && (await tela.temBotao(p, 'Não', rec))) await tela.botao(p, 'Não', { escopo: rec });

    const st = await t.banco.linha('select VALOR_DOCUMENTO_FINANCEIRO, VALOR_BAIXADO, STATUS, SITUACAO_DOCUMENTO from DOCUMENTO_FINANCEIRO where ID_DOCUMENTO_FINANCEIRO = ?', [id]);
    return { ID_DOCUMENTO_FINANCEIRO: id, ...st, valorNaTela, via: 'mouse', toasts: [...new Set(vistos.toasts)], dialogos: [...new Set(vistos.dialogos)] };
  },
};
