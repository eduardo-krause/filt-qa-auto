// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N) — ajudantes dos cenários desta tela (não é cenário)
const { limpo, observar, dropdown } = require('../../_comum');

const visiveis = (p, re) => p.locator('label:visible').evaluateAll((ls, src) => ls.map((l) => l.textContent.replace(/\*/g, '').trim()).filter((x) => new RegExp(src, 'i').test(x)), re);

module.exports = { visiveis };
