// Tela: Processos › Financeiro › Conciliação de Contas (/financeiro/conciliacao-bancaria) — reabre pela lista "Conciliações não encerradas".
const { ROTA, limpo, juntarToasts } = require('./_apoio');

module.exports = {
  // args: { conta: '1019810', arquivo (opcional, parte do nome do .ofx; sem ele pega a última da conta) }
  // → { opcoes:[textos da lista], clicada, toasts, abas:[cabeçalhos das abas depois de abrir] }
  async reabrir(t, { conta, arquivo }) {
    const { p, tela } = t;
    await tela.abrir(p, ROTA);
    const itens = p.locator('.conciliacao-nao-encerrada');
    await itens.first().waitFor({ timeout: 15000 }).catch(() => {});
    const opcoes = (await itens.allInnerTexts()).map(limpo);
    let i = -1;
    opcoes.forEach((x, k) => { if (x.includes(String(conta)) && (!arquivo || x.includes(arquivo))) i = k; });
    if (i < 0) throw new Error(`nenhuma conciliação não encerrada da conta ${conta}${arquivo ? ' / ' + arquivo : ''} (lista: ${opcoes.join(' | ') || 'vazia'})`);
    await itens.nth(i).click(); await tela.pronto(p, 1000);
    await p.locator('.p-tabview-nav li').first().waitFor({ timeout: 30000 });
    const toasts = await juntarToasts(p, 1500);
    return { opcoes, clicada: opcoes[i], toasts, abas: (await p.locator('.p-tabview-nav li').allInnerTexts()).map(limpo) };
  },
};
