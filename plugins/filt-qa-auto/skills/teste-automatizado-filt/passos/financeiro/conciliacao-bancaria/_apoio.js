// Tela: Processos › Financeiro › Conciliação de Contas (/financeiro/conciliacao-bancaria) — ajudantes (não é cenário)
const { limpo } = require('../../_comum');

const ROTA = '/financeiro/conciliacao-bancaria';

// Junta os toasts que aparecerem até `ms` sem novidade (somem sozinhos).
async function juntarToasts(p, ms = 5000) {
  const vistos = new Set(); let ultimo = Date.now();
  while (Date.now() - ultimo < ms) {
    for (const x of (await p.locator('.p-toast-message').allInnerTexts().catch(() => [])).map(limpo)) if (!vistos.has(x)) { vistos.add(x); ultimo = Date.now(); }
    await p.waitForTimeout(400);
  }
  return [...vistos];
}

// Aba ativa da conciliação ('Não Conciliados' | 'Conciliados'): clica no cabeçalho se não for a ativa.
async function irAba(t, aba) {
  const { p, tela } = t;
  const li = p.locator('.p-tabview-nav li').filter({ hasText: new RegExp(`^\\s*${aba}\\s*$`) }).first();
  if (!(await li.count())) throw new Error(`aba "${aba}" não existe na conciliação`);
  if (!/p-highlight/.test((await li.getAttribute('class')) || '')) { await li.locator('a').first().click(); await tela.pronto(p, 600); }
}

// Painel da aba ativa.
const painelAtivo = (p) => p.locator('.p-tabview-panel:visible').first();

// Lista (app-conciliacao-bancaria-lancamentos) do lado pedido na aba ativa: 'OFX' | 'Sistema'. Na aba Conciliados só existe uma.
async function lista(t, lado) {
  const { p } = t;
  const listas = painelAtivo(p).locator('app-conciliacao-bancaria-lancamentos');
  const n = await listas.count();
  if (n <= 1) return listas.first();
  for (let i = 0; i < n; i++) {
    const tit = limpo(await listas.nth(i).locator('.titulo').first().innerText().catch(() => ''));
    if (new RegExp(`^${lado}$`, 'i').test(tit)) return listas.nth(i);
  }
  throw new Error(`lado "${lado}" não encontrado na aba ativa`);
}

// Expande todas as linhas da aba ativa pelo "EXPANDIR TODOS" (se ainda não estiver).
async function expandirTodos(t) {
  const { p, tela } = t;
  const a = painelAtivo(p).locator('a.expandir-retrair').first();
  if (!(await a.count())) return false;
  if (/EXPANDIR TODOS/i.test(await a.innerText())) { await a.click(); await tela.pronto(p, 800); }
  return true;
}

// Lê os registros de uma lista: cada registro = tr.line1 + linhas de detalhe seguintes (line2/line3).
async function lerRegistros(lst) {
  return lst.evaluate((el) => {
    const L = (e) => (e ? e.innerText.replace(/\s+/g, ' ').trim() : '');
    const trs = [...el.querySelectorAll('tbody > tr')];
    const regs = [];
    trs.forEach((tr, i) => {
      if (tr.classList.contains('line1')) regs.push({ tr: [tr], i1: i });
      else if (regs.length && /line[23]/.test(tr.className)) regs[regs.length - 1].tr.push(tr);
    });
    return regs.map((g, idx) => {
      const l1 = g.tr[0];
      const tds = [...l1.children];
      const marc = l1.querySelector('span.geracao-automatica');
      const titles = [...new Set(g.tr.flatMap((tr) => [...tr.querySelectorAll('[title]')]).map((e) => e.getAttribute('title')).filter((x) => x && x !== 'Conciliar'))];
      // detalhes: pares "Rótulo:" + valor nas linhas expandidas
      const detalhes = {};
      g.tr.slice(1).forEach((tr) => {
        const ls = [...tr.querySelectorAll('label')];
        ls.forEach((l, k) => {
          const r = L(l);
          if (/:$/.test(r) && r.length < 40) {
            let v = '';
            for (let j = k + 1; j < ls.length; j++) { const x = L(ls[j]); if (/:$/.test(x) && x.length < 40) break; if (!ls[j].contains(l)) { v = x; break; } }
            const hist = r === 'Histórico:' ? (ls[k + 1] && ls[k + 1].getAttribute('title')) : null;
            detalhes[r.replace(/:$/, '')] = hist || v;
          }
        });
      });
      const link = g.tr.slice(1).map((tr) => tr.querySelector('.detalhe-geracao-automatica app-linkRelatorio a, .detalhe-geracao-automatica a[href]')).find(Boolean);
      const temMenu = !!g.tr.slice(1).find((tr) => tr.querySelector('.header-buttons button'));
      const docEl = l1.querySelector('#documento');
      const docTxt = docEl ? L(docEl).replace(marc ? L(marc) : '\u0000', '').trim() : '';
      return {
        idx, data: L(l1.querySelector('.date-colum')), tipoDocumento: L(l1.querySelector('.tipo-documento')), documento: docTxt,
        descricao: detalhes['Histórico'] || null,
        valor: L(l1.querySelector('.valor-lancamento')), negativo: !!l1.querySelector('.valor-lancamento .negativo'),
        marcador: marc ? L(marc) : null, marcadorTitle: marc ? marc.getAttribute('title') : null, title: titles.join(' | ') || null, titles,
        pendenteSalvar: /Pendente Salvar/.test(L(l1)), marcado: (l1.querySelector('.p-checkbox-box') || {}).classList?.contains('p-highlight') || false,
        expandido: g.tr.length > 1, detalhes, linkLancamento: link ? (link.getAttribute('href') || link.href) : null, temMenu, texto: L(l1),
      };
    });
  });
}

// Acha o registro na lista por fitid (detalhe), documento, valor ("1,28") e/ou data ("03/08/2026"), descrição (regex no histórico/title).
function casa(r, { fitid, valor, data, descricao, documento } = {}) {
  if (documento && !String(r.documento).includes(String(documento))) return false;
  if (fitid && (r.detalhes.FITID || '') !== String(fitid)) return false;
  if (valor && !r.valor.replace(/[^\d,]/g, '').endsWith(String(valor).replace(/[^\d,]/g, ''))) return false;
  if (valor && r.valor.replace(/[^\d,]/g, '').replace(/^0+/, '') !== String(valor).replace(/[^\d,]/g, '').replace(/^0+/, '')) return false;
  if (data && r.data !== data) return false;
  if (descricao && !new RegExp(descricao, 'i').test(`${r.descricao || ''} ${r.title || ''} ${r.texto}`)) return false;
  return true;
}

// Uma aba: abre a conciliação, OFX e prepara a espera da resposta do upload. Devolve a função que manda o arquivo.
async function preparar(t, p, arquivo) {
  const { tela } = t;
  await tela.abrir(p, ROTA);
  await p.locator('button[title="OFX"]').first().click(); await tela.pronto(p, 500);
  const inp = p.locator('input[type=file]').first();
  return async () => {
    const resp = p.waitForResponse((r) => /ofx-upload/.test(r.url()) && r.request().method() === 'POST', { timeout: 180000 });
    await inp.setInputFiles(arquivo);
    let status = null; let resposta = null;
    try {
      const r = await resp; status = r.status();
      const txt = await r.text().catch(() => '');
      if (status >= 400) { try { const j = JSON.parse(txt); resposta = j.message || j.mensagem || j.error || txt.slice(0, 500); } catch (e) { resposta = txt.slice(0, 500); } }
    } catch (e) { resposta = 'sem resposta do upload: ' + e.message.split('\n')[0]; }
    await tela.pronto(p, 600);
    const toasts = await juntarToasts(p, 3000);
    return { status, resposta, toasts };
  };
}

async function idsConciliacao(t, nome, desde) {
  const l = await t.banco.consultar('SELECT ID_CONCILIACAO ID FROM CONCILIACAO WHERE NOME_ARQUIVO = ? AND ID_CONCILIACAO > ? ORDER BY 1', [nome, desde]);
  return l.map((x) => Number(x.ID));
}

module.exports = { preparar, idsConciliacao, ROTA, limpo, juntarToasts, irAba, painelAtivo, lista, expandirTodos, lerRegistros, casa };
