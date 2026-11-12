// Tela: Processos › Financeiro › Retorno Bancário (/financeiro/retorno-cobranca-bancaria), aba "Arquivo de retorno"
// Componente: RetornoComponent (retorno.component.html). A área tracejada "Solte seus arquivos aqui." abre o seletor (p-fileUpload auto,
// accept .ret/.crt); o envio é automático: POST {fiscal}/remessa-retorno-bancario/upload-retorno (multipart "arquivo") →
// RemessaRetornoBancario { configuracaoPortador, documentosFinanceiros:[{ nossoNumero, status ATUALIZADO|DIVERGENTE|REJEICAO,
// ehDiveregente, dataBaixa, valorRecebido, documentoFinanceiro{...} }] }. Grade "Boletos": legenda colorida com title = status,
// contadores Total/Atualizados/Rejeitados/Divergêntes, linha expansível (valores + "Divergências"/"Rejeições" + motivos).
// Sem documentos na resposta: toast "Atenção — Não houve registros processados neste arquivo".
const path = require('path');
const { limpo } = require('../../_comum');
const { ROTA } = require('./_apoio');

const ABA = /Arquivo de retorno/i;

module.exports = {
  // Envia um arquivo de retorno pela aba "Arquivo de retorno" como o usuário (CARREGAR ARQUIVO → seletor de arquivo) e lê o que a tela mostrou.
  // args: { arquivo (caminho), conta? (só conferência: texto esperado no campo Conta Bancária/Caixa) }
  // devolve { conta, contadores, linhas:[{ status, Duplicata, 'Nosso Número', Pessoa, ..., detalhe }], toasts, errosApi, api:{ status, corpo } }
  async processarArquivoRetorno(t, { arquivo, conta }) {
    const { p, tela } = t;
    if (!arquivo) throw new Error('informe o arquivo de retorno');
    await tela.abrir(p, ROTA);
    const aba = p.locator('.p-tabview-nav li').filter({ hasText: ABA }).first();
    await aba.waitFor({ timeout: 30000 });
    await aba.click(); await tela.pronto(p, 500);
    // o botão "CARREGAR ARQUIVO" fica oculto (barra do p-fileUpload escondida); o usuário clica na área tracejada
    // "Solte seus arquivos aqui." (.p-fileupload-content), cujo contêiner abre o seletor de arquivo (openUploadArquivo)
    const botao = p.locator('.adjust-porAquivo .p-fileupload-content').first();
    await botao.waitFor({ timeout: 30000 });

    let api = null;
    const onResp = async (r) => {
      if (!/\/remessa-retorno-bancario\/upload-retorno/.test(r.url())) return;
      const corpo = await r.text().catch(() => '');
      api = { status: r.status(), corpo };
    };
    p.on('response', onResp);
    const vistos = []; const ini = Date.now();
    const coleta = async () => { for (const x of await tela.toasts(p)) if (!vistos.includes(x)) vistos.push(x); };
    try {
      const [chooser] = await Promise.all([p.waitForEvent('filechooser', { timeout: 15000 }), botao.click()]);
      await chooser.setFiles(path.resolve(arquivo));
      const limite = Date.now() + 90000;
      while (!api && Date.now() < limite) { await coleta(); await p.waitForTimeout(300); }
      await tela.pronto(p, 800);
      const fim = Date.now() + 3000;
      while (Date.now() < fim) { await coleta(); await p.waitForTimeout(300); }
    } finally { p.off('response', onResp); }
    if (!api) throw new Error('o envio do arquivo não chamou /upload-retorno em 90 s');
    const ev = await tela.evidencia(p, ini);

    let json = null; try { json = JSON.parse(api.corpo); } catch (e) { /* corpo de erro em texto */ }
    const docsApi = json && Array.isArray(json.documentosFinanceiros) ? json.documentosFinanceiros.map((d) => ({
      nossoNumero: d.nossoNumero, status: d.status, ehDiveregente: d.ehDiveregente, dataBaixa: d.dataBaixa, valorRecebido: d.valorRecebido,
      documento: d.documentoFinanceiro && d.documentoFinanceiro.numeroDocumento && d.documentoFinanceiro.numeroDocumento.label,
      idDocumento: d.documentoFinanceiro && d.documentoFinanceiro.id,
    })) : null;

    // Grade "Boletos"

    const temGrade = await p.locator('.table-duplicata table').first().isVisible().catch(() => false);
    let linhas = []; let contadores = null; let contaTela = null;
    if (temGrade) {
      contaTela = await p.locator('input#contaBancariaCaixa').first().inputValue().catch(() => null);
      contadores = (await p.locator('.border-total span').allInnerTexts().catch(() => [])).map(limpo);
      const cab = (await p.locator('.table-duplicata table thead th').allInnerTexts()).map(limpo);
      const trs = p.locator('.table-duplicata table tbody tr.table-body-line');
      const n = await trs.count();
      for (let i = 0; i < n; i++) {
        const tr = trs.nth(i);
        const o = await tr.evaluate((el, cab) => {
          const tds = [...el.querySelectorAll('td')];
          const r = { status: tds[0] ? tds[0].getAttribute('title') : null, cor: tds[0] ? [...tds[0].classList].filter((c) => c.startsWith('status-')).join(' ') : null };
          tds.forEach((td, j) => { if (j > 1 && cab[j]) r[cab[j]] = td.innerText.replace(/\s+/g, ' ').trim(); });
          return r;
        }, cab);
        // expande a linha (seta) e lê o detalhe
        const seta = tr.locator('a[href="#"]').first();
        if (await seta.count()) {
          await seta.click(); await tela.pronto(p, 300);
          const exp = tr.locator('xpath=following-sibling::tr[1]');
          o.detalhe = limpo(await exp.innerText().catch(() => ''));
          await seta.click(); await tela.pronto(p, 200);
        }
        linhas.push(o);
      }
    }

    if (conta && contaTela != null && !String(contaTela).includes(String(conta))) t.anotar(`Conta Bancária/Caixa mostrada "${contaTela}" (esperado conter "${conta}")`);
    return {
      conta: contaTela, contadores, linhas, toasts: vistos, errosApi: ev.errosApi || [], dialogos: await tela.textoDialogos(p),
      api: { status: api.status, documentos: docsApi, portador: json && json.configuracaoPortador ? { id: json.configuracaoPortador.id, conta: json.configuracaoPortador.conta } : null, id: json && json.id, erro: json ? undefined : String(api.corpo).slice(0, 600) },
    };
  },
};
