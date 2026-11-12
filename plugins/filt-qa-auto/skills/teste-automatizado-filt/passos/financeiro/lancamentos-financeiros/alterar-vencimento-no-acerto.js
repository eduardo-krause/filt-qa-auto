// Tela: Processos › Financeiro › Lançamentos Financeiros (/financeiro/lancamento-financeiro)
const { alterarVencimentos } = require('../../_acerto');

module.exports = {
  // Documento já salvo: seção "Acerto Financeiro" › Adicionar › lápis da forma Duplicata no Resumo › troca o vencimento da(s) parcela(s)
  // na grade Parcelas › Salvar (da forma) › Concluir › Salvar do form.
  // args: { id, vencs: { '1/1': 'dd/mm/aaaa' } (vazio = salva o acerto sem mudar), outro?: { seletor, valor } (campo de texto do form a trocar), acerto?: true }
  // → { antes (parcelas lidas), digitado, salvarForma, concluir, eventos (toasts/diálogos do Salvar do form), errosApi }
  async alterarVencimentoNoAcerto(t, { id, vencs, outro, acerto }) {
    return alterarVencimentos(t, '/financeiro/lancamento-financeiro/form?id=' + id, { vencs, outro, acerto });
  },
};
