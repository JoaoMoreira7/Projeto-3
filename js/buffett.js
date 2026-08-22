/* ============================================================
   CRIVO BUFFETT–MUNGER
   ------------------------------------------------------------
   Traduz em número o sistema que Warren Buffett e Charlie Munger
   descrevem em cartas e entrevistas:

   · Os quatro filtros de Munger — negócio que entendemos, vantagem
     competitiva duradoura, gente decente no comando, preço sensato.
   · Lucro do proprietário (carta de 1986): lucro contábil mais itens
     não-caixa, menos o capex necessário para manter a posição
     competitiva. É esse número, não o lucro do balanço, que deve ser
     descontado.
   · Teste do dólar (carta de 1983): cada R$ 1 retido pela empresa
     precisa virar pelo menos R$ 1 de valor de mercado para o sócio.
   · Desconto pelo juro do título longo do governo mais um prêmio, em
     vez de CAPM/WACC acadêmico.
   · Margem de segurança de Graham: nunca pagar o valor cheio.
   · Círculo de competência e inversão de Munger: só o que se entende,
     e sempre perguntando o que faria a tese morrer.

   Os 12 tenets abaixo seguem o agrupamento de Robert Hagstrom
   (negócio, gestão, financeiro e valor) em "The Warren Buffett Way".
   ============================================================ */

const PREMISSAS_BUFFETT = {
  premioRisco: 3.5,      // pontos acima do juro longo do governo local
  taxaMinima: 9,         // piso da taxa de desconto (%) — ver nota abaixo
  margemBuffett: 30,     // % de desconto exigido sobre o valor intrínseco
  crescLimite: 15,       // teto de crescimento projetado (% a.a.)
  crescPerpetuo: 2.5     // crescimento na perpetuidade (% a.a.)
};

/* Prêmio de risco-país somado ao juro local. Buffett aplicava o método a
   empresas americanas, onde o título do governo já é a referência mais
   segura do mundo. Aplicar a mesma conta a um mercado emergente com juro
   nominal baixo (China, por exemplo) inflaria o valor intrínseco — daí o
   prêmio adicional e o piso de taxaMinima, que impede que juro baixo
   transforme qualquer empresa em barganha. */
const PREMIO_PAIS = {
  "Brasil": 0, "EUA": 0, "Europa": 0.5, "Reino Unido": 0.5, "Suíça": 0.5,
  "Japão": 1.5, "Coreia do Sul": 1.5, "China": 3.5, "Índia": 2.0,
  "Canadá": 0, "América Latina": 3.0, "Oceania": 0.5
};

const QUALIDADE_PADRAO = {
  moat: [], moatForca: 1, anosLucro10: 7, anosCresc10: 5, complexidade: 2,
  governanca: 3, diluicao: 0, oeFator: 0.75, roic: 10, anosDivida: 2, preco5a: null
};

const MOAT_NOME = {
  marca: "marca e intangíveis", custo: "vantagem de custo", rede: "efeito de rede",
  switching: "custo de troca", escala: "escala eficiente", licenca: "licença e regulação"
};

const MOAT_ROTULO = ["sem fosso", "fosso estreito", "fosso sólido", "fosso largo"];

const SETOR_CICLICO = ["Petróleo e Gás", "Mineração e Siderurgia", "Papel e Celulose",
                       "Agro e Alimentos", "Construção"];

function qualidadeDe(a) {
  const q = (typeof QUALIDADE !== "undefined" && QUALIDADE[a.ticker]) || {};
  return { ...QUALIDADE_PADRAO, ...q };
}

function regiaoDe(a) {
  return a.regiao || (typeof REGIAO_POR_PAIS !== "undefined" ? REGIAO_POR_PAIS[a.pais] : null) || "EUA";
}

/* Buffett desconta pelo juro do título longo do governo do país da empresa,
   mais um prêmio. Uma ação brasileira compete com 12% de juro sem risco;
   uma japonesa, com 1,7%. É o que torna a comparação global honesta. */
function custoDeCapital(a, p) {
  const livre = juroLongo(a);
  const pais = PREMIO_PAIS[regiaoDe(a)] ?? 1;
  return Math.max(livre + p.premioRisco + pais, p.taxaMinima);
}

function juroLongo(a) {
  return (typeof TAXA_LIVRE_RISCO !== "undefined" ? TAXA_LIVRE_RISCO[regiaoDe(a)] : null) ?? 5;
}

/* Lucro do proprietário por ação: quanto do lucro contábil realmente
   sobra em caixa depois do capex de manutenção. */
function lucroProprietario(a, q) {
  return a.lpa * q.oeFator;
}

function valorIntrinseco(a, q, p) {
  const oe = lucroProprietario(a, q);
  if (!(oe > 0)) return { valor: null, oe, k: custoDeCapital(a, p) };
  const k = custoDeCapital(a, p) / 100;
  const g = Math.min(a.crescEst, p.crescLimite) / 100;
  const gp = Math.min(p.crescPerpetuo, custoDeCapital(a, p) - 2) / 100;

  let fluxo = oe, vp = 0;
  for (let ano = 1; ano <= 10; ano++) {
    fluxo *= 1 + g;
    vp += fluxo / Math.pow(1 + k, ano);
  }
  vp += ((fluxo * (1 + gp)) / (k - gp)) / Math.pow(1 + k, 10);
  return { valor: vp, oe, k: k * 100 };
}

/* Teste do dólar: comparar o lucro retido nos últimos 5 anos com o valor
   de mercado criado no mesmo período. */
function testeDoDolar(a, q) {
  if (!q.preco5a || q.preco5a <= 0 || !(a.lpa > 0)) return null;
  const retidoAno = a.lpa * (1 - a.payout / 100);
  const retidos = retidoAno * 5;
  const criado = a.preco - q.preco5a;
  if (retidos <= 0) return { retidos, criado, razao: null, passou: null };
  return { retidos, criado, razao: criado / retidos, passou: criado / retidos >= 1 };
}

/* mediana de margem e ROIC por setor, para julgar "margem alta" de forma
   relativa em vez de usar um número fixo para banco e supermercado */
function contextoSetorial(lista) {
  const porSetor = {};
  lista.forEach((a) => {
    const q = qualidadeDe(a);
    (porSetor[a.setor] = porSetor[a.setor] || { margens: [], roics: [] });
    porSetor[a.setor].margens.push(a.margem);
    porSetor[a.setor].roics.push(q.roic);
  });
  const mediana = (arr) => {
    const s = arr.slice().sort((x, y) => x - y);
    return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  };
  const ctx = {};
  Object.entries(porSetor).forEach(([setor, v]) => {
    ctx[setor] = { margem: mediana(v.margens), roic: mediana(v.roics) };
  });
  return ctx;
}

const nota = (ok, parcial) => (ok ? 100 : parcial ? 60 : 20);

function avaliarTenets(a, q, val, dolar, ctx, p) {
  const k = custoDeCapital(a, p);
  const margemSetor = (ctx[a.setor] || {}).margem ?? 10;
  const margemSeg = val.valor ? (1 - a.preco / val.valor) * 100 : null;
  const oeYield = val.oe > 0 ? (val.oe / a.preco) * 100 : 0;
  const livre = juroLongo(a);

  const t = [];
  const add = (grupo, nome, ok, parcial, detalhe) =>
    t.push({ grupo, nome, ok, nota: nota(ok, parcial), detalhe });

  // ---- NEGÓCIO ----
  add("Negócio", "Simples e compreensível",
    q.complexidade <= 2, q.complexidade === 3 && q.moatForca >= 2,
    q.complexidade === 1 ? "Negócio direto: dá para explicar em uma frase."
      : q.complexidade === 2 ? "Exige estudo, mas é possível acompanhar."
      : "Caixa-preta: difícil saber quando a deterioração começou.");

  add("Negócio", "Histórico operacional consistente",
    q.anosLucro10 >= 9 && q.anosCresc10 >= 6, q.anosLucro10 >= 8,
    `Lucro em ${q.anosLucro10} dos últimos 10 anos, crescendo em ${q.anosCresc10} deles.`);

  add("Negócio", "Perspectiva favorável de longo prazo",
    q.moatForca >= 2, q.moatForca === 1,
    q.moat.length
      ? `${MOAT_ROTULO[q.moatForca]}: ${q.moat.map((m) => MOAT_NOME[m] || m).join(", ")}.`
      : "Nenhuma vantagem competitiva identificada.");

  // ---- GESTÃO ----
  add("Gestão", "Alocação racional de capital",
    q.roic >= k + 3, q.roic >= k,
    `ROIC de ${q.roic}% contra custo de capital de ${k.toFixed(1)}% (juro longo local ${livre.toFixed(1)}% + prêmio de risco, com piso de ${p.taxaMinima}%).`);

  add("Gestão", "Teste do dólar de Buffett",
    dolar ? dolar.passou === true : false, dolar ? dolar.razao != null && dolar.razao >= 0.6 : false,
    dolar
      ? (dolar.razao == null
          ? "Distribui quase todo o lucro: quase nada retido para testar."
          : `Cada 1 retido nos últimos 5 anos virou ${dolar.razao.toFixed(2)} de valor de mercado.`)
      : "Sem preço de 5 anos atrás na base para calcular.");

  add("Gestão", "Não dilui o sócio",
    q.diluicao <= 0.5, q.diluicao <= 1.5,
    q.diluicao < 0
      ? `Recompra cerca de ${Math.abs(q.diluicao)}% das ações por ano — sua fatia cresce sozinha.`
      : q.diluicao === 0 ? "Número de ações estável."
      : `Emite cerca de ${q.diluicao}% de novas ações por ano — sua fatia encolhe.`);

  // ---- FINANCEIRO ----
  add("Financeiro", "ROE consistentemente alto",
    a.roe >= 15, a.roe >= 12,
    `ROE de ${a.roe}%. Buffett procura acima de 15% ao ano, de forma consistente.`);

  add("Financeiro", "Lucro do proprietário robusto",
    q.oeFator >= 0.7 && val.oe > 0, q.oeFator >= 0.5 && val.oe > 0,
    `${(q.oeFator * 100).toFixed(0)}% do lucro contábil sobra em caixa depois do capex de manutenção.`);

  add("Financeiro", "Margem acima da mediana do setor",
    a.margem >= margemSetor, a.margem >= margemSetor * 0.8,
    `Margem líquida de ${a.margem}% contra ${margemSetor.toFixed(1)}% da mediana do setor.`);

  add("Financeiro", "Dívida quitável em menos de 5 anos",
    q.anosDivida <= 5 && a.divEbitda <= 3, q.anosDivida <= 7,
    q.anosDivida === 0 ? "Sem dívida de longo prazo relevante."
      : `${q.anosDivida} anos de lucro atual para quitar a dívida de longo prazo (dívida/EBITDA de ${a.divEbitda}x).`);

  // ---- VALOR ----
  add("Valor", "Rende mais que o título do governo",
    oeYield >= livre, oeYield >= livre * 0.8,
    `Lucro do proprietário rende ${oeYield.toFixed(1)}% sobre o preço, contra ${livre.toFixed(1)}% do título longo local sem risco.`);

  add("Valor", "Margem de segurança suficiente",
    margemSeg != null && margemSeg >= p.margemBuffett,
    margemSeg != null && margemSeg > 0,
    margemSeg == null ? "Sem lucro do proprietário positivo: não dá para estimar valor intrínseco."
      : `Preço ${margemSeg >= 0 ? `${margemSeg.toFixed(0)}% abaixo` : `${Math.abs(margemSeg).toFixed(0)}% acima`} do valor intrínseco. Exigido: ${p.margemBuffett}%.`);

  return t;
}

/* Inversão de Munger: em vez de listar por que dá certo, listar o que
   faria a tese morrer. */
function inverter(a, q, val, p) {
  const r = [];
  if (q.moatForca <= 1) r.push("Sem fosso identificado: um concorrente com capital pode copiar o negócio e derrubar a margem.");
  if (q.complexidade === 3) r.push("Negócio difícil de entender — você provavelmente perceberia a deterioração tarde demais.");
  if (q.governanca <= 2) r.push("Governança fraca: histórico de decisões que atendem ao controlador antes do minoritário.");
  if (q.anosDivida > 5) r.push(`Dívida exigiria ${q.anosDivida} anos de lucro atual para ser quitada — juro alto por muito tempo aperta.`);
  if (q.diluicao > 1) r.push(`Emissão de ${q.diluicao}% de ações ao ano dilui sua participação mesmo se a empresa crescer.`);
  if (q.oeFator < 0.5) r.push("O lucro contábil não vira caixa: o capex consome mais da metade antes de chegar ao sócio.");
  if (SETOR_CICLICO.includes(a.setor)) r.push("Setor cíclico: o lucro de hoje pode ser o pico do ciclo, e múltiplo baixo no pico é armadilha clássica.");
  if (a.crescEst >= p.crescLimite) r.push(`O preço embute crescimento de ${a.crescEst}% ao ano — qualquer trimestre fraco derruba a ação.`);
  if (q.anosCresc10 <= 4) r.push("Lucro irregular na década: projetar crescimento aqui é chute, não análise.");
  if (a.beta > 1.3) r.push("Ação volátil: exige posição menor para o mesmo risco em reais.");
  if (val.valor && a.preco > val.valor) r.push("Você estaria pagando acima do valor intrínseco estimado — sem colchão para erro de premissa.");
  return r;
}

function selar(aprovados, margemSeg, p) {
  if (margemSeg == null) return { rotulo: "Sem valuation possível", classe: "neutro" };
  if (aprovados >= 10 && margemSeg >= p.margemBuffett) return { rotulo: "Qualidade Buffett", classe: "otimo" };
  if (aprovados >= 10 && margemSeg >= 0) return { rotulo: "Ótimo negócio, preço justo", classe: "bom" };
  if (aprovados >= 10) return { rotulo: "Ótimo negócio, caro demais", classe: "caro" };
  if (aprovados >= 7 && margemSeg >= 40) return { rotulo: "Barganha estilo Graham", classe: "bom" };
  if (aprovados >= 7) return { rotulo: "Em observação", classe: "neutro" };
  return { rotulo: "Reprovada no crivo", classe: "ruim" };
}

function analisarBuffett(a, ctx, premissas = {}, circulo = []) {
  const p = { ...PREMISSAS_BUFFETT, ...premissas };
  const q = qualidadeDe(a);
  const val = valorIntrinseco(a, q, p);
  const dolar = testeDoDolar(a, q);
  const tenets = avaliarTenets(a, q, val, dolar, ctx, p);

  const aprovados = tenets.filter((t) => t.ok).length;
  const score = tenets.reduce((s, t) => s + t.nota, 0) / tenets.length;
  const margemSeg = val.valor ? (1 - a.preco / val.valor) * 100 : null;
  const precoBuffett = val.valor ? val.valor * (1 - p.margemBuffett / 100) : null;

  return {
    q, tenets, aprovados, score,
    oe: val.oe,
    oeYield: val.oe > 0 ? (val.oe / a.preco) * 100 : 0,
    custoCapital: val.k,
    juroLongo: juroLongo(a),
    intrinseco: val.valor,
    margemSeg,
    precoBuffett,
    dolar,
    moatRotulo: MOAT_ROTULO[q.moatForca],
    moatTipos: q.moat.map((m) => MOAT_NOME[m] || m),
    selo: selar(aprovados, margemSeg, p),
    inversao: inverter(a, q, val, p),
    foraDoCirculo: circulo.length > 0 && !circulo.includes(a.setor)
  };
}

function analisarBuffettTodos(lista, premissas, circulo) {
  const ctx = contextoSetorial(lista);
  return lista.map((a) => analisarBuffett(a, ctx, premissas, circulo));
}

if (typeof module !== "undefined")
  module.exports = { analisarBuffett, analisarBuffettTodos, contextoSetorial, PREMISSAS_BUFFETT, MOAT_NOME };
