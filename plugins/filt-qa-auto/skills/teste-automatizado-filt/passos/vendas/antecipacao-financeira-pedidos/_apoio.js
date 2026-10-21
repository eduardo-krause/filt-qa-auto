// Tela: Processos › Vendas › Antecipação Financeira Pedidos (/vendas/antecipacao-financeira-pedido) — ajudantes dos cenários desta tela (não é cenário)

async function carregar(t, { pessoa, pedido }) {
  const { p, tela } = t;
  await tela.abrir(p, '/vendas/antecipacao-financeira-pedido');
  await p.getByRole('button', { name: 'Carregar', exact: true }).waitFor({ timeout: 60000 });
  const campo = tela.campo(p, 'Pessoa');
  if (!(await campo.inputValue()).includes(pessoa)) await tela.autocomplete(p, campo, pessoa);
  await tela.botao(p, 'Carregar', { noDialogo: false });
  const linha = p.locator('tbody tr').filter({ hasText: new RegExp(`\\b${pedido}\\s+\\d{2}/\\d{2}/\\d{4}`) }).first();
  if (!(await linha.count())) throw new Error(`pedido ${pedido} não aparece na Antecipação Financeira de ${pessoa}`);
  return linha;
}

const moedaTela = (s) => Number(String(s || '').replace(/[^\d,]/g, '').replace(',', '.'));

module.exports = { carregar, moedaTela };
