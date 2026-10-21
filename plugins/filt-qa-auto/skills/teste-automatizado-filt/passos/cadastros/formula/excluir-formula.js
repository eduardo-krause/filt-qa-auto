// Tela: Cadastros › Fórmulas › Fórmula (/fiscal/formula, form /fiscal/formula/form)

module.exports = {
  // Exclui pelo ⋮ › Excluir do form. Fórmula com vínculo: o sistema responde com o diálogo
  // "Não é possível excluir este cadastro, pois possui vínculos no sistema. Deseja inativar?" — o passo responde `inativar` (padrão Não).
  // → { confirmacao, resposta, toasts }
  async excluir(t, { id, inativar = false }) {
    const { p, tela } = t;
    await tela.abrir(p, '/fiscal/formula/form?id=' + id);
    await tela.menuKebab(p, /Excluir|Remover/);
    const confirmacao = (await tela.textoDialogos(p)).join(' | ');
    await tela.confirmar(p, ['Excluir', 'Sim', 'Confirmar']);
    await tela.pronto(p, 800);
    const toasts = await tela.toasts(p);
    const resposta = (await tela.textoDialogos(p)).join(' | ');
    if (/Deseja inativar/i.test(resposta)) await tela.botao(p, inativar ? 'Sim' : 'Não');
    return { confirmacao, resposta, toasts };
  },
};
