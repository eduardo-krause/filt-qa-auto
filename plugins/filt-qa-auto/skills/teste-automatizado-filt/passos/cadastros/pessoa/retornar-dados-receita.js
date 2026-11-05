// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) → modal "Consulta CPF/CNPJ - Receita Federal" com resultado (pesquisarDadosReceita)
// Não salva a pessoa: só devolve o que a modal preencheu no cadastro.
const { limpo } = require('../../_comum');
const ap = require('./_apoio');

const soDigitos = (s) => String(s || '').replace(/\D/g, '');

module.exports = {
  // Opcional: marca outra IE como principal na grade (pelo número). Clica "Retornar dados", captura os avisos com o texto
  // exato e devolve o cadastro preenchido (pessoa + cada complemento com Geral, Endereços e Produtor Rural). Não salva.
  // args: { principal?: '0809427800174', esperaAvisos?: 4000 }
  // devolve { marcacao, modalFechou, avisos, avisosFechados (texto dos avisos fechados pelo Ok/Fechar), pessoa: [{rotulo, valor, desabilitado}], complementos: [...] }
  async retornarDadosReceita(t, { principal, esperaAvisos = 4000 }) {
    const { p, tela } = t;
    const m = ap.modal(p);
    if (!(await m.count())) throw new Error(`modal "${ap.TITULO}" não está aberta`);
    const r = {};
    await ap.abaRetornada(p, m, 'Dados CPF/CNPJ');
    if (principal) {
      const g = await ap.gradeIes(p, m, { dicas: false });
      const i = g.linhas.findIndex((l) => l.celulas && soDigitos(l.celulas['Inscrição estadual']) === soDigitos(principal));
      if (i < 0) throw new Error(`IE ${principal} não está na grade (IEs: ${g.linhas.map((l) => l.celulas ? l.celulas['Inscrição estadual'] : l.vazia).join(', ')})`);
      const box = m.locator('.grid-inscricoes tbody tr').nth(i).locator('.p-checkbox-box').first();
      r.marcacao = { ie: principal, antes: g.linhas[i].principal };
      await box.click().catch((e) => { r.marcacao.erroClique = e.message.split('\n')[0]; });
      await p.waitForTimeout(300);
      const g2 = await ap.gradeIes(p, m, { dicas: false });
      r.marcacao.depois = g2.linhas.map((l) => ({ ie: l.celulas && l.celulas['Inscrição estadual'], ...l.principal }));
      r.marcacao.marcou = !!(g2.linhas[i].principal || {}).marcado;
      if (!r.marcacao.marcou) t.anotar(`ATENÇÃO: o clique no Principal da IE ${principal} não marcou a linha`);
    }
    const bt = m.getByRole('button', { name: 'Retornar dados', exact: true });
    if (!(await bt.isEnabled())) throw new Error('"Retornar dados" desabilitado (pesquise antes)');
    const col = ap.coletor(p);
    await bt.click();
    const ini = Date.now();
    while (Date.now() - ini < esperaAvisos) { await col.coletar(); await p.waitForTimeout(300); }
    await tela.pronto(p, 300); await col.coletar();
    r.modalFechou = !(await m.count());
    // aviso que sobra aberto (ex.: IEs sem endereço) é fechado pelo botão dele (Ok/Fechar), como a pessoa faria; o texto fica em r.avisos
    r.avisosFechados = [];
    for (let k = 0; k < 3; k++) {
      const d = p.locator('.p-dialog:visible, [role=alertdialog]:visible').filter({ hasNot: p.locator('.consulta-receita-federal') }).last();
      if (!(await d.count()) || /consulta-receita-federal(?!-)/.test(String(await d.getAttribute('class')))) break;
      const b = d.getByRole('button', { name: /^(Ok|OK|Fechar)$/ }).first();
      if (!(await b.count())) break;
      const txt = limpo(await d.innerText());
      await b.click(); await tela.pronto(p, 300);
      r.avisosFechados.push(txt);
    }
    r.avisos = col.lista;
    Object.assign(r, await ap.lerCadastro(p));
    await col.coletar(); r.avisos = col.lista;
    return r;
  },
};
