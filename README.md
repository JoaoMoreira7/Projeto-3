# 📈 Ações Radar

App web para **estudar e identificar ações que estão baratas hoje e têm motor de crescimento para amanhã**.

Roda direto no navegador: basta abrir o `index.html`. Sem instalação, sem servidor, sem build.

---

## O que ele faz

| Aba | O que entrega |
|---|---|
| **Radar** | Tabela de todas as ações da base com preço justo, upside, P/L, P/VP, DY, ROE, score de 0 a 100 e veredito. Filtros por setor, país, score, upside, P/L, dividend yield e endividamento. |
| **Análise** | Raio-X de uma ação: preço justo por 4 métodos, preço máximo de compra com margem de segurança, stop sugerido, todos os indicadores, pontos fortes e pontos de atenção em texto claro. |
| **Carteira** | Suas posições com resultado, score médio ponderado, yield da carteira, concentração por setor e alertas automáticos de risco. Salva no navegador. |
| **Prompts de IA** | Os 10 roteiros de análise no padrão Goldman Sachs, Morgan Stanley, Bridgewater, JPMorgan, BlackRock, Citadel, Harvard, Bain, Renaissance e McKinsey. O app preenche os campos com a ação ou carteira selecionada e gera o texto pronto para colar em qualquer IA. |
| **Aprender** | Como o modelo decide o que é barato, onde ele erra, checklist antes de comprar e glossário dos indicadores. |
| **Config** | Premissas do modelo (taxa de desconto, crescimento perpétuo, yield desejado, margem de segurança), atualização de preços por API e edição da base de fundamentos. |

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

## Dados

A base em `js/data.js` é **de demonstração**, com números aproximados. Antes de usar para valer:

- **Preços**: aba Config → cole um token gratuito da [brapi.dev](https://brapi.dev) → *Atualizar preços* (ações da B3). O token fica só no seu navegador.
- **Fundamentos**: aba Config → edite o JSON com os números do último balanço (site de RI da empresa, Status Invest, Fundamentei) → *Salvar base*.

Tudo o que você edita (base, carteira, premissas, token) fica no `localStorage` do seu navegador. Nada é enviado para lugar nenhum.

## Estrutura

```
index.html      interface e abas
style.css       estilos
js/data.js      base de fundamentos + P/L justo por setor
js/engine.js    motor: indicadores, preço justo, notas, score, diagnóstico
js/prompts.js   os 10 roteiros de análise
js/app.js       interface, filtros, carteira, navegação, integração com a API
clima/          projeto anterior (app de clima), preservado
```

## Aviso

Ferramenta de **estudo**, não recomendação de investimento. Modelo de valuation é premissa, não previsão: mude a taxa de desconto e o preço justo muda junto. Métodos de valor castigam empresas de crescimento acelerado, e upside acima de 100% quase sempre esconde risco que os números não capturam. Confira sempre no release de resultados da empresa antes de qualquer decisão.

Os 10 roteiros de análise foram adaptados dos prompts publicados por [@guilhermemorais.ia](https://instagram.com/guilhermemorais.ia).
