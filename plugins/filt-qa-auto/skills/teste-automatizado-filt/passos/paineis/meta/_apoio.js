// Ajudantes do painel ERP › Painéis de Gestão › Meta (/fiscal/meta-dashboard). Não vira passo.
const limpo = (s) => String(s || '').replace(/\s+/g, ' ').trim();

const sidebar = (p) => p.locator('.p-sidebar.p-sidebar-active').last();

// Lê a lista de metas, a aba ativa, a meta selecionada e o estado dos gráficos.
async function lerPainel(p) {
  return p.evaluate(() => {
    const L = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const vis = (e) => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const aba = L(document.querySelector('app-select-options button.button-active')?.innerText);
    const lista = document.querySelector('#cards-lateral');
    const cards = [...(lista ? lista.querySelectorAll('p-card') : [])].filter(vis);
    const desc = (c) => L(c.querySelector('span[title=descricao]')?.innerText || c.innerText.split('\n')[0]);
    const metas = cards.map(desc);
    const sel = cards.find((c) => c.querySelector('.cor-card-lateral-2') || c.closest('.cor-card-lateral-2'));
    const semRegistros = [...document.querySelectorAll('app-sem-registros-widget')].filter(vis).length;
    const graf = (id) => { const e = document.getElementById(id); return e && vis(e) ? L(e.innerText).slice(0, 200) : null; };
    const porc = L(document.querySelector('#meta-geral span.porcentagem-chart')?.innerText);
    const canvas = [...document.querySelectorAll('#meta-geral canvas, #card-baixo canvas, #meta-atingida app-grafico-progress-meta')].filter(vis).length;
    return {
      aba, metas, selecionada: sel ? desc(sel) : null, semRegistros, porcentagem: porc || null, graficosVisiveis: canvas,
      metaGeral: graf('meta-geral'), metaAtingida: graf('meta-atingida'), esperadaAtingida: graf('card-baixo'),
      cardsTexto: cards.map((c) => L(c.innerText).slice(0, 160)),
    };
  });
}

// Lê o filtro lateral: rótulos visíveis, valores, habilitado/desabilitado e o estado dos botões.
async function lerFiltro(p) {
  const s = sidebar(p);
  if (!(await s.count())) return { aberto: false };
  return s.evaluate((sb) => {
    const L = (x) => String(x || '').replace(/\s+/g, ' ').trim();
    const vis = (e) => !!e && !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
    const ids = {
      descricao: 'filtro-descricao', responsavel: 'filtro-responsavel', meta: 'filtro-tipo-meta-item', nivel: 'filtro-nivel-grupo',
      grupo: 'filtro-grupos', marca: 'filtro-marca', item: 'filtro-item', dataInicial: 'filtro-data-inicial', dataFinal: 'filtro-data-final',
    };
    const campos = {};
    for (const [k, id] of Object.entries(ids)) {
      const host = sb.querySelector(`p-autocomplete#${id}, p-dropdown#${id}, p-calendar#${id}, input#${id}`) || sb.querySelector(`#${id}`);
      if (!host || !vis(host)) { campos[k] = null; continue; }
      const inp = host.tagName === 'INPUT' ? host : host.querySelector('input');
      const chips = [...host.querySelectorAll('.p-autocomplete-token-label')].map((c) => L(c.innerText)).filter(Boolean);
      const ddLabel = host.querySelector('.p-dropdown-label');
      const desab = !!(inp && inp.disabled) || host.classList.contains('p-disabled') || !!host.querySelector('.p-disabled');
      let rot = sb.querySelector(`label[for="${id}"]`);
      if (!rot) { let el = host; for (let i = 0; i < 5 && el && !rot; i++) { el = el.parentElement; rot = el && el.querySelector('label'); } }
      const bloco = rot ? rot.parentElement : null;
      const link = bloco ? bloco.querySelector('a') : null;
      campos[k] = {
        rotulo: rot ? L(rot.innerText) : null, valor: ddLabel ? L(ddLabel.innerText) : (inp ? inp.value : ''), chips, desabilitado: desab,
        obrigatorio: !!(bloco && (bloco.querySelector('.campo-obrigatorio') || /\*/.test(rot.innerText))), link: !!link,
      };
    }
    const btn = (txt) => { const b = [...sb.querySelectorAll('button')].find((x) => L(x.innerText) === txt); return b ? { existe: true, habilitado: !b.disabled } : { existe: false }; };
    const rotulos = [...sb.querySelectorAll('label')].filter(vis).map((l) => L(l.innerText)).filter(Boolean);
    return { aberto: true, titulo: L(sb.querySelector('.p-sidebar-header')?.innerText), rotulos, campos, filtrar: btn('Filtrar'), limpar: btn('Limpar') };
  });
}

// Corpo JSON de uma requisição (ou o texto cru).
function corpo(r) { if (!r) return null; try { return JSON.parse(r.postData() || 'null'); } catch (e) { return r.postData(); } }

// Nome do campo do filtro → id do componente.
const IDS = {
  descricao: 'filtro-descricao', responsavel: 'filtro-responsavel', meta: 'filtro-tipo-meta-item', nivel: 'filtro-nivel-grupo',
  grupo: 'filtro-grupos', marca: 'filtro-marca', item: 'filtro-item', dataInicial: 'filtro-data-inicial', dataFinal: 'filtro-data-final',
};
function idCampo(campo) { const id = IDS[campo]; if (!id) throw new Error(`campo "${campo}" desconhecido (use: ${Object.keys(IDS).join(', ')})`); return id; }

module.exports = { limpo, sidebar, lerPainel, lerFiltro, corpo, IDS, idCampo };
