// args: {code:"async (p, lib) => {...}"} ou {file:"caminho.js", ...} (o arquivo exporta async (p, lib, args))
module.exports = async (p, args, lib) => { const f = args.file ? (delete require.cache[require.resolve(args.file)], require(args.file)) : eval(args.code); return await f(p, lib, args); };
