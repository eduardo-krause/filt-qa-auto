// Tela: Processos › Financeiro › Gestão Caixa e Bancos (/financeiro/caixas-contas) — ajudantes (não é cenário)
const { limpo } = require('../../_comum');

const ROTA = '/financeiro/caixas-contas';

// Abre a tela, informa o período (se vier) e seleciona a conta na tabela "Selecione uma conta".
async function abrirConta(t, { conta, dataInicial, dataFinal }) {
  const { p, tela } = t;
  await tela.abrir(p, ROTA);
  const linhas = p.locator('p-table').first().locator('tbody tr.table-body-line');
  await linhas.first().waitFor({ timeout: 20000 });
  if (dataInicial) await tela.data(p, p.locator('#dataInicial input').first(), dataInicial);
  if (dataFinal) await tela.data(p, p.locator('#dataFinal input').first(), dataFinal);
  await tela.pronto(p, 600);
  const textos = (await linhas.allInnerTexts()).map(limpo);
  const i = textos.findIndex((x) => x.includes(String(conta)));
  if (i < 0) throw new Error(`conta ${conta} não aparece em "Selecione uma conta" (contas: ${textos.join(' | ')})`);
  const ln = linhas.nth(i);
  if (!/p-highlight/.test((await ln.getAttribute('class')) || '')) { await ln.click(); await tela.pronto(p, 800); }
  await p.locator('#movBancaria, #estornos').first().waitFor({ timeout: 20000 });
  return { contas: textos };
}

// Linhas do extrato da conta selecionada.
async function lerExtrato(p) {
  return p.evaluate(() => {
    const L = (e) => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
    const tabs = [...document.querySelectorAll('p-table')];
    const ext = tabs.find((tb) => /Data Lançamento/.test(L(tb.querySelector('thead'))));
    if (!ext) return { colunas: [], linhas: [] };
    const colunas = [...ext.querySelectorAll('thead th')].map(L);
    const linhas = [...ext.querySelectorAll('tbody tr.table-body-line')].map((tr, idx) => {
      const td = [...tr.children];
      const desc = td[4];
      return {
        idx, data: L(td[1]), situacao: L(td[2]), documento: L(td[3]), descricao: desc ? (desc.getAttribute('title') || L(desc)) : '',
        descricaoTela: L(desc), credito: L(td[5]), debito: L(td[6]), saldo: L(td[7]), negrito: /font-weight-bold/.test(tr.className),
        acoes: [...(td[8] ? td[8].querySelectorAll('app-impressao, app-editar, app-remover') : [])].map((a) => a.tagName.toLowerCase().replace('app-', '')),
      };
    });
    return { colunas, linhas };
  });
}

module.exports = { ROTA, abrirConta, lerExtrato, limpo };
