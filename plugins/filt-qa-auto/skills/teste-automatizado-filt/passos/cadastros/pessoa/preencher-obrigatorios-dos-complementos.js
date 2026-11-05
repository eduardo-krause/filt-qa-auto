// Tela: Cadastros › Pessoa (/fiscal/pessoa/form) — complementos (p-tabview#dadosAdicionais-N), abas Geral e Produtor Rural
const { limpo } = require('../../_comum');

// Campo do painel pelo rótulo exato (com ou sem asterisco).
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
function rotulo(painel, texto) { return painel.locator('label:visible').filter({ hasText: new RegExp('^\\s*' + esc(texto) + '\\s*\\*?\\s*$') }).first(); }

module.exports = {
  // Em cada complemento, preenche SÓ o que estiver vazio entre os obrigatórios que o Salvar pede:
  // Geral → Perfil tributário (opção pedida ou a 1ª da lista pela seta), E-mail principal e E-mail documento eletrônico (args.email);
  // Produtor Rural → Forma de recolhimento funrural (opção pedida ou a 1ª depois de "Selecione"). Só pelo mouse; não salva.
  // args: { email: 'teste@exemplo.com', perfil?, funrural?, complementos?: [índices] (padrão: todos), campos?: [rótulos] (padrão: os quatro) }
  // devolve [{ indice, preenchidos: { campo: valor } }]
  async preencherObrigatoriosDosComplementos(t, { email = 'teste@teste.com.br', perfil, funrural, complementos, campos }) {
    const quer = (c) => !campos || campos.includes(c);
    const { p, tela } = t;
    const tvs = p.locator('p-tabview[id^="dadosAdicionais-"]');
    const n = await tvs.count(); const out = [];
    const aba = async (tv, nome) => { await tv.locator('.p-tabview-nav li').filter({ hasText: new RegExp('^\\s*' + esc(nome) + '\\s*$', 'i') }).first().click(); await p.waitForTimeout(300); return tv.locator('.p-tabview-panel:not([hidden])').first(); };
    for (let i = 0; i < n; i++) {
      if (complementos && !complementos.includes(i)) continue;
      const tv = tvs.nth(i); const r = { indice: i, preenchidos: {} };
      let g = await aba(tv, 'Geral');
      // Perfil tributário (autocomplete com seta)
      const pinp = g.locator('input#perfilTributario').first();
      if (quer('Perfil tributário') && (await pinp.count()) && !(await pinp.inputValue())) {
        // espera fechar a lista do complemento anterior (senão o clique cai nela)
        await p.locator('.p-autocomplete-panel:visible').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        await g.locator('p-autocomplete#perfilTributario .p-autocomplete-dropdown').first().click();
        const ops = p.locator('.p-autocomplete-panel:visible li');
        await ops.first().waitFor({ timeout: 10000 }).catch(() => {});
        const textos = (await ops.allInnerTexts()).map(limpo);
        const k = perfil ? textos.findIndex((o) => o === perfil || o.includes(perfil)) : 0;
        if (k < 0 || !textos.length) throw new Error(`complemento ${i}: opção "${perfil || '(1ª)'}" não está no Perfil tributário (tem: ${textos.join(' | ')})`);
        await ops.nth(k).click(); await tela.pronto(p, 300);
        await p.locator('.p-autocomplete-panel:visible').first().waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
        r.preenchidos['Perfil tributário'] = await pinp.inputValue();
        if (!r.preenchidos['Perfil tributário']) t.anotar(`ATENÇÃO: complemento ${i}: o clique em "${textos[k]}" não preencheu o Perfil tributário`);
      }
      for (const nome of ['E-mail principal', 'E-mail documento eletrônico']) {
        if (!quer(nome)) continue;
        const lab = rotulo(g, nome); if (!(await lab.count())) continue;
        const id = await lab.getAttribute('for');
        const inp = id ? g.locator(`[id="${id}"]`).first() : lab.locator('xpath=following::input[1]');
        if (await inp.inputValue()) continue;
        await tela.digitar(p, inp, email); r.preenchidos[nome] = await inp.inputValue();
      }
      // Produtor Rural → Forma de recolhimento funrural (p-dropdown)
      const pr = quer('Forma de recolhimento funrural') ? await aba(tv, 'Produtor Rural') : null;
      const lab = pr && rotulo(pr, 'Forma de recolhimento funrural');
      if (lab && (await lab.count())) {
        const d = lab.locator('xpath=ancestor::*[.//p-dropdown][1]').locator('.p-dropdown').first();
        const atual = limpo(await d.locator('.p-dropdown-label').innerText().catch(() => ''));
        if (!atual || /^Selecione$/i.test(atual)) {
          await d.scrollIntoViewIfNeeded(); await d.click(); await tela.pronto(p, 400);
          const ops = p.locator('li.p-dropdown-item:visible, li[role=option]:visible');
          const textos = (await ops.allInnerTexts()).map(limpo);
          const k = funrural ? textos.findIndex((o) => o === funrural) : textos.findIndex((o) => o && !/^Selecione$/i.test(o));
          if (k < 0) throw new Error(`complemento ${i}: opção "${funrural || '(1ª)'}" não está em Forma de recolhimento funrural (tem: ${textos.join(' | ')})`);
          await ops.nth(k).click(); await tela.pronto(p, 300);
          r.preenchidos['Forma de recolhimento funrural'] = limpo(await d.locator('.p-dropdown-label').innerText().catch(() => ''));
          if (r.preenchidos['Forma de recolhimento funrural'] !== textos[k]) t.anotar(`ATENÇÃO: complemento ${i}: o clique em "${textos[k]}" não trocou a Forma de recolhimento funrural`);
        }
      }
      await aba(tv, 'Geral');
      out.push(r);
    }
    return out;
  },
};
