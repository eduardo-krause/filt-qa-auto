// Tela: Cadastros › Financeiro › Conta Bancária/Caixa (/fiscal/configuracao-portador/form?id=N)
// Lê o checkbox "Consulta DDA" e o card "Configuração DDA (Débito Direto Autorizado)" da conta aberta (não altera nada).
// devolve { checkboxVisivel, marcado, aoLadoDe, mesmaLinha, cardVisivel, tituloCard, campos:[{id, rotulo, obrigatorio, tipo, valor}], ambiente, salvarHabilitado, invalidos }
const { limpo } = require('../../_comum');

module.exports = {
  async lerDda(t) {
    const { p } = t;
    await t.tela.pronto(p, 300);
    return p.evaluate(() => {
      const vis = (e) => !!(e && e.offsetParent);
      const chk = document.querySelector('p-checkbox#consultaDda');
      const grupo = chk && chk.closest('.form-group');
      const ant = grupo && grupo.previousElementSibling;
      const lbEmite = document.querySelector('label[for=emiteBoleto]');
      const lbDda = document.querySelector('label[for=consultaDda]');
      const r1 = lbEmite && lbEmite.getBoundingClientRect(); const r2 = lbDda && lbDda.getBoundingClientRect();
      const box = chk && chk.querySelector('.p-checkbox-box');
      const titulo = [...document.querySelectorAll('h1,h2,h3,h4,h5,span,div,legend')].find((e) => vis(e) && e.children.length === 0 && /Configura[cç][aã]o DDA/i.test(e.textContent));
      const campos = ['ddaClientId', 'ddaClientSecret', 'ddaApplicationKey', 'ddaAmbiente'].map((id) => {
        const el = document.getElementById(id) || document.querySelector(`[name=${id}]`);
        const lab = document.querySelector(`label[for=${id}]`);
        if (!vis(el) && !(el && el.tagName === 'P-DROPDOWN' && vis(el.querySelector('.p-dropdown')))) return { id, visivel: false };
        const inp = el.tagName === 'INPUT' ? el : el.querySelector('input');
        const valor = el.tagName === 'P-DROPDOWN' ? (el.querySelector('.p-dropdown-label') || {}).textContent : (inp ? inp.value : '');
        return { id, visivel: true, rotulo: lab ? lab.textContent.trim() : null, obrigatorio: lab ? (/\*/.test(lab.innerText) || /\*/.test(getComputedStyle(lab, '::after').content || '') || /\*/.test(getComputedStyle(lab, '::before').content || '') || !!(lab.parentElement && lab.parentElement.querySelector('.campo-obrigatorio, .obrigatorio, .required'))) : null, tipo: el.tagName === 'P-DROPDOWN' ? 'select' : (inp && inp.type), estiloSenha: inp ? getComputedStyle(inp).webkitTextSecurity || '' : '', valor: (valor || '').trim(), placeholder: inp ? inp.placeholder : '', invalido: el.classList.contains('ng-invalid') };
      });
      const bt = [...document.querySelectorAll('button')].find((b) => vis(b) && b.textContent.trim() === 'Salvar');
      return {
        checkboxVisivel: vis(chk), marcado: !!(box && box.classList.contains('p-highlight')),
        aoLadoDe: ant ? (ant.querySelector('label') || {}).textContent : null,
        mesmaLinha: !!(r1 && r2 && Math.abs(r1.y - r2.y) < 4 && r2.x > r1.x),
        estiloRotulo: lbEmite && lbDda ? [getComputedStyle(lbEmite).font, getComputedStyle(lbDda).font] : null,
        cardVisivel: vis(titulo), tituloCard: titulo ? titulo.textContent.trim() : null,
        campos,
        salvarHabilitado: !!(bt && !bt.disabled && !bt.classList.contains('p-disabled')),
        invalidos: [...new Set([...document.querySelectorAll('.ng-invalid:not(form)')].filter(vis).map((e) => e.id || e.getAttribute('name') || e.tagName.toLowerCase()))],
      };
    });
  },
};
