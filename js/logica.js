// Lógica pura do Dose de Força (sem DOM). Usada pelo app e pelos testes.

// Duração fixa: 30 s + 4 × (40 s + 20 s) + 30 s = 300 s = 5 min.
export const DURACAO = Object.freeze({ aquecimento: 30, exercicio: 40, descanso: 20, desaquecimento: 30 });
export const GRUPOS = Object.freeze(['pernas', 'empurrar', 'costas', 'extra']);

export const NIVEIS = Object.freeze([
  { nivel: 1, nome: 'Esquentando', de: 1, ate: 6 },
  { nivel: 2, nome: 'Pegando no tranco', de: 7, ate: 15 },
  { nivel: 3, nome: 'Força Total', de: 16, ate: Infinity },
]);

/** Nível do treino de número `n` (1, 2, 3...). */
export function nivelDoTreino(n) {
  const achado = NIVEIS.find((nv) => n >= nv.de && n <= nv.ate);
  return achado ? achado.nivel : 1;
}
export const nomeDoNivel = (nivel) => (NIVEIS.find((nv) => nv.nivel === nivel) || NIVEIS[0]).nome;

/** Monta a sequência de etapas do treino com o segundo de início de cada uma. */
export function montarLinhaDoTempo(movimentos, d = DURACAO) {
  const etapas = [{ tipo: 'aquecimento', dur: d.aquecimento, proximo: movimentos[0] || null }];
  movimentos.forEach((mov, i) => {
    etapas.push({ tipo: 'exercicio', dur: d.exercicio, mov, indice: i });
    etapas.push({ tipo: 'descanso', dur: d.descanso, proximo: movimentos[i + 1] || null, indice: i });
  });
  etapas.push({ tipo: 'desaquecimento', dur: d.desaquecimento });
  let t = 0;
  for (const e of etapas) { e.inicio = t; t += e.dur; }
  return etapas;
}
export const duracaoTotal = (etapas) => etapas.reduce((soma, e) => soma + e.dur, 0);

function sortearUm(lista, rnd) { return lista[Math.floor(rnd() * lista.length)]; }
function embaralhar(lista, rnd) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function temLevantarSeguido(ordem) {
  for (let i = 0; i < ordem.length - 1; i++) {
    if (ordem[i].envolve_levantar && ordem[i + 1].envolve_levantar) return true;
  }
  return false;
}
const chaveCombo = (ids) => ids.slice().sort().join('|');

/**
 * Sorteia 1 movimento de cada grupo do nível, em ordem aleatória.
 * - nunca repete a combinação exata do treino anterior (se houver alternativa);
 * - evita dois movimentos com envolve_levantar seguidos.
 */
export function sortearTreino(exercicios, nivel, idsAnteriores = [], rnd = Math.random) {
  const doNivel = exercicios.filter((e) => e.nivel === nivel);
  const porGrupo = GRUPOS.map((g) => doNivel.filter((e) => e.grupo === g));
  porGrupo.forEach((lista, i) => {
    if (!lista.length) throw new Error(`Nível ${nivel} sem movimento do grupo "${GRUPOS[i]}"`);
  });
  const chaveAnterior = chaveCombo(idsAnteriores);
  const totalCombos = porGrupo.reduce((p, l) => p * l.length, 1);

  let escolha;
  for (let tentativa = 0; tentativa < 100; tentativa++) {
    escolha = porGrupo.map((lista) => sortearUm(lista, rnd));
    if (totalCombos === 1 || chaveCombo(escolha.map((e) => e.id)) !== chaveAnterior) break;
  }
  for (let tentativa = 0; tentativa < 50; tentativa++) {
    const ordem = embaralhar(escolha, rnd);
    if (!temLevantarSeguido(ordem)) return ordem;
  }
  return embaralhar(escolha, rnd);
}

// ---------- Código de recuperação ----------
export const codigoDe = (treinos) => `DOSE-${treinos}`;
export function lerCodigo(texto) {
  const m = String(texto || '').trim().match(/^(?:DOSE|FNC)[\s-]?(\d{1,4})$/i);
  return m ? Number(m[1]) : null;
}
export function lerHashTreino(hash) {
  const m = String(hash || '').match(/[#&]t=(\d{1,4})(?:&|$)/);
  return m ? Number(m[1]) : null;
}

// ---------- Datas ----------
const doisDig = (n) => String(n).padStart(2, '0');
export function hojeISO(agora = new Date()) {
  return `${agora.getFullYear()}-${doisDig(agora.getMonth() + 1)}-${doisDig(agora.getDate())}`;
}

/** Próximo dia útil (seg–sex) a partir de hoje, no horário pedido. */
export function proximoDiaUtil(hora, minuto, agora = new Date()) {
  const d = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), hora, minuto, 0);
  if (d <= agora) d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}
const fmtLocal = (d) => `${d.getFullYear()}${doisDig(d.getMonth() + 1)}${doisDig(d.getDate())}T${doisDig(d.getHours())}${doisDig(d.getMinutes())}00`;
const fmtUTC = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const escaparICS = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

export const TITULO_LEMBRETE = 'Treino Dose de Força – 5 min';

/** Gera um .ics com evento recorrente de segunda a sexta (horário local "flutuante"). */
export function gerarICS({ hora, minuto, url = '', agora = new Date() }) {
  const inicio = proximoDiaUtil(hora, minuto, agora);
  const linhas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dose de Forca//Lembrete//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:fnc-${fmtUTC(agora)}-${doisDig(hora)}${doisDig(minuto)}@dosedeforca`,
    `DTSTAMP:${fmtUTC(agora)}`,
    `DTSTART:${fmtLocal(inicio)}`,
    'DURATION:PT5M',
    'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    `SUMMARY:${escaparICS(TITULO_LEMBRETE)}`,
    `DESCRIPTION:${escaparICS(`Hora do treino de 5 minutos! Cadeira encostada na parede, toalha na mão e bora. ${url}`.trim())}`,
  ];
  if (url) linhas.push(`URL:${url}`);
  linhas.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0S', `DESCRIPTION:${escaparICS(TITULO_LEMBRETE)}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR');
  return linhas.join('\r\n') + '\r\n';
}

/** Link para criar o mesmo lembrete no Google Agenda (útil no Android). */
export function linkGoogleAgenda({ hora, minuto, url = '', agora = new Date() }) {
  const inicio = proximoDiaUtil(hora, minuto, agora);
  const fim = new Date(inicio.getTime() + 5 * 60 * 1000);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: TITULO_LEMBRETE,
    dates: `${fmtLocal(inicio)}/${fmtLocal(fim)}`,
    recur: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
    details: `Hora do treino de 5 minutos! ${url}`.trim(),
    ctz: 'America/Sao_Paulo',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

// ---------- Plataforma ----------
export function detectarPlataforma(ua = '', toques = 0, standalone = false) {
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && toques > 1);
  const android = /Android/i.test(ua);
  let inApp = null;
  if (/Instagram/i.test(ua)) inApp = 'Instagram';
  else if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) inApp = 'Facebook';
  else if (/WhatsApp/i.test(ua)) inApp = 'WhatsApp';
  else if (/musical_ly|Bytedance|TikTok/i.test(ua)) inApp = 'TikTok';
  else if (/\bLine\//i.test(ua)) inApp = 'Line';
  return { ios, android, inApp, standalone: !!standalone };
}

/** Id de clínica válido: letras minúsculas, números e hífen. */
export const idClinicaValido = (id) => typeof id === 'string' && /^[a-z0-9-]{1,40}$/.test(id);

/** Deve mostrar o card "Missão Elástico" depois do treino número `n`? */
export function mostrarElastico(n, dispensadoEm, aPartirDe = 7, aCada = 5) {
  if (n < aPartirDe) return false;
  if (dispensadoEm == null) return true;
  return n - dispensadoEm >= aCada;
}
