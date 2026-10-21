// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)

module.exports = {
  // Maior ID_DOCUMENTO_FINANCEIRO (para achar os títulos criados por uma ação).
  async ultimoTitulo(t) { return Number(await t.banco.valor('select coalesce(max(ID_DOCUMENTO_FINANCEIRO),0) from DOCUMENTO_FINANCEIRO')) || 0; },

  // Títulos da pessoa criados depois de `desde`, com o boleto mais recente de cada. args: { desde, pessoaId },
};
