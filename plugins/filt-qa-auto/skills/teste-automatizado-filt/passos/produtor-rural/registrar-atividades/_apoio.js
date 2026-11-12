// Tela: Produtor Rural › Registrar Atividades (/produtor-rural/registro-atividade → /form?id=<ID_REGISTRO_ATIVIDADE>) — ajudantes dos cenários desta tela (não é cenário)
const ROTA = '/produtor-rural/registro-atividade';

// Garante a filial logada (código do estabelecimento, ex.: 2000). Sem `filial`, não mexe. O motor entra na filial padrão da base a cada suíte.
async function garantirFilial(t, filial) {
  if (!filial) return;
  const { p, tela } = t;
  const botao = () => p.locator('.toolbar-btn-empresa').first();
  if (!(await botao().count())) await tela.abrir(p, '/home');
  await botao().waitFor({ timeout: 30000 });
  if (tela.limpo(await botao().innerText()).includes(String(filial))) return;
  await require('../../geral/estabelecimento/trocar-filial-logada').trocar(t, { codigo: filial });
}

// Abre o formulário: registro existente (id) ou novo.
async function abrirForm(t, { id, filial } = {}) {
  await garantirFilial(t, filial);
  await t.tela.abrir(t.p, ROTA + '/form' + (id ? '?id=' + id : ''));
  await t.tela.fecharToasts(t.p);
  if (id) {   // espera o registro carregar (Atividade preenchida) antes de agir
    await t.p.waitForFunction(() => (document.querySelector('input#atividade') || {}).value, null, { timeout: 30000 }).catch(() => {});
    await t.tela.semLoader(t.p);
  }
}

// Cabeçalho "Apontamento": autocompletes (Configuração, Safra, Atividade) e datas dd/mm/aaaa.
async function preencherCabecalho(t, { configuracao, safra, atividade, dataInicial, dataFinal, dataRegistro }) {
  const { p, tela } = t;
  await tela.autocomplete(p, p.locator('input#configuracaoAtividade'), configuracao, configuracao);
  await tela.autocomplete(p, p.locator('input#controleSafra'), safra, safra);
  await tela.autocomplete(p, p.locator('input#atividade'), atividade, atividade);
  await tela.data(p, p.locator('input[name=dataInicial]'), dataInicial);
  await tela.data(p, p.locator('input[name=dataFinal]'), dataFinal);
  await tela.data(p, p.locator('input[name=dataCadastro]'), dataRegistro);
}

const card = (p, titulo) => p.locator('p-accordiontab', { hasText: titulo }).first();

// Card Insumos › Adicionar › item, quantidade solicitada (máscara de 3 casas) › Adicionar.
async function adicionarInsumo(t, { item, qtd, casas = 3 }) {
  const { p, tela } = t;
  await card(p, 'Insumos').locator('button:has-text("Adicionar")').first().click(); await tela.pronto(p, 800);
  const dlg = await tela.dialogo(p);
  if (!dlg) throw new Error('o diálogo "Novo item" dos Insumos não abriu');
  await tela.autocomplete(p, p.locator('input#item'), item, item);
  await tela.digitar(p, tela.campo(dlg, 'Quantidade solicitada'), tela.qtd(qtd, casas));
  await tela.botao(p, 'Adicionar', { escopo: dlg });
  const sobrou = await tela.textoDialogos(p);
  if (sobrou.length) throw new Error('o diálogo do insumo continuou aberto: ' + sobrou.join(' | '));
}

// Card Máquinas › Adicionar › Patrimônio (bem), contador final › Adicionar.
// Se a tela mostrar o diálogo "Aviso" ao escolher o bem, o texto exato vai em `aviso`, o Ok é clicado e o modal é cancelado (bem não entra).
// → { bem, incluido, aviso, modalAposOk, contadorInicial, contadorFinal, dialogos, toasts, linhasMaquinas }
async function adicionarBem(t, { bem, contadorFinal }) {
  const { p, tela } = t;
  await card(p, 'Máquinas').locator('button:has-text("Adicionar")').first().click(); await tela.pronto(p, 800);
  const modal = p.locator('.p-dialog:visible', { hasText: 'Adicionar máquina' }).first();
  await modal.waitFor({ timeout: 15000 });
  await tela.autocomplete(p, p.locator('input#patrimonio'), bem, bem);
  await tela.pronto(p, 1200);
  const res = { bem, incluido: false, aviso: null, contadorInicial: null, contadorFinal: null, dialogos: [], toasts: [] };
  const aviso = p.locator('.p-dialog:visible', { hasText: /^\s*Aviso/ }).first();
  if (await aviso.count()) {
    res.aviso = tela.limpo(await aviso.innerText());
    res.dialogos = await tela.textoDialogos(p);
    await aviso.getByRole('button', { name: 'Ok', exact: true }).click(); await tela.pronto(p, 800);
    res.toasts = await tela.toasts(p);
    res.modalAposOk = (await modal.count()) ? 'continua aberto (patrimônio: "' + (await p.locator('input#patrimonio').inputValue()) + '")' : 'fechado';
    if (await modal.count()) await tela.botao(p, 'Cancelar', { escopo: modal });
    res.linhasMaquinas = await linhasMaquinas(p, tela);
    return res;
  }
  const lido = async (id) => (await p.locator('input#' + id).inputValue()).trim();
  res.contadorInicial = await lido('contadorInicial');
  if (contadorFinal !== undefined && contadorFinal !== null) await tela.digitar(p, p.locator('input#contadorFinal'), tela.moeda(contadorFinal));
  res.contadorFinal = await lido('contadorFinal');
  await tela.botao(p, 'Adicionar', { escopo: modal });
  res.dialogos = await tela.textoDialogos(p); res.toasts = await tela.toasts(p);
  res.incluido = !(await modal.count());
  res.linhasMaquinas = await linhasMaquinas(p, tela);
  return res;
}

// Linhas da tabela do card Máquinas (texto) — comprova o que entrou (ou não) no registro.
const linhasMaquinas = async (p, tela) => (await card(p, 'Máquinas').locator('tr.table-body-line').allInnerTexts()).map(tela.limpo);

const ultimoId = (t) => t.banco.valor('select coalesce(max(ID_REGISTRO_ATIVIDADE),0) from REGISTRO_ATIVIDADE');

// Estado do registro no banco: status, datas e os bens com contadores.
async function lerRegistro(t, id) {
  const reg = await t.banco.linha('select ID_REGISTRO_ATIVIDADE id, STATUS, ID_ATIVIDADE_PRODUTOR_RURAL atividade, DATA_INICIAL, HORA_INICIAL, DATA_FINAL, HORA_FINAL from REGISTRO_ATIVIDADE where ID_REGISTRO_ATIVIDADE = ?', [id]);
  const bens = await t.banco.consultar('select ID_REGISTRO_ATIVIDADE_BEM id, ID_BEM bem, CONTADOR_INICIAL, CONTADOR_FINAL, CONTADOR_TOTAL from REGISTRO_ATIVIDADE_BEM where ID_REGISTRO_ATIVIDADE = ? order by 1', [id]);
  return { ...reg, bens };
}

module.exports = { ROTA, garantirFilial, abrirForm, preencherCabecalho, card, adicionarInsumo, adicionarBem, ultimoId, lerRegistro };
