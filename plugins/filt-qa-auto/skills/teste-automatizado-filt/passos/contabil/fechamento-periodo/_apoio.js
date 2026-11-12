// Tela: Processos › Contábil › Fechamento do Período (/contabil/fechamento-periodo) — ajudantes (não é cenário)
const { limpo } = require('../../_comum');

const ROTA = '/contabil/fechamento-periodo';
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Abre o período pela linha da listagem (ano + nome do mês) → form?id=N.
async function abrirForm(t, ano, mes) {
  const { p, tela } = t;
  await tela.abrir(p, ROTA);
  const linhas = p.locator('app-grid tbody tr.table-body-line');
  await linhas.first().waitFor({ timeout: 20000 });
  await tela.pronto(p, 500);
  const nome = MESES[Number(mes) - 1];
  const textos = (await linhas.allInnerTexts()).map(limpo);
  const i = textos.findIndex((x) => x.includes(String(ano)) && new RegExp(`\\b${nome}\\b|\\b${String(mes).padStart(2, '0')}\\b`, 'i').test(x));
  if (i < 0) throw new Error(`período ${nome}/${ano} não aparece na listagem (linhas: ${textos.slice(0, 15).join(' | ')})`);
  await linhas.nth(i).locator('td').first().click();
  await p.waitForURL(/fechamento-periodo\/form/, { timeout: 20000 });
  await tela.pronto(p, 800);
}

async function estado(p) {
  return p.evaluate(() => {
    const vis = (e) => !!(e && e.getClientRects().length);
    const st = [...document.querySelectorAll('.status-bar .label span')].find(vis);
    const bts = [...document.querySelectorAll('button')].filter(vis).map((b) => b.innerText.trim()).filter(Boolean);
    const procs = [...document.querySelectorAll('app-periodoMovimentacaoProcesso-list tbody tr.table-body-line')].map((r) => r.innerText.replace(/\s+/g, ' ').trim());
    return { status: st ? st.textContent.trim() : null, botoes: bts, processos: procs };
  });
}

// Situação do período e dos processos no banco, pelo id do form (?id=N).
async function noBanco(t, id) {
  const per = await t.banco.linha('SELECT ID_PERIODO_MOVIMENTACAO ID, ANO, MES, SITUACAO_PERIODO, MOTIVO_REABERTURA, DATA_REABERTURA FROM PERIODO_MOVIMENTACAO WHERE ID_PERIODO_MOVIMENTACAO = ?', [id]);
  if (!per) return null;
  const procs = await t.banco.consultar('SELECT TIPO_PROCESSO, SITUACAO_PROCESSO FROM PERIODO_MOVIMENTACAO_PROCESSO WHERE ID_PERIODO_MOVIMENTACAO = ? ORDER BY 1', [id]);
  return { id: Number(per.ID), situacao: per.SITUACAO_PERIODO, motivo: per.MOTIVO_REABERTURA, processos: Object.fromEntries(procs.map((x) => [x.TIPO_PROCESSO, x.SITUACAO_PROCESSO])) };
}
const idDaUrl = (p) => Number((p.url().match(/[?&]id=(\d+)/) || [])[1]) || null;

module.exports = { ROTA, MESES, abrirForm, estado, noBanco, idDaUrl, limpo };
