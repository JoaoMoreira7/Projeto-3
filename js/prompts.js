/* ============================================================
   BIBLIOTECA DE PROMPTS DE ANÁLISE
   10 roteiros de análise no padrão das grandes casas do mercado.
   Cada prompt tem campos a preencher; o app monta o texto final
   e você cola em qualquer IA (Claude, ChatGPT, Gemini...).
   ============================================================ */

const PROMPTS = [
  {
    id: "screener",
    num: 1,
    titulo: "Stock Screener nível Goldman Sachs",
    casa: "Goldman Sachs",
    resumo: "Filtra as 10 melhores ações para o seu perfil, com preço-alvo, risco e zona de entrada.",
    campos: [
      { id: "perfil", label: "Tolerância a risco", placeholder: "moderada", valor: "moderada" },
      { id: "valor", label: "Valor de investimento", placeholder: "R$ 50.000", valor: "" },
      { id: "horizonte", label: "Horizonte de tempo", placeholder: "5 anos", valor: "" },
      { id: "setores", label: "Setores preferidos", placeholder: "bancos, energia, saneamento", valor: "" }
    ],
    montar: (c) => `Você é um analista de equity sênior no Goldman Sachs com 20 anos de experiência selecionando ações para clientes de alto patrimônio. Preciso de um framework completo de screening de ações para os meus objetivos de investimento.

Analise e entregue:
1. Top 10 ações que combinam com meus critérios, com ticker
2. Análise de P/L comparado à média do setor
3. Tendência de crescimento de receita dos últimos 5 anos
4. Saúde de dívida sobre patrimônio para cada escolha
5. Yield de dividendo e sustentabilidade do payout
6. Rating de moat competitivo (fraco, médio, forte)
7. Preços-alvo bull e bear para os próximos 12 meses
8. Rating de risco de 1 a 10 com raciocínio claro
9. Zonas de entrada e sugestão de stop-loss

Formate como relatório profissional de equity research com tabela resumo.

Meu perfil: tolerância a risco ${c.perfil}, valor de investimento ${c.valor}, horizonte de tempo ${c.horizonte}, setores preferidos: ${c.setores}.`
  },

  {
    id: "dcf",
    num: 2,
    titulo: "Análise de valuation DCF estilo Morgan Stanley",
    casa: "Morgan Stanley",
    resumo: "Fluxo de caixa descontado completo para dizer se a ação está barata, justa ou cara.",
    campos: [
      { id: "ticker", label: "Ticker e nome da empresa", placeholder: "BBAS3 — Banco do Brasil", valor: "" }
    ],
    montar: (c) => `Você é um investment banker nível VP no Morgan Stanley que constrói modelos de valuation para deals de M&A da Fortune 500. Preciso de uma análise de fluxo de caixa descontado completa para uma ação específica.

Construa:
1. Projeção de receita de 5 anos com premissas de crescimento explícitas
2. Estimativas de margem operacional baseadas em tendências históricas
3. Cálculo de fluxo de caixa livre ano a ano
4. Custo médio ponderado de capital (WACC)
5. Valor terminal usando exit multiple e perpetuity growth
6. Tabela de sensibilidade mostrando fair value em diferentes taxas de desconto
7. Comparação DCF vs preço atual
8. Veredito claro: subvalorizada, justamente valorizada ou sobrevalorizada
9. Premissas-chave que podem quebrar o modelo

Formate como memo de valuation de investment banking com tabela e matemática clara.

Ação a valorar: ${c.ticker}.`
  },

  {
    id: "risco",
    num: 3,
    titulo: "Framework de análise de risco inspirado na Bridgewater",
    casa: "Bridgewater Associates",
    resumo: "Raio-X de risco da carteira: correlação, concentração, stress test de recessão e hedges.",
    campos: [
      { id: "carteira", label: "Sua carteira (ativos e %)", placeholder: "BBAS3 25%, PETR4 20%, TAEE11 15%, WEGE3 15%, caixa 25%", valor: "", tipo: "textarea" },
      { id: "total", label: "Valor total investido", placeholder: "R$ 120.000", valor: "" }
    ],
    montar: (c) => `Você é um analista de risco sênior na Bridgewater Associates treinado nos princípios de transparência radical do Ray Dalio para investimento. Preciso de uma avaliação de risco completa do meu portfólio atual.

Avalie:
1. Análise de correlação entre meus ativos
2. Risco de concentração setorial com breakdown percentual
3. Exposição geográfica e fatores de risco cambial
4. Sensibilidade a taxa de juros para cada posição
5. Stress test de recessão mostrando drawdown estimado
6. Rating de risco de liquidez para cada holding
7. Risco por ação e recomendação de dimensionamento
8. Cenários de tail risk com estimativa de probabilidade
9. Estratégias de hedge para reduzir meus 3 principais riscos
10. Sugestões de rebalanceamento com alocação específica

Formate como relatório profissional de risk management com heatmap.

Meu portfólio: ${c.carteira}. Valor total: ${c.total}.`
  },

  {
    id: "resultados",
    num: 4,
    titulo: "Breakdown de resultados nível JPMorgan",
    casa: "JPMorgan Chase",
    resumo: "Prévia de balanço: o que esperar, cenário bull/bear e se vale comprar antes do resultado.",
    campos: [
      { id: "empresa", label: "Empresa que vai reportar", placeholder: "Petrobras (PETR4)", valor: "" },
      { id: "data", label: "Data do resultado (se souber)", placeholder: "próximo trimestre", valor: "" }
    ],
    montar: (c) => `Você é um analista sênior de equity research no JPMorgan Chase que escreve prévias de resultados para investidores institucionais. Preciso de uma análise completa de resultados antes de uma empresa reportar.

Entregue:
1. Últimos 4 trimestres de resultados vs estimativas (histórico de beat ou miss)
2. Consenso de receita e EPS para o próximo trimestre
3. Métricas-chave que o mercado está observando nessa empresa específica
4. Breakdown de receita por segmento e tendências
5. Resumo do guidance da última call
6. Movimento implícito no mercado de opções para o dia do resultado
7. Reação histórica do preço da ação após os últimos 4 resultados
8. Cenário bull e estimativa de impacto no preço
9. Cenário bear e estimativa de risco de queda
10. Jogada recomendada: comprar antes, vender antes ou esperar

Formate como brief de research pré-resultado com resumo de decisão no topo.

Empresa que vai reportar: ${c.empresa}. Data do resultado: ${c.data}.`
  },

  {
    id: "portfolio",
    num: 5,
    titulo: "Modelo de construção de portfólio estilo BlackRock",
    casa: "BlackRock",
    resumo: "Monta a carteira do zero: alocação por classe, ETFs, rebalanceamento e política de investimento.",
    campos: [
      { id: "idade", label: "Idade", placeholder: "32", valor: "" },
      { id: "renda", label: "Renda mensal", placeholder: "R$ 9.000", valor: "" },
      { id: "poupanca", label: "Quanto investe por mês", placeholder: "R$ 1.500", valor: "" },
      { id: "objetivo", label: "Objetivo", placeholder: "aposentadoria em 20 anos", valor: "" },
      { id: "risco", label: "Tolerância a risco", placeholder: "moderada", valor: "" },
      { id: "conta", label: "Tipo de conta", placeholder: "conta em corretora, PF, isento até R$20 mil/mês", valor: "" }
    ],
    montar: (c) => `Você é um estrategista de portfólio sênior na BlackRock gerenciando portfólios multi-ativos de mais de 500 milhões para clientes institucionais. Preciso de um portfólio de investimento customizado construído do zero para a minha situação.

Crie:
1. Alocação exata de ativos com percentuais entre ações, títulos e alternativos
2. Recomendações específicas de ETF ou fundo para cada categoria, com ticker
3. Holdings core vs satélite claramente identificadas
4. Faixa de retorno anual esperada baseada em dados históricos
5. Drawdown máximo esperado em um ano ruim
6. Cronograma de rebalanceamento e regras de gatilho
7. Estratégia de eficiência fiscal para o meu tipo de conta
8. Plano de aportes mensais (dollar cost averaging)
9. Benchmark para medir minha performance
10. Statement de política de investimento de uma página que eu possa seguir

Formate como documento profissional de investment policy, com a descrição da alocação em formato de pizza.

Meus dados: idade ${c.idade}, renda ${c.renda}, aporte mensal ${c.poupanca}, objetivo ${c.objetivo}, tolerância a risco ${c.risco}, tipo de conta ${c.conta}.`
  },

  {
    id: "tecnica",
    num: 6,
    titulo: "Sistema de análise técnica nível Citadel",
    casa: "Citadel",
    resumo: "Tendência, suportes, médias, RSI/MACD, alvo, stop e risco-retorno do trade.",
    campos: [
      { id: "ticker", label: "Ação para analisar", placeholder: "VALE3", valor: "" },
      { id: "posicao", label: "Sua posição atual (se houver)", placeholder: "100 ações a R$ 60,00", valor: "" }
    ],
    montar: (c) => `Você é um trader quantitativo sênior na Citadel que combina análise técnica com modelos estatísticos para timing de entradas e saídas. Preciso de um breakdown completo de análise técnica de uma ação.

Analise:
1. Direção da tendência atual nos timeframes diário, semanal e mensal
2. Níveis-chave de suporte e resistência com preços exatos
3. Médias móveis de 50, 100 e 200 dias e sinais de cruzamento
4. Leituras de RSI, MACD e Bandas de Bollinger com interpretação em linguagem simples
5. Análise de tendência de volume e o que sinaliza sobre força de compradores vs vendedores
6. Identificação de padrões de gráfico (ombro-cabeça-ombro, xícara com alça, etc.)
7. Níveis de retração de Fibonacci para zonas de bounce potenciais
8. Preço ideal de entrada, nível de stop-loss e alvo de lucro
9. Ratio risco-retorno para o trade atual
10. Rating de confiança: compra forte, compra, neutro, venda ou venda forte

Formate como relatório técnico de análise com plano de trade claro.

Ação para analisar: ${c.ticker}. Posição atual: ${c.posicao}.`
  },

  {
    id: "dividendos",
    num: 7,
    titulo: "Estratégia de dividendos inspirada no endowment de Harvard",
    casa: "Harvard Endowment",
    resumo: "Carteira de renda passiva com 15 a 20 pagadoras, safety score e projeção de renda mensal.",
    campos: [
      { id: "total", label: "Valor total de investimento", placeholder: "R$ 200.000", valor: "" },
      { id: "meta", label: "Meta de renda mensal", placeholder: "R$ 1.500", valor: "" },
      { id: "conta", label: "Tipo de conta", placeholder: "pessoa física, corretora nacional", valor: "" },
      { id: "faixa", label: "Faixa fiscal", placeholder: "27,5%", valor: "" }
    ],
    montar: (c) => `Você é o chief investment strategist do endowment de 50 bilhões da Harvard, especializado em estratégias de equity geradoras de renda. Preciso de um portfólio de renda por dividendo que gere renda passiva confiável.

Construa:
1. 15 a 20 escolhas de ações com dividendo, com ticker e yield atual
2. Dividend safety score para cada ação (escala de 1 a 10)
3. Anos consecutivos de crescimento de dividendo para cada escolha
4. Análise de payout ratio para sinalizar dividendos não sustentáveis
5. Projeção de renda mensal baseada no meu valor de investimento
6. Breakdown de diversificação setorial para evitar concentração
7. Estimativa de taxa de crescimento de dividendo para os próximos 5 anos
8. Projeção de reinvestimento mostrando a composição em 10 anos
9. Resumo de implicações fiscais para dividendos no meu tipo de conta
10. Lista ranqueada do mais seguro ao mais agressivo

Formate como blueprint de portfólio de dividendos com tabela de projeção de renda.

Minha situação: valor total ${c.total}, meta de renda mensal ${c.meta}, tipo de conta ${c.conta}, faixa fiscal ${c.faixa}.`
  },

  {
    id: "competitiva",
    num: 8,
    titulo: "Análise de vantagem competitiva estilo Bain",
    casa: "Bain & Company",
    resumo: "Compara os líderes de um setor e aponta a melhor ação para comprar, com catalisadores.",
    campos: [
      { id: "setor", label: "Setor ou indústria", placeholder: "bancos brasileiros", valor: "" }
    ],
    montar: (c) => `Você é um partner sênior na Bain & Company conduzindo análise de estratégia competitiva para um grande fundo de investimento avaliando um setor. Preciso de um relatório completo de landscape competitivo para achar a melhor ação para comprar no setor.

Entregue:
1. Top 5 a 7 concorrentes no setor com comparação de market cap
2. Comparação de receita e margem de lucro em formato de tabela
3. Análise de moat competitivo para cada empresa (marca, custo, efeito de rede, custo de troca)
4. Tendências de market share nos últimos 3 anos
5. Rating de qualidade de gestão baseado em histórico de alocação de capital
6. Comparação de pipeline de inovação e gasto em P&D
7. Maiores ameaças ao setor (regulação, disrupção, macro)
8. Análise SWOT para as 2 principais empresas
9. Sua única melhor escolha de ação, com rationale claro
10. Catalisadores que podem mover a ação vencedora nos próximos 12 meses

Formate como deck de estratégia competitiva com tabelas de comparação.

Setor que quero analisar: ${c.setor}.`
  },

  {
    id: "padroes",
    num: 9,
    titulo: "Identificador de padrões da Renaissance Technologies",
    casa: "Renaissance Technologies",
    resumo: "Caça padrões estatísticos: sazonalidade, insiders, short interest e comportamento em resultados.",
    campos: [
      { id: "ticker", label: "Ação para investigar", placeholder: "WEGE3", valor: "" },
      { id: "periodo", label: "Período de tempo", placeholder: "últimos 10 anos", valor: "" }
    ],
    montar: (c) => `Você é um quantitative researcher na Renaissance Technologies usando métodos data-driven para achar edges estatísticos no mercado de ações. Preciso que você identifique padrões escondidos e anomalias no comportamento de uma ação.

Pesquise:
1. Padrões sazonais (melhores e piores meses historicamente)
2. Padrões de performance por dia da semana, se existirem
3. Correlação com eventos macro importantes (reuniões de banco central, dados de inflação)
4. Padrões de compra e venda de insiders em filings recentes
5. Tendência de participação institucional (grandes fundos comprando ou vendendo)
6. Análise de short interest e potencial de squeeze
7. Sinais de atividade incomum de opções dignos de observação
8. Comportamento de preço em torno de resultados (padrões pre-run, post-gap)
9. Sinais de rotação setorial que afetam essa ação
10. Resumo do statistical edge: o que dá a essa ação uma vantagem quantificável

Formate como memo de research quantitativo com tabelas de dados e resumo de padrões.

Ação para investigar: ${c.ticker}. Período: ${c.periodo}.`
  },

  {
    id: "macro",
    num: 10,
    titulo: "Avaliação de impacto macro nível McKinsey",
    casa: "McKinsey Global Institute",
    resumo: "Como juros, inflação, PIB, câmbio e política monetária batem na sua carteira, com plano de ação.",
    campos: [
      { id: "carteira", label: "Seu portfólio atual", placeholder: "BBAS3, PETR4, TAEE11, WEGE3, Tesouro Selic", valor: "", tipo: "textarea" },
      { id: "preocupacao", label: "Sua maior preocupação com a economia", placeholder: "juros altos por muito tempo", valor: "" }
    ],
    montar: (c) => `Você é um partner sênior no McKinsey Global Institute que aconselha sovereign wealth funds sobre como tendências macroeconômicas afetam mercados de equity. Preciso de uma análise macro mostrando como as condições econômicas atuais afetam meu portfólio.

Analise:
1. Ambiente atual de taxa de juros e seu impacto em ações de crescimento vs valor
2. Análise de tendência de inflação e quais setores se beneficiam ou sofrem
3. Previsão de crescimento do PIB e o que significa para os lucros corporativos
4. Impacto da força do dólar em holdings internacionais vs domésticas
5. Tendências de dados de emprego e implicações no consumo
6. Outlook de política monetária para os próximos 6 a 12 meses
7. Fatores de risco global (geopolítica, guerras comerciais, cadeias de suprimento)
8. Recomendação de rotação setorial baseada no ciclo econômico atual
9. Ajustes específicos no portfólio que devo considerar agora
10. Timeline de quando esses fatores macro provavelmente impactam mercados

Formate como briefing executivo de estratégia macro com plano de ação claro.

Meu portfólio atual: ${c.carteira}. Minha maior preocupação com a economia: ${c.preocupacao}.`
  }
];

if (typeof module !== "undefined") module.exports = { PROMPTS };
