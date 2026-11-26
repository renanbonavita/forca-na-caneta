// Testes da lógica: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DURACAO, GRUPOS, montarLinhaDoTempo, duracaoTotal, sortearTreino, temLevantarSeguido, nivelDoTreino,
  gerarICS, lerCodigo, lerHashTreino, codigoDe, detectarPlataforma, mostrarElastico, proximoDiaUtil, idClinicaValido,
} from '../js/logica.js';

const raiz = new URL('..', import.meta.url);
const { exercicios } = JSON.parse(readFileSync(new URL('exercicios.json', raiz), 'utf8'));
const config = JSON.parse(readFileSync(new URL('config.json', raiz), 'utf8'));

test('treino soma exatamente 300 s (5 min)', () => {
  for (const nivel of [1, 2, 3]) {
    const etapas = montarLinhaDoTempo(sortearTreino(exercicios, nivel), DURACAO);
    assert.equal(duracaoTotal(etapas), 300);
    assert.equal(etapas.length, 10);
    assert.equal(etapas.at(-1).inicio + etapas.at(-1).dur, 300);
  }
});

test('biblioteca: 8 movimentos por nível, 2 por grupo, campos completos', () => {
  const campos = ['id', 'nome', 'nivel', 'grupo', 'descricao', 'dica_seguranca', 'versao_facil', 'usa_cadeira', 'usa_toalha', 'envolve_levantar', 'video', 'audio_intro'];
  for (const nivel of [1, 2, 3]) {
    const doNivel = exercicios.filter((e) => e.nivel === nivel);
    assert.equal(doNivel.length, 8, `nível ${nivel}`);
    for (const g of GRUPOS) assert.equal(doNivel.filter((e) => e.grupo === g).length, 2, `nível ${nivel} grupo ${g}`);
  }
  for (const e of exercicios) for (const c of campos) assert.ok(e[c] !== undefined && e[c] !== '', `${e.id} sem ${c}`);
  assert.equal(new Set(exercicios.map((e) => e.id)).size, exercicios.length, 'ids repetidos');
});

test('nada no chão e nada de mergulho de tríceps', () => {
  for (const e of exercicios) {
    const txt = `${e.nome} ${e.descricao} ${e.versao_facil}`.toLowerCase();
    assert.ok(!/mergulho|deitad|no chão, de|de joelhos no chão|ajoelhad|quatro apoios/.test(txt), e.id);
  }
});

test('sorteio: 1 por grupo, não repete combinação anterior, sem levantar seguido', () => {
  for (const nivel of [1, 2, 3]) {
    let anterior = [];
    for (let i = 0; i < 2000; i++) {
      const t = sortearTreino(exercicios, nivel, anterior);
      assert.deepEqual(t.map((m) => m.grupo).sort(), [...GRUPOS].sort());
      assert.ok(t.every((m) => m.nivel === nivel));
      const ids = t.map((m) => m.id);
      assert.notEqual(ids.slice().sort().join(), anterior.slice().sort().join(), 'repetiu a combinação');
      assert.ok(!temLevantarSeguido(t));
      anterior = ids;
    }
  }
});

test('evita levantar seguido mesmo com dois movimentos de levantar', () => {
  const falsos = GRUPOS.map((g, i) => ({ id: g, grupo: g, nivel: 9, envolve_levantar: i < 2 }));
  for (let i = 0; i < 500; i++) assert.ok(!temLevantarSeguido(sortearTreino(falsos, 9)));
});

test('níveis: 1–6, 7–15, 16+', () => {
  assert.deepEqual([1, 6, 7, 15, 16, 100].map(nivelDoTreino), [1, 1, 2, 2, 3, 3]);
});

test('frases: pelo menos 30 e nenhuma cita remédio ou emagrecimento', () => {
  const listas = ['frases_durante', 'frases_levantar', 'frases_toalha', 'frases_10s', 'frases_descanso', 'frases_conclusao'];
  const todas = listas.flatMap((l) => config[l]);
  assert.ok(todas.length >= 30, `só ${todas.length} frases`);
  const tudo = JSON.stringify(config) + JSON.stringify(exercicios);
  assert.ok(!/ozempic|mounjaro|wegovy|semaglutid|tirzepatid|liraglutid|saxenda|emagre[cç]a|perca peso|perder peso|kg/i.test(tudo));
});

test('.ics: recorrente seg–sex, 5 min, título correto', () => {
  const agora = new Date(2026, 10, 28, 10, 0); // sábado
  const ics = gerarICS({ hora: 8, minuto: 30, url: 'https://exemplo.com/', agora });
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/);
  assert.match(ics, /DURATION:PT5M/);
  assert.match(ics, /SUMMARY:Treino Força na Caneta – 5 min/);
  assert.match(ics, /DTSTART:20261130T083000/); // segunda
  assert.ok(ics.includes('\r\n'));
  assert.equal(proximoDiaUtil(8, 0, new Date(2026, 10, 25, 7, 0)).getDate(), 25);
});

test('código de recuperação e link #t=', () => {
  assert.equal(codigoDe(15), 'FNC-15');
  assert.equal(lerCodigo('fnc-15'), 15);
  assert.equal(lerCodigo(' FNC 7 '), 7);
  assert.equal(lerCodigo('abc'), null);
  assert.equal(lerHashTreino('#t=15'), 15);
  assert.equal(lerHashTreino('#x=1&t=3'), 3);
  assert.equal(lerHashTreino(''), null);
});

test('plataforma: iOS, Android e navegadores internos', () => {
  const ig = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0';
  assert.deepEqual(detectarPlataforma(ig), { ios: true, android: false, inApp: 'Instagram', standalone: false });
  assert.equal(detectarPlataforma('Mozilla/5.0 (Linux; Android 14) Chrome/130 Mobile').android, true);
  assert.equal(detectarPlataforma('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari', 5).ios, true);
  assert.equal(detectarPlataforma('Mozilla/5.0 (Linux; Android 14) WhatsApp/2.24').inApp, 'WhatsApp');
});

test('Missão Elástico: a partir do 7 e reaparece a cada 5', () => {
  assert.equal(mostrarElastico(6, null), false);
  assert.equal(mostrarElastico(7, null), true);
  assert.equal(mostrarElastico(9, 7), false);
  assert.equal(mostrarElastico(12, 7), true);
});

test('id de clínica', () => {
  assert.ok(idClinicaValido('demo'));
  assert.ok(!idClinicaValido('<script>'));
  assert.ok(!idClinicaValido('Demo'));
});
