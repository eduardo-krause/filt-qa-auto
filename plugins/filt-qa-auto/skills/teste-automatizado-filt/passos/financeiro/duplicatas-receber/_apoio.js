// Apoio da tela Processos › Financeiro › Duplicatas a Receber (/financeiro/duplicata-receber/form?id=N).
// Campo e janela de vencimento iguais aos de Duplicatas a Pagar (p-calendar#dataVencimento, janela "Alteração da Data de Vencimento",
// textarea#justificativaVencimento): reaproveita os ajudantes de lá, só a rota muda.
const tela = require('../../../motor/lib/tela');
const pagar = require('../duplicatas-pagar/_apoio');

async function abrirForm(p, id) {
  await tela.abrir(p, '/financeiro/duplicata-receber/form?id=' + id);
  await tela.semLoader(p);
  await p.locator('p-calendar#dataVencimento input').waitFor({ timeout: 30000 });
  await tela.pronto(p, 600);
}

module.exports = { ...pagar, abrirForm };
