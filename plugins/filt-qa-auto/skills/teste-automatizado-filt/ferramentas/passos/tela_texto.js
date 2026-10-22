// Texto da tela (barato, sem imagem): para enxergar onde um assistente/fluxo parou, sem abrir print.
// args: {apos?: "marcador" (começa no último ponto em que ele aparece), n?: 900}
// Devolve o trecho do texto, os diálogos e os toasts visíveis.
module.exports = async (p, lib, a) => {
  const t = (await p.innerText('body')).split('\n').filter((x) => x.trim()).join(' | ');
  const i = a.apos ? Math.max(0, t.lastIndexOf(a.apos)) : 0;
  return { url: p.url(), texto: t.slice(i, i + (a.n || 900)), dialogos: (await p.locator('.p-dialog:visible').allInnerTexts()).map((x) => x.slice(0, 400)), toasts: await p.locator('.p-toast-message').allInnerTexts() };
};
