// Apoio da tela Processos › Financeiro › Duplicatas a Pagar (/financeiro/duplicata-pagar/form?id=N).
const tela = require('../../../motor/lib/tela');

const CAMPOS = ['Pessoa', 'Data de Emissão', 'Data de Entrada', 'Data de Vencimento', 'Número Duplicata', 'Parcelamento', 'Valor Duplicata', 'Valor Baixado', 'Saldo', 'Linha Digitável'];
const TITULO_JUST = 'Alteração da Data de Vencimento';

async function abrirForm(p, id) {
  await tela.abrir(p, '/financeiro/duplicata-pagar/form?id=' + id);
  await tela.semLoader(p);
  await p.locator('p-calendar#dataVencimento input').waitFor({ timeout: 30000 });
  await tela.pronto(p, 600);
}

async function vencimento(p) {
  const i = p.locator('p-calendar#dataVencimento input');
  return { valor: await i.inputValue(), editavel: await i.evaluate((e) => !e.disabled && !e.readOnly) };
}

async function lerCampos(p) {
  const out = {};
  for (const r of CAMPOS) {
    const i = r === 'Data de Vencimento' ? p.locator('p-calendar#dataVencimento input') : r === 'Linha Digitável' ? p.locator('input#linhaDigitavel') : tela.campo(p, r);
    out[r] = (await i.count()) ? tela.limpo(await i.first().inputValue()) : null;
  }
  return out;
}

const dialogoJust = (p) => p.locator('p-dialog').filter({ hasText: TITULO_JUST }).locator('.p-dialog:visible');

// Digita a data no campo (clique, Ctrl+A, dd/mm/aaaa, Tab). → { dialogo: bool }
async function digitarVencimento(p, data) {
  const i = p.locator('p-calendar#dataVencimento input');
  await i.scrollIntoViewIfNeeded(); await i.click(); await p.keyboard.press('Control+A');
  await p.keyboard.type(data, { delay: 40 }); await p.keyboard.press('Tab');
  await tela.esperar(p, 600);
  const d = dialogoJust(p);
  await d.waitFor({ timeout: 5000 }).catch(() => {});
  return { dialogo: (await d.count()) > 0 };
}

async function confirmarHabilitado(p) {
  const b = dialogoJust(p).getByRole('button', { name: 'Confirmar' });
  return !(await b.isDisabled());
}

async function digitarJustificativa(p, texto) {
  const ta = dialogoJust(p).locator('textarea#justificativaVencimento');
  await ta.click(); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace');
  if (texto) await p.keyboard.type(texto, { delay: 20 });
  await tela.esperar(p, 300);
}

module.exports = { CAMPOS, TITULO_JUST, abrirForm, vencimento, lerCampos, dialogoJust, digitarVencimento, confirmarHabilitado, digitarJustificativa };
