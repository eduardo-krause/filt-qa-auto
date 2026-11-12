// Tela: Cadastros › Usuário (/master/usuario/form?id=<ID_USUARIO>), seção "Grupos" (app-grupoUsuarioFilial)
// Linha do grupo → lápis (app-editar) → diálogo "Grupo x Filial": Grupo (desabilitado na edição) + Filial (p-autocomplete múltiplo,
// chips com a fantasia; botão "Adicionar todas as filiais") → Adicionar (só muda a lista na tela; o diálogo fica aberto e limpo:
// Cancelar) → Salvar do usuário (grava).
// Tirar uma filial que o usuário não tem em outro grupo abre confirmação (aviso de permissões customizadas) → Confirmar.
// Banco: GRUPO_USUARIO_FILIAL (ID_GRUPO_USUARIO, ID_USUARIO, ID_FILIAL).
const { limpo } = require('../../_comum');

module.exports = {
  // Deixa o usuário, no grupo informado, só com as filiais pedidas (pela tela) e salva o usuário.
  // args: { idUsuario, grupo: 'DESCRIÇÃO DO GRUPO', filiais: [ID_FILIAL...] | 'todas' }
  // devolve { antes: [fantasias na tela], depois: [fantasias na tela], confirmacoes: [textos], toasts, banco: [ID_FILIAL...] }
  async definirFiliaisDoGrupo(t, { idUsuario, grupo, filiais }) {
    const { p, tela } = t;
    const g = await t.banco.linha('select ID_GRUPO_USUARIO id from GRUPO_USUARIO where DESCRICAO = ?', [grupo]);
    if (!g) throw new Error(`grupo "${grupo}" não existe no banco`);
    const todas = await t.banco.consultar('select ID_FILIAL id, FANTASIA f from FILIAL');
    const querIds = filiais === 'todas' ? todas.map((x) => x.id) : filiais.map(Number);
    const quer = todas.filter((x) => querIds.includes(Number(x.id))).map((x) => x.f);
    if (quer.length !== querIds.length) throw new Error('filial inexistente em ' + JSON.stringify(filiais));

    await tela.abrir(p, '/master/usuario/form?id=' + idUsuario);
    const linha = p.locator('app-grupousuariofilial tr.table-body-line, app-grupoUsuarioFilial tr.table-body-line').filter({ hasText: grupo }).first();
    await linha.waitFor({ timeout: 20000 }).catch(() => { throw new Error(`grupo "${grupo}" não aparece na seção Grupos do usuário ${idUsuario}`); });
    await linha.locator('app-editar i').first().click();   // o <a> do lápis tem tamanho 0: clica no ícone
    await tela.pronto(p, 600);
    const d = p.locator('.p-dialog:visible').filter({ has: p.locator('.p-dialog-header', { hasText: 'Grupo x Filial' }) }).last();
    await d.waitFor({ timeout: 10000 });
    const chips = () => d.locator('.p-autocomplete-token');
    const nomes = async () => (await d.locator('.p-autocomplete-token .p-autocomplete-token-label').allInnerTexts()).map(limpo);
    const antes = await nomes();
    const confirmacoes = [];
    const confirmarSeAbrir = async () => {
      await tela.pronto(p, 400);
      const c = p.locator('.p-dialog:visible, .p-confirm-dialog:visible, [role=alertdialog]:visible').filter({ hasNot: p.locator('.p-dialog-header', { hasText: 'Grupo x Filial' }) }).last();
      if (await c.count()) {
        confirmacoes.push(limpo(await c.innerText()).slice(0, 300));
        await c.getByRole('button', { name: /^\s*confirmar\s*$/i }).first().click();
        await tela.pronto(p, 400);
      }
    };

    // tira as que sobram
    for (let guarda = 0; guarda < 20; guarda++) {
      const atual = await nomes();
      const i = atual.findIndex((x) => !quer.includes(x));
      if (i < 0) break;
      await chips().nth(i).locator('.p-autocomplete-token-icon').click();
      await confirmarSeAbrir();
      if ((await nomes()).length === atual.length) throw new Error(`não consegui tirar a filial "${atual[i]}" (chip continua)`);
    }
    // põe as que faltam
    if (filiais === 'todas' && quer.some((x) => !antes.includes(x))) {
      await d.getByRole('button', { name: 'Adicionar todas as filiais' }).click(); await tela.pronto(p, 600);
    }
    for (const f of quer) {
      if ((await nomes()).includes(f)) continue;
      const inp = d.locator('input#filial');
      await inp.click(); await p.keyboard.type(f.slice(0, 12), { delay: 40 }); await tela.pronto(p, 600);
      const ops = p.locator('.p-autocomplete-panel:visible li');
      await ops.first().waitFor({ timeout: 8000 }).catch(() => {});
      const tx = (await ops.allInnerTexts()).map(limpo);
      const i = tx.findIndex((x) => x === f || x.replace(/^\d+\s*/, '') === f);
      if (i < 0) throw new Error(`filial "${f}" não aparece no autocomplete (opções: ${tx.join(' | ') || 'nenhuma'})`);
      await ops.nth(i).click(); await tela.pronto(p, 400);
    }
    const depois = await nomes();
    await d.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await tela.pronto(p, 600);
    // o Adicionar aplica e limpa o diálogo, que continua aberto (vazio): fecha em Cancelar
    if (await d.isVisible().catch(() => false)) { await d.getByRole('button', { name: 'Cancelar', exact: true }).click(); await tela.pronto(p, 400); }
    const abertos = await tela.textoDialogos(p);
    if (abertos.length) throw new Error('depois do Adicionar ainda há diálogo aberto: ' + abertos.join(' || ') + ' · toasts: ' + (await tela.toasts(p)).join(' | ') + ' · chips: ' + depois.join(', '));
    await tela.fecharToasts(p);
    const s = await tela.salvar(p);
    const banco = (await t.banco.consultar('select ID_FILIAL from GRUPO_USUARIO_FILIAL where ID_USUARIO = ? and ID_GRUPO_USUARIO = ? order by ID_FILIAL', [idUsuario, g.id])).map((x) => Number(x.ID_FILIAL));
    return { antes, depois, confirmacoes, toasts: s.toasts, dialogos: s.dialogos, banco };
  },
};
