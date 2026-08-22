/* ============================================================
   UNIVERSO GLOBAL + CAMADA DE QUALIDADE (BUFFETT / MUNGER)
   ------------------------------------------------------------
   BASE DE DEMONSTRAÇÃO: números aproximados, para o app funcionar
   offline. Atualize na aba Config antes de decidir qualquer coisa.

   Três blocos:
     ACOES_GLOBAIS  — ativos fora do Brasil (EUA, Europa, Ásia, LatAm)
     QUALIDADE      — dados que os múltiplos não capturam: moat,
                      consistência do lucro, alocação de capital,
                      governança e conversão de lucro em caixa
     PARAMETROS     — câmbio e juro longo por região
   ============================================================ */

/* ---------- câmbio: quanto vale 1 unidade da moeda em reais ---------- */
const FX = {
  BRL: 1.00, USD: 5.40, EUR: 5.90, GBP: 6.90, CHF: 6.30,
  JPY: 0.036, HKD: 0.69, KRW: 0.0040, CAD: 3.90
};

/* ---------- juro longo (livre de risco) por região, % a.a. ----------
   Buffett desconta fluxos pelo juro do título longo do governo mais um
   prêmio. É por isso que uma ação brasileira precisa ser bem mais barata
   que uma americana para valer a pena: o custo de oportunidade é maior. */
const TAXA_LIVRE_RISCO = {
  "Brasil": 12.0, "EUA": 4.3, "Europa": 3.0, "Reino Unido": 4.3,
  "Suíça": 1.0, "Japão": 1.7, "Coreia do Sul": 3.0, "China": 2.0,
  "Índia": 6.8, "Canadá": 3.2, "América Latina": 9.0, "Oceania": 4.3
};

const REGIAO_POR_PAIS = { BR: "Brasil", US: "EUA" };

/* símbolo usado nos dados -> código da moeda na tabela FX */
const MOEDA_CODIGO = {
  "R$": "BRL", "US$": "USD", "€": "EUR", "£": "GBP", "CHF": "CHF",
  "¥": "JPY", "HK$": "HKD", "₩": "KRW", "C$": "CAD"
};

const ACOES_GLOBAIS = [
  // ---------------- EUA ----------------
  {ticker:"BRK.B", nome:"Berkshire Hathaway", setor:"Seguros", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:470, lpa:24.0, vpa:300, dpa:0, roe:9.0, margem:25, divEbitda:0.3, liqCorr:1.50,
   cagrRec:9, cagrLuc:8, crescEst:8, payout:0, max52:500, min52:400, beta:0.85, liqDia:2000},
  {ticker:"AAPL", nome:"Apple", setor:"Tecnologia", pais:"US", regiao:"EUA", bolsa:"NASDAQ", moeda:"US$",
   preco:235, lpa:7.10, vpa:4.30, dpa:1.02, roe:150, margem:24, divEbitda:0.4, liqCorr:0.87,
   cagrRec:8, cagrLuc:10, crescEst:9, payout:15, max52:260, min52:190, beta:1.10, liqDia:12000},
  {ticker:"MSFT", nome:"Microsoft", setor:"Tecnologia", pais:"US", regiao:"EUA", bolsa:"NASDAQ", moeda:"US$",
   preco:425, lpa:13.10, vpa:44.0, dpa:3.30, roe:33, margem:36, divEbitda:0.2, liqCorr:1.30,
   cagrRec:15, cagrLuc:17, crescEst:13, payout:25, max52:470, min52:370, beta:0.95, liqDia:11000},
  {ticker:"JNJ", nome:"Johnson & Johnson", setor:"Saúde", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:158, lpa:9.90, vpa:30.0, dpa:4.90, roe:26, margem:22, divEbitda:0.8, liqCorr:1.10,
   cagrRec:4, cagrLuc:5, crescEst:5, payout:49, max52:170, min52:140, beta:0.55, liqDia:900},
  {ticker:"PG", nome:"Procter & Gamble", setor:"Consumo", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:165, lpa:6.60, vpa:20.0, dpa:4.00, roe:31, margem:18, divEbitda:1.2, liqCorr:0.75,
   cagrRec:4, cagrLuc:6, crescEst:5, payout:60, max52:180, min52:150, beta:0.45, liqDia:850},
  {ticker:"PEP", nome:"PepsiCo", setor:"Consumo", pais:"US", regiao:"EUA", bolsa:"NASDAQ", moeda:"US$",
   preco:145, lpa:7.20, vpa:13.50, dpa:5.40, roe:45, margem:10, divEbitda:2.4, liqCorr:0.85,
   cagrRec:6, cagrLuc:5, crescEst:5, payout:75, max52:180, min52:130, beta:0.55, liqDia:700},
  {ticker:"V", nome:"Visa", setor:"Bolsa e Serviços Financeiros", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:300, lpa:9.90, vpa:20.0, dpa:2.30, roe:48, margem:54, divEbitda:0.6, liqCorr:1.30,
   cagrRec:11, cagrLuc:13, crescEst:11, payout:23, max52:320, min52:250, beta:0.95, liqDia:2200},
  {ticker:"UNH", nome:"UnitedHealth", setor:"Saúde", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:300, lpa:22.0, vpa:105, dpa:8.40, roe:21, margem:4.0, divEbitda:1.6, liqCorr:0.85,
   cagrRec:12, cagrLuc:10, crescEst:9, payout:38, max52:600, min52:250, beta:0.70, liqDia:2500},
  {ticker:"HD", nome:"Home Depot", setor:"Varejo", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:380, lpa:15.0, vpa:5.00, dpa:9.00, roe:300, margem:10, divEbitda:1.9, liqCorr:1.20,
   cagrRec:5, cagrLuc:3, crescEst:6, payout:60, max52:430, min52:320, beta:1.00, liqDia:1500},
  {ticker:"WMT", nome:"Walmart", setor:"Varejo", pais:"US", regiao:"EUA", bolsa:"NYSE", moeda:"US$",
   preco:95, lpa:2.45, vpa:11.0, dpa:0.94, roe:22, margem:2.8, divEbitda:1.5, liqCorr:0.82,
   cagrRec:6, cagrLuc:7, crescEst:8, payout:38, max52:105, min52:75, beta:0.60, liqDia:3000},

  // ---------------- EUROPA ----------------
  {ticker:"NESN", nome:"Nestlé", setor:"Consumo", pais:"CH", regiao:"Suíça", bolsa:"SIX", moeda:"CHF",
   preco:78, lpa:3.60, vpa:5.20, dpa:3.05, roe:28, margem:11, divEbitda:3.0, liqCorr:0.85,
   cagrRec:3, cagrLuc:2, crescEst:4, payout:85, max52:90, min52:70, beta:0.55, liqDia:300},
  {ticker:"ASML", nome:"ASML Holding", setor:"Tecnologia", pais:"NL", regiao:"Europa", bolsa:"Euronext", moeda:"€",
   preco:680, lpa:19.5, vpa:38.0, dpa:6.10, roe:45, margem:27, divEbitda:-0.5, liqCorr:1.50,
   cagrRec:18, cagrLuc:20, crescEst:14, payout:31, max52:900, min52:600, beta:1.35, liqDia:900},
  {ticker:"MC", nome:"LVMH", setor:"Consumo", pais:"FR", regiao:"Europa", bolsa:"Euronext", moeda:"€",
   preco:560, lpa:24.0, vpa:130, dpa:13.0, roe:19, margem:15, divEbitda:1.0, liqCorr:1.30,
   cagrRec:12, cagrLuc:9, crescEst:6, payout:54, max52:720, min52:480, beta:1.05, liqDia:500},
  {ticker:"SAP", nome:"SAP", setor:"Tecnologia", pais:"DE", regiao:"Europa", bolsa:"Xetra", moeda:"€",
   preco:230, lpa:4.60, vpa:38.0, dpa:2.35, roe:12, margem:13, divEbitda:0.2, liqCorr:1.00,
   cagrRec:6, cagrLuc:8, crescEst:12, payout:51, max52:270, min52:190, beta:1.00, liqDia:600},
  {ticker:"NVO", nome:"Novo Nordisk", setor:"Saúde", pais:"DK", regiao:"Europa", bolsa:"NYSE (ADR)", moeda:"US$",
   preco:58, lpa:3.30, vpa:8.00, dpa:1.55, roe:78, margem:34, divEbitda:0.4, liqCorr:1.00,
   cagrRec:22, cagrLuc:25, crescEst:10, payout:47, max52:100, min52:45, beta:0.85, liqDia:1200},
  {ticker:"SHEL", nome:"Shell", setor:"Petróleo e Gás", pais:"GB", regiao:"Reino Unido", bolsa:"LSE", moeda:"£",
   preco:27.50, lpa:3.20, vpa:24.0, dpa:1.10, roe:11, margem:6.0, divEbitda:0.8, liqCorr:1.30,
   cagrRec:5, cagrLuc:2, crescEst:3, payout:34, max52:30, min52:24, beta:0.85, liqDia:600},
  {ticker:"ULVR", nome:"Unilever", setor:"Consumo", pais:"GB", regiao:"Reino Unido", bolsa:"LSE", moeda:"£",
   preco:46, lpa:2.40, vpa:6.00, dpa:1.60, roe:32, margem:11, divEbitda:2.0, liqCorr:0.85,
   cagrRec:4, cagrLuc:3, crescEst:5, payout:67, max52:52, min52:41, beta:0.50, liqDia:300},
  {ticker:"SIE", nome:"Siemens", setor:"Tecnologia", pais:"DE", regiao:"Europa", bolsa:"Xetra", moeda:"€",
   preco:195, lpa:11.0, vpa:60.0, dpa:5.20, roe:17, margem:10, divEbitda:1.3, liqCorr:1.30,
   cagrRec:6, cagrLuc:7, crescEst:7, payout:47, max52:230, min52:160, beta:1.10, liqDia:400},

  // ---------------- ÁSIA ----------------
  {ticker:"TSM", nome:"Taiwan Semiconductor", setor:"Tecnologia", pais:"TW", regiao:"China", bolsa:"NYSE (ADR)", moeda:"US$",
   preco:175, lpa:7.60, vpa:33.0, dpa:2.20, roe:28, margem:40, divEbitda:-0.3, liqCorr:2.40,
   cagrRec:20, cagrLuc:22, crescEst:18, payout:29, max52:220, min52:130, beta:1.20, liqDia:4000},
  {ticker:"7203", nome:"Toyota Motor", setor:"Consumo", pais:"JP", regiao:"Japão", bolsa:"Tóquio", moeda:"¥",
   preco:2900, lpa:350, vpa:3100, dpa:90, roe:12, margem:9.0, divEbitda:1.5, liqCorr:1.20,
   cagrRec:7, cagrLuc:9, crescEst:4, payout:26, max52:3400, min52:2400, beta:0.80, liqDia:60000},
  {ticker:"6758", nome:"Sony Group", setor:"Tecnologia", pais:"JP", regiao:"Japão", bolsa:"Tóquio", moeda:"¥",
   preco:3400, lpa:250, vpa:2200, dpa:25, roe:12, margem:8.0, divEbitda:0.8, liqCorr:1.10,
   cagrRec:6, cagrLuc:8, crescEst:7, payout:10, max52:4200, min52:2700, beta:1.05, liqDia:45000},
  {ticker:"0700", nome:"Tencent Holdings", setor:"Tecnologia", pais:"HK", regiao:"China", bolsa:"HKEX", moeda:"HK$",
   preco:620, lpa:26.0, vpa:110, dpa:5.00, roe:24, margem:30, divEbitda:-0.2, liqCorr:1.30,
   cagrRec:9, cagrLuc:15, crescEst:10, payout:19, max52:700, min52:400, beta:1.10, liqDia:12000},
  {ticker:"005930", nome:"Samsung Electronics", setor:"Tecnologia", pais:"KR", regiao:"Coreia do Sul", bolsa:"KRX", moeda:"₩",
   preco:78000, lpa:6500, vpa:65000, dpa:1450, roe:10, margem:11, divEbitda:-0.6, liqCorr:2.50,
   cagrRec:6, cagrLuc:-5, crescEst:12, payout:22, max52:95000, min52:49000, beta:1.15, liqDia:1200000},
  {ticker:"INFY", nome:"Infosys", setor:"Tecnologia", pais:"IN", regiao:"Índia", bolsa:"NYSE (ADR)", moeda:"US$",
   preco:19, lpa:0.95, vpa:4.00, dpa:0.75, roe:30, margem:17, divEbitda:-0.8, liqCorr:2.20,
   cagrRec:11, cagrLuc:9, crescEst:8, payout:79, max52:23, min52:16, beta:0.80, liqDia:120},
  {ticker:"HDB", nome:"HDFC Bank", setor:"Bancos", pais:"IN", regiao:"Índia", bolsa:"NYSE (ADR)", moeda:"US$",
   preco:68, lpa:3.40, vpa:26.0, dpa:0.90, roe:14, margem:25, divEbitda:0, liqCorr:1.10,
   cagrRec:18, cagrLuc:16, crescEst:13, payout:26, max52:75, min52:55, beta:0.85, liqDia:200},

  // ---------------- AMÉRICA LATINA E OUTROS ----------------
  {ticker:"MELI", nome:"MercadoLibre", setor:"Varejo", pais:"AR", regiao:"América Latina", bolsa:"NASDAQ", moeda:"US$",
   preco:2100, lpa:40.0, vpa:90.0, dpa:0, roe:45, margem:8.0, divEbitda:0.5, liqCorr:1.20,
   cagrRec:40, cagrLuc:55, crescEst:22, payout:0, max52:2600, min52:1600, beta:1.50, liqDia:900},
  {ticker:"AMX", nome:"América Móvil", setor:"Telecom", pais:"MX", regiao:"América Latina", bolsa:"NYSE (ADR)", moeda:"US$",
   preco:19, lpa:1.30, vpa:6.00, dpa:0.65, roe:21, margem:9.0, divEbitda:1.7, liqCorr:0.80,
   cagrRec:4, cagrLuc:6, crescEst:5, payout:50, max52:22, min52:15, beta:0.90, liqDia:90},
  {ticker:"BHP", nome:"BHP Group", setor:"Mineração e Siderurgia", pais:"AU", regiao:"Oceania", bolsa:"NYSE (ADR)", moeda:"US$",
   preco:55, lpa:4.60, vpa:20.0, dpa:2.60, roe:23, margem:21, divEbitda:0.8, liqCorr:1.40,
   cagrRec:5, cagrLuc:-2, crescEst:3, payout:57, max52:65, min52:45, beta:1.00, liqDia:400},
  {ticker:"RY", nome:"Royal Bank of Canada", setor:"Bancos", pais:"CA", regiao:"Canadá", bolsa:"TSX", moeda:"C$",
   preco:175, lpa:12.0, vpa:80.0, dpa:5.90, roe:15, margem:28, divEbitda:0, liqCorr:1.10,
   cagrRec:7, cagrLuc:6, crescEst:6, payout:49, max52:190, min52:145, beta:0.85, liqDia:400}
];


/* ---------- camada de qualidade: o que os múltiplos não mostram ----------
   moat        fontes de vantagem competitiva (Morningstar: marca/intangível,
               custo, rede, switching, escala eficiente, licença)
   moatForca   0 sem fosso · 1 estreito · 2 sólido · 3 largo
   anosLucro10 anos com lucro nos últimos 10
   anosCresc10 anos com lucro maior que o anterior nos últimos 10
   complexidade 1 simples de entender · 2 exige estudo · 3 caixa-preta
   governanca  1 a 5 (histórico de tratar o minoritário com respeito)
   diluicao    variação anual das ações em circulação (%); negativo = recompra
   oeFator     lucro do proprietário ÷ lucro contábil (quanto do lucro vira
               caixa livre depois do capex de manutenção)
   roic        retorno sobre o capital investido (%); em bancos, use o ROE
   anosDivida  anos de lucro atual para quitar a dívida de longo prazo
   preco5a     preço da ação 5 anos atrás (para o teste do dólar de Buffett)
   ------------------------------------------------------------------------ */
const QUALIDADE = {
  BBAS3: {moat:["custo","licenca"], moatForca:2, anosLucro10:10, anosCresc10:7, complexidade:3, governanca:2, diluicao:0, oeFator:0.9, roic:16, anosDivida:0, preco5a:11.0},
  ITSA4: {moat:["marca","escala"], moatForca:2, anosLucro10:10, anosCresc10:6, complexidade:3, governanca:4, diluicao:0, oeFator:0.95, roic:14, anosDivida:0, preco5a:5.9},
  BBDC4: {moat:["marca","custo"], moatForca:2, anosLucro10:10, anosCresc10:3, complexidade:3, governanca:3, diluicao:0.5, oeFator:0.9, roic:10.5, anosDivida:0, preco5a:12.5},
  SANB11: {moat:["marca"], moatForca:1, anosLucro10:10, anosCresc10:3, complexidade:3, governanca:3, diluicao:0, oeFator:0.9, roic:11, anosDivida:0, preco5a:22.0},
  BBSE3: {moat:["licenca","rede"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:2, governanca:3, diluicao:0, oeFator:1.0, roic:58, anosDivida:0, preco5a:21.0},
  CXSE3: {moat:["licenca","rede"], moatForca:2, anosLucro10:8, anosCresc10:7, complexidade:2, governanca:3, diluicao:0, oeFator:1.0, roic:42, anosDivida:0, preco5a:8.5},
  PETR4: {moat:["custo","escala"], moatForca:2, anosLucro10:8, anosCresc10:5, complexidade:3, governanca:1, diluicao:0, oeFator:0.7, roic:18, anosDivida:1.5, preco5a:17.0},
  PRIO3: {moat:["custo"], moatForca:2, anosLucro10:8, anosCresc10:8, complexidade:2, governanca:4, diluicao:1, oeFator:0.65, roic:21, anosDivida:1.0, preco5a:6.0},
  VALE3: {moat:["custo","escala"], moatForca:3, anosLucro10:10, anosCresc10:4, complexidade:2, governanca:3, diluicao:-1, oeFator:0.75, roic:17, anosDivida:1.0, preco5a:42.0},
  GGBR4: {moat:["custo"], moatForca:1, anosLucro10:9, anosCresc10:4, complexidade:2, governanca:4, diluicao:0, oeFator:0.7, roic:7, anosDivida:1.5, preco5a:12.0},
  CMIG4: {moat:["licenca"], moatForca:2, anosLucro10:9, anosCresc10:6, complexidade:3, governanca:2, diluicao:0, oeFator:0.75, roic:12, anosDivida:1.5, preco5a:8.0},
  TAEE11: {moat:["licenca"], moatForca:3, anosLucro10:10, anosCresc10:5, complexidade:1, governanca:4, diluicao:0, oeFator:0.85, roic:13, anosDivida:4.0, preco5a:27.0},
  CPLE6: {moat:["licenca"], moatForca:2, anosLucro10:8, anosCresc10:5, complexidade:3, governanca:2, diluicao:0, oeFator:0.7, roic:8, anosDivida:2.5, preco5a:5.5},
  EGIE3: {moat:["licenca"], moatForca:3, anosLucro10:10, anosCresc10:7, complexidade:1, governanca:4, diluicao:0, oeFator:0.8, roic:15, anosDivida:3.5, preco5a:36.0},
  SBSP3: {moat:["licenca","escala"], moatForca:3, anosLucro10:9, anosCresc10:7, complexidade:2, governanca:3, diluicao:0, oeFator:0.6, roic:10, anosDivida:3.0, preco5a:42.0},
  CSMG3: {moat:["licenca"], moatForca:3, anosLucro10:9, anosCresc10:6, complexidade:2, governanca:2, diluicao:0, oeFator:0.65, roic:11, anosDivida:2.0, preco5a:13.0},
  VIVT3: {moat:["licenca","rede"], moatForca:2, anosLucro10:10, anosCresc10:4, complexidade:2, governanca:4, diluicao:0, oeFator:0.55, roic:6, anosDivida:1.0, preco5a:45.0},
  WEGE3: {moat:["marca","custo"], moatForca:3, anosLucro10:10, anosCresc10:10, complexidade:2, governanca:5, diluicao:0, oeFator:0.9, roic:25, anosDivida:0, preco5a:25.0},
  TOTS3: {moat:["switching"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:2, governanca:4, diluicao:0.5, oeFator:0.85, roic:17, anosDivida:0.5, preco5a:22.0},
  RENT3: {moat:["escala","custo"], moatForca:2, anosLucro10:9, anosCresc10:5, complexidade:2, governanca:4, diluicao:1, oeFator:0.35, roic:9, anosDivida:4.0, preco5a:55.0},
  RAIL3: {moat:["licenca","escala"], moatForca:3, anosLucro10:7, anosCresc10:6, complexidade:2, governanca:3, diluicao:0.5, oeFator:0.4, roic:7, anosDivida:3.5, preco5a:20.0},
  LREN3: {moat:["marca"], moatForca:2, anosLucro10:9, anosCresc10:4, complexidade:2, governanca:4, diluicao:0, oeFator:0.8, roic:10, anosDivida:0.5, preco5a:40.0},
  ASAI3: {moat:["custo"], moatForca:2, anosLucro10:7, anosCresc10:5, complexidade:2, governanca:3, diluicao:1, oeFator:0.5, roic:11, anosDivida:4.0, preco5a:18.0},
  ABEV3: {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:5, complexidade:1, governanca:4, diluicao:0, oeFator:0.95, roic:15, anosDivida:0, preco5a:12.0},
  JBSS3: {moat:["escala","custo"], moatForca:2, anosLucro10:8, anosCresc10:6, complexidade:3, governanca:2, diluicao:0, oeFator:0.7, roic:14, anosDivida:2.0, preco5a:22.0},
  SLCE3: {moat:["custo"], moatForca:2, anosLucro10:9, anosCresc10:6, complexidade:2, governanca:4, diluicao:0, oeFator:0.5, roic:9, anosDivida:2.5, preco5a:14.0},
  KLBN11: {moat:["custo"], moatForca:3, anosLucro10:9, anosCresc10:6, complexidade:2, governanca:4, diluicao:0, oeFator:0.45, roic:10, anosDivida:4.0, preco5a:15.0},
  SUZB3: {moat:["custo","escala"], moatForca:3, anosLucro10:8, anosCresc10:5, complexidade:2, governanca:4, diluicao:-1, oeFator:0.5, roic:13, anosDivida:4.0, preco5a:40.0},
  CYRE3: {moat:["marca"], moatForca:2, anosLucro10:8, anosCresc10:6, complexidade:2, governanca:4, diluicao:-1, oeFator:0.8, roic:14, anosDivida:1.0, preco5a:14.0},
  DIRR3: {moat:["custo"], moatForca:2, anosLucro10:9, anosCresc10:8, complexidade:2, governanca:4, diluicao:0, oeFator:0.8, roic:20, anosDivida:1.0, preco5a:9.0},
  B3SA3: {moat:["rede","licenca"], moatForca:3, anosLucro10:10, anosCresc10:5, complexidade:2, governanca:4, diluicao:-1, oeFator:0.9, roic:15, anosDivida:1.5, preco5a:11.0},
  MULT3: {moat:["escala"], moatForca:3, anosLucro10:9, anosCresc10:6, complexidade:2, governanca:4, diluicao:-1, oeFator:0.75, roic:10, anosDivida:2.0, preco5a:20.0},
  HAPV3: {moat:["escala"], moatForca:1, anosLucro10:6, anosCresc10:3, complexidade:3, governanca:2, diluicao:2, oeFator:0.5, roic:3, anosDivida:3.0, preco5a:8.0},
  FLRY3: {moat:["marca"], moatForca:2, anosLucro10:9, anosCresc10:5, complexidade:2, governanca:4, diluicao:0, oeFator:0.6, roic:9, anosDivida:2.5, preco5a:16.0},
  YDUQ3: {moat:["marca"], moatForca:1, anosLucro10:8, anosCresc10:3, complexidade:2, governanca:3, diluicao:1, oeFator:0.55, roic:8, anosDivida:3.0, preco5a:30.0},
  GOOGL: {moat:["rede","marca"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:2, governanca:4, diluicao:-1, oeFator:0.85, roic:28, anosDivida:0, preco5a:73.0},
  PFE: {moat:["marca"], moatForca:2, anosLucro10:9, anosCresc10:3, complexidade:3, governanca:3, diluicao:0.5, oeFator:0.85, roic:9, anosDivida:2.0, preco5a:38.0},
  CVX: {moat:["custo"], moatForca:2, anosLucro10:8, anosCresc10:4, complexidade:2, governanca:4, diluicao:-1, oeFator:0.7, roic:11, anosDivida:0.8, preco5a:85.0},
  KO: {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:7, complexidade:1, governanca:4, diluicao:0, oeFator:0.95, roic:15, anosDivida:2.5, preco5a:46.0},
  BABA: {moat:["rede"], moatForca:2, anosLucro10:9, anosCresc10:4, complexidade:3, governanca:2, diluicao:-1, oeFator:0.8, roic:10, anosDivida:0.5, preco5a:250.0},
  INTC: {moat:["custo"], moatForca:1, anosLucro10:7, anosCresc10:2, complexidade:3, governanca:2, diluicao:1, oeFator:0.2, roic:2, anosDivida:4.0, preco5a:50.0},
  F: {moat:["marca"], moatForca:1, anosLucro10:7, anosCresc10:4, complexidade:3, governanca:3, diluicao:0.5, oeFator:0.35, roic:6, anosDivida:5.0, preco5a:7.0},
  VZ: {moat:["licenca","rede"], moatForca:2, anosLucro10:10, anosCresc10:5, complexidade:2, governanca:3, diluicao:0, oeFator:0.5, roic:6, anosDivida:4.0, preco5a:55.0},
  "BRK.B": {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:3, governanca:5, diluicao:-1, oeFator:0.95, roic:9, anosDivida:0.5, preco5a:200.0},
  AAPL: {moat:["marca","switching"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:1, governanca:5, diluicao:-2.5, oeFator:1.05, roic:55, anosDivida:0.6, preco5a:125.0},
  MSFT: {moat:["switching","rede"], moatForca:3, anosLucro10:10, anosCresc10:10, complexidade:2, governanca:5, diluicao:-0.5, oeFator:1.0, roic:30, anosDivida:0.4, preco5a:205.0},
  JNJ: {moat:["marca","licenca"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:2, governanca:4, diluicao:-0.5, oeFator:0.9, roic:20, anosDivida:1.0, preco5a:148.0},
  PG: {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:1, governanca:4, diluicao:-1, oeFator:0.95, roic:18, anosDivida:1.5, preco5a:125.0},
  PEP: {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:1, governanca:4, diluicao:0, oeFator:0.9, roic:16, anosDivida:3.0, preco5a:135.0},
  V: {moat:["rede","switching"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:2, governanca:4, diluicao:-1.5, oeFator:1.05, roic:35, anosDivida:0.7, preco5a:190.0},
  UNH: {moat:["escala","custo"], moatForca:2, anosLucro10:10, anosCresc10:8, complexidade:3, governanca:3, diluicao:-1, oeFator:0.9, roic:15, anosDivida:1.5, preco5a:250.0},
  HD: {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:7, complexidade:1, governanca:4, diluicao:-1.5, oeFator:0.9, roic:40, anosDivida:2.0, preco5a:270.0},
  WMT: {moat:["custo","escala"], moatForca:3, anosLucro10:10, anosCresc10:7, complexidade:1, governanca:4, diluicao:-1, oeFator:0.7, roic:14, anosDivida:2.0, preco5a:47.0},
  NESN: {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:6, complexidade:1, governanca:4, diluicao:-1, oeFator:0.9, roic:14, anosDivida:3.0, preco5a:105.0},
  ASML: {moat:["licenca","switching"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:3, governanca:5, diluicao:-1, oeFator:0.95, roic:35, anosDivida:0, preco5a:350.0},
  MC: {moat:["marca"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:1, governanca:4, diluicao:0, oeFator:0.85, roic:15, anosDivida:1.5, preco5a:420.0},
  SAP: {moat:["switching"], moatForca:3, anosLucro10:10, anosCresc10:6, complexidade:2, governanca:4, diluicao:-0.5, oeFator:0.9, roic:11, anosDivida:0.5, preco5a:110.0},
  NVO: {moat:["licenca","marca"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:3, governanca:4, diluicao:-1.5, oeFator:0.95, roic:60, anosDivida:0.5, preco5a:30.0},
  SHEL: {moat:["custo","escala"], moatForca:2, anosLucro10:8, anosCresc10:4, complexidade:2, governanca:4, diluicao:-2, oeFator:0.6, roic:10, anosDivida:1.5, preco5a:15.0},
  ULVR: {moat:["marca"], moatForca:3, anosLucro10:10, anosCresc10:6, complexidade:1, governanca:4, diluicao:-0.5, oeFator:0.9, roic:17, anosDivida:2.5, preco5a:44.0},
  SIE: {moat:["marca","switching"], moatForca:2, anosLucro10:9, anosCresc10:6, complexidade:3, governanca:4, diluicao:-0.5, oeFator:0.85, roic:12, anosDivida:1.5, preco5a:110.0},
  TSM: {moat:["custo","licenca"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:3, governanca:4, diluicao:0, oeFator:0.55, roic:25, anosDivida:0.5, preco5a:60.0},
  "7203": {moat:["marca","escala"], moatForca:3, anosLucro10:10, anosCresc10:7, complexidade:2, governanca:4, diluicao:-0.5, oeFator:0.6, roic:9, anosDivida:2.0, preco5a:1400.0},
  "6758": {moat:["marca"], moatForca:2, anosLucro10:9, anosCresc10:7, complexidade:2, governanca:4, diluicao:-0.5, oeFator:0.7, roic:11, anosDivida:1.0, preco5a:1000.0},
  "0700": {moat:["rede"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:2, governanca:3, diluicao:-1, oeFator:0.9, roic:20, anosDivida:0.5, preco5a:500.0},
  "005930": {moat:["custo","escala"], moatForca:2, anosLucro10:10, anosCresc10:4, complexidade:2, governanca:3, diluicao:-0.5, oeFator:0.5, roic:9, anosDivida:0, preco5a:55000.0},
  INFY: {moat:["custo","switching"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:2, governanca:4, diluicao:-1, oeFator:0.95, roic:32, anosDivida:0, preco5a:12.0},
  HDB: {moat:["marca","custo"], moatForca:3, anosLucro10:10, anosCresc10:9, complexidade:3, governanca:4, diluicao:1, oeFator:0.9, roic:14, anosDivida:0, preco5a:50.0},
  MELI: {moat:["rede"], moatForca:3, anosLucro10:8, anosCresc10:7, complexidade:2, governanca:4, diluicao:0.5, oeFator:0.7, roic:30, anosDivida:1.0, preco5a:1100.0},
  AMX: {moat:["licenca","escala"], moatForca:2, anosLucro10:9, anosCresc10:5, complexidade:2, governanca:3, diluicao:-1, oeFator:0.55, roic:12, anosDivida:2.0, preco5a:14.0},
  BHP: {moat:["custo","escala"], moatForca:3, anosLucro10:9, anosCresc10:4, complexidade:2, governanca:4, diluicao:0, oeFator:0.7, roic:20, anosDivida:0.8, preco5a:40.0},
  RY: {moat:["marca","switching"], moatForca:3, anosLucro10:10, anosCresc10:8, complexidade:3, governanca:4, diluicao:-0.5, oeFator:0.9, roic:15, anosDivida:0, preco5a:105.0},
};

if (typeof module !== "undefined") module.exports = { ACOES_GLOBAIS, FX, TAXA_LIVRE_RISCO, REGIAO_POR_PAIS, MOEDA_CODIGO, QUALIDADE };
