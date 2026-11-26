// Força na Caneta — app principal (vanilla JS, sem backend).
import {
  DURACAO, montarLinhaDoTempo, duracaoTotal, sortearTreino, nivelDoTreino, nomeDoNivel,
  codigoDe, lerCodigo, lerHashTreino, hojeISO, gerarICS, linkGoogleAgenda,
  detectarPlataforma, idClinicaValido, mostrarElastico,
} from './js/logica.js';

const $ = (sel) => document.querySelector(sel);
const sortearDe = (lista) => (lista && lista.length ? lista[Math.floor(Math.random() * lista.length)] : '');

// ---------------- Armazenamento (sempre em try/catch) ----------------
const store = {
  get(chave, padrao = null) {
    try { const v = localStorage.getItem('fnc:' + chave); return v === null ? padrao : JSON.parse(v); } catch { return padrao; }
  },
  set(chave, valor) { try { localStorage.setItem('fnc:' + chave, JSON.stringify(valor)); } catch { /* sem armazenamento */ } },
};
const treinosFeitos = () => Number(store.get('treinos', 0)) || 0;
function treinosHoje() {
  const h = store.get('hoje', null);
  return h && h.dia === hojeISO() ? h.n : 0;
}

// ---------------- Dados ----------------
let config = {};
let exercicios = [];
let clinica = null;

async function carregarJSON(url, padrao) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch { return padrao; }
}

// ---------------- Telas ----------------
const TELAS = ['aviso', 'inicio', 'treino', 'fim'];
function mostrar(nome) {
  TELAS.forEach((t) => { $(`#tela-${t}`).hidden = t !== nome; });
  window.scrollTo(0, 0);
  const alvo = $(`#tela-${nome} h1, #tela-${nome} h2`);
  if (alvo && nome !== 'treino') { alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); }
}

function atualizarInicio() {
  const proximo = treinosFeitos() + 1;
  $('#num-treino').textContent = `Treino nº ${proximo}`;
  $('#nome-nivel').textContent = nomeDoNivel(nivelDoTreino(proximo));
  const hoje = treinosHoje();
  const msg = $('#msg-hoje');
  if (hoje === 1) { msg.textContent = 'Que tal o 2º treino do dia?'; msg.hidden = false; }
  else if (hoje > 1) { msg.textContent = `Hoje já foram ${hoje} treinos. Que orgulho! 🧡`; msg.hidden = false; }
  else msg.hidden = true;
}

// ---------------- Reduzir animações ----------------
const querReduzir = () => store.get('reduzir', null) ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function aplicarReduzir() {
  const r = querReduzir();
  document.documentElement.classList.toggle('reduzir-animacoes', !!r);
  $('#btn-animacoes').setAttribute('aria-pressed', String(!!r));
}

// ---------------- Analytics (sem cookies, sem dados pessoais) ----------------
const filaEventos = [];
function carregarScript(src, attrs = {}) {
  const s = document.createElement('script');
  s.src = src; s.async = true;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
  return s;
}
function configurarAnalytics() {
  const a = config.analytics || {};
  if (a.goatcounter) {
    const s = carregarScript('https://gc.zgo.at/count.js', { 'data-goatcounter': `https://${a.goatcounter}.goatcounter.com/count` });
    s.onload = () => { while (filaEventos.length) enviarEvento(...filaEventos.shift()); };
  }
  if (a.plausible_dominio) {
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    carregarScript('https://plausible.io/js/script.js', { 'data-domain': a.plausible_dominio });
  }
}
function enviarEvento(nome, props) {
  try {
    if (window.goatcounter && window.goatcounter.count) {
      // GoatCounter não tem "propriedades": a clínica vai no caminho do evento.
      const caminho = `evento/${nome}` + (props.clinica ? `/${props.clinica}` : '') + (props.nivel ? `/nivel-${props.nivel}` : '');
      window.goatcounter.count({ path: caminho, title: nome, event: true });
    } else if ((config.analytics || {}).goatcounter) {
      filaEventos.push([nome, props]);
    }
  } catch { /* ignora */ }
}
function track(nome, extra = {}) {
  const props = { ...extra };
  if (clinica) props.clinica = clinica.id;
  enviarEvento(nome, props);
  try { if (window.plausible && (config.analytics || {}).plausible_dominio) window.plausible(nome, { props }); } catch { /* ignora */ }
  if ((config.analytics || {}).debug) console.info('[evento]', nome, props);
  window.dispatchEvent(new CustomEvent('fnc:evento', { detail: { nome, props } }));
}

// ---------------- Modo clínica ----------------
async function configurarClinica() {
  const dados = await carregarJSON('clinicas.json', { clinicas: [] });
  const lista = dados.clinicas || [];
  const daUrl = new URLSearchParams(location.search).get('c');
  let id = null;
  if (idClinicaValido(daUrl) && lista.some((c) => c.id === daUrl)) { id = daUrl; store.set('clinica', id); }
  else id = store.get('clinica', null);
  clinica = lista.find((c) => c.id === id) || null;
  if (!clinica) return;
  $('#nome-clinica').textContent = clinica.nome;
  const logo = $('#logo-clinica');
  if (clinica.logo) { logo.src = clinica.logo; logo.alt = `Logo ${clinica.nome}`; } else logo.hidden = true;
  if (clinica.cor && /^#[0-9a-f]{3,8}$/i.test(clinica.cor)) document.documentElement.style.setProperty('--cor-clinica', clinica.cor);
  $('#selo-clinica').hidden = false;
}

// ---------------- Voz: MP3 pré-gravado ou speechSynthesis de reserva ----------------
const voz = {
  fila: [], falando: false, player: new Audio(), vozPt: null, ctx: null, timeout: null,
};
function escolherVoz() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  const norm = (v) => (v.lang || '').replace('_', '-').toLowerCase();
  voz.vozPt = vs.find((v) => norm(v) === 'pt-br') || vs.find((v) => norm(v).startsWith('pt')) || null;
}
if ('speechSynthesis' in window) {
  escolherVoz();
  speechSynthesis.addEventListener?.('voiceschanged', escolherVoz);
}
function legenda(texto) { $('#legenda').textContent = texto || ''; }
const semEmoji = (t) => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();

/** Enfileira falas. Cada item: { texto, audio } (audio = caminho do MP3, opcional). */
function falar(itens, { interromper = false } = {}) {
  if (interromper) calar();
  voz.fila.push(...[].concat(itens).filter((i) => i && i.texto));
  if (!voz.falando) proximaFala();
}
function calar() {
  voz.fila = [];
  voz.falando = false;
  clearTimeout(voz.timeout);
  try { voz.player.pause(); } catch { /* */ }
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch { /* */ }
}
function proximaFala() {
  const item = voz.fila.shift();
  if (!item) { voz.falando = false; return; }
  voz.falando = true;
  legenda(item.texto);
  const terminou = () => { clearTimeout(voz.timeout); if (voz.falando) proximaFala(); };
  // Rede de segurança: alguns navegadores não disparam "onend".
  voz.timeout = setTimeout(terminou, 1500 + item.texto.length * 95);
  const porTTS = () => {
    if (!('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(semEmoji(item.texto));
      u.lang = 'pt-BR';
      if (voz.vozPt) u.voice = voz.vozPt;
      u.rate = 1;
      u.onend = terminou;
      speechSynthesis.speak(u);
    } catch { /* sem voz: a legenda continua */ }
  };
  if ((config.audio || {}).usar_mp3 && item.audio) {
    voz.player.src = item.audio;
    voz.player.onended = terminou;
    voz.player.onerror = porTTS;
    voz.player.play().catch(porTTS);
  } else porTTS();
}
const fala = (id) => ({ texto: (config.falas || {})[id] || '', audio: `audio/${id}.mp3` });
const falaDeLista = (lista, prefixo) => {
  const arr = config[lista] || [];
  if (!arr.length) return null;
  const i = Math.floor(Math.random() * arr.length);
  return { texto: arr[i], audio: `audio/${prefixo}-${String(i + 1).padStart(2, '0')}.mp3` };
};

/** Precisa acontecer dentro do toque no botão (gesto do usuário), por causa do iOS. */
function desbloquearAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !voz.ctx) voz.ctx = new AC();
    if (voz.ctx && voz.ctx.state === 'suspended') voz.ctx.resume();
  } catch { /* */ }
  if ((config.audio || {}).usar_mp3) {
    // toca um silêncio curtinho para liberar o <audio> no iPhone
    voz.player.src = silencioWav();
    voz.player.play().catch(() => {});
  }
}
let _silencio = null;
function silencioWav() {
  if (_silencio) return _silencio;
  const n = 800, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  _silencio = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
  return _silencio;
}
function bipe(freq = 880, ms = 120) {
  try {
    if (!voz.ctx) return;
    const o = voz.ctx.createOscillator(), g = voz.ctx.createGain();
    o.frequency.value = freq; g.gain.value = 0.08;
    o.connect(g); g.connect(voz.ctx.destination);
    o.start(); o.stop(voz.ctx.currentTime + ms / 1000);
  } catch { /* */ }
}

// ---------------- Wake Lock (tela ligada) ----------------
let wakeLock = null;
async function pedirWakeLock() {
  if (!('wakeLock' in navigator)) { $('#aviso-tela').hidden = false; return; }
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    $('#aviso-tela').hidden = true;
  } catch { $('#aviso-tela').hidden = false; }
}
function soltarWakeLock() { try { wakeLock && wakeLock.release(); } catch { /* */ } wakeLock = null; }

// ---------------- Motor do treino ----------------
const T = {
  ativo: false, etapas: [], idx: -1, inicioEtapa: 0, pausadoEm: null,
  timer: null, nivel: 1, numero: 1, posicao: 'sentada', ditos: new Set(), facil: false,
};

function comecarTreino(nivelForcado = null) {
  desbloquearAudio();
  T.numero = treinosFeitos() + 1;
  T.nivel = nivelForcado || nivelDoTreino(T.numero);
  const movs = sortearTreino(exercicios, T.nivel, store.get('ultimaCombo', []));
  store.set('ultimaCombo', movs.map((m) => m.id));
  T.etapas = montarLinhaDoTempo(movs, DURACAO);
  T.total = duracaoTotal(T.etapas); // sempre 300 s
  T.ativo = true; T.pausadoEm = null; T.posicao = 'sentada';
  $('#btn-pausar').textContent = '⏸ Pausar';
  mostrar('treino');
  pedirWakeLock();
  track('treino_iniciado', { nivel: T.nivel });
  entrarEtapa(0);
  clearInterval(T.timer);
  T.timer = setInterval(tique, 200);
}

function mostrarMidia(mov, imagemPadrao) {
  const video = $('#video'), img = $('#placeholder');
  const usarVideo = (config.midia || {}).usar_videos && mov && mov.video;
  img.src = mov ? mov.placeholder : imagemPadrao;
  img.alt = mov ? `Ilustração: ${mov.nome}` : '';
  if (usarVideo) {
    video.onerror = () => { video.hidden = true; img.hidden = false; };
    if (!video.src.endsWith(mov.video)) video.src = mov.video;
    video.hidden = false; img.hidden = true;
    video.play().catch(() => {});
  } else {
    video.hidden = true; video.removeAttribute('src'); img.hidden = false;
  }
}

function alertaCadeira(proximo) {
  const el = $('#alerta');
  if (proximo && proximo.usa_cadeira) { el.textContent = '🪑 ' + fala('cadeira-alerta').texto; el.hidden = false; return true; }
  el.hidden = true; return false;
}
function anunciarProximo(proximo) {
  if (!proximo) return;
  const itens = [{ texto: `${fala('a-seguir').texto} ${proximo.nome}.`, audio: proximo.audio_proximo }];
  if (alertaCadeira(proximo)) itens.push(fala('cadeira-alerta'));
  falar(itens);
}

function entrarEtapa(i) {
  if (i >= T.etapas.length) return concluir();
  T.idx = i;
  T.inicioEtapa = Date.now();
  T.ditos = new Set();
  T.facil = false;
  const e = T.etapas[i];
  const btnFacil = $('#btn-facil');
  btnFacil.setAttribute('aria-pressed', 'false');
  btnFacil.disabled = e.tipo !== 'exercicio';
  $('#alerta').hidden = true;

  if (e.tipo === 'aquecimento') {
    $('#etapa-rotulo').textContent = 'Aquecimento';
    $('#nome-mov').textContent = 'Aquecimento';
    $('#descricao-mov').textContent = 'Sentada, costas retas. Siga a voz: marcha leve, ombros e mãos.';
    mostrarMidia(null, 'img/aquecimento.svg');
    falar(fala('aquecimento-1'), { interromper: true });
  } else if (e.tipo === 'exercicio') {
    const m = e.mov;
    $('#etapa-rotulo').textContent = `Movimento ${e.indice + 1} de 4`;
    $('#nome-mov').textContent = m.nome;
    $('#descricao-mov').textContent = m.descricao;
    mostrarMidia(m);
    const itens = [];
    const levantando = m.posicao === 'em_pe' && T.posicao === 'sentada';
    if (levantando) itens.push(fala('levanta-devagar'));
    itens.push({ texto: m.fala_intro, audio: m.audio_intro });
    if (m.envolve_levantar && !/levanta devagar/i.test(m.fala_intro) && !levantando) itens.push(fala('levanta-devagar'));
    falar(itens, { interromper: true });
    T.posicao = m.posicao;
  } else if (e.tipo === 'descanso') {
    $('#etapa-rotulo').textContent = 'Descanso';
    if (e.proximo) {
      $('#nome-mov').textContent = `A seguir: ${e.proximo.nome}`;
      $('#descricao-mov').textContent = e.proximo.dica_seguranca;
      mostrarMidia(e.proximo);
      falar(falaDeLista('frases_descanso', 'descanso'), { interromper: true });
    } else {
      $('#nome-mov').textContent = 'Último descanso';
      $('#descricao-mov').textContent = 'Respire fundo. Já já vem o desaquecimento.';
      mostrarMidia(null, 'img/descanso.svg');
      falar(fala('ultimo-descanso'), { interromper: true });
    }
  } else if (e.tipo === 'desaquecimento') {
    $('#etapa-rotulo').textContent = 'Desaquecimento';
    $('#nome-mov').textContent = 'Desaquecimento';
    $('#descricao-mov').textContent = 'Sente-se, respire e alongue. No final, levante devagar e fique um instante parada antes de sair andando.';
    mostrarMidia(null, 'img/desaquecimento.svg');
    falar(fala('desaquecimento-1'), { interromper: true });
  }
  renderizarTempo();
}

function uma(chave, fn) { if (!T.ditos.has(chave)) { T.ditos.add(chave); fn(); } }

function decorridoNaEtapa() {
  const agora = T.pausadoEm || Date.now();
  return (agora - T.inicioEtapa) / 1000;
}

function tique() {
  if (!T.ativo || T.pausadoEm) return;
  const e = T.etapas[T.idx];
  const d = decorridoNaEtapa();
  const restante = Math.ceil(e.dur - d);

  // Falas programadas por etapa
  if (e.tipo === 'aquecimento') {
    if (d >= 10) uma('aq2', () => falar(fala('aquecimento-2')));
    if (d >= 18) uma('aq3', () => falar(fala('aquecimento-3')));
    if (d >= 23) uma('prox', () => anunciarProximo(e.proximo));
  } else if (e.tipo === 'exercicio') {
    const m = e.mov;
    if (d >= e.dur / 2) {
      uma('meio', () => {
        if (m.unilateral) falar(fala('troca-lado'), { interromper: true });
        else if (m.envolve_levantar) falar(falaDeLista('frases_levantar', 'levantar'));
        else if (m.usa_toalha) falar(falaDeLista('frases_toalha', 'toalha'));
        else falar(falaDeLista('frases_durante', 'durante'));
      });
    }
    if (restante <= 10) uma('10s', () => falar(falaDeLista('frases_10s', 'dez')));
  } else if (e.tipo === 'descanso') {
    if (d >= 7 && e.proximo) uma('prox', () => anunciarProximo(e.proximo));
  } else if (e.tipo === 'desaquecimento') {
    if (d >= 10) uma('dq2', () => falar(fala('desaquecimento-2')));
    if (d >= 20) uma('dq3', () => falar(fala('desaquecimento-3')));
  }
  if (restante <= 3 && restante >= 1 && e.tipo !== 'desaquecimento') uma('bipe' + restante, () => bipe(restante === 1 ? 1175 : 880));

  if (d >= e.dur) { entrarEtapa(T.idx + 1); return; }
  renderizarTempo();
}

const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;
function renderizarTempo() {
  const e = T.etapas[T.idx];
  if (!e) return;
  const d = Math.min(decorridoNaEtapa(), e.dur);
  const restanteEtapa = Math.max(0, Math.ceil(e.dur - d));
  const feito = e.inicio + d;
  $('#cronometro').textContent = restanteEtapa;
  $('#tempo-total').textContent = `${mmss(Math.max(0, Math.ceil(T.total - feito)))} restantes`;
  $('#barra-preenchida').style.width = `${(feito / T.total) * 100}%`;
  $('#barra').setAttribute('aria-valuenow', String(Math.round(feito)));
}

function pausar(motivo) {
  if (!T.ativo || T.pausadoEm) return;
  T.pausadoEm = Date.now();
  calar();
  legenda(motivo || 'Pausado. Toque em Continuar quando quiser.');
  $('#btn-pausar').textContent = '▶ Continuar';
  $('#cronometro').classList.add('pausado');
  try { $('#video').pause(); } catch { /* */ }
}
function continuar() {
  if (!T.pausadoEm) return;
  T.inicioEtapa += Date.now() - T.pausadoEm;
  T.pausadoEm = null;
  legenda('');
  $('#btn-pausar').textContent = '⏸ Pausar';
  $('#cronometro').classList.remove('pausado');
  if (!$('#video').hidden) $('#video').play().catch(() => {});
}

function pararTreino() {
  T.ativo = false;
  clearInterval(T.timer);
  calar();
  soltarWakeLock();
  try { $('#video').pause(); } catch { /* */ }
}

function concluir() {
  pararTreino();
  const n = treinosFeitos() + 1;
  store.set('treinos', n);
  store.set('ultimoTreino', hojeISO());
  store.set('hoje', { dia: hojeISO(), n: treinosHoje() + 1 });
  track('treino_concluido', { nivel: T.nivel });
  const novoNivel = nivelDoTreino(n + 1);
  const subiu = novoNivel > nivelDoTreino(n);
  if (subiu) track('nivel_alcancado', { nivel: novoNivel });
  mostrarFim(n, subiu ? novoNivel : null);
}

// ---------------- Conclusão ----------------
function marcador(texto) {
  const s = document.createElement('span');
  s.className = 'marcador';
  s.textContent = `📍 ${texto}`;
  return s;
}

function mostrarFim(n, novoNivel, { previa = false } = {}) {
  $('#titulo-fim').textContent = `Acabou! Treino nº ${n} 🎉`;
  const frase = falaDeLista('frases_conclusao', 'conclusao');
  $('#frase-fim').textContent = frase ? frase.texto : '';
  const msgNivel = $('#msg-nivel');
  if (novoNivel) { msgNivel.textContent = `Novo nível desbloqueado: ${nomeDoNivel(novoNivel)}! 🚀`; msgNivel.hidden = false; }
  else msgNivel.hidden = true;

  const marcadores = !!config.mostrar_marcadores_de_lugar;

  // Patrocínio (uma linha discreta)
  const pat = config.patrocinio || {};
  const elPat = $('#patrocinio');
  elPat.replaceChildren();
  if (pat.marca) {
    elPat.append(`${pat.texto || 'Apoio'} `);
    if (pat.link) {
      const a = document.createElement('a');
      a.href = pat.link; a.target = '_blank'; a.rel = 'sponsored noopener';
      a.textContent = pat.marca;
      a.addEventListener('click', () => track('clique_patrocinio'));
      elPat.append(a);
    } else elPat.append(pat.marca);
    elPat.hidden = false;
  } else if (marcadores) {
    elPat.append(marcador('ESPAÇO DO PATROCINADOR DE PROTEÍNA — preencher "patrocinio" (marca + link) em config.json'));
    elPat.hidden = false;
  } else elPat.hidden = true;

  // Missão Elástico
  const el = config.elastico || {};
  const card = $('#card-elastico');
  const deveMostrar = previa || mostrarElastico(n, store.get('elasticoDispensadoEm', null), el.a_partir_do_treino || 7, el.repetir_a_cada || 5);
  if (deveMostrar && (el.link || marcadores)) {
    $('#elastico-titulo').textContent = el.titulo || 'Missão Elástico';
    $('#elastico-texto').textContent = el.texto || '';
    const link = $('#elastico-link');
    if (el.link) {
      link.href = el.link; link.textContent = el.botao || 'Ver elásticos';
      link.removeAttribute('aria-disabled'); link.className = 'btn btn-secundario';
    } else {
      link.removeAttribute('href'); link.textContent = '📍 LINK DE AFILIADO DO ELÁSTICO — preencher "elastico.link" em config.json';
      link.setAttribute('aria-disabled', 'true'); link.className = 'btn marcador';
    }
    card.hidden = false;
  } else card.hidden = true;

  mostrar('fim');
  if (!previa) falar(frase, { interromper: true });
  confete();
}

function confete() {
  const canvas = $('#confete');
  if (querReduzir() || !canvas.getContext) { canvas.hidden = true; return; }
  canvas.hidden = false;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const cores = ['#FF6B4A', '#FFC24B', '#2F9E7A', '#7A5AF8', '#FF9AB0'];
  const pecas = Array.from({ length: 70 }, () => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
    vy: 2 + Math.random() * 3, vx: -1 + Math.random() * 2, r: Math.random() * Math.PI,
    cor: cores[Math.floor(Math.random() * cores.length)], w: 6 + Math.random() * 6,
  }));
  const inicio = performance.now();
  (function quadro(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pecas.forEach((p) => {
      p.y += p.vy; p.x += p.vx; p.r += 0.1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.cor; ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); ctx.restore();
    });
    if (t - inicio < 2800) requestAnimationFrame(quadro);
    else { ctx.clearRect(0, 0, innerWidth, innerHeight); canvas.hidden = true; }
  })(inicio);
}

// ---------------- Instalação ----------------
let promptInstalacao = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); promptInstalacao = e; });
window.addEventListener('appinstalled', () => track('instalacao'));
const estaInstalado = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

function li(html) { const l = document.createElement('li'); l.innerHTML = html; return l; }
async function abrirInstalar() {
  const p = detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints || 0, estaInstalado());
  const box = $('#instalar-conteudo');
  box.replaceChildren();
  const par = (t) => { const e = document.createElement('p'); e.textContent = t; return e; };

  if (p.inApp) {
    box.append(par(`Você está no navegador interno do ${p.inApp}. Para instalar, abra no ${p.ios ? 'Safari' : 'Chrome'}:`));
    const ol = document.createElement('ol');
    ol.append(li('Toque nos <strong>três pontinhos</strong> (⋯ ou ⋮) no canto da tela.'),
      li(`Escolha <strong>“Abrir no ${p.ios ? 'Safari' : 'navegador'}”</strong>.`),
      li('Lá, toque de novo em “Adicionar à tela de início”.'));
    box.append(ol);
    const copiar = document.createElement('button');
    copiar.type = 'button'; copiar.className = 'btn btn-secundario'; copiar.textContent = 'Copiar link do app';
    copiar.addEventListener('click', () => copiarTexto(location.origin + location.pathname + location.search, copiar));
    box.append(copiar);
  } else if (p.ios) {
    const ol = document.createElement('ol');
    ol.append(li('Abra este site no <strong>Safari</strong>.'),
      li('Toque em <strong>⋯ (Mais)</strong> e depois em <strong>Compartilhar</strong> <span aria-hidden="true">⬆️</span>.'),
      li('Role e toque em <strong>“Adicionar à Tela de Início”</strong>.'),
      li('Toque em <strong>“Adicionar”</strong>. Pronto! 🎉'));
    box.append(ol);
    box.append(par(`Dica: no iPhone, o app instalado pode começar a contagem do zero. Se isso acontecer, use “Meu código”: o seu é ${codigoDe(treinosFeitos())}.`));
  } else if (promptInstalacao) {
    $('#dlg-instalar').close();
    promptInstalacao.prompt();
    try { await promptInstalacao.userChoice; } catch { /* */ }
    promptInstalacao = null;
    return;
  } else {
    const ol = document.createElement('ol');
    ol.append(li('Toque no menu do navegador (<strong>⋮</strong>).'),
      li('Escolha <strong>“Instalar app”</strong> ou <strong>“Adicionar à tela inicial”</strong>.'));
    box.append(ol);
  }
  if (!$('#dlg-instalar').open) $('#dlg-instalar').showModal();
}

// ---------------- Lembretes (.ics) ----------------
function prepararLembretes() {
  const sel = $('#hora-lembrete');
  if (!sel.options.length) {
    for (let h = 6; h <= 21; h++) for (const m of [0, 30]) {
      const o = document.createElement('option');
      o.value = `${h}:${m}`; o.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      sel.append(o);
    }
    sel.value = store.get('horaLembrete', '8:0');
    sel.addEventListener('change', atualizarLinksLembrete);
  }
  atualizarLinksLembrete();
}
function atualizarLinksLembrete() {
  const [hora, minuto] = $('#hora-lembrete').value.split(':').map(Number);
  store.set('horaLembrete', `${hora}:${minuto}`);
  const url = location.origin + location.pathname;
  const ics = gerarICS({ hora, minuto, url });
  $('#link-ics').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  $('#link-google').href = linkGoogleAgenda({ hora, minuto, url });
}

// ---------------- Código de recuperação ----------------
function linkRecuperacao() {
  const n = treinosFeitos();
  return `${location.origin}${location.pathname}${clinica ? `?c=${clinica.id}` : ''}#t=${n}`;
}
function abrirCodigo() {
  $('#codigo-texto').textContent = codigoDe(treinosFeitos());
  $('#codigo-link').value = linkRecuperacao();
  $('#copiado').textContent = ''; $('#codigo-erro').textContent = ''; $('#codigo-entrada').value = '';
  $('#dlg-codigo').showModal();
}
async function copiarTexto(texto, botao) {
  let ok = false;
  try { await navigator.clipboard.writeText(texto); ok = true; } catch {
    const campo = document.createElement('textarea');
    campo.value = texto; document.body.append(campo); campo.select();
    try { ok = document.execCommand('copy'); } catch { /* */ }
    campo.remove();
  }
  if (botao === $('#btn-copiar')) $('#copiado').textContent = ok ? 'Link copiado! Guarde no WhatsApp ou nas notas.' : 'Não deu para copiar: selecione o link acima e copie.';
  else if (botao) botao.textContent = ok ? 'Link copiado ✓' : 'Copie o endereço da barra';
}
function pedirRestauracao(n) {
  $('#restaurar-num').textContent = String(n);
  $('#restaurar-texto').textContent = `Sua contagem fica com ${n} treino${n === 1 ? '' : 's'} feito${n === 1 ? '' : 's'}, e o próximo será o nº ${n + 1}.`;
  $('#btn-restaurar-sim').onclick = () => {
    store.set('treinos', n);
    $('#dlg-restaurar').close();
    atualizarInicio();
  };
  const dlg = $('#dlg-restaurar');
  if (!dlg.open) dlg.showModal();
}
function verificarHash() {
  const n = lerHashTreino(location.hash);
  if (n == null) return;
  history.replaceState(null, '', location.pathname + location.search);
  if (n !== treinosFeitos()) pedirRestauracao(n);
}

// ---------------- Textos do responsável técnico ----------------
function preencherRT() {
  const rt = config.responsavel_tecnico || {};
  document.querySelectorAll('[data-rt-nome]').forEach((e) => { e.textContent = rt.nome || '[NOME]'; });
  document.querySelectorAll('[data-rt-cref]').forEach((e) => { e.textContent = rt.cref || '[NÚMERO]'; });
}

// ---------------- Service worker ----------------
function registrarSW() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

// ---------------- Eventos ----------------
function ligarEventos() {
  $('#btn-aceitar').addEventListener('click', () => {
    store.set('aceite', new Date().toISOString());
    atualizarInicio(); mostrar('inicio'); verificarHash();
  });
  $('#btn-bora').addEventListener('click', () => comecarTreino());
  $('#btn-pausar').addEventListener('click', () => (T.pausadoEm ? continuar() : pausar()));
  $('#btn-pular').addEventListener('click', () => { if (T.pausadoEm) continuar(); entrarEtapa(T.idx + 1); });
  $('#btn-facil').addEventListener('click', () => {
    const e = T.etapas[T.idx];
    if (!e || e.tipo !== 'exercicio') return;
    T.facil = !T.facil;
    $('#btn-facil').setAttribute('aria-pressed', String(T.facil));
    $('#descricao-mov').textContent = T.facil ? `Versão mais fácil: ${e.mov.versao_facil}` : e.mov.descricao;
    if (T.facil) falar({ texto: `Versão mais fácil: ${e.mov.versao_facil}` }, { interromper: true });
  });
  $('#btn-encerrar').addEventListener('click', () => {
    pausar();
    if (window.confirm('Encerrar o treino agora? Ele não vai entrar na contagem.')) { pararTreino(); atualizarInicio(); mostrar('inicio'); }
    else continuar();
  });
  $('#btn-mais-uma').addEventListener('click', () => { track('mais_uma_rodada', { nivel: T.nivel }); comecarTreino(T.nivel); });
  $('#btn-por-hoje').addEventListener('click', () => { calar(); atualizarInicio(); mostrar('inicio'); });
  $('#btn-dispensar-elastico').addEventListener('click', () => { store.set('elasticoDispensadoEm', treinosFeitos()); $('#card-elastico').hidden = true; });
  $('#elastico-link').addEventListener('click', (e) => {
    if ($('#elastico-link').getAttribute('aria-disabled') === 'true') { e.preventDefault(); return; }
    track('clique_elastico');
  });

  $('#btn-instalar').addEventListener('click', abrirInstalar);
  $('#btn-lembretes').addEventListener('click', () => { prepararLembretes(); $('#dlg-lembretes').showModal(); });
  $('#btn-codigo').addEventListener('click', abrirCodigo);
  $('#btn-copiar').addEventListener('click', (e) => copiarTexto($('#codigo-link').value, e.currentTarget));
  $('#btn-usar-codigo').addEventListener('click', () => {
    const n = lerCodigo($('#codigo-entrada').value);
    if (n == null) { $('#codigo-erro').textContent = 'Código inválido. Ele tem o formato FNC-15.'; return; }
    $('#dlg-codigo').close();
    pedirRestauracao(n);
  });
  $('#btn-animacoes').addEventListener('click', () => { store.set('reduzir', !querReduzir()); aplicarReduzir(); });
  document.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));

  window.addEventListener('hashchange', verificarHash);
  document.addEventListener('visibilitychange', () => {
    if (!T.ativo) return;
    if (document.visibilityState === 'hidden') pausar('Pausado porque você saiu do app. Toque em Continuar.');
    else pedirWakeLock();
  });
}

// ---------------- Início ----------------
async function iniciar() {
  [config, exercicios] = await Promise.all([
    carregarJSON('config.json', {}),
    carregarJSON('exercicios.json', { exercicios: [] }).then((j) => j.exercicios || []),
  ]);
  preencherRT();
  aplicarReduzir();
  ligarEventos();
  await configurarClinica();
  configurarAnalytics();
  registrarSW();
  if (estaInstalado()) $('#btn-instalar').hidden = true;

  const previa = new URLSearchParams(location.search).get('previa');
  if (previa === 'fim') { mostrarFim(treinosFeitos() || 7, null, { previa: true }); return; }

  if (!store.get('aceite')) { mostrar('aviso'); return; }
  atualizarInicio();
  mostrar('inicio');
  verificarHash();
}
iniciar();

// Exposto só para testes automatizados.
window.__fnc = { T, store };
