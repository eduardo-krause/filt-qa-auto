// Tela: Cadastros › Financeiro › Movimentação automática OFX — lê as opções dos autocompletes do form Novo (opcionalmente em outra filial).
const { limpo } = require('../../_comum');
const { ROTA } = require('./_apoio');
const filial = require('../../geral/estabelecimento/trocar-filial-logada');

async function trocarFilial(t, codigo) {
  const { p } = t;
  const antes = p.url();
  let erro = null; let r = null;
  try { r = await filial.trocar(t, { codigo }); } catch (e) { erro = e.message.split('\n')[0]; }
  const depois = p.url();
  return { codigo, filial: r && r.filial, erro, urlAntes: antes, urlDepois: depois, pediuLogin: /login|auth/i.test(depois) || !!(await p.locator('input[type=password]:visible').count()) };
}

module.exports = {
  // args: { filial:'1001' (opcional), campos:{ <inputId>:[textos] }, filialVolta:'1000' }
  // → { opcoes:{ <inputId>:{ <texto>:[opções] } }, troca, volta }  (troca/volta = o que aconteceu ao trocar a filial)
  async opcoesCampos(t, { filial: cod, campos = {}, filialVolta = '1000' } = {}) {
    const { p, tela } = t;
    let troca = null; let volta = null;
    if (cod) { troca = await trocarFilial(t, cod); if (troca.erro || troca.pediuLogin) return { opcoes: {}, troca, volta }; }
    const opcoes = {};
    try {
      await tela.abrir(p, ROTA);
      await p.getByText('Novo', { exact: true }).first().click(); await tela.pronto(p, 800);
      await p.locator('input#descricao').waitFor({ timeout: 20000 });
      for (const [id, textos] of Object.entries(campos)) {
        opcoes[id] = {};
        const inp = p.locator(`input#${id}`).first();
        for (const txt of textos) {
          await inp.scrollIntoViewIfNeeded(); await inp.click(); await inp.fill('');
          await p.keyboard.type(String(txt), { delay: 40 });
          await tela.pronto(p, 900);
          const ops = p.locator('.p-autocomplete-panel:visible li[role=option]');
          await ops.first().waitFor({ timeout: 6000 }).catch(() => {});
          opcoes[id][txt] = (await ops.allInnerTexts()).map(limpo);
          await p.keyboard.press('Escape'); await inp.fill(''); await tela.pronto(p, 300);
        }
      }
    } finally {
      if (cod && cod !== filialVolta) volta = await trocarFilial(t, filialVolta);
    }
    return { opcoes, troca, volta };
  },
};
