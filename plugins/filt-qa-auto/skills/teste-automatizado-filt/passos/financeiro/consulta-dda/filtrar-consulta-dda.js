// Tela: Processos › Financeiro › Consulta DDA — clica Filtrar (ou Limpar) do painel e junta o que aconteceu:
// toasts, diálogos, mensagens do painel, chamadas de API (status + trecho), se o painel fechou e se apareceu carregando.
// args: { botao: 'Filtrar'|'Limpar' }  devolve { eventos, chamadas, filtros, painelAberto, viuCarregando }
const { painel, estadoFiltros } = require('./_apoio');

module.exports = {
  async filtrarDda(t, { botao = 'Filtrar' } = {}) {
    const { p, tela } = t;
    const chamadas = [];
    const ouvir = async (r) => {
      if (!/\/api\//.test(r.url()) || r.request().method() === 'OPTIONS' || /notifica|tour|politica|menu|help|theme|oauth|inteligencia/.test(r.url())) return;
      let corpo = ''; try { corpo = (await r.text()).slice(0, 400); } catch { /* sem corpo */ }
      chamadas.push({ status: r.status(), metodo: r.request().method(), url: r.url().replace(/^https?:\/\/[^/]+/, ''), envio: (r.request().postData() || '').slice(0, 400), corpo });
    };
    p.on('response', ouvir);
    let viuCarregando = false;
    const sel = 'mat-progress-spinner:visible, .mat-progress-spinner:visible, .p-progress-spinner:visible, .p-datatable-loading-overlay:visible, .p-skeleton:visible, .spinner:visible, .loader:visible';
    const vigia = setInterval(() => { p.locator(sel).count().then((n) => { if (n) viuCarregando = true; }).catch(() => {}); }, 80);
    try {
      await painel(p).getByRole('button', { name: botao, exact: true }).click();
      await tela.pronto(p, 1200);
    } finally { clearInterval(vigia); p.off('response', ouvir); }
    const f = await estadoFiltros(p);
    const eventos = [...(await tela.toasts(p)).map((x) => 'TOAST: ' + x), ...(await tela.textoDialogos(p)).map((x) => 'DIALOGO: ' + x),
      ...(f.painelObrigatorios ? ['CAMPOS OBRIGATÓRIOS: ' + f.painelObrigatorios.join(', ')] : []), ...f.obrigatorioSob.map((x) => 'OBRIGATÓRIO SOB: ' + x)];
    return { eventos, chamadas, filtros: f, painelAberto: !!f.aberto, viuCarregando };
  },
};
