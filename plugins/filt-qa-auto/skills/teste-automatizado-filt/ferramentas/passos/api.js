// args: {url:"/api/...", metodo?:"GET", corpo?:{}} — chamada à API com o token da sessão (somente leitura por padrão)
module.exports = async (p, args) => {
  const r = await p.evaluate(async ({ url, metodo, corpo, max }) => {
    const tk = localStorage.getItem('access_token');
    let token = tk;
    const res = await fetch(url, { method: metodo || 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: corpo ? JSON.stringify(corpo) : undefined });
    return { status: res.status, body: (await res.text()).slice(0, max || 5000000) };
  }, { ...args });
  return r;
};
