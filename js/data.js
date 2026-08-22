/* ============================================================
   BASE DE DADOS DE FUNDAMENTOS  —  Ações Radar
   ------------------------------------------------------------
   ATENÇÃO: esta é uma BASE LOCAL DE DEMONSTRAÇÃO, com valores
   aproximados e arredondados, usada para o app funcionar offline.
   NÃO use para decidir investimento sem antes atualizar os dados.

   Como atualizar:
     1) Aba "Config" -> conecte um token da API (brapi.dev) para
        puxar o PREÇO em tempo real; ou
     2) Edite os números abaixo (ou pela aba Config -> Editar dados).

   Campos por ativo:
     ticker   nome    setor   pais    moeda
     preco    preço atual da ação
     lpa      lucro por ação (12 meses)
     vpa      valor patrimonial por ação
     dpa      dividendo por ação (12 meses)
     roe      retorno sobre patrimônio (%)
     margem   margem líquida (%)
     divEbitda dívida líquida / EBITDA (x)
     liqCorr  liquidez corrente (x)
     cagrRec  CAGR da receita 5 anos (%)
     cagrLuc  CAGR do lucro 5 anos (%)
     crescEst crescimento estimado p/ próximos anos (%)
     payout   payout (%)
     max52 / min52   máxima e mínima de 52 semanas
     beta     beta (volatilidade x mercado)
     liqDia   liquidez média diária (R$ ou US$ milhões)
   ============================================================ */

const DATA_REF = "Base de exemplo — referência: fechamento de 2025. Atualize antes de usar.";

const PL_JUSTO_SETOR = {
  "Bancos": 9,
  "Energia Elétrica": 10,
  "Saneamento": 12,
  "Seguros": 10,
  "Petróleo e Gás": 7,
  "Mineração e Siderurgia": 8,
  "Varejo": 16,
  "Consumo": 18,
  "Saúde": 18,
  "Tecnologia": 24,
  "Telecom": 12,
  "Papel e Celulose": 9,
  "Agro e Alimentos": 12,
  "Construção": 9,
  "Logística": 14,
  "Educação": 12,
  "Shoppings e Imóveis": 12,
  "Bolsa e Serviços Financeiros": 13
};

const ACOES = [
  // ---------- BRASIL (B3) ----------
  {ticker:"BBAS3", nome:"Banco do Brasil", setor:"Bancos", pais:"BR", moeda:"R$",
   preco:23.50, lpa:5.60, vpa:34.20, dpa:2.30, roe:16.4, margem:23.0, divEbitda:0, liqCorr:1.30,
   cagrRec:9.0, cagrLuc:11.0, crescEst:6.0, payout:41, max52:29.60, min52:18.90, beta:0.95, liqDia:900},

  {ticker:"ITSA4", nome:"Itaúsa", setor:"Bancos", pais:"BR", moeda:"R$",
   preco:10.40, lpa:1.42, vpa:9.80, dpa:0.80, roe:14.5, margem:60.0, divEbitda:0.4, liqCorr:1.10,
   cagrRec:8.0, cagrLuc:12.0, crescEst:7.0, payout:56, max52:11.90, min52:8.60, beta:0.85, liqDia:450},

  {ticker:"BBDC4", nome:"Bradesco PN", setor:"Bancos", pais:"BR", moeda:"R$",
   preco:14.80, lpa:1.85, vpa:17.90, dpa:0.75, roe:10.5, margem:16.0, divEbitda:0, liqCorr:1.20,
   cagrRec:5.0, cagrLuc:2.0, crescEst:9.0, payout:40, max52:17.20, min52:10.90, beta:1.05, liqDia:800},

  {ticker:"SANB11", nome:"Santander Brasil", setor:"Bancos", pais:"BR", moeda:"R$",
   preco:26.90, lpa:3.10, vpa:29.50, dpa:1.10, roe:11.0, margem:15.0, divEbitda:0, liqCorr:1.15,
   cagrRec:6.0, cagrLuc:3.0, crescEst:8.0, payout:35, max52:31.00, min52:21.40, beta:1.00, liqDia:220},

  {ticker:"BBSE3", nome:"BB Seguridade", setor:"Seguros", pais:"BR", moeda:"R$",
   preco:36.20, lpa:3.70, vpa:6.90, dpa:3.10, roe:58.0, margem:52.0, divEbitda:0, liqCorr:1.40,
   cagrRec:12.0, cagrLuc:14.0, crescEst:7.0, payout:84, max52:40.30, min52:30.10, beta:0.70, liqDia:270},

  {ticker:"CXSE3", nome:"Caixa Seguridade", setor:"Seguros", pais:"BR", moeda:"R$",
   preco:15.10, lpa:1.30, vpa:3.40, dpa:1.05, roe:42.0, margem:48.0, divEbitda:0, liqCorr:1.35,
   cagrRec:13.0, cagrLuc:16.0, crescEst:9.0, payout:80, max52:17.20, min52:12.30, beta:0.65, liqDia:110},

  {ticker:"PETR4", nome:"Petrobras PN", setor:"Petróleo e Gás", pais:"BR", moeda:"R$",
   preco:33.40, lpa:6.10, vpa:29.60, dpa:3.60, roe:20.5, margem:16.0, divEbitda:1.0, liqCorr:0.95,
   cagrRec:11.0, cagrLuc:9.0, crescEst:2.0, payout:59, max52:40.20, min52:29.80, beta:1.15, liqDia:2200},

  {ticker:"PRIO3", nome:"PRIO", setor:"Petróleo e Gás", pais:"BR", moeda:"R$",
   preco:38.50, lpa:6.20, vpa:26.40, dpa:0.00, roe:23.0, margem:33.0, divEbitda:0.9, liqCorr:1.90,
   cagrRec:48.0, cagrLuc:52.0, crescEst:18.0, payout:0, max52:49.80, min52:32.10, beta:1.25, liqDia:600},

  {ticker:"VALE3", nome:"Vale", setor:"Mineração e Siderurgia", pais:"BR", moeda:"R$",
   preco:56.00, lpa:8.10, vpa:44.00, dpa:4.20, roe:18.5, margem:19.0, divEbitda:0.8, liqCorr:1.20,
   cagrRec:6.0, cagrLuc:-3.0, crescEst:3.0, payout:52, max52:66.50, min52:50.20, beta:1.10, liqDia:1800},

  {ticker:"GGBR4", nome:"Gerdau PN", setor:"Mineração e Siderurgia", pais:"BR", moeda:"R$",
   preco:17.60, lpa:2.20, vpa:29.80, dpa:0.90, roe:7.5, margem:6.5, divEbitda:0.7, liqCorr:2.40,
   cagrRec:9.0, cagrLuc:4.0, crescEst:6.0, payout:41, max52:21.30, min52:15.10, beta:1.20, liqDia:320},

  {ticker:"CMIG4", nome:"Cemig PN", setor:"Energia Elétrica", pais:"BR", moeda:"R$",
   preco:11.20, lpa:1.75, vpa:11.40, dpa:0.95, roe:15.5, margem:14.0, divEbitda:0.9, liqCorr:1.10,
   cagrRec:10.0, cagrLuc:12.0, crescEst:4.0, payout:54, max52:13.10, min52:9.60, beta:0.80, liqDia:280},

  {ticker:"TAEE11", nome:"Taesa", setor:"Energia Elétrica", pais:"BR", moeda:"R$",
   preco:34.10, lpa:3.00, vpa:16.80, dpa:2.60, roe:17.8, margem:44.0, divEbitda:3.1, liqCorr:0.90,
   cagrRec:7.0, cagrLuc:5.0, crescEst:3.0, payout:87, max52:38.40, min52:30.20, beta:0.55, liqDia:150},

  {ticker:"CPLE6", nome:"Copel PNB", setor:"Energia Elétrica", pais:"BR", moeda:"R$",
   preco:10.90, lpa:1.20, vpa:12.60, dpa:0.55, roe:9.5, margem:16.0, divEbitda:1.6, liqCorr:1.20,
   cagrRec:12.0, cagrLuc:10.0, crescEst:8.0, payout:46, max52:12.40, min52:8.90, beta:0.75, liqDia:200},

  {ticker:"EGIE3", nome:"Engie Brasil", setor:"Energia Elétrica", pais:"BR", moeda:"R$",
   preco:41.30, lpa:3.40, vpa:12.90, dpa:2.10, roe:26.0, margem:22.0, divEbitda:2.8, liqCorr:1.05,
   cagrRec:11.0, cagrLuc:8.0, crescEst:6.0, payout:62, max52:46.20, min52:36.40, beta:0.60, liqDia:180},

  {ticker:"SBSP3", nome:"Sabesp", setor:"Saneamento", pais:"BR", moeda:"R$",
   preco:96.00, lpa:6.40, vpa:56.00, dpa:0.90, roe:11.5, margem:22.0, divEbitda:1.7, liqCorr:1.10,
   cagrRec:10.0, cagrLuc:14.0, crescEst:14.0, payout:14, max52:112.00, min52:78.50, beta:0.85, liqDia:420},

  {ticker:"CSMG3", nome:"Copasa", setor:"Saneamento", pais:"BR", moeda:"R$",
   preco:22.80, lpa:3.30, vpa:26.10, dpa:1.60, roe:12.6, margem:20.0, divEbitda:1.4, liqCorr:1.30,
   cagrRec:9.0, cagrLuc:11.0, crescEst:7.0, payout:48, max52:26.40, min52:18.70, beta:0.70, liqDia:60},

  {ticker:"VIVT3", nome:"Vivo (Telefônica Brasil)", setor:"Telecom", pais:"BR", moeda:"R$",
   preco:26.40, lpa:2.05, vpa:41.00, dpa:1.80, roe:5.0, margem:11.0, divEbitda:0.5, liqCorr:0.95,
   cagrRec:6.0, cagrLuc:9.0, crescEst:8.0, payout:88, max52:30.10, min52:22.30, beta:0.60, liqDia:190},

  {ticker:"WEGE3", nome:"WEG", setor:"Tecnologia", pais:"BR", moeda:"R$",
   preco:38.90, lpa:1.35, vpa:6.20, dpa:0.45, roe:22.0, margem:17.0, divEbitda:-0.2, liqCorr:2.10,
   cagrRec:18.0, cagrLuc:22.0, crescEst:14.0, payout:33, max52:56.00, min52:36.20, beta:0.95, liqDia:700},

  {ticker:"TOTS3", nome:"Totvs", setor:"Tecnologia", pais:"BR", moeda:"R$",
   preco:35.60, lpa:1.10, vpa:6.80, dpa:0.35, roe:16.5, margem:13.0, divEbitda:0.6, liqCorr:1.60,
   cagrRec:17.0, cagrLuc:19.0, crescEst:15.0, payout:32, max52:43.00, min52:28.90, beta:1.00, liqDia:230},

  {ticker:"RENT3", nome:"Localiza", setor:"Logística", pais:"BR", moeda:"R$",
   preco:32.40, lpa:2.30, vpa:26.50, dpa:0.55, roe:8.7, margem:7.5, divEbitda:3.3, liqCorr:1.40,
   cagrRec:24.0, cagrLuc:6.0, crescEst:12.0, payout:24, max52:48.60, min52:27.80, beta:1.30, liqDia:520},

  {ticker:"RAIL3", nome:"Rumo", setor:"Logística", pais:"BR", moeda:"R$",
   preco:17.20, lpa:1.05, vpa:12.30, dpa:0.30, roe:8.5, margem:11.0, divEbitda:1.8, liqCorr:1.50,
   cagrRec:14.0, cagrLuc:20.0, crescEst:12.0, payout:29, max52:22.40, min52:15.30, beta:1.10, liqDia:280},

  {ticker:"LREN3", nome:"Lojas Renner", setor:"Varejo", pais:"BR", moeda:"R$",
   preco:14.90, lpa:1.20, vpa:11.60, dpa:0.50, roe:10.3, margem:8.0, divEbitda:0.3, liqCorr:1.80,
   cagrRec:8.0, cagrLuc:1.0, crescEst:11.0, payout:42, max52:19.80, min52:11.60, beta:1.25, liqDia:310},

  {ticker:"ASAI3", nome:"Assaí", setor:"Varejo", pais:"BR", moeda:"R$",
   preco:8.60, lpa:0.70, vpa:6.10, dpa:0.15, roe:11.5, margem:1.4, divEbitda:2.9, liqCorr:0.85,
   cagrRec:19.0, cagrLuc:5.0, crescEst:13.0, payout:21, max52:12.30, min52:6.40, beta:1.35, liqDia:260},

  {ticker:"ABEV3", nome:"Ambev", setor:"Consumo", pais:"BR", moeda:"R$",
   preco:12.10, lpa:0.98, vpa:6.40, dpa:0.72, roe:15.3, margem:16.0, divEbitda:-0.6, liqCorr:1.10,
   cagrRec:12.0, cagrLuc:10.0, crescEst:5.0, payout:73, max52:14.20, min52:10.80, beta:0.70, liqDia:600},

  {ticker:"JBSS3", nome:"JBS", setor:"Agro e Alimentos", pais:"BR", moeda:"R$",
   preco:38.20, lpa:5.40, vpa:24.30, dpa:1.60, roe:22.0, margem:3.4, divEbitda:2.1, liqCorr:1.70,
   cagrRec:14.0, cagrLuc:12.0, crescEst:7.0, payout:30, max52:45.60, min52:26.10, beta:1.05, liqDia:380},

  {ticker:"SLCE3", nome:"SLC Agrícola", setor:"Agro e Alimentos", pais:"BR", moeda:"R$",
   preco:17.30, lpa:2.10, vpa:16.90, dpa:0.80, roe:12.4, margem:11.0, divEbitda:2.2, liqCorr:1.60,
   cagrRec:16.0, cagrLuc:9.0, crescEst:8.0, payout:38, max52:21.40, min52:14.60, beta:0.95, liqDia:70},

  {ticker:"KLBN11", nome:"Klabin", setor:"Papel e Celulose", pais:"BR", moeda:"R$",
   preco:19.40, lpa:1.60, vpa:11.20, dpa:1.05, roe:14.3, margem:12.0, divEbitda:3.4, liqCorr:1.90,
   cagrRec:13.0, cagrLuc:7.0, crescEst:8.0, payout:66, max52:23.20, min52:17.10, beta:0.80, liqDia:190},

  {ticker:"SUZB3", nome:"Suzano", setor:"Papel e Celulose", pais:"BR", moeda:"R$",
   preco:52.10, lpa:6.80, vpa:32.40, dpa:1.20, roe:21.0, margem:18.0, divEbitda:3.2, liqCorr:2.10,
   cagrRec:15.0, cagrLuc:11.0, crescEst:9.0, payout:18, max52:62.30, min52:47.20, beta:1.00, liqDia:460},

  {ticker:"CYRE3", nome:"Cyrela", setor:"Construção", pais:"BR", moeda:"R$",
   preco:21.60, lpa:3.40, vpa:20.80, dpa:1.20, roe:16.3, margem:18.0, divEbitda:0.6, liqCorr:2.60,
   cagrRec:15.0, cagrLuc:17.0, crescEst:8.0, payout:35, max52:27.10, min52:17.90, beta:1.15, liqDia:170},

  {ticker:"DIRR3", nome:"Direcional", setor:"Construção", pais:"BR", moeda:"R$",
   preco:28.40, lpa:3.90, vpa:15.60, dpa:2.00, roe:25.0, margem:14.0, divEbitda:0.9, liqCorr:2.30,
   cagrRec:26.0, cagrLuc:31.0, crescEst:14.0, payout:51, max52:34.20, min52:21.80, beta:1.05, liqDia:90},

  {ticker:"B3SA3", nome:"B3", setor:"Bolsa e Serviços Financeiros", pais:"BR", moeda:"R$",
   preco:11.60, lpa:1.05, vpa:5.90, dpa:0.62, roe:17.8, margem:38.0, divEbitda:1.3, liqCorr:1.30,
   cagrRec:9.0, cagrLuc:4.0, crescEst:8.0, payout:59, max52:14.30, min52:9.10, beta:1.05, liqDia:480},

  {ticker:"MULT3", nome:"Multiplan", setor:"Shoppings e Imóveis", pais:"BR", moeda:"R$",
   preco:22.70, lpa:2.60, vpa:20.90, dpa:1.00, roe:12.4, margem:38.0, divEbitda:1.6, liqCorr:1.20,
   cagrRec:12.0, cagrLuc:15.0, crescEst:8.0, payout:38, max52:27.60, min52:19.80, beta:0.85, liqDia:130},

  {ticker:"HAPV3", nome:"Hapvida", setor:"Saúde", pais:"BR", moeda:"R$",
   preco:2.60, lpa:0.14, vpa:4.90, dpa:0.00, roe:2.9, margem:3.0, divEbitda:2.5, liqCorr:1.05,
   cagrRec:31.0, cagrLuc:-8.0, crescEst:16.0, payout:0, max52:4.30, min52:1.90, beta:1.45, liqDia:290},

  {ticker:"FLRY3", nome:"Fleury", setor:"Saúde", pais:"BR", moeda:"R$",
   preco:13.40, lpa:1.35, vpa:11.80, dpa:0.60, roe:11.4, margem:6.5, divEbitda:2.0, liqCorr:1.10,
   cagrRec:15.0, cagrLuc:8.0, crescEst:9.0, payout:44, max52:17.20, min52:11.90, beta:0.85, liqDia:80},

  {ticker:"YDUQ3", nome:"YDUQS", setor:"Educação", pais:"BR", moeda:"R$",
   preco:14.10, lpa:2.20, vpa:19.40, dpa:0.55, roe:11.3, margem:7.0, divEbitda:2.4, liqCorr:1.20,
   cagrRec:7.0, cagrLuc:5.0, crescEst:10.0, payout:25, max52:18.60, min52:10.20, beta:1.30, liqDia:110},

  // ---------- EUA (referência internacional) ----------
  {ticker:"GOOGL", nome:"Alphabet", setor:"Tecnologia", pais:"US", moeda:"US$",
   preco:190.00, lpa:8.60, vpa:26.50, dpa:0.80, roe:31.0, margem:28.0, divEbitda:-1.2, liqCorr:1.90,
   cagrRec:17.0, cagrLuc:22.0, crescEst:14.0, payout:9, max52:210.00, min52:140.00, beta:1.05, liqDia:12000},

  {ticker:"PFE", nome:"Pfizer", setor:"Saúde", pais:"US", moeda:"US$",
   preco:25.50, lpa:1.90, vpa:15.60, dpa:1.70, roe:11.0, margem:17.0, divEbitda:2.6, liqCorr:1.20,
   cagrRec:2.0, cagrLuc:-10.0, crescEst:5.0, payout:89, max52:31.50, min52:23.80, beta:0.65, liqDia:1400},

  {ticker:"CVX", nome:"Chevron", setor:"Petróleo e Gás", pais:"US", moeda:"US$",
   preco:152.00, lpa:9.80, vpa:83.00, dpa:6.50, roe:11.5, margem:8.5, divEbitda:0.6, liqCorr:1.10,
   cagrRec:9.0, cagrLuc:6.0, crescEst:4.0, payout:66, max52:168.00, min52:132.00, beta:0.95, liqDia:1600},

  {ticker:"KO", nome:"Coca-Cola", setor:"Consumo", pais:"US", moeda:"US$",
   preco:63.00, lpa:2.60, vpa:6.90, dpa:1.95, roe:38.0, margem:23.0, divEbitda:2.3, liqCorr:1.10,
   cagrRec:7.0, cagrLuc:8.0, crescEst:6.0, payout:75, max52:73.50, min52:58.00, beta:0.55, liqDia:1100},

  {ticker:"BABA", nome:"Alibaba", setor:"Tecnologia", pais:"US", moeda:"US$",
   preco:88.00, lpa:6.40, vpa:52.00, dpa:1.00, roe:12.0, margem:9.0, divEbitda:-0.8, liqCorr:1.70,
   cagrRec:9.0, cagrLuc:-4.0, crescEst:10.0, payout:16, max52:118.00, min52:71.00, beta:1.30, liqDia:2100},

  {ticker:"INTC", nome:"Intel", setor:"Tecnologia", pais:"US", moeda:"US$",
   preco:22.00, lpa:0.35, vpa:24.60, dpa:0.00, roe:1.4, margem:2.0, divEbitda:2.8, liqCorr:1.30,
   cagrRec:-6.0, cagrLuc:-32.0, crescEst:7.0, payout:0, max52:37.20, min52:18.90, beta:1.25, liqDia:2400},

  {ticker:"F", nome:"Ford", setor:"Consumo", pais:"US", moeda:"US$",
   preco:10.40, lpa:1.35, vpa:11.30, dpa:0.60, roe:12.0, margem:3.0, divEbitda:3.6, liqCorr:1.20,
   cagrRec:8.0, cagrLuc:6.0, crescEst:3.0, payout:44, max52:14.20, min52:9.10, beta:1.40, liqDia:900},

  {ticker:"VZ", nome:"Verizon", setor:"Telecom", pais:"US", moeda:"US$",
   preco:41.00, lpa:4.20, vpa:23.50, dpa:2.70, roe:18.0, margem:12.0, divEbitda:2.9, liqCorr:0.65,
   cagrRec:1.0, cagrLuc:2.0, crescEst:3.0, payout:64, max52:47.00, min52:37.50, beta:0.45, liqDia:1000}
];

if (typeof module !== "undefined") module.exports = { ACOES, PL_JUSTO_SETOR, DATA_REF };
