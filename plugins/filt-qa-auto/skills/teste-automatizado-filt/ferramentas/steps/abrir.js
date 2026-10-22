// Abre uma rota do sistema. args: {rota: "/nota/nota-fiscal", novo?: true, registro?: "texto da linha a clicar"}
// Sempre recarrega a lista antes (o SPA pode manter o registro anterior no /form).
module.exports = async (p, args, lib, { base }) => {
  if (!base) throw new Error('faça o login primeiro (steps/login)');
  await p.goto(base + args.rota, { waitUntil: 'networkidle' });
  await p.reload({ waitUntil: 'networkidle' }); await lib.esperar(p, 2500);
  if (args.novo) { await p.locator('button:has-text("Novo")').first().click(); await lib.esperar(p, 4000); }
  if (args.registro) { await p.locator(`text=${args.registro}`).first().click(); await lib.esperar(p, 5000); }
  return lib.retrato(p, args.print);
};
