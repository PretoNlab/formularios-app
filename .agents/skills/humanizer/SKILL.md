---
name: humanizer
description: |
  Remove vícios, clichês e padrões artificiais de escrita de IA em textos, documentação,
  copywriting de páginas, microcopy de componentes e geração de formulários.
  Baseado nos 25 anti-padrões do Humanizer e no artigo 'Signs of AI writing' da Wikipédia,
  com adaptação rigorosa para Português Brasileiro (PT-BR) e UX de alta conversão.
license: MIT
metadata:
  version: "3.0.0"
  author: "blader (adaptado para formularios.ia.br)"
---

# Humanizer: Remoção de Padrões e Vícios de IA

Reescreva textos gerados por IA para que soem como se tivessem sido escritos por uma pessoa real, atenta e direta — sem perder fatos, regras de negócio ou inventar detalhes.

## Por que textos de IA soam artificiais?

Modelos de linguagem escolhem a palavra ou estrutura estatisticamente mais genérica para agradar ao maior número possível de leitores. Humanos escrevem para um leitor e contexto específicos. Todo padrão artificial abaixo é reflexo dessa generalização:

1. **Encenação (*Staging*):** Frases que buscam soar solenes ou profundas em vez de adicionar fatos concretos (ex: contrastes vazios, aberturas teatrais).
2. **Ritmo por regra (*Rhythm by rule*):** Listas forçadas sempre em 3 itens (tríades), travessões (`—`) em todo lugar.
3. **Inflação de autoridade:** Fatos comuns descritos como "marcos revolucionários", adjetivação corporativa vazia.
4. **Formatação excessiva:** Negrito em cada palavra-chave, emojis decorativos como marcadores de tópico.
5. **Resquícios de chatbot:** Introduções e encerramentos que parecem mensagens de suporte.

---

## Os 25 Padrões Críticos

### A. Encenação em vez de afirmação direta (Aja na primeira ocorrência)

1. **"Não X, mas Y" / "Não se trata apenas de X, mas de Y":**
   - *Problema:* Cria um contraste com algo que ninguém contestou só para fazer o ponto parecer grandioso.
   - *Antes:* "Não é apenas um formulário, é uma experiência completa de conexão."
   - *Depois:* "O formulário conecta sua marca aos clientes de forma rápida."

2. **Fechamentos dramáticos de uma frase e fragmentos:**
   - *Problema:* Força uma pausa emocional artificial (*"Essa é a verdadeira virada."*, *"Pense nisso."*, *"Simples assim."*).
   - *Ação:* Corte a frase repetitiva ou integre o dado na frase anterior.

3. **Frases de efeito pseudoprofundas:**
   - *Problema:* *"No fundo, o que importa é a confiança."*, *"A simetria é a linguagem da precisão."*
   - *Ação:* Substitua o clichê filosófico pelo benefício ou fato prático.

4. **Aberturas teatrais (*Run-ups*):**
   - *Problema:* *"Vamos direto ao ponto"*, *"Sendo sincero? Depende..."*, *"Mergulhe conosco nessa jornada..."*
   - *Ação:* Remova o aquecimento e comece direto no assunto.

5. **Rebater quem não fez perguntas:**
   - *Problema:* *"Alguns poderiam argumentar que...", "Uma alternativa tentadora seria..."*
   - *Ação:* Remova a falsa objeção; mantenha apenas os argumentos reais.

---

### B. Métrica e ritmo mecânicos

6. **Tríades forçadas:**
   - *Problema:* Agrupar adjetivos ou substantivos sempre de 3 em 3 (*"rápido, prático e seguro"*; *"inovação, inspiração e insights"*).
   - *Ação:* Use a quantidade natural de itens que o significado exige (muitas vezes apenas 1 ou 2).

7. **Aberturas repetitivas de frases:**
   - *Problema:* Começar três frases consecutivas da mesma forma (*"Ele fez...", "Ele enviou...", "Ele confirmou..."*).

8. **Travessões (`—`) como conectivos universais:**
   - *Ação:* Use pontos, vírgulas ou parênteses naturais.

9. **Acúmulo de atenuantes:**
   - *Problema:* *"poderia potencialmente talvez ser considerado"* -> *"pode ser considerado"*.

10. **Voz passiva sem sujeito desnecessária:**
    - *Problema:* *"Nenhum arquivo de configuração é exigido."* -> *"Não exige arquivo de configuração."*

---

### C. Inflação e jargão de IA

11. **Palavras e clichês batidos de IA:**
    - *Evitar:* *"mergulhar" (delve)*, *"testemunho/testamento"*, *"tapeçaria"*, *"ecossistema"*, *"panorama"*, *"pioneiro"*, *"crucial"*, *"transformador"*, *"robusto"*.
    - *Ação:* Use palavras simples, corriqueiras e diretas.

12. **Significância inflada:**
    - *Problema:* *"marcando um momento decisivo"*, *"o futuro parece brilhante"*.
    - *Ação:* Apresente o fato concreto e deixe o leitor tirar a conclusão.

13. **Linguagem vendedora melodramática:**
    - *Problema:* *"aninhado estrategicamente no coração da plataforma"*, *"uma solução mágica e inovadora"*.

14. **Evitar verbos diretos (ser, ter, fazer):**
    - *Problema:* *"atua como uma ponte que viabiliza"* -> *"serve para"*, *"conecta"*.

---

### D. Formatação e resíduos

15. **Negrito decorativo em excesso:**
    - *Problema:* Deixar termos óbvios em negrito no meio do texto ou em listas.
    - *Ação:* Use negrito somente para destaque funcional ou títulos semânticos.

16. **Títulos com emojis e caixas altas desnecessárias:**
    - *Problema:* *"🚀 FASE 1: O Despertar Dos Resultados"* -> *"Passo 1: Definição dos objetivos"*.

17. **Resíduos de chatbot:**
    - *Problema:* *"Ótima pergunta! Espero que isso ajude!"*, *"Aqui estão algumas ideias:"*.
    - *Ação:* Elimine completamente.

---

## Diretrizes Específicas para Formulários & CRO (formularios.ia.br)

Ao aplicar em formulários e páginas:

1. **Perguntas como conversa humana:**
   - Em vez de: *"Qual é a sua percepção acerca do nosso nível de conformidade e atendimento prestado?"*
   - Prefira: *"Como foi seu atendimento com a gente?"*
2. **Títulos de formulário focados em benefício real:**
   - Em vez de: *"🚀 Pesquisa de Satisfação: Transformando Nossa Experiência Juntos"*
   - Prefira: *"Pesquisa rápida sobre sua compra (leva 1 min)"*
3. **Alternativas de resposta autênticas:**
   - Em múltipla escolha, use termos que as pessoas reais usam no dia a dia (ex: *"Menos de R$ 5 mil"*, *"Entre R$ 5 mil e R$ 20 mil"* em vez de formulações acadêmicas).
4. **Resumos analíticos sem floreios:**
   - Em relatórios de respostas com IA, relate a frequência e o sentimento diretamente, sem introduções pomposas.
