# Força na Caneta 💪

Um web app (PWA) gratuito de treinos de força de **5 minutos**, feitos em casa com **cadeira e toalha**. Não tem cadastro e não tem backend: são só arquivos estáticos, então a hospedagem pode ser gratuita.

---

## Sumário

1. [O que tem nesta pasta](#1-o-que-tem-nesta-pasta)
2. [Publicar de graça no GitHub Pages (passo a passo, sem terminal)](#2-publicar-de-graça-no-github-pages)
3. [Alternativa: Netlify em 1 minuto](#3-alternativa-netlify-em-1-minuto)
4. [Ligar o contador de acessos (GoatCounter)](#4-ligar-o-contador-de-acessos-goatcounter)
5. [Como editar o app](#5-como-editar-o-app)
6. [Links das clínicas](#6-links-das-clínicas)
7. [Vídeos e áudios](#7-vídeos-e-áudios)
8. [Testes](#8-testes)
9. [Checklist antes do lançamento](#9-checklist-antes-do-lançamento)

---

## 1. O que tem nesta pasta

| Arquivo | Para que serve | Você vai editar? |
|---|---|---|
| `config.json` | Responsável técnico, patrocinador, link do elástico, contador de acessos, frases e falas | **Sim** |
| `clinicas.json` | Clínicas parceiras (nome, logo, cor) | **Sim** |
| `exercicios.json` | Os 24 movimentos (8 por nível) | Às vezes |
| `termos.html` | Termos de uso e privacidade | **Sim** (marcadores `[ ]`) |
| `index.html`, `styles.css`, `app.js`, `js/logica.js`, `termos.js` | O app em si (estrutura inspirada no AuHug: telas por endereço, página Sobre com seções, ação principal presa ao rodapé) | Não precisa |
| `og-image.png`, `robots.txt` | Prévia do link no WhatsApp/Instagram e busca | Não |
| `sw.js` | Faz o app funcionar offline | Só a linha `VERSAO` |
| `manifest.json`, `icons/` | Ícone e nome na tela de início | Não |
| `img/` | Ilustrações provisórias, uma por movimento | Não |
| `videos/`, `audio/` | Onde entram os vídeos e áudios gravados | Quando gravar |
| `ROTEIRO-GRAVACAO.md` | Lista dos 24 vídeos e 95 áudios, com os textos | Para gravar |
| `TESTES.md` | Roteiro de testes no iPhone e no Android | Para testar |
| `tests/`, `tools/`, `package.json` | Testes automáticos e geradores | Não |

---

## 2. Publicar de graça no GitHub Pages

O endereço final fica assim: `https://SEU-USUARIO.github.io/forca-na-caneta/`

### 2.1 Criar a conta e o repositório

1. Crie uma conta em **github.com** (é grátis), caso ainda não tenha.
2. Clique no **+** (canto superior direito) e em **New repository**.
3. Preencha:
   - **Repository name:** `forca-na-caneta`
   - Deixe **Public** marcado. O GitHub Pages gratuito exige repositório público, e o código do app não tem nada secreto.
   - **Não** marque "Add a README".
4. Clique em **Create repository**.

### 2.2 Enviar os arquivos (pelo navegador, sem terminal)

1. Descompacte o `forca-na-caneta.zip` no seu computador.
2. Na página do repositório recém-criado, clique no link **"uploading an existing file"**.
3. Abra a pasta descompactada, **selecione tudo o que está dentro dela** (todas as pastas e arquivos, não a pasta em si) e arraste para a página. Use o **Chrome** ou o **Edge**: eles mantêm as subpastas (`icons/`, `img/`, `js/` etc.).
4. Espere a lista carregar. Confira se aparecem `index.html`, `js/logica.js` e `img/mov/...`.
5. Lá embaixo, em "Commit changes", escreva `Primeira versão` e clique em **Commit changes**.

> Se as subpastas não subirem, repita o arraste pasta por pasta. Para criar uma pasta pelo site, use **Add file → Create new file** e digite `js/logica.js`: a barra cria a pasta.

### 2.3 Ligar o GitHub Pages

1. No repositório, abra **Settings → Pages** (menu da esquerda).
2. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
3. Em **Branch**, escolha **main**, depois **/ (root)**, e clique em **Save**.
4. Espere de 1 a 3 minutos e atualize a página. Vai aparecer: *"Your site is live at https://SEU-USUARIO.github.io/forca-na-caneta/"*.

### 2.4 Atualizar depois

1. No repositório, abra o arquivo (por exemplo, `config.json`) e clique no **lápis ✏️**.
2. Edite e clique em **Commit changes**. Em cerca de 1 minuto o site atualiza.
3. **Importante:** sempre que mudar algo, abra também o `sw.js` e aumente a versão (`fnc-v1` → `fnc-v2`). Sem isso, os celulares que já instalaram o app continuam usando a versão antiga guardada.

### 2.5 Domínio próprio (opcional)

Se você registrar `forcanacaneta.com.br` (no registro.br, cerca de R$ 40/ano), configure em **Settings → Pages → Custom domain**. O GitHub mostra quais registros DNS criar.

---

## 3. Alternativa: Netlify em 1 minuto

1. Entre em **app.netlify.com/drop**.
2. Arraste a pasta `forca-na-caneta` inteira para a página.
3. Pronto: você recebe um endereço como `https://nome-aleatorio.netlify.app`. Crie uma conta gratuita para manter o site e trocar o nome.

Também dá para ligar o Netlify ao repositório do GitHub: assim cada edição publica sozinha.

---

## 4. Ligar o contador de acessos (GoatCounter)

O GoatCounter é gratuito para projetos pequenos, não usa cookies e não coleta dados pessoais.

1. Entre em **goatcounter.com** e clique em **Sign up**.
2. Escolha um **código** (por exemplo, `forcanacaneta`). O painel fica em `https://forcanacaneta.goatcounter.com`.
3. Preencha e-mail e senha e confirme o e-mail.
4. No `config.json`, coloque o código:
   ```json
   "analytics": { "goatcounter": "forcanacaneta", "plausible_dominio": "", "debug": false }
   ```
5. Publique (e aumente a `VERSAO` no `sw.js`).

**Como ler os números:** no painel, os eventos aparecem como caminhos:

| Caminho | Significa |
|---|---|
| `evento/treino_iniciado/nivel-1` | Alguém começou um treino do nível 1 |
| `evento/treino_concluido/demo/nivel-2` | Treino do nível 2 concluído por uma paciente da clínica `demo` |
| `evento/mais_uma_rodada/...` | Clicou em "Mais uma rodada?" |
| `evento/nivel_alcancado/nivel-2` | Chegou ao treino 7 (nível 2). `nivel-3` = chegou ao treino 16 |
| `evento/clique_patrocinio`, `evento/clique_elastico` | Cliques nos links de parceiros |
| `evento/instalacao` | Instalou na tela de início (só no Android/Chrome) |

Para o **relatório mensal da clínica**, filtre por `/demo/` (o id da clínica) e pelo período. Os números são sempre agregados, e nenhuma paciente é identificada.

> Se preferir o **Plausible** (pago, com painel mais bonito e "propriedades" de verdade), preencha `"plausible_dominio": "seu-dominio.com.br"`. Os eventos chegam com as propriedades `clinica` e `nivel`.

Para ver os eventos no console do navegador enquanto testa, use `"debug": true`.

---

## 5. Como editar o app

### Responsável técnico (obrigatório antes de lançar)
No `config.json`:
```json
"responsavel_tecnico": { "nome": "Fulana de Tal", "cref": "012345-G/SP" },
"contato_email": "contato@forcanacaneta.com.br"
```
O nome aparece no aviso inicial, no rodapé e nos termos.

### Marcadores de lugar 📍
Enquanto `"mostrar_marcadores_de_lugar": true`, o app mostra **caixas tracejadas** onde vão entrar o patrocinador e o link do elástico, para você ver o lugar exato. **Mude para `false` antes do lançamento**: assim, o que estiver vazio some.

Para ver a tela final com os dois marcadores sem precisar treinar, abra: `SEU-SITE/?previa=fim`

### Endereços úteis
| Endereço | Abre |
|---|---|
| `SEU-SITE/#sobre` | Página Sobre |
| `SEU-SITE/#sobre/instalar` | Instruções de instalação |
| `SEU-SITE/#sobre/lembretes` | Lembretes na agenda |
| `SEU-SITE/#sobre/codigo` | Meu código |
| `SEU-SITE/#sobre/voz` | Voz e animações |
| `SEU-SITE/#t=15` | Pergunta se quer restaurar para o treino 15 |

### Segurança (CSP)
O `index.html` tem uma política de segurança (Content-Security-Policy) que só permite scripts do próprio site, do GoatCounter e do Plausible. Se um dia adicionar outro serviço externo, inclua o endereço dele nessa linha, senão ele será bloqueado.

### Patrocinador de proteína
```json
"patrocinio": { "marca": "Marca X", "link": "https://marca-x.com.br/?utm_source=forcanacaneta", "texto": "Hidrate-se e garanta sua proteína — apoio" }
```
Resultado na tela final (linha discreta abaixo do card): *"Hidrate-se e garanta sua proteína — apoio **Marca X**"* (com link). Se `marca` ficar vazia, a linha some.

### Link de afiliado do elástico (Missão Elástico)
```json
"elastico": { "link": "https://link-de-afiliado...", "a_partir_do_treino": 7, "repetir_a_cada": 5, ... }
```
O card aparece a partir do treino 7. Se a pessoa dispensar, ele volta 5 treinos depois.

### Frases
Ficam no `config.json`, nas listas `frases_durante`, `frases_levantar`, `frases_toalha`, `frases_10s`, `frases_descanso` e `frases_conclusao`. Pode adicionar, tirar ou mudar o texto (mantenha as aspas e as vírgulas). **Se já tiver gravado os MP3**, a ordem importa: a 1ª frase de `frases_10s` toca `audio/dez-01.mp3`, e assim por diante. Depois de mudar, rode `node tools/gerar-roteiro.mjs` para atualizar o roteiro.

### Exercícios
Em `exercicios.json`. Cada nível precisa ter **pelo menos 1 movimento de cada grupo** (`pernas`, `empurrar`, `costas`, `extra`). Regras: nada no chão e nada de mergulho de tríceps. Campos importantes:

- `usa_cadeira: true`: mostra e fala o alerta "Cadeira encostada na parede? Então bora."
- `envolve_levantar: true`: a voz diz "levanta devagar", e o sorteio evita dois desses seguidos.
- `posicao`: `"sentada"` ou `"em_pe"`. Ao passar de sentada para em pé, a voz diz "levanta devagar".
- `unilateral: true`: a voz diz "Troca de lado!" na metade.

Ao criar um movimento novo, rode `node tools/gerar-placeholders.mjs` para gerar a ilustração provisória dele.

### Duração e níveis
A duração (30 s + 4 × 60 s + 30 s = 300 s) e os níveis (1–6, 7–15, 16+) ficam no começo de `js/logica.js`. Os testes garantem que o total continua sendo 300 s.

> **Validador:** se quebrar um JSON (uma vírgula a mais, por exemplo), o app abre sem os dados. Antes de salvar, cole o conteúdo em **jsonlint.com** para conferir.

---

## 6. Links das clínicas

1. Coloque o logo da clínica em `clinicas/` (SVG ou PNG quadrado, de preferência até 50 KB).
2. Adicione a clínica em `clinicas.json`:
   ```json
   { "id": "clinica-vida", "nome": "Clínica Vida", "logo": "clinicas/clinica-vida.png", "cor": "#2F7D6D" }
   ```
   O `id` só pode ter letras minúsculas, números e hífen.
3. O link da clínica fica: **`https://SEU-SITE/?c=clinica-vida`**
4. Para o médico entregar na consulta, gere um **QR code** desse link (por exemplo, em qr-code-generator.com ou no próprio Chrome: menu ⋮ → Compartilhar → QR code) e imprima num cartãozinho.

Quem abre pelo link vê "Indicado por Clínica Vida" com o logo, e isso fica guardado no celular. Os eventos do contador levam o id da clínica.

Para testar agora: `SEU-SITE/?c=demo` (a Clínica Exemplo). **Apague a clínica `demo` antes do lançamento.**

---

## 7. Vídeos e áudios

Hoje o app usa **ilustrações provisórias** e a **voz do próprio celular** (speechSynthesis). Quando gravar:

1. Siga o `ROTEIRO-GRAVACAO.md`: ele traz o nome exato de cada arquivo e o texto.
2. Coloque os vídeos em `videos/` e os áudios em `audio/`.
3. No `config.json`: `"midia": { "usar_videos": true }` e `"audio": { "usar_mp3": true }`.
4. Aumente a `VERSAO` no `sw.js` e publique.

Se algum arquivo faltar, o app volta sozinho para a ilustração ou para a voz do celular. A legenda aparece sempre.

---

## 8. Testes

### Automáticos (precisa do Node.js 20 ou mais recente)
```bash
npm test        # lógica (300 s, sorteio, biblioteca, .ics, código) + contraste WCAG AA
npm run e2e     # fluxo completo no navegador (precisa do Playwright: npm i -D playwright && npx playwright install chromium)
```

### Rodar no computador
```bash
npm run dev     # abre em http://localhost:8080
```

### Manuais nos celulares
Siga o **`TESTES.md`** (iPhone/Safari, tela de início, Instagram/WhatsApp, Android, offline, tela ligada, áudio).

---

## 9. Checklist antes do lançamento

- [ ] Nome e CREF do responsável técnico no `config.json`
- [ ] E-mail de contato, razão social/CNPJ e data nos `termos.html`
- [ ] **Revisão jurídica** do aviso e dos termos de uso
- [ ] Busca e depósito no INPI (classes 41 e 42)
- [ ] Código do GoatCounter no `config.json`
- [ ] Patrocinador e link do elástico preenchidos, ou deixados vazios de propósito
- [ ] `"mostrar_marcadores_de_lugar": false`
- [ ] Clínica `demo` removida do `clinicas.json`
- [ ] Movimentos revisados e aprovados pelo responsável técnico
- [ ] `VERSAO` do `sw.js` aumentada
- [ ] Roteiro do `TESTES.md` feito em pelo menos 1 iPhone e 1 Android
