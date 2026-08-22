/* ============================================================
   MOTOR DE ANÁLISE — cálculo de indicadores, preço justo e score
   ------------------------------------------------------------
   Objetivo do app: encontrar ações que estão BARATAS (preço abaixo
   do valor estimado) e que ao mesmo tempo têm MOTOR DE CRESCIMENTO
   (receita/lucro subindo) e QUALIDADE (não quebram no caminho).
   ============================================================ */

const PREMISSAS_PADRAO = {
  taxaDesconto: 13,      // % a.a. usada no fluxo de caixa descontado (custo de capital)
  crescPerpetuo: 4,      // % a.a. após o 5º ano
  yieldDesejado: 6,      // % — método Bazin (preço-teto por dividendo)
  margemSeguranca: 25,   // % de desconto exigido para "comprar"
  perfil: "moderado"     // conservador | moderado | agressivo
};

const PESOS_PERFIL = {
  conservador: { valor: 0.30, cresc: 0.15, qualidade: 0.30, risco: 0.25 },
  moderado:    { valor: 0.35, cresc: 0.25, qualidade: 0.25, risco: 0.15 },
  agressivo:   { valor: 0.30, cresc: 0.40, qualidade: 0.20, risco: 0.10 }
};

/* --------- utilidades --------- */
const nb = (v, c = 1) => (v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: c, maximumFractionDigits: c }));
const num = (v) => (typeof v === "number" && isFinite(v) ? v : null);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// nota 0-100: quanto MAIOR o valor, melhor
const notaCresc = (v, ruim, otimo) => (v == null ? 50 : clamp(((v - ruim) / (otimo - ruim)) * 100, 0, 100));
// nota 0-100: quanto MENOR o valor, melhor
const notaDecr = (v, otimo, ruim) => (v == null ? 50 : clamp(((ruim - v) / (ruim - otimo)) * 100, 0, 100));

/* --------- indicadores derivados --------- */
function indicadores(a) {
  const pl   = a.lpa > 0 ? a.preco / a.lpa : null;         // preço / lucro
  const pvp  = a.vpa > 0 ? a.preco / a.vpa : null;         // preço / valor patrimonial
  const dy   = a.preco > 0 ? (a.dpa / a.preco) * 100 : 0;  // dividend yield %
  const ey   = a.preco > 0 ? (a.lpa / a.preco) * 100 : 0;  // earnings yield %
  const plVpa = pl != null && pvp != null ? pl * pvp : null; // "número de Graham" relativo
  const distMax = a.max52 > 0 ? (a.preco / a.max52 - 1) * 100 : null; // % abaixo da máxima
  const distMin = a.min52 > 0 ? (a.preco / a.min52 - 1) * 100 : null; // % acima da mínima
  const peg = pl != null && a.crescEst > 0 ? pl / a.crescEst : null;   // P/L sobre crescimento
  return { pl, pvp, dy, ey, plVpa, distMax, distMin, peg };
}

/* --------- 4 métodos de preço justo --------- */
function precoJusto(a, p = PREMISSAS_PADRAO) {
  const metodos = {};

  // 1) Graham: raiz(22,5 x LPA x VPA) — clássico valor + patrimônio
  if (a.lpa > 0 && a.vpa > 0) metodos.graham = Math.sqrt(22.5 * a.lpa * a.vpa);

  // 2) Bazin: dividendo dividido pelo yield desejado — foco em renda
  if (a.dpa > 0) metodos.bazin = a.dpa / (p.yieldDesejado / 100);

  // 3) Múltiplo justo do setor: LPA x P/L típico do setor
  const plSetor = PL_JUSTO_SETOR[a.setor];
  if (a.lpa > 0 && plSetor) metodos.multiplo = a.lpa * plSetor;

  // 4) DCF simplificado: LPA como proxy de caixa por ação,
  //    5 anos de crescimento estimado + perpetuidade
  if (a.lpa > 0) {
    const k = p.taxaDesconto / 100;
    const g = Math.min(a.crescEst, p.taxaDesconto - 2) / 100; // trava g < k
    const gp = Math.min(p.crescPerpetuo, p.taxaDesconto - 3) / 100;
    // usa 85% do LPA como proxy de caixa livre (parte do lucro é contábil)
    let vp = 0, fluxo = a.lpa * 0.85;
    for (let ano = 1; ano <= 5; ano++) {
      fluxo *= 1 + g;
      vp += fluxo / Math.pow(1 + k, ano);
    }
    const terminal = (fluxo * (1 + gp)) / (k - gp);
    vp += terminal / Math.pow(1 + k, 5);
    metodos.dcf = vp;
  }

  const valores = Object.values(metodos).filter((v) => isFinite(v) && v > 0);
  if (!valores.length) return { metodos, justo: null, upside: null, margem: null };

  // média aparada: descarta o extremo mais distante quando há 4 métodos
  let usados = valores.slice().sort((x, y) => x - y);
  if (usados.length >= 4) usados = usados.slice(1, -1);
  const justo = usados.reduce((s, v) => s + v, 0) / usados.length;

  return {
    metodos,
    justo,
    upside: (justo / a.preco - 1) * 100,        // quanto pode subir até o valor justo
    margem: (1 - a.preco / justo) * 100         // margem de segurança atual
  };
}

/* --------- notas por dimensão (0-100) --------- */
function notas(a, ind, val) {
  // BARATO: earnings yield, P/VP, dividend yield, desconto vs preço justo
  const nValor = media([
    [notaCresc(ind.ey, 4, 20), 0.35],
    [ind.pvp == null ? 50 : notaDecr(ind.pvp, 0.6, 4.0), 0.25],
    [notaCresc(ind.dy, 0, 9), 0.15],
    [val.upside == null ? 50 : notaCresc(val.upside, -20, 80), 0.25]
  ]);

  // CRESCIMENTO: histórico de receita e lucro + expectativa + PEG
  const nCresc = media([
    [notaCresc(a.cagrRec, 0, 25), 0.30],
    [notaCresc(a.cagrLuc, -5, 25), 0.30],
    [notaCresc(a.crescEst, 0, 18), 0.30],
    [ind.peg == null ? 50 : notaDecr(ind.peg, 0.5, 3.0), 0.10]
  ]);

  // QUALIDADE: rentabilidade e eficiência
  const nQual = media([
    [notaCresc(a.roe, 5, 30), 0.45],
    [notaCresc(a.margem, 2, 30), 0.30],
    [notaDecr(a.payout, 30, 100), 0.25]  // payout muito alto = pouco reinvestimento
  ]);

  // RISCO (nota alta = risco baixo): alavancagem, liquidez, beta, tamanho de giro
  const nRisco = media([
    [notaDecr(a.divEbitda, 0, 4), 0.40],
    [notaCresc(a.liqCorr, 0.7, 2.5), 0.20],
    [notaDecr(a.beta, 0.5, 1.6), 0.20],
    [notaCresc(Math.log10(Math.max(a.liqDia, 1)), 1, 3), 0.20]
  ]);

  return { valor: nValor, cresc: nCresc, qualidade: nQual, risco: nRisco };
}

/* --------- alertas e pontos fortes --------- */
function media(pares) {
  const total = pares.reduce((s, [, w]) => s + w, 0);
  return pares.reduce((s, [v, w]) => s + v * w, 0) / total;
}

/* --------- alertas e pontos fortes --------- */
function diagnostico(a, ind, val, n) {
  const fortes = [], fracos = [];

  if (ind.pl != null && ind.pl < 8) fortes.push(`P/L de ${nb(ind.pl, 1)}x — o mercado paga pouco por cada real de lucro`);
  if (ind.pvp != null && ind.pvp < 1) fortes.push(`Negocia a ${nb(ind.pvp, 2)}x o patrimônio — abaixo do valor contábil`);
  if (a.roe >= 18) fortes.push(`ROE de ${nb(a.roe, 1)}% — capital dos sócios bem remunerado`);
  if (a.cagrLuc >= 12) fortes.push(`Lucro cresce ${nb(a.cagrLuc, 0)}% ao ano nos últimos 5 anos`);
  if (a.crescEst >= 12) fortes.push(`Crescimento estimado de ${nb(a.crescEst, 0)}% ao ano à frente`);
  if (ind.dy >= 6) fortes.push(`Dividend yield de ${nb(ind.dy, 1)}% — paga bem enquanto você espera`);
  if (a.divEbitda <= 0.5) fortes.push("Praticamente sem dívida líquida");
  if (ind.distMax != null && ind.distMax <= -25) fortes.push(`${nb(Math.abs(ind.distMax), 0)}% abaixo da máxima de 52 semanas`);
  if (ind.peg != null && ind.peg < 1) fortes.push(`PEG de ${nb(ind.peg, 2)} — cresce mais rápido do que custa`);

  if (a.divEbitda >= 3) fracos.push(`Dívida líquida/EBITDA de ${nb(a.divEbitda, 1)}x — alavancagem alta`);
  if (a.liqCorr < 1) fracos.push(`Liquidez corrente de ${nb(a.liqCorr, 2)}x — caixa curto para o passivo de curto prazo`);
  if (a.payout > 85) fracos.push(`Payout de ${a.payout}% — sobra pouco para reinvestir`);
  if (a.cagrLuc < 0) fracos.push(`Lucro caindo ${nb(Math.abs(a.cagrLuc), 0)}% ao ano nos últimos 5 anos`);
  if (a.roe < 8) fracos.push(`ROE de ${nb(a.roe, 1)}% — rentabilidade fraca`);
  if (a.margem < 5) fracos.push(`Margem líquida de ${nb(a.margem, 1)}% — pouca gordura para absorver crise`);
  if (a.beta > 1.25) fracos.push(`Beta de ${nb(a.beta, 2)} — oscila mais que o índice`);
  if (a.liqDia < 60) fracos.push("Liquidez diária baixa — difícil entrar e sair de posições grandes");
  if (ind.pl != null && ind.pl > 25) fracos.push(`P/L de ${nb(ind.pl, 1)}x — já embute muito otimismo no preço`);
  if (ind.pl == null) fracos.push("Sem lucro nos últimos 12 meses — múltiplos de lucro não se aplicam");
  if (val.upside != null && val.upside > 100)
    fracos.push(`Upside teórico de ${nb(val.upside, 0)}% — desconfie: preço tão descolado costuma esconder risco que o modelo não vê (governança, ciclo no pico, risco regulatório)`);

  return { fortes, fracos };
}

/* --------- classificação final --------- */
function classificar(score, upside, margemExigida) {
  if (upside == null) return { rotulo: "Sem dados", classe: "neutro" };
  if (score >= 70 && upside >= margemExigida) return { rotulo: "Barata e crescendo", classe: "otimo" };
  if (score >= 60 && upside >= margemExigida * 0.6) return { rotulo: "Oportunidade", classe: "bom" };
  if (score >= 50 && upside >= 0) return { rotulo: "Observar", classe: "neutro" };
  if (upside < 0 && score >= 60) return { rotulo: "Boa empresa, preço caro", classe: "caro" };
  return { rotulo: "Evitar por ora", classe: "ruim" };
}

/* --------- análise completa de um ativo --------- */
function analisar(a, premissas = PREMISSAS_PADRAO) {
  const p = { ...PREMISSAS_PADRAO, ...premissas };
  const ind = indicadores(a);
  const val = precoJusto(a, p);
  const n = notas(a, ind, val);
  const pesos = PESOS_PERFIL[p.perfil] || PESOS_PERFIL.moderado;

  const score =
    n.valor * pesos.valor +
    n.cresc * pesos.cresc +
    n.qualidade * pesos.qualidade +
    n.risco * pesos.risco;

  const diag = diagnostico(a, ind, val, n);
  const classe = classificar(score, val.upside, p.margemSeguranca);

  // preço de compra sugerido = preço justo com a margem de segurança exigida
  const precoCompra = val.justo != null ? val.justo * (1 - p.margemSeguranca / 100) : null;
  // stop sugerido: mínimo entre -15% e a mínima de 52 semanas
  const stop = Math.min(a.preco * 0.85, a.min52 || a.preco * 0.85);

  return { ...a, ind, val, notas: n, score, classe, diag, precoCompra, stop };
}

function analisarTodos(lista, premissas) {
  return lista.map((a) => analisar(a, premissas)).sort((x, y) => y.score - x.score);
}

if (typeof module !== "undefined")
  module.exports = { analisar, analisarTodos, indicadores, precoJusto, PREMISSAS_PADRAO, PESOS_PERFIL };
