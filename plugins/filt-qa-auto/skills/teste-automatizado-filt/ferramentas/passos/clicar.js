// args: {texto:"...", exato?:bool, menu?:true|"acao"} — clica por texto (getByText) e opcionalmente lista/aciona o menu ⋮
module.exports = async (p, args, lib) => {
  if (args.texto) { await p.getByText(args.texto, { exact: !!args.exato }).first().click(); await lib.esperar(p, args.espera || 3000); }
  let m = null;
  if (args.menu) m = await lib.menu(p, args.menu === true ? undefined : args.menu);
  const r = await lib.retrato(p, args.print);
  return { menu: m, url: r.url, botoes: r.botoes, dialogos: r.dialogos, toasts: r.toasts, campos: args.campos ? r.campos : undefined, tabelas: args.tabelas ? r.tabelas : undefined };
};
