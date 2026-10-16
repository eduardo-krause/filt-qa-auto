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
  const s = { pend: new Map(), ultimo: Date.now(), erros: [] };
  p.on('request', (r) => { if (eApi(r.url())) { s.pend.set(r, Date.now()); s.ultimo = Date.now(); } });
  const fim = (r) => { if (s.pend.delete(r)) s.ultimo = Date.now(); };
  p.on('requestfinished', fim);
  p.on('requestfailed', (r) => { if (s.pend.has(r)) s.erros.push({ em: Date.now(), texto: `FALHOU ${r.method()} ${curto(r.url())} ${(r.failure() || {}).errorText || ''}` }); fim(r); });
  p.on('response', async (resp) => {
    if (!eApi(resp.url()) || resp.status() < 400) return;
    let corpo = ''; try { corpo = (await resp.text()).replace(/\s+/g, ' ').slice(0, 300); } catch (e) {}
    s.erros.push({ em: Date.now(), texto: `${resp.status()} ${resp.request().method()} ${curto(resp.url())} ${corpo}` });
  });
  estados.set(p, s);
  return s;
}

function pendentes(p, maisDeMs = 0) {
  const s = instalar(p);
  return [...s.pend.entries()].filter(([, t]) => Date.now() - t >= maisDeMs).map(([r, t]) => `${Math.round((Date.now() - t) / 1000)}s ${r.method()} ${curto(r.url())}`);
}

function errosDesde(p, desde) { return instalar(p).erros.filter((e) => e.em >= desde).map((e) => e.texto); }

// Espera a tela "acalmar": nenhuma chamada de API aberta por `calma` ms.
// Se passar de `limite` com chamada aberta há mais de `travadoMs`, o AT travou → AtTravado (para a suíte toda).
async function ocioso(p, { calma = 700, limite = 90000, travadoMs = 60000 } = {}) {
  const s = instalar(p); const t0 = Date.now();
  while (Date.now() - t0 < limite) {
    if (s.pend.size === 0 && Date.now() - s.ultimo >= calma) return;
    await p.waitForTimeout(200);
  }
  const presas = pendentes(p, travadoMs);
  if (presas.length) {
    const unicas = [...new Set(presas.map((x) => x.replace(/^\d+s /, '').replace(/\?.*/, '')))];
    throw new AtTravado(`PROBLEMA NO AT DA TAREFA — ${presas.length} chamada(s) sem resposta há mais de ${Math.round(travadoMs / 1000)}s: ${unicas.slice(0, 4).join(' | ')}${unicas.length > 4 ? ` (+${unicas.length - 4})` : ''}. Avisar a pessoa para conferir o AT.`);
  }
}

module.exports = { instalar, ocioso, pendentes, errosDesde, AtTravado };
