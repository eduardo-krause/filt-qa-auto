// Tela: Processos › Financeiro › Consulta DDA — rola uma área até o fim (rolagem do mouse sobre a lista) e mede o que carregou.
// args: { area: 'DDA'|'Contas a Pagar', vezes?: 1 }  devolve { linhasAntes, linhasDepois, chamadas, topoOutraArea, viuCarregando }
module.exports = {
  async rolarAreaDda(t, { area, vezes = 1 }) {
    const { p, tela } = t;
    const areas = p.locator('.area');
    const a = areas.filter({ has: p.locator('.area-titulo .titulo', { hasText: new RegExp(`^\\s*${area}\\s*$`) }) }).first();
    const outra = areas.filter({ hasNot: p.locator('.area-titulo .titulo', { hasText: new RegExp(`^\\s*${area}\\s*$`) }) }).first();
    const sc = a.locator('.area-scroll');
    const chamadas = [];
    const ouvir = (r) => { if (/consulta-dda/.test(r.url())) chamadas.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`); };
    const linhasAntes = await a.locator('tbody tr.linha').count();
    const topoOutraAntes = await outra.locator('.area-scroll').evaluate((e) => e.scrollTop).catch(() => null);
    let viuCarregando = false;
    p.on('response', ouvir);
    // vigia o indicador de carregamento (na área ou na tela) enquanto rola e espera a próxima página
    const sel = 'mat-progress-spinner:visible, .mat-progress-spinner:visible, .p-progress-spinner:visible, .carregando:visible, .loading:visible, .spinner:visible';
    const vigia = setInterval(() => { p.locator(sel).count().then((n) => { if (n) viuCarregando = true; }).catch(() => {}); }, 80);
    try {
      for (let i = 0; i < vezes; i++) {
        const box = await sc.boundingBox();
        await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        for (let k = 0; k < 15; k++) { await p.mouse.wheel(0, 600); await p.waitForTimeout(60); }
        await tela.pronto(p, 800);
      }
    } finally { clearInterval(vigia); p.off('response', ouvir); }
    return {
      linhasAntes, linhasDepois: await a.locator('tbody tr.linha').count(), chamadas,
      topoOutraArea: [topoOutraAntes, await outra.locator('.area-scroll').evaluate((e) => e.scrollTop).catch(() => null)],
      topoArea: await sc.evaluate((e) => e.scrollTop), viuCarregando,
    };
  },
};
