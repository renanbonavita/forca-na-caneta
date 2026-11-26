# Roteiro de testes manuais

Os testes automáticos (`npm test` e `npm run e2e`) já conferem: duração de 300 s, sorteio, biblioteca, .ics, código de recuperação, modo clínica, offline, contraste e o fluxo completo em iPhone simulado. **O que só dá para ver no aparelho de verdade** está abaixo. Marque ✅ ou anote o problema.

Antes de testar, abra uma vez `SEU-SITE/?c=demo` para ligar o modo clínica.

## iPhone — Safari
- [ ] Aviso aparece na primeira vez; "Termos de uso" abre e volta.
- [ ] BORA: a **voz fala em português** logo no aquecimento (volume ligado, chave lateral sem o modo silencioso).
- [ ] Legendas aparecem em todas as falas.
- [ ] Bipes nos últimos 3 segundos de cada etapa.
- [ ] **Tela não apaga** durante os 5 minutos (iOS 16.4+). Em versão antiga, aparece "Mantenha a tela ligada".
- [ ] Sair do Safari no meio: o treino **pausa** e continua ao voltar.
- [ ] Pausar, Pular e Versão mais fácil funcionam.
- [ ] Tela final: confete (some com "Reduzir animações" ligado).
- [ ] "Lembretes" → escolher horário → abre o Calendário → evento de seg a sex, 5 min.

## iPhone — tela de início
- [ ] "Adicionar à tela de início" mostra os passos; seguir os passos instala o ícone **FnC**.
- [ ] Abrir pelo ícone: abre sem a barra do Safari.
- [ ] A contagem começou do zero? Se sim, usar "Meu código" (anotado antes) e restaurar.
- [ ] Modo avião + abrir pelo ícone: **funciona offline** e faz um treino completo.

## iPhone — navegadores internos
- [ ] Enviar o link no **WhatsApp** e abrir: o app funciona; "Adicionar à tela de início" orienta abrir no Safari.
- [ ] Abrir o link pela bio/direct do **Instagram**: aparece "Você está no navegador interno do Instagram".

## Android — Chrome
- [ ] Voz em português, legendas e bipes.
- [ ] "Adicionar à tela de início" abre o **pedido de instalação** do Chrome; o ícone aparece.
- [ ] Tela não apaga durante o treino.
- [ ] Offline funciona depois de instalado.
- [ ] "Lembretes" → "Usar o Google Agenda" cria o evento recorrente.

## Código de recuperação
- [ ] Fazer 2 treinos → "Meu código" mostra FNC-2 → "Copiar link".
- [ ] Abrir o link em outra aba anônima → pergunta "Restaurar para o treino 2?" → Sim → mostra "Treino nº 3".

## Acessibilidade
- [ ] **VoiceOver** (iPhone: Ajustes → Acessibilidade) lê os botões e as legendas.
- [ ] **TalkBack** (Android) idem.
- [ ] Com a fonte do sistema aumentada, nada fica cortado.
- [ ] "Reduzir animações" desliga a pulsação do BORA e o confete.

## Contador de acessos (depois de ligar o GoatCounter)
- [ ] Fazer 1 treino pelo link `?c=demo` → em até 1 minuto aparece `evento/treino_concluido/demo/nivel-1` no painel.
