// App Filt Pedido (Android, via adb) — tela de LOGIN: CPF/senha do config.json, escolha da base e da filial.
// Use no app um usuário DIFERENTE do ERP web (o sistema aceita um login por usuário): ex. 'secundario' no app, 'principal' no motor.
const a = require('../_adb');

module.exports = {
  // args: { usuario?: 'secundario', base: 'BASE KRAUSE', filial: '1000 - BASE KRAUSE' } → texto da tela inicial
  async entrar(t, { usuario = 'secundario', base, filial }) {
    a.login(usuario);
    const empresa = a.elementos().find((e) => /^CLIENTE_|^[A-Z].*/.test(e.rotulo) && e.y > 1300 && e.y < 1500 && !/Entrar|senha/i.test(e.rotulo));
    if (base && empresa && empresa.rotulo !== base) { a.tocarXY(empresa.x, empresa.y); a.tocar(base); a.tocar('Entrar'); }
    const imp = a.esperarTexto(/Importação concluída|Acessar Filial|PEDIDOS/, 300000);
    if (/Importação concluída/.test(imp.rotulo)) a.tocar('Continuar');
    if (filial) { a.esperarTexto('Acessar Filial'); a.tocar(filial); a.tocar('Confirmar'); }
    a.esperarTexto('Pedidos | Guia 1 de 4');
    t.confere('app logado', true, true);
    return a.tela();
  },
};
