// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Informa um bem na seção Máquinas e captura o diálogo "Aviso" (texto exato) quando a tela barra o bem.
  // Em registro existente (id) ou em registro novo (sem id: precisa do cabeçalho — configuracao, safra, atividade, datas).
  // args: { bem, contadorFinal?, id?, salvar?: false, filial?, configuracao?, safra?, atividade?, dataInicial?, dataFinal?, dataRegistro? }
  // → { incluido, aviso, modalAposOk, contadorInicial, contadorFinal, dialogos, toasts, linhasMaquinas, id? (registro novo salvo) }
  async adicionarBem(t, { bem, contadorFinal, id, salvar = false, filial, ...cab }) {
    const hoje = t.hoje();
    await ap.abrirForm(t, { id, filial });
    if (!id) await ap.preencherCabecalho(t, { ...cab, dataInicial: cab.dataInicial || hoje, dataFinal: cab.dataFinal || cab.dataInicial || hoje, dataRegistro: cab.dataRegistro || hoje });
    const antes = await ap.ultimoId(t);
    const r = await ap.adicionarBem(t, { bem, contadorFinal });
    if (salvar) {
      const s = await t.tela.salvar(t.p);
      r.toasts = [...r.toasts, ...s.toasts];
      if (!id) { const novo = await ap.ultimoId(t); if (novo > antes) r.id = novo; }
    }
    return r;
  },
};
