// Preenche os dados do responsável técnico e o contato a partir do config.json.
fetch('config.json').then((r) => r.json()).then((c) => {
  const rt = c.responsavel_tecnico || {};
  document.querySelectorAll('[data-rt-nome]').forEach((e) => { if (rt.nome) e.textContent = rt.nome; });
  document.querySelectorAll('[data-rt-cref]').forEach((e) => { if (rt.cref) e.textContent = rt.cref; });
  document.querySelectorAll('[data-contato]').forEach((e) => { if (c.contato_email) e.textContent = c.contato_email; });
}).catch(() => {});
