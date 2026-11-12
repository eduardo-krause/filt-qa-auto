// Tela: Cadastros › Patrimônio › Bens (/patrimonio/bem → /patrimonio/bem/form?id=<ID_BEM>)

const num = (s) => Number(String(s || '').replace(/\./g, '').replace(',', '.'));

module.exports = {
  // Lê o "Contador atual" nos 3 lugares da tela do bem: card Limite de contador entre atividades, diálogo de Manutenção de bem
  // (Adicionar, cancelado) e diálogo de Ajuste e troca de contadores (Adicionar, cancelado). Compara com BEM.CONTADOR_ATUAL do banco.
  // args: { id: ID_BEM } → { tipoContador, limite, manutencao, ajuste, banco } (números; null se o campo não existir)
  async lerContadores(t, { id }) {
    const { p, tela } = t;
    await tela.abrir(p, '/patrimonio/bem/form?id=' + id);
    await tela.pronto(p, 1500);
    await p.locator('input#contadorAtual').first().waitFor({ timeout: 30000 });
    const limite = num(await p.locator('input#contadorAtual').first().inputValue());
    const tipoContador = await p.locator('label:has-text("Tipo de controle de contador")').first().evaluate((l) => {
      const el = document.getElementById(l.getAttribute('for')) || l.parentElement.querySelector('input,.p-dropdown');
      return (el ? (el.value || el.innerText || '') : '').trim();
    }).catch(() => '');
    const lerNoDialogo = async (titulo) => {
      const tab = p.locator('p-accordiontab', { hasText: titulo }).last();
      await tab.locator('button:has-text("Adicionar")').first().click(); await tela.pronto(p, 1000);
      const dlg = await tela.dialogo(p);
      if (!dlg) throw new Error('o diálogo de "' + titulo + '" não abriu');
      const v = num(await dlg.locator('input#contadorAtual').inputValue());
      await tela.botao(p, 'Cancelar', { escopo: dlg });
      return v;
    };
    const manutencao = await lerNoDialogo('Manutenção de bem');
    const ajuste = await lerNoDialogo('Ajuste e troca de contadores');
    const banco = await t.banco.valor('select CONTADOR_ATUAL from BEM where ID_BEM = ?', [id]);
    return { tipoContador, limite, manutencao, ajuste, banco: banco === null ? null : Number(banco) };
  },
};
