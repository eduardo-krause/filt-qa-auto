// Chave de acesso fictícia (44 dígitos, DV válido) para nota de terceiros digitada à mão.
// uso: require('./chave.js')(serie, numero, cnpj?, aamm?) — a Sefaz não conhece essa chave.
module.exports = function chave(serie, numero, cnpj, aamm) {
  const b = '41' + (aamm || '2609') + (cnpj || '12345678000195') + '55' + String(serie).padStart(3, '0') + String(numero).padStart(9, '0') + '1' + String(numero).slice(-8).padStart(8, '0');
  let s = 0, w = 2; for (let i = b.length - 1; i >= 0; i--) { s += Number(b[i]) * w; w = w === 9 ? 2 : w + 1; }
  const r = s % 11; return b + (r < 2 ? 0 : 11 - r);
};
