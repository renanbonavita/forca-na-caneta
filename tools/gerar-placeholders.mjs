// Gera as ilustrações provisórias (SVG) de cada movimento a partir de exercicios.json.
// Uso: node tools/gerar-placeholders.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const raiz = new URL('..', import.meta.url).pathname;
const { exercicios } = JSON.parse(readFileSync(raiz + 'exercicios.json', 'utf8'));
mkdirSync(raiz + 'img/mov', { recursive: true });

const CORES = { pernas: '#FFE1D6', empurrar: '#FFF0C7', costas: '#DDF3E8', extra: '#E8E2FF' };
const ROTULO = { pernas: 'Pernas', empurrar: 'Empurrar', costas: 'Costas', extra: 'Extra' };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function quebrar(texto, max = 19) {
  const linhas = []; let atual = '';
  for (const p of texto.split(' ')) {
    if ((atual + ' ' + p).trim().length > max) { linhas.push(atual.trim()); atual = p; } else atual += ' ' + p;
  }
  if (atual.trim()) linhas.push(atual.trim());
  return linhas;
}

const cadeira = `<g stroke="#2A1A14" stroke-width="6" stroke-linecap="round" fill="none">
  <path d="M250 150 v110"/><path d="M250 205 h70 v55"/><path d="M250 205 v55"/><path d="M250 150 h0"/></g>`;
const parede = `<rect x="226" y="60" width="14" height="210" fill="#C9B3A8"/>`;
const pessoaSentada = `<g stroke="#2A1A14" stroke-width="8" stroke-linecap="round" fill="none">
  <path d="M285 140 v55 h40 v60"/><path d="M285 160 l35 15"/></g><circle cx="285" cy="120" r="16" fill="#2A1A14"/>`;
const pessoaEmPe = `<g stroke="#2A1A14" stroke-width="8" stroke-linecap="round" fill="none">
  <path d="M360 135 v70 l-12 60"/><path d="M360 205 l12 60"/><path d="M360 155 l-40 25"/></g><circle cx="360" cy="113" r="16" fill="#2A1A14"/>`;
const toalha = `<path d="M300 172 q20 -14 42 0" stroke="#FF6B4A" stroke-width="10" fill="none" stroke-linecap="round"/>`;

function svg(mov) {
  const fundo = CORES[mov.grupo] || '#FFF';
  const linhas = quebrar(mov.nome);
  const usaParede = /parede/i.test(mov.nome + mov.descricao);
  const figura = '<g transform="translate(70 10)">' + [
    usaParede ? parede : '',
    mov.usa_cadeira ? cadeira : '',
    mov.posicao === 'sentada' ? pessoaSentada : pessoaEmPe,
    mov.usa_toalha ? toalha : '',
  ].join('\n') + '</g>';
  const texto = linhas.map((l, i) => `<text x="24" y="${46 + i * 31}" font-size="26" font-weight="800">${esc(l)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" font-family="Nunito, Arial, sans-serif" fill="#2A1A14">
<rect width="480" height="360" fill="${fundo}"/>
<rect x="0" y="270" width="480" height="90" fill="#000" opacity=".05"/>
${figura}
${texto}
<text x="24" y="310" font-size="20" font-weight="700">${ROTULO[mov.grupo]} · nível ${mov.nivel}</text>
<text x="24" y="338" font-size="18" fill="#5E4B43">Ilustração provisória · vídeo em gravação</text>
</svg>\n`;
}

for (const mov of exercicios) writeFileSync(raiz + mov.placeholder, svg(mov));

const simples = (titulo, sub, cor) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" font-family="Nunito, Arial, sans-serif" fill="#2A1A14">
<rect width="480" height="360" fill="${cor}"/>
${pessoaSentada.replace(/285/g, '240').replace(/325/g, '280').replace(/320/g, '275')}
<text x="240" y="300" font-size="34" font-weight="900" text-anchor="middle">${titulo}</text>
<text x="240" y="335" font-size="20" text-anchor="middle" fill="#5E4B43">${sub}</text>
</svg>\n`;
writeFileSync(raiz + 'img/aquecimento.svg', simples('Aquecimento', 'Sentada, no seu ritmo', '#FFE1D6'));
writeFileSync(raiz + 'img/descanso.svg', simples('Descanso', 'Respira fundo', '#DDF3E8'));
writeFileSync(raiz + 'img/desaquecimento.svg', simples('Desaquecimento', 'Levante devagar no final', '#E8E2FF'));
console.log(`${exercicios.length} ilustrações + 3 telas geradas em img/`);
