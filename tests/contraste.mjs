// Confere o contraste WCAG AA das cores do styles.css: node tests/contraste.mjs
const lum = (hex) => {
  const [r, g, b] = hex.match(/\w\w/g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const razao = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const pares = [
  ['texto sobre fundo', '#2A1A14', '#FFF8F4', 4.5],
  ['texto secundário sobre fundo', '#6B5850', '#FFF8F4', 4.5],
  ['texto secundário sobre branco', '#6B5850', '#FFFFFF', 4.5],
  ['texto secundário sobre coral suave', '#6B5850', '#FFEDE6', 4.5],
  ['texto sobre chip coral suave', '#2A1A14', '#FFEDE6', 4.5],
  ['coral escuro sobre coral suave (rótulos)', '#B23A1C', '#FFEDE6', 4.5],
  ['verde sobre verde claro', '#1F6B4F', '#E6F4EE', 4.5],
  ['texto sobre alerta', '#2A1A14', '#FFF4D6', 4.5],
  ['ícone coral escuro sobre branco (gráfico)', '#B23A1C', '#FFFFFF', 3],
  ['texto escuro sobre botão coral', '#2A1A14', '#FF6B4A', 4.5],
  ['link coral escuro sobre fundo', '#B23A1C', '#FFF8F4', 4.5],
  ['marcador coral escuro sobre branco', '#B23A1C', '#FFFFFF', 4.5],
  ['legenda branca sobre escuro', '#FFFFFF', '#2A1A14', 4.5],
  ['verde sobre fundo', '#1F6B4F', '#FFF8F4', 4.5],
  ['texto sobre alerta amarelo', '#2A1A14', '#FFF1C9', 4.5],
  ['texto sobre verde claro', '#2A1A14', '#DDF3E8', 4.5],
  ['erro sobre branco', '#A3241B', '#FFFFFF', 4.5],
  ['barra de progresso (gráfico) sobre trilho', '#B23A1C', '#FFEDE6', 3],
];
let falhou = false;
for (const [nome, a, b, min] of pares) {
  const r = razao(a, b);
  const ok = r >= min;
  if (!ok) falhou = true;
  console.log(`${ok ? '✓' : '✗'} ${r.toFixed(2)}:1 (mín ${min}) ${nome}`);
}
process.exit(falhou ? 1 : 0);
