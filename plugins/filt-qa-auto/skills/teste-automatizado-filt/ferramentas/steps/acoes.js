// Executa uma lista de ações em qualquer tela. args: {acoes: [...], print?: "nome"}
// Ações (uma chave por objeto):
//  {"ac": ["Label", "texto", "trecho da opção"]}   autocomplete ("" no texto = abrir pela seta)
//  {"dd": ["Label", "trecho da opção"]}            dropdown
//  {"texto": ["Label", "valor"]}                   campo simples (label com "=" = texto exato)
//  {"moeda": ["Label", 100.5, 2]}                  moeda (casas 2; desconto unitário usa 5)
//  {"moedaId": ["valorFrete", 50, 2]}              moeda pelo id do input (dentro do diálogo aberto, se houver)
//  {"clicar": "texto do botão/elemento"}           clica pelo texto (no diálogo aberto, se houver)
//  {"clicarXY": [x, y]}
//  {"tecla": "Escape"}
//  {"salvar": true}                                Salvar do registro → devolve status
//  {"acerto": "Dinheiro"}                          acerto financeiro
//  {"docRef": {"pessoa": "...", "numero": "364", "itens": [{"texto": "ITEM", "qtd": 2}]}}
//  {"menu": "Excluir"}                             menu ⋮ (sem valor = listar)
//  {"confirmar": "Excluir"}                        botão do diálogo de confirmação
//  {"esperar": 3000}
//  {"print": "nome"}                              print — só quando a pessoa pedir
module.exports = async (p, args, lib, { sessao }) => {
  const log = [];
  const grava = (args.acoes || []).some((a) => ['salvar', 'acerto', 'confirmar'].includes(Object.keys(a)[0]) || (a.menu && a.menu !== true));
  const fiscal = /\/nota\/|conhecimento-de-transporte|\/pdv|manifesto|nfce|mdfe/i.test(p.url());
  // Emitir documento fiscal é permitido — desde que o DF-e NÃO esteja em ambiente PRODUÇÃO (conferido por checar_dfe.py).
  // (a trava fica também dentro de lib.salvar, para valer em qualquer passo)
  if (grava && fiscal) {
    const chk = sessao.ambiente === 'producao' ? sessao.dfe_producao : sessao.dfe_at;
    if (!chk) throw new Error(`BLOQUEADO: confira o DF-e antes — python checar_dfe.py${sessao.ambiente === 'producao' ? ' --producao, ou node run.js checar_dfe_tela' : ''}.`);
    if (!chk.ok) throw new Error('BLOQUEADO: ' + chk.bloqueio);
  }
  // PRODUÇÃO (só bases de teste de config producao.basesTeste): lançamentos pela tela liberados; a trava de DF-e acima continua valendo.
  const escopo = async () => { const d = p.locator('.p-dialog:visible').last(); return (await d.count()) ? d : null; };
  for (const a of args.acoes || []) {
    const [k, v] = Object.entries(a)[0];
    let r = 'ok';
    const sc = await escopo();
    if (k === 'ac') r = await lib.ac(p, v[0], v[1], v[2], sc || undefined);
    else if (k === 'dd') r = await lib.dd(p, v[0], v[1], sc || undefined);
    else if (k === 'texto') await lib.texto(p, v[0], v[1], sc || undefined);
    else if (k === 'moeda') await lib.moeda(p, v[0], v[1], v[2] || 2, sc || undefined);
    else if (k === 'moedaId') await lib.moedaId(p, v[0], v[1], v[2] || 2, sc || undefined);
    else if (k === 'clicar') { await (sc || p).locator(`button:has-text("${v}"), text="${v}"`).first().click(); await lib.esperar(p, 2000); }
    else if (k === 'clicarXY') { await p.mouse.click(v[0], v[1]); await lib.esperar(p, 1500); }
    else if (k === 'tecla') await p.keyboard.press(v);
    else if (k === 'salvar') r = await lib.salvar(p);
    else if (k === 'acerto') r = await lib.acerto(p, v === true ? undefined : v);
    else if (k === 'docRef') r = await lib.docRef(p, v);
    else if (k === 'menu') r = await lib.menu(p, v === true ? undefined : v);
    else if (k === 'confirmar') { await p.locator(`.p-dialog:visible button:has-text("${v}"), .p-confirm-dialog button:has-text("${v}")`).last().click(); await lib.esperar(p, 5000); r = { toasts: await lib.toasts(p) }; }
    else if (k === 'esperar') await lib.esperar(p, v);
    else if (k === 'print') r = await p.screenshot({ path: require('path').join(lib.pastaPrints(), v + '.png') }).then(() => v + '.png');
    else r = 'ação desconhecida: ' + k;
    log.push({ [k]: v, resultado: r });
    if (r && r.ok === false) break;
  }
  const fim = await lib.retrato(p, args.print);
  return { log, tela: { url: fim.url, dialogos: fim.dialogos, toasts: fim.toasts, obrigatorios: fim.obrigatorios, print: fim.print } };
};
