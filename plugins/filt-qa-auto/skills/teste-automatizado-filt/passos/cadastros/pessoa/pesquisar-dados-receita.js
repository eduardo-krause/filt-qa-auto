// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) → modal "Consulta CPF/CNPJ - Receita Federal" já aberta (abrirConsultaReceita)
const { limpo } = require('../../_comum');
const ap = require('./_apoio');

module.exports = {
  // Na modal aberta: troca (opcional) documento, data de nascimento e UF (sigla), clica "Pesquisar dados" e espera o fim.
  // args: { documento?, dataNascimento?: 'dd/mm/aaaa', uf?: 'DF', fecharDuranteConsulta?: false, aguardarAposFechar?: 10000,
  //         limite?: 180000 (ms de espera da consulta), dicas?: true (passa o mouse em cada campo/célula para ler o tooltip) }
  // devolve { filtrosAntes, pesquisou, consulta: { apareceu, titulo, texto, fechou, ms }, api, dados, adicionais, grade, avisos, retornarDados }
  async pesquisarDadosReceita(t, { documento, dataNascimento, uf, fecharDuranteConsulta = false, aguardarAposFechar = 10000, limite = 180000, dicas = true }) {
    const { p, tela } = t;
    const m = ap.modal(p);
    if (!(await m.count())) throw new Error(`modal "${ap.TITULO}" não está aberta`);
    const col = ap.coletor(p); const r = { preenchimento: {} };

    if (documento) { await tela.digitar(p, m.locator('#consultaIdentificacao'), documento); r.preenchimento.documento = await m.locator('#consultaIdentificacao').inputValue(); }
    if (dataNascimento) {
      const d = m.locator('#consultaDataNascimento');
      if (await d.isDisabled()) r.preenchimento.dataNascimento = 'campo bloqueado (não informada)';
      else { await tela.data(p, d, dataNascimento); r.preenchimento.dataNascimento = await d.inputValue(); }
    }
    if (uf) { r.preenchimento.uf = await ap.escolherUf(p, m, uf); if (r.preenchimento.uf.via !== 'mouse') t.anotar(`ATENÇÃO: UF "${uf}" não ficou no campo pelo clique (${JSON.stringify(r.preenchimento.uf)})`); }
    await col.coletar();
    r.filtrosAntes = await ap.filtros(m);
    if (!r.filtrosAntes.pesquisarDados.habilitado) { r.pesquisou = false; r.avisos = col.lista; return r; }

    // acompanha a chamada da Receita (viasoft/documento/cpf|cnpj)
    const api = [];
    const onReq = (q) => { if (/\/documento\/(cpf|cnpj)\?/.test(q.url())) api.push({ url: q.url().replace(/^https?:\/\/[^/]+/, ''), ini: Date.now() }); };
    const onResp = async (s) => { const a = api.find((x) => x.url === s.url().replace(/^https?:\/\/[^/]+/, '') && !x.status); if (a) { a.status = s.status(); a.ms = Date.now() - a.ini; if (s.status() >= 400) a.corpo = limpo(await s.text().catch(() => '')).slice(0, 400);
      else { const j = await s.json().catch(() => null); if (j) a.ies = (j.inscricoesEstaduais || []).map((x) => ({ ie: x.inscricaoEstadual, situacao: x.situacaoIe, ativa: x.ativa, tipo: x.tipoInscricao, uf: x.uf, municipio: x.municipio, cidade: x.cidade && x.cidade.nome, cep: x.cep })); } } };
    const onFail = (q) => { const a = api.find((x) => x.url === q.url().replace(/^https?:\/\/[^/]+/, '') && !x.status); if (a) { a.status = 'FALHOU ' + ((q.failure() || {}).errorText || ''); a.ms = Date.now() - a.ini; } };
    p.on('request', onReq); p.on('response', onResp); p.on('requestfailed', onFail);

    const aux = ap.auxiliar(p, 'Consulta Receita Federal');
    const c = { apareceu: false, fechou: false };
    const ini = Date.now();
    // texto da espera lido de uma vez (a consulta pode responder em menos de 1 s)
    const lerAux = () => aux.evaluate((d) => ({ titulo: (d.querySelector('.p-dialog-header') || {}).innerText, texto: [...d.querySelectorAll('.p-dialog-content p')].map((x) => x.innerText.replace(/\s+/g, ' ').trim()), botoes: [...d.querySelectorAll('button')].map((x) => x.innerText.trim()) })).catch(() => null);
    try {
      await m.getByRole('button', { name: 'Pesquisar dados', exact: true }).click();
      r.pesquisou = true;
      if (fecharDuranteConsulta) {
        // clica no Fechar assim que ele aparecer; se a consulta já tiver terminado, registra (não é falha do passo)
        const apareceu = await aux.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
        if (apareceu) {
          c.apareceu = true; c.msAteAparecer = Date.now() - ini; Object.assign(c, (await lerAux()) || {});
          c.fechou = await aux.getByRole('button', { name: 'Fechar', exact: true }).click({ timeout: 3000 }).then(() => true).catch(() => false);
          c.msAteFechar = Date.now() - ini;
          if (!c.fechou) c.motivo = 'a espera sumiu antes do clique em Fechar (consulta já tinha respondido)';
          await p.waitForTimeout(300); c.sumiuAoFechar = !(await aux.count());
          const fimObs = Date.now() + aguardarAposFechar;
          while (Date.now() < fimObs) { await col.coletar(); await p.waitForTimeout(400); }
        } else c.motivo = 'a espera "Consulta Receita Federal" não apareceu em 5 s';
      }
      while (!fecharDuranteConsulta && Date.now() - ini < limite) {
        await col.coletar();
        const vis = (await aux.count()) > 0;
        if (vis && !c.apareceu) { c.apareceu = true; c.msAteAparecer = Date.now() - ini; Object.assign(c, (await lerAux()) || {}); }
        if (!vis && (c.apareceu || Date.now() - ini > 3000) && api.every((a) => a.status)) break;
        await p.waitForTimeout(250);
      }
      c.ms = Date.now() - ini;
      c.terminou = !(await aux.count());
      await tela.pronto(p, 500, { limite: 15000 }).catch(() => {});
      await col.coletar();
    } finally { p.off('request', onReq); p.off('response', onResp); p.off('requestfailed', onFail); }
    r.consulta = c;
    r.api = api.map(({ ini: _i, ...a }) => a);

    // botão "Ok" do aviso de dados inválidos: lê e deixa aberto (quem chama decide); devolve o texto exato
    const aviso = ap.auxiliar(p, 'Aviso');
    if (await aviso.count()) r.aviso = { titulo: limpo(await aviso.locator('.p-dialog-header').innerText()), texto: limpo(await aviso.locator('.p-dialog-content').innerText()), botoes: (await aviso.getByRole('button').allInnerTexts()).map(limpo) };
    if (r.aviso && r.aviso.botoes.includes('Ok')) { await aviso.getByRole('button', { name: 'Ok', exact: true }).click(); await p.waitForTimeout(300); r.aviso.fechouNoOk = !(await aviso.count()); }

    r.filtrosDepois = await ap.filtros(m);
    await ap.abaRetornada(p, m, 'Dados CPF/CNPJ');
    r.dados = await ap.camposRetornados(p, m, { dicas });
    r.grade = await ap.gradeIes(p, m, { dicas });
    await ap.abaRetornada(p, m, 'Dados adicionais');
    r.adicionais = await ap.camposRetornados(p, m, { dicas });
    await ap.abaRetornada(p, m, 'Dados CPF/CNPJ');
    await col.coletar();
    r.avisos = col.lista;
    r.retornarDados = r.filtrosDepois.retornarDados;
    return r;
  },
};
