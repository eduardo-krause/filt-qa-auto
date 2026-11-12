// Tela: Processos › Financeiro › Gestão Caixa e Bancos — exclui uma movimentação do extrato pela lixeira (só aparece em não conciliada).
const { observar } = require('../../_comum');
const { abrirConta, lerExtrato, limpo } = require('./_apoio');

module.exports = {
  // args: { conta, data:'26/08/2026', valor:4.95, descricao (texto contido), dataInicial, dataFinal (padrão = data) }
  // → { linha, temLixeira, dialogo, toasts, eventos, errosApi, aindaNoExtrato }
  async excluir(t, { conta, data, valor, descricao, dataInicial, dataFinal }) {
    const { p, tela } = t;
    await abrirConta(t, { conta, dataInicial: dataInicial || data, dataFinal: dataFinal || data });
    const v = Number(valor).toFixed(2).replace('.', ',');
    const acha = (ls) => ls.filter((l) => (!data || l.data === data) && (valor == null || l.debito.endsWith(v) || l.credito.endsWith(v)) && (!descricao || l.descricao.includes(descricao)));
    const ext = await lerExtrato(p);
    const achadas = acha(ext.linhas);
    if (!achadas.length) throw new Error(`movimentação não encontrada no extrato (${data} ${v} ${descricao || ''}); linhas: ${ext.linhas.map((l) => `${l.data} ${l.descricao} ${l.debito || l.credito}`).slice(0, 12).join(' | ')}`);
    const linha = achadas[0];
    if (!linha.acoes.includes('remover')) return { linha, candidatas: achadas.length, temLixeira: false };
    const tr = p.locator('p-table').filter({ hasText: 'Data Lançamento' }).locator('tbody tr.table-body-line').nth(linha.idx);
    await tr.locator('app-remover a i').first().click(); // <a> com display:contents: clique no ícone
    await tela.pronto(p, 500);
    const d = await tela.dialogo(p);
    const dialogo = d ? limpo(await d.innerText()) : null;
    let r = { eventos: [], errosApi: [] };
    if (d) {
      const bts = (await d.getByRole('button').allInnerTexts()).map(limpo);
      const nome = ['Sim', 'Excluir', 'Confirmar'].find((n) => bts.includes(n));
      if (!nome) throw new Error(`confirmação sem botão esperado (tem: ${bts.join(' | ')})`);
      r = await observar(t, d.getByRole('button', { name: nome, exact: true }).first(), { minimo: 2500 });
    }
    const depois = acha((await lerExtrato(p)).linhas);
    return { linha, candidatas: achadas.length, temLixeira: true, dialogo, toasts: r.eventos.filter((e) => e.startsWith('TOAST: ')).map((e) => e.slice(7)), eventos: r.eventos, errosApi: r.errosApi, aindaNoExtrato: depois.length >= achadas.length };
  },
};
