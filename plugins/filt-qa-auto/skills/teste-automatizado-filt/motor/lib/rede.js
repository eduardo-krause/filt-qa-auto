// Acompanha as chamadas de API da aba para:
//  - saber quando a tela terminou de carregar (em vez de esperas fixas);
//  - perceber quando o AT travou (chamada sem resposta por muito tempo) e parar a suíte (regra: AT com problema = parar e avisar);
//  - guardar as respostas de erro (4xx/5xx) como evidência do passo.
const estados = new WeakMap();

// chamadas que ficam abertas ou rodam em segundo plano e não indicam tela carregando
const IGNORAR = /notificacao|inteligencia-artificial|aceite-tour|politicas-de-privacidade|theme\/eh-modo-dark/;
const eApi = (u) => /\/api\//.test(u) && !IGNORAR.test(u);
const curto = (u) => u.replace(/^https?:\/\/[^/]+/, '').slice(0, 160);

class AtTravado extends Error {}

function instalar(p) {
  if (estados.has(p)) return estados.get(p);
  const s = { pend: new Map(), ultimo: Date.now(), ultimaResposta: Date.now(), erros: [] };
  p.on('request', (r) => { if (eApi(r.url())) { s.pend.set(r, Date.now()); s.ultimo = Date.now(); } });
  const fim = (r) => { if (s.pend.delete(r)) { s.ultimo = Date.now(); s.ultimaResposta = Date.now(); } };
  p.on('requestfinished', fim);
  p.on('requestfailed', (r) => { if (s.pend.has(r)) s.erros.push({ em: Date.now(), texto: `FALHOU ${r.method()} ${curto(r.url())} ${(r.failure() || {}).errorText || ''}` }); fim(r); });
  p.on('response', async (resp) => {
    // a resposta já basta para considerar a chamada terminada (requestfinished nem sempre chega via CDP)
    fim(resp.request());
    if (!eApi(resp.url()) || resp.status() < 400) return;
    let corpo = ''; try { corpo = (await resp.text()).replace(/\s+/g, ' ').slice(0, 300); } catch (e) {}
    s.erros.push({ em: Date.now(), texto: `${resp.status()} ${resp.request().method()} ${curto(resp.url())} ${corpo}` });
  });
  estados.set(p, s);
  return s;
}

// Depois de carregar uma página nova (goto/login), as chamadas da página anterior nunca recebem resposta nem
// falha pelo CDP — esquece as que começaram antes de `desde`, para não parecer AT travado.
function esquecerAnteriores(p, desde) {
  const s = instalar(p);
  for (const [r, t] of s.pend) if (t < desde) s.pend.delete(r);
}

function pendentes(p, maisDeMs = 0) {
  const s = instalar(p);
  return [...s.pend.entries()].filter(([, t]) => Date.now() - t >= maisDeMs).map(([r, t]) => `${Math.round((Date.now() - t) / 1000)}s ${r.method()} ${curto(r.url())}`);
}

function errosDesde(p, desde) { return instalar(p).erros.filter((e) => e.em >= desde).map((e) => e.texto); }

// Espera a tela "acalmar": nenhuma chamada de API RECENTE aberta por `calma` ms.
// Chamada aberta há mais de `travadoMs` não segura a espera. Se OUTRAS respostas chegaram depois que ela começou,
// ela só se perdeu (algumas da tela inicial nunca recebem resposta nem falha pelo CDP) e é ignorada.
// AT travado = 2+ chamadas diferentes abertas há mais de `travadoMs` sem NENHUMA resposta do sistema desde que ela começou → AtTravado.
async function ocioso(p, { calma = 700, limite = 90000, travadoMs = 60000 } = {}) {
  const s = instalar(p); const t0 = Date.now();
  const recentes = () => [...s.pend.values()].filter((t) => Date.now() - t < travadoMs).length;
  // precisa de pelo menos 2 chamadas DIFERENTES presas: uma só, com a tela parada, costuma ser chamada perdida
  const travadas = () => { const l = [...s.pend.entries()].filter(([, t]) => t >= s.ultimaResposta && Date.now() - t > travadoMs); return new Set(l.map(([r]) => r.url().replace(/\?.*/, ''))).size >= 2 ? l : []; };
  while (Date.now() - t0 < limite) {
    if (recentes() === 0 && Date.now() - s.ultimo >= calma) return;
    if (travadas().length) break;
    await p.waitForTimeout(200);
  }
  if (travadas().length) {
    const presas = travadas().map(([r, t]) => `${Math.round((Date.now() - t) / 1000)}s ${r.method()} ${curto(r.url())}`);
    const unicas = [...new Set(presas.map((x) => x.replace(/^\d+s /, '').replace(/\?.*/, '')))];
    throw new AtTravado(`PROBLEMA NO AT DA TAREFA — nenhuma resposta do sistema há mais de ${Math.round(travadoMs / 1000)}s; ${presas.length} chamada(s) abertas: ${unicas.slice(0, 4).join(' | ')}${unicas.length > 4 ? ` (+${unicas.length - 4})` : ''}. Avisar a pessoa para conferir o AT.`);
  }
}

module.exports = { instalar, ocioso, pendentes, errosDesde, esquecerAnteriores, AtTravado };
