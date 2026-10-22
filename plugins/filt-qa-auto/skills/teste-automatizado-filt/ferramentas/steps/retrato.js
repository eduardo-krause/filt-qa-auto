// Retrato da tela atual (campos, botões, diálogos, tabelas, obrigatórios). args: {nome?: "arquivo"} — com nome tira print (só quando a pessoa pedir)
module.exports = async (p, args, lib) => lib.retrato(p, args.nome);
