// Teste de ponta a ponta no navegador (Playwright): node tests/e2e.mjs
// Cobre: aviso → BORA → treino de 300 s (relógio simulado) → conclusão, contador, 2º treino do dia,
// navegação por endereço (voltar), modo clínica, código de recuperação, lembretes, instalação,
// prévia da conclusão, offline, navegador interno e ausência de erros/violação de CSP.
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
const vigiar = (page) => {
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy|Refused/i.test(m.text())) erros.push('CSP: ' + m.text()); });
};
const visivel = (page, sel) => page.locator(sel).waitFor({ state: 'visible' });

try {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  vigiar(page);
  await page.clock.install();
  await page.goto(BASE);

  await page.getByRole('heading', { name: 'Antes de começar' }).waitFor();
  assert.ok(!(await page.content()).match(/isen[çc][ãa]o de responsabilidade|assumo|assume a responsabilidade/i));
  ok('aviso aparece no primeiro acesso, sem cláusula de isenção');

  await page.getByRole('button', { name: 'Entendi, bora!' }).click();
  await page.locator('#num-treino', { hasText: 'Treino nº 1' }).waitFor();
  assert.match(await page.locator('#btn-bora').innerText(), /5 min/);
  assert.ok(await page.locator('#botao-instalar').isVisible());
  ok('início: BORA com "5 min", Treino nº 1 e "Usar sem internet" no navegador');

  const eventos = [];
  await page.exposeFunction('registrarEvento', (n) => eventos.push(n));
  await page.evaluate(() => window.addEventListener('fnc:evento', (e) => window.registrarEvento(e.detail.nome)));

  await page.locator('#btn-bora').click();
  await visivel(page, '#treino');
  assert.equal(page.url(), BASE + '#treino');
  assert.equal(await page.locator('#etapa-rotulo').innerText(), 'Aquecimento');
  assert.equal(await page.evaluate(() => window.__fnc.T.total), 300);
  ok('treino abre em #treino, com aquecimento e 300 s no total');

  await page.clock.runFor(31_000);
  assert.equal(await page.locator('#etapa-rotulo').innerText(), 'Movimento 1 de 4');
  assert.notEqual(await page.locator('#legenda').innerText(), '');
  ok('após 30 s entra no movimento 1, com legenda');

  await page.locator('#btn-facil').click();
  assert.match(await page.locator('#descricao-mov').innerText(), /Versão mais fácil/);
  await page.locator('#btn-voz').click();
  assert.equal(await page.locator('#btn-voz').getAttribute('aria-pressed'), 'false');
  await page.locator('#btn-voz').click();
  ok('versão mais fácil e botão de voz (aria-pressed) funcionam');

  await page.locator('#btn-pausar').click();
  const antes = await page.locator('#cronometro').innerText();
  await page.clock.runFor(10_000);
  assert.equal(await page.locator('#cronometro').innerText(), antes);
  await page.locator('#btn-pausar').click();
  ok('pausar congela o cronômetro');

  await page.clock.runFor(270_000);
  await visivel(page, '#fim');
  assert.equal(page.url(), BASE + '#fim');
  assert.match(await page.locator('#titulo-fim').innerText(), /Treino nº 1/);
  assert.equal(await page.evaluate(() => window.__fnc.store.get('treinos')), 1);
  assert.ok(eventos.includes('treino_iniciado') && eventos.includes('treino_concluido'));
  assert.match(await page.locator('#patrocinio').innerText(), /ESPAÇO DO PATROCINADOR/);
  ok('conclusão em 300 s (#fim), contador = 1, eventos enviados, marcador do patrocinador');

  await page.getByRole('button', { name: 'Por hoje tá ótimo' }).click();
  await page.getByText('Que tal o 2º treino do dia?').waitFor();
  await page.locator('#num-treino', { hasText: 'Treino nº 2' }).waitFor();
  ok('início mostra Treino nº 2 e sugere o 2º treino do dia');

  // Voltar do celular no meio do treino: pergunta e não conta
  await page.locator('#btn-bora').click();
  await visivel(page, '#treino');
  page.once('dialog', (d) => d.accept());
  await page.goBack();
  await visivel(page, '#inicio');
  assert.equal(await page.evaluate(() => window.__fnc.T.ativo), false);
  assert.equal(await page.evaluate(() => window.__fnc.store.get('treinos')), 1);
  ok('"voltar" do celular durante o treino pergunta, encerra e não conta');

  // Código de recuperação (seção da página Sobre)
  await page.getByRole('link', { name: 'Meu código' }).click();
  await visivel(page, '#sobre');
  assert.equal(await page.locator('#codigo-texto').innerText(), 'DOSE-1');
  assert.match(await page.locator('#codigo-link').inputValue(), /#t=1$/);
  await page.locator('#codigo-entrada').fill('DOSE-15');
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click();
  assert.match(await page.locator('#restaurar-texto').innerText(), /Restaurar para o treino 15\?/);
  await page.getByRole('button', { name: 'Sim, restaurar' }).click();
  await page.getByRole('button', { name: '← Voltar' }).click();
  await page.locator('#num-treino', { hasText: 'Treino nº 16' }).waitFor();
  ok('código DOSE-15 restaura (próximo: nº 16) e "← Voltar" leva ao início');

  // Link #t=
  await page.goto(BASE + '#t=6');
  await page.locator('#restaurar-texto', { hasText: 'Restaurar para o treino 6?' }).waitFor();
  await page.getByRole('button', { name: 'Sim, restaurar' }).click();
  await page.goto(BASE);
  await page.locator('#num-treino', { hasText: 'Treino nº 7' }).waitFor();
  ok('link #t=6 pergunta e restaura');

  // Lembretes
  await page.getByRole('link', { name: 'Lembretes' }).click();
  assert.ok(await page.locator('#sobre-lembretes').evaluate((d) => d.open));
  assert.match(decodeURIComponent(await page.locator('#link-ics').getAttribute('href')), /RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR/);
  ok('lembretes abrem a seção e geram .ics recorrente');

  // Modo clínica
  await page.goto(BASE + '?c=demo');
  await page.getByText('Indicado por').waitFor();
  assert.equal(await page.locator('#nome-clinica').innerText(), 'Clínica Exemplo');
  await page.goto(BASE);
  await page.getByText('Indicado por').waitFor();
  ok('modo clínica (?c=demo) aparece e fica guardado');

  // Instalação no iPhone
  await page.getByRole('button', { name: 'Usar sem internet' }).click();
  await visivel(page, '#sobre');
  assert.ok(await page.locator('#sobre-instalar').evaluate((d) => d.open));
  assert.match(await page.locator('#sobre-instalar').innerText(), /Adicionar à Tela de Início/);
  ok('"Usar sem internet" abre as instruções de instalação');

  // Prévia da conclusão com Missão Elástico
  await page.goto(BASE + '?previa=fim');
  await visivel(page, '#card-elastico');
  assert.match(await page.locator('#elastico-link').innerText(), /LINK DE AFILIADO/);
  ok('prévia da conclusão mostra o marcador da Missão Elástico');

  // Termos
  await page.goto(BASE + 'termos.html');
  await page.getByRole('heading', { name: 'Termos de uso e privacidade' }).waitFor();
  ok('termos abrem');

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
  vigiar(p2);
  await p2.goto(BASE);
  await p2.getByRole('button', { name: 'Entendi, bora!' }).click();
  await p2.getByRole('button', { name: 'Usar sem internet' }).click();
  await p2.locator('#instalar-inapp', { hasText: 'navegador interno do Instagram' }).waitFor();
  ok('detecta navegador interno do Instagram e orienta abrir no Safari');

  // iPhone SE (tela baixa): BORA e rodapé cabem sem rolar
  const se = await browser.newContext({ ...devices['iPhone SE'] });
  const p3 = await se.newPage();
  vigiar(p3);
  await p3.goto(BASE);
  await p3.getByRole('button', { name: 'Entendi, bora!' }).click();
  await visivel(p3, '#inicio');
  const caber = await p3.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1);
  assert.ok(caber, 'início rola no iPhone SE');
  ok('iPhone SE: tela inicial cabe sem rolar');

  assert.deepEqual(erros, [], 'erros: ' + erros.join(' | '));
  ok('nenhum erro de JavaScript nem violação de CSP');
  console.log(`\n${passos.length} verificações passaram.`);
} catch (e) {
  console.error('✗ FALHOU:', e.message);
  if (erros.length) console.error('Erros:', erros);
  process.exitCode = 1;
} finally {
  await browser.close();
  srv.close();
}
