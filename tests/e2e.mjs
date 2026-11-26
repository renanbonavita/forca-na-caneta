// Teste de ponta a ponta no navegador (Playwright): node tests/e2e.mjs
// Cobre: aviso → BORA → treino de 300 s (relógio simulado) → conclusão, contador, 2º treino do dia,
// modo clínica, código de recuperação, prévia da conclusão e funcionamento offline.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { iniciarServidor } from '../tools/servidor.mjs';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const PORTA = 8199;
const BASE = `http://localhost:${PORTA}/`;
const srv = await iniciarServidor(PORTA);
const browser = await chromium.launch();
const passos = [];
const ok = (t) => { passos.push(t); console.log('✓', t); };
const erros = [];

try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => erros.push(e.message));
  await page.clock.install();
  await page.goto(BASE);

  await page.getByRole('heading', { name: 'Antes de começar' }).waitFor();
  assert.ok(!(await page.content()).match(/isen[çc][ãa]o|assumo|assume a responsabilidade/i));
  ok('aviso aparece no primeiro acesso, sem cláusula de isenção');

  await page.getByRole('button', { name: 'Entendi, bora!' }).click();
  await page.locator('#num-treino', { hasText: 'Treino nº 1' }).waitFor();
  assert.match(await page.locator('#btn-bora').innerText(), /5 min/);
  ok('tela inicial: BORA com "5 min" e Treino nº 1');

  const eventos = [];
  await page.exposeFunction('registrarEvento', (n) => eventos.push(n));
  await page.evaluate(() => window.addEventListener('fnc:evento', (e) => window.registrarEvento(e.detail.nome)));

  await page.locator('#btn-bora').click();
  await page.locator('#tela-treino').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#etapa-rotulo').innerText(), 'Aquecimento');
  assert.equal(await page.evaluate(() => window.__fnc.T.total), 300);
  ok('treino começa com aquecimento e duração total 300 s');

  await page.clock.runFor(31_000);
  assert.equal(await page.locator('#etapa-rotulo').innerText(), 'Movimento 1 de 4');
  assert.notEqual(await page.locator('#legenda').innerText(), '');
  ok('após 30 s entra no movimento 1, com legenda');

  await page.locator('#btn-facil').click();
  assert.match(await page.locator('#descricao-mov').innerText(), /Versão mais fácil/);
  ok('versão mais fácil troca a instrução');

  await page.locator('#btn-pausar').click();
  const antes = await page.locator('#cronometro').innerText();
  await page.clock.runFor(10_000);
  assert.equal(await page.locator('#cronometro').innerText(), antes);
  await page.locator('#btn-pausar').click();
  ok('pausar congela o cronômetro');

  await page.clock.runFor(270_000);
  await page.locator('#tela-fim').waitFor({ state: 'visible' });
  assert.match(await page.locator('#titulo-fim').innerText(), /Treino nº 1/);
  assert.equal(await page.evaluate(() => window.__fnc.store.get('treinos')), 1);
  assert.ok(eventos.includes('treino_iniciado') && eventos.includes('treino_concluido'));
  assert.match(await page.locator('#patrocinio').innerText(), /ESPAÇO DO PATROCINADOR/);
  ok('conclusão em 300 s, contador = 1, eventos enviados, marcador do patrocinador visível');

  await page.getByRole('button', { name: 'Por hoje tá ótimo' }).click();
  await page.getByText('Que tal o 2º treino do dia?').waitFor();
  await page.locator('#num-treino', { hasText: 'Treino nº 2' }).waitFor();
  ok('início mostra Treino nº 2 e sugere o 2º treino do dia');

  // Código de recuperação
  await page.getByRole('button', { name: /Meu código/ }).click();
  assert.equal(await page.locator('#codigo-texto').innerText(), 'FNC-1');
  assert.match(await page.locator('#codigo-link').inputValue(), /#t=1$/);
  await page.locator('#codigo-entrada').fill('FNC-15');
  await page.getByRole('button', { name: 'Restaurar' }).click();
  await page.getByRole('heading', { name: 'Restaurar para o treino 15?' }).waitFor();
  await page.getByRole('button', { name: 'Sim, restaurar' }).click();
  await page.locator('#num-treino', { hasText: 'Treino nº 16' }).waitFor();
  ok('código FNC-15 restaura a contagem (próximo: treino nº 16, nível 3)');

  // Link #t=
  await page.goto(BASE + '#t=6');
  await page.getByRole('heading', { name: 'Restaurar para o treino 6?' }).waitFor();
  await page.getByRole('button', { name: 'Sim, restaurar' }).click();
  await page.locator('#num-treino', { hasText: 'Treino nº 7' }).waitFor();
  ok('link #t=6 pergunta e restaura');

  // Lembrete .ics
  await page.getByRole('button', { name: /Lembretes/ }).click();
  const href = await page.locator('#link-ics').getAttribute('href');
  assert.match(decodeURIComponent(href), /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/);
  await page.locator('#dlg-lembretes [data-fechar]').click();
  ok('lembretes geram .ics recorrente');

  // Modo clínica
  await page.goto(BASE + '?c=demo');
  await page.getByText('Indicado por').waitFor();
  assert.equal(await page.locator('#nome-clinica').innerText(), 'Clínica Exemplo');
  await page.goto(BASE);
  await page.getByText('Indicado por').waitFor();
  ok('modo clínica (?c=demo) aparece e fica guardado');

  // Instalação no iPhone
  await page.getByRole('button', { name: /Adicionar à tela de início/ }).click();
  assert.match(await page.locator('#instalar-conteudo').innerText(), /Adicionar à Tela de Início/);
  await page.locator('#dlg-instalar [data-fechar]').click();
  ok('instruções de instalação para iPhone');

  // Prévia da conclusão com Missão Elástico
  await page.goto(BASE + '?previa=fim');
  await page.locator('#card-elastico').waitFor({ state: 'visible' });
  assert.match(await page.locator('#elastico-link').innerText(), /LINK DE AFILIADO/);
  ok('prévia da conclusão mostra o marcador da Missão Elástico');

  // Offline
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(500);
  await ctx.setOffline(true);
  await page.reload();
  await page.locator('#btn-bora').waitFor();
  await ctx.setOffline(false);
  ok('abre offline depois da primeira visita (service worker)');

  // Navegador interno do Instagram
  const ig = await browser.newContext({ ...devices['iPhone 13'], userAgent: devices['iPhone 13'].userAgent + ' Instagram 350.0' });
  const p2 = await ig.newPage();
  await p2.goto(BASE);
  await p2.getByRole('button', { name: 'Entendi, bora!' }).click();
  await p2.getByRole('button', { name: /Adicionar à tela de início/ }).click();
  assert.match(await p2.locator('#instalar-conteudo').innerText(), /navegador interno do Instagram/);
  ok('detecta navegador interno do Instagram e orienta abrir no Safari');

  assert.deepEqual(erros, [], 'erros de JavaScript: ' + erros.join(' | '));
  ok('nenhum erro de JavaScript');
  console.log(`\n${passos.length} verificações passaram.`);
} catch (e) {
  console.error('✗ FALHOU:', e.message);
  if (erros.length) console.error('Erros JS:', erros);
  process.exitCode = 1;
} finally {
  await browser.close();
  srv.close();
}
