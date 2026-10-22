// escolhe o Local de Estoque no diálogo de item aberto e confirma que o formulário aceitou
module.exports = async (p, lib) => {
  const box = p.locator('.p-dialog:visible p-autocomplete#localEstoque').last();
  const res = [];
  for (let tent = 0; tent < 3; tent++) {
    if (!(await box.evaluate(e => e.classList.contains('ng-invalid')))) return res.concat(['ok']);
    if (tent === 0) { await box.locator('button').click(); await lib.esperar(p, 3500); }
    else { const inp = box.locator('input').first(); await inp.click(); await inp.fill(''); await p.keyboard.type(tent === 1 ? 'EST' : 'LOC', { delay: 80 }); await lib.esperar(p, 3500); }
    const ops = p.locator('li[role=option]:visible'); const t = await ops.allInnerTexts(); res.push(t.slice(0, 3));
    if (t.length) { await ops.first().click(); await lib.esperar(p, 1500); }
  }
  return res.concat([(await box.evaluate(e => e.classList.contains('ng-invalid'))) ? 'AINDA INVALIDO' : 'ok']);
};
