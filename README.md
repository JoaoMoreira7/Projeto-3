# 📈 Ações Radar

App web para **estudar e identificar ações que estão baratas hoje e têm motor de crescimento para amanhã**, em
**72 empresas de 12 regiões** (Brasil, EUA, Europa, Reino Unido, Suíça, Japão, China, Coreia do Sul, Índia, Canadá,
América Latina e Oceania), com um crivo que traduz em números o sistema de **Warren Buffett e Charlie Munger**.

Roda direto no navegador: basta abrir o `index.html`. Sem instalação, sem servidor, sem build.

---

## O que ele faz

| Aba | O que entrega |
|---|---|
| **Radar** | Tabela de todas as ações da base com preço justo, upside, P/L, P/VP, DY, ROE, score de 0 a 100 e veredito. Filtros por setor, país, score, upside, P/L, dividend yield e endividamento. |
| **Crivo Buffett** | Os 12 tenets de Buffett aplicados a todas as empresas da base: fosso econômico, lucro do proprietário, teste do dólar, valor intrínseco descontado pelo juro local de cada país e margem de segurança. Filtros por região, selo, força do fosso, tenets aprovados e círculo de competência. |
| **Análise** | Raio-X de uma ação: preço justo por 4 métodos, preço máximo de compra com margem de segurança, stop sugerido, todos os indicadores, pontos fortes e pontos de atenção em texto claro. |
| **Carteira** | Suas posições com resultado, score médio ponderado, yield da carteira, concentração por setor e alertas automáticos de risco. Salva no navegador. |
| **Prompts de IA** | Os 10 roteiros de análise no padrão Goldman Sachs, Morgan Stanley, Bridgewater, JPMorgan, BlackRock, Citadel, Harvard, Bain, Renaissance e McKinsey. O app preenche os campos com a ação ou carteira selecionada e gera o texto pronto para colar em qualquer IA. |
| **Aprender** | Como o modelo decide o que é barato, onde ele erra, checklist antes de comprar e glossário dos indicadores. |
| **Config** | Premissas dos dois modelos, círculo de competência, moeda base da carteira, câmbio e juro longo por região, atualização de preços por API e edição da base de fundamentos. |

## Como o score é calculado

Cada ação recebe quatro notas de 0 a 100, combinadas conforme o seu perfil:

- **Está barata?** — earnings yield, P/VP, dividend yield e desconto contra o preço justo
- **Está crescendo?** — CAGR de receita e de lucro em 5 anos, crescimento estimado e PEG
- **Tem qualidade?** — ROE, margem líquida e payout
- **Risco controlado?** — dívida líquida/EBITDA, liquidez corrente, beta e liquidez diária

Pesos por perfil:

| Perfil | Valor | Crescimento | Qualidade | Risco |
|---|---|---|---|---|
| Conservador | 30% | 15% | 30% | 25% |
| Moderado | 35% | 25% | 25% | 15% |
| Agressivo | 30% | 40% | 20% | 10% |

O **preço justo** é a média aparada de quatro métodos independentes (descarta o maior e o menor):

1. **Graham** — `√(22,5 × LPA × VPA)`
2. **Bazin** — `dividendo por ação ÷ yield desejado`
3. **Múltiplo justo do setor** — `LPA × P/L típico do setor`
4. **Fluxo de caixa descontado** — 5 anos de crescimento estimado + perpetuidade, descontados ao custo de capital

O veredito cruza o score com o desconto: "Barata e crescendo" exige score ≥ 70 **e** upside acima da margem de segurança exigida.

## O crivo Buffett–Munger

Buffett e Munger nunca publicaram um algoritmo — o que existe são as cartas da Berkshire, as assembleias e os livros que
sistematizaram tudo isso. O app traduz esse material em 12 testes objetivos, cada um mostrando o número apurado **e** o
limite exigido:

| Grupo | Tenets |
|---|---|
| **Negócio** | Simples e compreensível · histórico operacional consistente · perspectiva favorável de longo prazo (fosso) |
| **Gestão** | Alocação racional de capital (ROIC vs custo de capital) · teste do dólar · não dilui o sócio |
| **Financeiro** | ROE consistentemente alto · lucro do proprietário robusto · margem acima da mediana do setor · dívida quitável em menos de 5 anos |
| **Valor** | Rende mais que o título do governo · margem de segurança suficiente |

Conceitos implementados:

- **Lucro do proprietário** (carta de 1986) — lucro contábil mais itens não-caixa, menos o capex necessário para manter a
  posição competitiva. Buffett avisou na mesma carta que o número nunca é exato, porque o capex de manutenção é estimado;
  por isso ele aparece aqui como um fator explícito e editável por empresa (`oeFator`), não escondido na conta.
- **Teste do dólar** (carta de 1983) — cada R$ 1 retido precisa virar pelo menos R$ 1 de valor de mercado para o sócio.
- **Desconto pelo juro do título longo do governo local** mais um prêmio, em vez de CAPM/WACC. Acrescentamos um prêmio de
  risco-país e um **piso na taxa de desconto**, para que juro nominal baixo não transforme qualquer empresa em barganha.
- **Fosso econômico** nas cinco fontes do enquadramento da Morningstar, mais licença/regulação.
- **Círculo de competência e inversão** — marque os setores que você entende e o app avisa quando a ação está fora deles;
  a lista de "o que mataria esta tese" sai automática dos números.

Quando a lente de qualidade e a de preço discordam — empresa excelente cara, ou ação barata que reprova no crivo — o app
diz isso na cara, porque a divergência costuma ser a informação mais útil da tela.

### Fontes

- [Cartas anuais da Berkshire Hathaway](https://www.berkshirehathaway.com/letters/letters.html) — lucro do proprietário (1986) e teste do dólar (1983)
- [Owner earnings](https://en.wikipedia.org/wiki/Owner_earnings) — definição e limitações
- [Os quatro filtros de Charlie Munger](https://www.gurufocus.com/news/158161/charlie-mungers-four-filters-of-investing)
- [Morningstar — tipos de fosso econômico](https://www.morningstar.com/investing-terms/economic-moat) e ROIC acima do custo de capital
- [Robert Hagstrom, *The Warren Buffett Way*](https://www.wiley.com/en-us/The+Warren+Buffett+Way,+30th+Anniversary+Edition-p-9781394239849) — agrupamento dos tenets
- [Critérios quantitativos de *Buffettology*](https://blog.validea.com/quantifying-warren-buffett/) — ROE acima de 15%, dívida quitável em menos de 5 anos, consistência do lucro

## Dados

A base em `js/data.js` é **de demonstração**, com números aproximados. Antes de usar para valer:

- **Preços**: aba Config → cole um token gratuito da [brapi.dev](https://brapi.dev) → *Atualizar preços* (ações da B3). O token fica só no seu navegador.
- **Fundamentos**: aba Config → edite o JSON com os números do último balanço (site de RI da empresa, Status Invest, Fundamentei) → *Salvar base*.

Tudo o que você edita (base, carteira, premissas, token) fica no `localStorage` do seu navegador. Nada é enviado para lugar nenhum.

## Estrutura

```
index.html         interface e abas
style.css          estilos
js/data.js         fundamentos do Brasil e EUA + P/L justo por setor
js/data-global.js  universo global, camada de qualidade (fosso, consistência,
                   alocação de capital), câmbio e juro longo por região
js/engine.js       motor de valor: indicadores, preço justo, notas, score
js/buffett.js      crivo Buffett–Munger: lucro do proprietário, teste do dólar,
                   valor intrínseco, 12 tenets, selo e inversão
js/prompts.js      os 10 roteiros de análise
js/app.js          interface, filtros, carteira multimoeda, navegação, API
clima/             projeto anterior (app de clima), preservado
```

## Aviso

Ferramenta de **estudo**, não recomendação de investimento. Nenhum software reproduz o julgamento de quem construiu a
Berkshire — desconfie de quem prometer isso. O que dá para fazer é aplicar o método com transparência, no mundo inteiro,
de forma consistente; o julgamento sobre pessoas, o temperamento em crises e a paciência para ficar anos sem comprar nada
continuam sendo seus. Modelo de valuation é premissa, não previsão: mude a taxa de desconto e o preço justo muda junto. Métodos de valor castigam empresas de crescimento acelerado, e upside acima de 100% quase sempre esconde risco que os números não capturam. Confira sempre no release de resultados da empresa antes de qualquer decisão.

Os 10 roteiros de análise foram adaptados dos prompts publicados por [@guilhermemorais.ia](https://instagram.com/guilhermemorais.ia).
