// Tela: Processos › Financeiro › Remessa Bancária (/financeiro/gerar-remessa) — ajudantes dos cenários desta tela (não é cenário)

// painel do filtro aberto = botão Filtrar dentro da tela (fechado, ele desliza para fora e continua "visível")
async function painelAberto(p) {
  const b = await p.getByRole('button', { name: 'Filtrar', exact: true }).first().boundingBox().catch(() => null);
  const vw = (p.viewportSize() || { width: 1600 }).width;
  return !!b && b.x >= 0 && b.x + b.width <= vw;
}

module.exports = { painelAberto };
