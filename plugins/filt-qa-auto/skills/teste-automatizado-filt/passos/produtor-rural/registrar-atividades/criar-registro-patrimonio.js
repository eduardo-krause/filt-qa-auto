// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Cria um registro de atividade de patrimônio pela tela (cabeçalho, insumo, máquinas) e clica Salvar → fica CADASTRADO.
  // args: { configuracao, safra, atividade, dataInicial, dataFinal, dataRegistro (dd/mm/aaaa; padrão: hoje),
  //         bens: [{ bem: 'DESCRIÇÃO', contadorFinal }], insumo: { item, qtd, casas }, filial?: 2000 }
  // O insumo entra depois do 1º Salvar (ver abaixo) e é o que a tela exige para finalizar depois (sem ele: "Há itens com quantidade solicitada igual a zero").
  // Bem barrado pelo "Aviso" não entra: o texto vem em `bens[i].aviso`.
  // → { id (lido do banco), toasts, dialogos, bens:[{bem, incluido, aviso, contadorInicial, contadorFinal}], registro }
  async criar(t, { configuracao, safra, atividade, dataInicial, dataFinal, dataRegistro, bens = [], insumo, filial }) {
    const { p, tela } = t;
    const hoje = t.hoje();
    await ap.abrirForm(t, { filial });
    const antes = await ap.ultimoId(t);
    await ap.preencherCabecalho(t, { configuracao, safra, atividade, dataInicial: dataInicial || hoje, dataFinal: dataFinal || dataInicial || hoje, dataRegistro: dataRegistro || hoje });
    const lidos = [];
    for (const b of bens) lidos.push(await ap.adicionarBem(t, b));
    const r = await tela.salvar(p);
    const id = await ap.ultimoId(t);
    if (!(id > antes)) throw new Error('o Salvar não criou o registro no banco (status "' + r.status + '", toasts: ' + r.toasts.join(' | ') + ', diálogos: ' + r.dialogos.join(' | ') + ')');
    let toasts = r.toasts;
    if (insumo) {
      // Em registro novo o campo Item do diálogo de Insumos vem desabilitado até o 1º Salvar: o insumo entra reabrindo o registro salvo.
      await ap.abrirForm(t, { id });
      await ap.adicionarInsumo(t, insumo);
      toasts = [...toasts, ...(await tela.salvar(p)).toasts];
    }
    return { id, toasts, dialogos: r.dialogos, bens: lidos, registro: await ap.lerRegistro(t, id) };
  },
};
