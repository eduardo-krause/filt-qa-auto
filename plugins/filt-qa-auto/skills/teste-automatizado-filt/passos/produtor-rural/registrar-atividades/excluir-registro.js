// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>)
const ap = require('./_apoio');

module.exports = {
  // Na listagem (percorre as páginas até achar o registro): clica a lixeira (Remover) da linha e confirma. O texto do diálogo é devolvido.
  // args: { id, filial?, confirmar?: true } → { dialogos, toasts, excluiu (banco) }
  async excluir(t, { id, filial, confirmar = true }) {
    const { p, tela } = t;
    await ap.garantirFilial(t, filial);
    await tela.abrir(p, ap.ROTA);
    const linha = p.locator('tr.table-body-line', { hasText: new RegExp('^\\s*' + id + '\\b') }).first();
    const carregou = await p.locator('tr.table-body-line').first().waitFor({ timeout: 30000 }).then(() => true, () => false);   // listagem carregada
    if (!carregou) {
      t.anotar('ATENÇÃO: a listagem de Registrar Atividades abriu sem nenhuma linha em 30 s (chamadas de API ' + JSON.stringify(await tela.evidencia(p, 0)) + ') — a automação recarregou a página uma vez');
      await p.reload(); await tela.pronto(p, 1000);
      await p.locator('tr.table-body-line').first().waitFor({ timeout: 30000 });
    }
    // percorre as páginas da listagem (15 por página) até achar a linha
    for (let pag = 0; ; pag++) {
      if (await linha.count()) break;
      const prox = p.locator('button.p-paginator-next:not([disabled])').first();
      if (!(await prox.count()) || pag > 50) throw new Error('registro ' + id + ' não aparece na listagem (' + (pag + 1) + ' página(s) conferida(s))');
      await prox.click(); await tela.pronto(p, 800);
    }
    await linha.waitFor({ timeout: 20000 });
    await linha.locator('app-remover i.ph-trash').first().click(); await tela.pronto(p, 800);
    const dialogos = await tela.textoDialogos(p);
    if (confirmar) { const dlg = await tela.dialogo(p); if (dlg) await tela.confirmar(p, ['Excluir', 'Sim', 'Confirmar']); await tela.pronto(p, 1500); }
    const toasts = await tela.toasts(p);
    if (toasts.some((x) => /erro/i.test(x))) t.anotar('ATENÇÃO: excluir registro ' + id + ' mostrou toast de erro: ' + toasts.join(' | '));
    const excluiu = !Number(await t.banco.valor('select count(*) from REGISTRO_ATIVIDADE where ID_REGISTRO_ATIVIDADE = ?', [id]));
    return { dialogos, toasts, excluiu };
  },
};
