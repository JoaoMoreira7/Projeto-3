/* ============================================================
   APP — liga a base de dados, o motor de análise e a interface
   ============================================================ */

const LS = {
  dados: "ar_dados", carteira: "ar_carteira", premissas: "ar_premissas", token: "ar_token",
  premissasB: "ar_premissas_buffett", circulo: "ar_circulo", params: "ar_params", moedaBase: "ar_moeda_base"
};

// universo completo: Brasil + resto do mundo, com região sempre preenchida
const UNIVERSO = [...ACOES, ...ACOES_GLOBAIS].map((a) => ({
  ...a, regiao: a.regiao || REGIAO_POR_PAIS[a.pais] || a.pais
}));

const PARAMS_PADRAO = { FX: { ...FX }, juros: { ...TAXA_LIVRE_RISCO } };

const estado = {
  dados: carregar(LS.dados) || UNIVERSO.map((a) => ({ ...a })),
  carteira: carregar(LS.carteira) || [],
  premissas: { ...PREMISSAS_PADRAO, ...(carregar(LS.premissas) || {}) },
  premissasB: { ...PREMISSAS_BUFFETT, ...(carregar(LS.premissasB) || {}) },
  circulo: carregar(LS.circulo) || [],
  params: carregar(LS.params) || JSON.parse(JSON.stringify(PARAMS_PADRAO)),
  moedaBase: carregar(LS.moedaBase) || "BRL",
  analisadas: [],
  ordem: { campo: "score", desc: true },
  ordemB: { campo: "tenets", desc: true },
  selecionado: null,
  origemPrecos: "local"
};

/* ---------- câmbio ---------- */
function aplicarParams() {
  Object.assign(FX, estado.params.FX || {});
  Object.assign(TAXA_LIVRE_RISCO, estado.params.juros || {});
}
const simboloBase = () => (estado.moedaBase === "BRL" ? "R$" : "US$");
function fxParaBRL(simbolo) {
  return FX[MOEDA_CODIGO[simbolo] || "BRL"] ?? 1;
}
// converte um valor na moeda do ativo para a moeda base da carteira
function paraBase(valor, simbolo) {
  const emReais = valor * fxParaBRL(simbolo);
  return estado.moedaBase === "BRL" ? emReais : emReais / (FX.USD || 5.4);
}

function carregar(chave) {
  try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; }
}
function salvar(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {}
}

/* ---------- formatação ---------- */
const fmt = (v, casas = 2) =>
  v == null || !isFinite(v) ? "—" : v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const money = (v, m = "R$") => (v == null || !isFinite(v) ? "—" : `${m} ${fmt(v)}`);
const pct = (v, casas = 1) => (v == null || !isFinite(v) ? "—" : `${v >= 0 ? "" : ""}${fmt(v, casas)}%`);
const sinal = (v) => (v == null ? "" : v >= 0 ? "pos" : "neg");
const el = (id) => document.getElementById(id);

/* ---------- recalcular tudo ---------- */
function recalcular() {
  aplicarParams();
  estado.analisadas = analisarTodos(estado.dados, estado.premissas);
  const buffs = analisarBuffettTodos(estado.analisadas, estado.premissasB, estado.circulo);
  estado.analisadas.forEach((a, i) => { a.buff = buffs[i]; });
  renderResumo();
  renderBuffett();
  renderTabela();
  preencherSelects();
  renderDetalhe();
  renderCarteira();
}

/* ================= RADAR ================= */
function filtrar() {
  const busca = el("fBusca").value.trim().toLowerCase();
  const setor = el("fSetor").value;
  const regiao = el("fRegiao").value;
  const minScore = +el("fScore").value;
  const minUpside = +el("fUpside").value;
  const maxPL = +el("fPL").value;
  const minDY = +el("fDY").value;
  const semDivida = el("fDivida").checked;
  const soLucro = el("fLucro").checked;

  return estado.analisadas.filter((a) => {
    if (busca && !(a.ticker.toLowerCase().includes(busca) || a.nome.toLowerCase().includes(busca))) return false;
    if (setor && a.setor !== setor) return false;
    if (regiao && a.regiao !== regiao) return false;
    if (a.score < minScore) return false;
    if ((a.val.upside ?? -999) < minUpside) return false;
    if (soLucro && (a.ind.pl == null || a.ind.pl <= 0)) return false;
    if (maxPL < 40 && (a.ind.pl == null || a.ind.pl > maxPL)) return false;
    if (a.ind.dy < minDY) return false;
    if (semDivida && a.divEbitda > 3) return false;
    return true;
  });
}

function ordenar(lista) {
  const { campo, desc } = estado.ordem;
  const chave = {
    ticker: (a) => a.ticker, setor: (a) => a.setor, preco: (a) => a.preco,
    justo: (a) => a.val.justo ?? -1, upside: (a) => a.val.upside ?? -999,
    pl: (a) => a.ind.pl ?? 999, pvp: (a) => a.ind.pvp ?? 999, dy: (a) => a.ind.dy,
    roe: (a) => a.roe, cresc: (a) => a.crescEst, score: (a) => a.score,
    buffett: (a) => a.buff.aprovados + a.buff.score / 1000
  }[campo] || ((a) => a.score);

  return lista.slice().sort((x, y) => {
    const vx = chave(x), vy = chave(y);
    const cmp = typeof vx === "string" ? vx.localeCompare(vy) : vx - vy;
    return desc ? -cmp : cmp;
  });
}

function classeTenets(n) {
  return n >= 10 ? "s-alto" : n >= 7 ? "s-medio" : n >= 5 ? "s-baixo" : "s-min";
}

function classeScore(s) {
  return s >= 70 ? "s-alto" : s >= 60 ? "s-medio" : s >= 50 ? "s-baixo" : "s-min";
}

function renderTabela() {
  const lista = ordenar(filtrar());
  const corpo = el("corpoTabela");
  el("vazio").hidden = lista.length > 0;

  corpo.innerHTML = lista.map((a) => `
    <tr data-ticker="${a.ticker}">
      <td><div class="tk">${a.ticker}<span class="moeda-tag">${a.regiao}</span></div><div class="nm">${a.nome}</div></td>
      <td class="nm">${a.setor}</td>
      <td class="n">${money(a.preco, a.moeda)}</td>
      <td class="n">${money(a.val.justo, a.moeda)}</td>
      <td class="n ${sinal(a.val.upside)}">${pct(a.val.upside, 0)}</td>
      <td class="n">${a.ind.pl == null ? "—" : fmt(a.ind.pl, 1) + "x"}</td>
      <td class="n">${a.ind.pvp == null ? "—" : fmt(a.ind.pvp, 2) + "x"}</td>
      <td class="n">${pct(a.ind.dy)}</td>
      <td class="n">${pct(a.roe)}</td>
      <td class="n">${pct(a.crescEst, 0)}</td>
      <td class="n"><span class="score-bola ${classeScore(a.score)}">${a.score.toFixed(0)}</span></td>
      <td class="n"><span class="score-bola ${classeTenets(a.buff.aprovados)}">${a.buff.aprovados}/12</span></td>
      <td><span class="pill ${a.classe.classe}">${a.classe.rotulo}</span></td>
      <td><button class="btn-mini" data-abrir="${a.ticker}">ver</button></td>
    </tr>`).join("");

  corpo.querySelectorAll("[data-abrir]").forEach((b) =>
    b.addEventListener("click", () => abrirAnalise(b.dataset.abrir)));
}

function renderResumo() {
  const lista = estado.analisadas;
  const oportunidades = lista.filter((a) => a.classe.classe === "otimo" || a.classe.classe === "bom");
  const top = lista[0];
  const mediaUpside = oportunidades.length
    ? oportunidades.reduce((s, a) => s + (a.val.upside || 0), 0) / oportunidades.length : 0;
  const baratas = lista.filter((a) => a.ind.pl != null && a.ind.pl < 10).length;

  el("resumo").innerHTML = `
    <div class="kpi"><div class="rot">Ativos na base</div><div class="val">${lista.length}</div>
      <div class="obs">${estado.origemPrecos === "api" ? "preços atualizados via API" : "preços da base local"}</div></div>
    <div class="kpi"><div class="rot">Oportunidades</div><div class="val" style="color:var(--verde)">${oportunidades.length}</div>
      <div class="obs">score ≥ 60 e desconto relevante</div></div>
    <div class="kpi"><div class="rot">Upside médio delas</div><div class="val">${pct(mediaUpside, 0)}</div>
      <div class="obs">até o preço justo calculado</div></div>
    <div class="kpi"><div class="rot">Aprovadas no crivo Buffett</div>
      <div class="val" style="color:var(--roxo)">${lista.filter((a) => a.buff.aprovados >= 10).length}</div>
      <div class="obs">10 ou mais dos 12 tenets · ${[...new Set(lista.map((a) => a.regiao))].length} regiões na base</div></div>
    <div class="kpi"><div class="rot">Destaque do momento</div><div class="val" style="color:var(--azul)">${top ? top.ticker : "—"}</div>
      <div class="obs">${top ? `score ${top.score.toFixed(0)} · upside ${pct(top.val.upside, 0)}` : ""}</div></div>`;
}

/* ================= ANÁLISE ================= */
function abrirAnalise(ticker) {
  estado.selecionado = ticker;
  el("selAtivo").value = ticker;
  trocarAba("analise");
  renderDetalhe();
}

function renderDetalhe() {
  const t = estado.selecionado || (estado.analisadas[0] && estado.analisadas[0].ticker);
  const a = estado.analisadas.find((x) => x.ticker === t);
  if (!a) { el("detalhe").innerHTML = ""; return; }
  estado.selecionado = a.ticker;

  const m = a.val.metodos;
  const nomeMetodo = {
    graham: "Fórmula de Graham (lucro + patrimônio)",
    bazin: `Método Bazin (yield desejado de ${estado.premissas.yieldDesejado}%)`,
    multiplo: `Múltiplo justo do setor (P/L ${PL_JUSTO_SETOR[a.setor] || "—"}x)`,
    dcf: `Fluxo de caixa descontado (${estado.premissas.taxaDesconto}% a.a.)`
  };

  const linhasMetodos = Object.entries(m)
    .map(([k, v]) => `<tr><td>${nomeMetodo[k] || k}</td><td>${money(v, a.moeda)}</td></tr>`).join("");

  const barra = (rot, valor, classe) => `
    <div class="mini">
      <div class="rot">${rot}</div>
      <div class="val">${valor.toFixed(0)}<span style="font-size:.8rem;color:var(--txt2)">/100</span></div>
      <div class="barra"><i class="${classe}" style="width:${valor.toFixed(0)}%"></i></div>
    </div>`;

  el("detalhe").innerHTML = `
    <div class="cartao">
      <div class="linha-topo" style="justify-content:space-between;margin-bottom:8px">
        <div>
          <h2 style="margin-bottom:2px">${a.ticker} · ${a.nome}</h2>
          <span class="nm">${a.setor} · ${a.pais === "BR" ? "Brasil" : "EUA"}</span>
        </div>
        <span class="pill ${a.classe.classe}" style="font-size:.9rem;padding:6px 14px">${a.classe.rotulo} · score ${a.score.toFixed(0)}</span>
      </div>
      <div class="grade">
        <div class="mini"><div class="rot">Preço atual</div><div class="val">${money(a.preco, a.moeda)}</div>
          <div class="obs">${a.ind.distMax != null ? pct(a.ind.distMax, 0) + " da máxima 52s" : ""}</div></div>
        <div class="mini"><div class="rot">Preço justo</div><div class="val">${money(a.val.justo, a.moeda)}</div>
          <div class="obs">média de ${Object.keys(m).length} métodos</div></div>
        <div class="mini"><div class="rot">Upside</div><div class="val ${sinal(a.val.upside)}">${pct(a.val.upside, 0)}</div>
          <div class="obs">até o valor justo</div></div>
        <div class="mini"><div class="rot">Comprar até</div><div class="val" style="color:var(--verde)">${money(a.precoCompra, a.moeda)}</div>
          <div class="obs">com ${estado.premissas.margemSeguranca}% de margem</div></div>
        <div class="mini"><div class="rot">Stop sugerido</div><div class="val">${money(a.stop, a.moeda)}</div>
          <div class="obs">-15% ou mínima de 52s</div></div>
      </div>
    </div>

    ${cartaoBuffett(a)}

    <div class="duas-col">
      <div class="cartao">
        <h2>De onde vem o score</h2>
        <p class="ajuda">Perfil <b>${estado.premissas.perfil}</b>: pesos de ${(PESOS_PERFIL[estado.premissas.perfil].valor * 100).toFixed(0)}% valor,
          ${(PESOS_PERFIL[estado.premissas.perfil].cresc * 100).toFixed(0)}% crescimento,
          ${(PESOS_PERFIL[estado.premissas.perfil].qualidade * 100).toFixed(0)}% qualidade e
          ${(PESOS_PERFIL[estado.premissas.perfil].risco * 100).toFixed(0)}% risco.</p>
        <div class="grade">
          ${barra("Está barata?", a.notas.valor, "b-valor")}
          ${barra("Está crescendo?", a.notas.cresc, "b-cresc")}
          ${barra("Tem qualidade?", a.notas.qualidade, "b-qual")}
          ${barra("Risco controlado?", a.notas.risco, "b-risco")}
        </div>
      </div>

      <div class="cartao">
        <h2>Preço justo por método</h2>
        <table class="metodos"><tbody>
          ${linhasMetodos}
          <tr style="border-top:2px solid var(--linha)"><td><b>Média aparada (descarta extremos)</b></td><td><b>${money(a.val.justo, a.moeda)}</b></td></tr>
        </tbody></table>
      </div>
    </div>

    <div class="cartao">
      <h2>Indicadores</h2>
      <div class="grade">
        <div class="mini"><div class="rot">P/L</div><div class="val">${a.ind.pl == null ? "—" : fmt(a.ind.pl, 1) + "x"}</div><div class="obs">setor: ${PL_JUSTO_SETOR[a.setor] || "—"}x</div></div>
        <div class="mini"><div class="rot">P/VP</div><div class="val">${a.ind.pvp == null ? "—" : fmt(a.ind.pvp, 2) + "x"}</div><div class="obs">abaixo de 1 = abaixo do patrimônio</div></div>
        <div class="mini"><div class="rot">Dividend yield</div><div class="val">${pct(a.ind.dy)}</div><div class="obs">payout ${a.payout}%</div></div>
        <div class="mini"><div class="rot">ROE</div><div class="val">${pct(a.roe)}</div><div class="obs">retorno sobre patrimônio</div></div>
        <div class="mini"><div class="rot">Margem líquida</div><div class="val">${pct(a.margem)}</div></div>
        <div class="mini"><div class="rot">Dívida/EBITDA</div><div class="val">${fmt(a.divEbitda, 1)}x</div><div class="obs">acima de 3x acende alerta</div></div>
        <div class="mini"><div class="rot">Cresc. receita 5a</div><div class="val">${pct(a.cagrRec, 0)}</div></div>
        <div class="mini"><div class="rot">Cresc. lucro 5a</div><div class="val ${sinal(a.cagrLuc)}">${pct(a.cagrLuc, 0)}</div></div>
        <div class="mini"><div class="rot">Cresc. estimado</div><div class="val">${pct(a.crescEst, 0)}</div></div>
        <div class="mini"><div class="rot">PEG</div><div class="val">${a.ind.peg == null ? "—" : fmt(a.ind.peg, 2)}</div><div class="obs">abaixo de 1 é bom sinal</div></div>
        <div class="mini"><div class="rot">Beta</div><div class="val">${fmt(a.beta, 2)}</div><div class="obs">1 = oscila como o índice</div></div>
        <div class="mini"><div class="rot">Faixa 52 semanas</div><div class="val" style="font-size:.95rem">${fmt(a.min52)} – ${fmt(a.max52)}</div></div>
      </div>
    </div>

    <div class="duas-col">
      <div class="cartao"><h2>Pontos fortes</h2>
        ${a.diag.fortes.length ? `<ul class="lista-diag forte">${a.diag.fortes.map((f) => `<li>${f}</li>`).join("")}</ul>`
          : `<p class="ajuda">Nada se destaca positivamente com os números atuais.</p>`}</div>
      <div class="cartao"><h2>Pontos de atenção</h2>
        ${a.diag.fracos.length ? `<ul class="lista-diag fraco">${a.diag.fracos.map((f) => `<li>${f}</li>`).join("")}</ul>`
          : `<p class="ajuda">Nenhum alerta relevante nos indicadores analisados.</p>`}</div>
    </div>

    <div class="cartao">
      <h2>Próximo passo</h2>
      <p class="ajuda">Os números dizem se está barata. Eles não dizem <em>por que</em> está barata — e essa é a pergunta que separa
        oportunidade de armadilha. Use os roteiros da aba Prompts com esta ação:</p>
      <div class="linha-topo">
        <button class="btn-mini" data-prompt="dcf">Valuation DCF (Morgan Stanley)</button>
        <button class="btn-mini" data-prompt="tecnica">Análise técnica (Citadel)</button>
        <button class="btn-mini" data-prompt="padroes">Padrões estatísticos (RenTech)</button>
        <button class="btn-mini" data-prompt="resultados">Prévia de resultados (JPMorgan)</button>
        <button class="btn-mini" data-prompt="competitiva">Concorrência do setor (Bain)</button>
      </div>
    </div>`;

  el("detalhe").querySelectorAll("[data-prompt]").forEach((b) =>
    b.addEventListener("click", () => irParaPrompt(b.dataset.prompt, a)));
}


/* ================= CRIVO BUFFETT ================= */
function renderBuffettIntro() {
  const alvo = el("buffettIntro");
  if (!alvo || alvo.dataset.pronto) return;
  alvo.dataset.pronto = "1";
  alvo.innerHTML = `
    <div class="aviso-box">
      <strong>O crivo:</strong> os quatro filtros de Munger — entender o negócio, vantagem competitiva duradoura,
      gente decente no comando e preço sensato — traduzidos em 12 testes objetivos. O valor intrínseco sai do
      <em>lucro do proprietário</em> (carta de 1986: lucro contábil mais itens não-caixa, menos o capex necessário para
      manter a posição competitiva), descontado pelo juro do título longo do governo do país da empresa mais um prêmio.
      Cada linha mostra o número e o limite exigido — nada de nota sem explicação.
      <br><br>Poucas empresas passam. É o esperado: Buffett rejeita quase tudo, e um crivo que aprova metade da bolsa não é um crivo.
    </div>`;
}

function filtrarBuffett() {
  const regiao = el("bRegiao").value, selo = el("bSelo").value;
  const moat = +el("bMoat").value, minTenets = +el("bTenets").value;
  const minMargem = +el("bMargem").value, soCirculo = el("bCirculo").checked;

  return estado.analisadas.filter((a) => {
    const b = a.buff;
    if (regiao && a.regiao !== regiao) return false;
    if (selo && b.selo.rotulo !== selo) return false;
    if (b.q.moatForca < moat) return false;
    if (b.aprovados < minTenets) return false;
    if (minMargem > -100 && (b.margemSeg == null || b.margemSeg < minMargem)) return false;
    if (soCirculo && b.foraDoCirculo) return false;
    return true;
  });
}

function ordenarBuffett(lista) {
  const { campo, desc } = estado.ordemB;
  const chave = {
    ticker: (a) => a.ticker, regiao: (a) => a.regiao, moat: (a) => a.buff.q.moatForca,
    tenets: (a) => a.buff.aprovados + a.buff.score / 1000, roic: (a) => a.buff.q.roic,
    oe: (a) => a.buff.oeYield, juro: (a) => a.buff.juroLongo, k: (a) => a.buff.custoCapital,
    intr: (a) => a.buff.intrinseco ?? -1, margem: (a) => a.buff.margemSeg ?? -999,
    compra: (a) => a.buff.precoBuffett ?? -1
  }[campo] || ((a) => a.buff.aprovados);

  return lista.slice().sort((x, y) => {
    const vx = chave(x), vy = chave(y);
    const cmp = typeof vx === "string" ? vx.localeCompare(vy) : vx - vy;
    return desc ? -cmp : cmp;
  });
}

function renderBuffett() {
  renderBuffettIntro();
  const lista = ordenarBuffett(filtrarBuffett());
  el("vazioBuffett").hidden = lista.length > 0;

  el("corpoBuffett").innerHTML = lista.map((a) => {
    const b = a.buff;
    return `<tr>
      <td><div class="tk">${a.ticker}${b.foraDoCirculo ? ' <span class="moeda-tag" title="fora do seu círculo de competência">fora do círculo</span>' : ""}</div>
          <div class="nm">${a.nome}</div></td>
      <td class="nm">${a.regiao}</td>
      <td><div>${b.moatRotulo}</div>${b.moatTipos.map((m) => `<span class="moat-chip">${m}</span>`).join("")}</td>
      <td class="n"><span class="score-bola ${classeTenets(b.aprovados)}">${b.aprovados}/12</span></td>
      <td class="n">${pct(b.q.roic, 0)}</td>
      <td class="n">${pct(b.oeYield)}</td>
      <td class="n">${pct(b.juroLongo)}</td>
      <td class="n">${pct(b.custoCapital)}</td>
      <td class="n">${money(b.intrinseco, a.moeda)}</td>
      <td class="n ${sinal(b.margemSeg)}">${b.margemSeg == null ? "—" : pct(b.margemSeg, 0)}</td>
      <td class="n">${money(b.precoBuffett, a.moeda)}</td>
      <td><span class="pill ${b.selo.classe}">${b.selo.rotulo}</span></td>
      <td><button class="btn-mini" data-abrirb="${a.ticker}">ver</button></td>
    </tr>`;
  }).join("");

  el("corpoBuffett").querySelectorAll("[data-abrirb]").forEach((btn) =>
    btn.addEventListener("click", () => abrirAnalise(btn.dataset.abrirb)));
}

/* bloco do checklist usado dentro da aba Análise */
function cartaoBuffett(a) {
  const b = a.buff;
  const grupos = ["Negócio", "Gestão", "Financeiro", "Valor"];
  const marca = (t) => (t.ok ? ["ok-sim", "✓"] : t.nota >= 60 ? ["ok-quase", "~"] : ["ok-nao", "✗"]);

  const checklist = grupos.map((g) => `
    <div class="tenet-grupo">
      <h4>${g}</h4>
      ${b.tenets.filter((t) => t.grupo === g).map((t) => {
        const [cls, ic] = marca(t);
        return `<div class="tenet">
          <span class="marca-ok ${cls}">${ic}</span>
          <span><span class="nome">${t.nome}</span><div class="detalhe">${t.detalhe}</div></span>
        </div>`;
      }).join("")}
    </div>`).join("");

  const d = b.dolar;

  // as duas lentes podem discordar — e a divergência costuma ser a informação mais útil
  const valorDiz = a.classe.classe;
  const qualidadeOk = b.aprovados >= 10;
  const divergencia =
    qualidadeOk && (valorDiz === "ruim" || valorDiz === "caro")
      ? `<b>As duas lentes discordam.</b> Pelo crivo de qualidade a empresa passa (${b.aprovados}/12), mas os métodos de
         valor clássicos — Graham, Bazin e múltiplo do setor — a consideram cara. É o retrato de um negócio excelente
         negociando a múltiplo alto: Buffett pagaria por qualidade, Graham não pagaria por preço. Saiba qual escola você
         está seguindo antes de clicar em comprar.`
      : !qualidadeOk && (valorDiz === "otimo" || valorDiz === "bom")
      ? `<b>As duas lentes discordam.</b> A ação está estatisticamente barata, mas reprova em ${12 - b.aprovados} dos 12
         tenets de qualidade. Esse é o perfil clássico da armadilha de valor: barata porque o negócio piorou, não porque
         o mercado se distraiu. Antes de comprar, encontre o motivo do desconto.`
      : null;

  return `
    <div class="cartao">
      <div class="linha-topo" style="justify-content:space-between;margin-bottom:10px">
        <h2 style="margin:0">Crivo Buffett–Munger</h2>
        <span class="pill ${b.selo.classe}" style="font-size:.9rem;padding:6px 14px">${b.selo.rotulo} · ${b.aprovados}/12</span>
      </div>
      ${b.foraDoCirculo ? `<div class="aviso-circulo">Este setor está fora do círculo de competência que você marcou na aba Config.
        Munger diria para pular: a nota alta não substitui entender o negócio.</div>` : ""}
      <div class="grade">
        <div class="mini"><div class="rot">Lucro do proprietário</div><div class="val">${money(b.oe, a.moeda)}</div>
          <div class="obs">por ação, após capex de manutenção</div></div>
        <div class="mini"><div class="rot">Rende sobre o preço</div><div class="val">${pct(b.oeYield)}</div>
          <div class="obs">título longo local: ${pct(b.juroLongo)}</div></div>
        <div class="mini"><div class="rot">Custo de capital</div><div class="val">${pct(b.custoCapital)}</div>
          <div class="obs">juro local + prêmio, com piso de ${estado.premissasB.taxaMinima}%</div></div>
        <div class="mini"><div class="rot">Valor intrínseco</div><div class="val">${money(b.intrinseco, a.moeda)}</div>
          <div class="obs">lucro do dono descontado em 10 anos</div></div>
        <div class="mini"><div class="rot">Margem de segurança</div><div class="val ${sinal(b.margemSeg)}">${b.margemSeg == null ? "—" : pct(b.margemSeg, 0)}</div>
          <div class="obs">exigido: ${estado.premissasB.margemBuffett}%</div></div>
        <div class="mini"><div class="rot">Comprar até</div><div class="val" style="color:var(--verde)">${money(b.precoBuffett, a.moeda)}</div>
          <div class="obs">valor intrínseco com desconto</div></div>
      </div>
      ${divergencia ? `<p class="aviso-circulo" style="margin-top:14px">${divergencia}</p>` : ""}
      ${d && d.razao != null ? `<p class="ajuda" style="margin-top:14px"><b>Teste do dólar (carta de 1983):</b>
        a empresa reteve ${money(d.retidos, a.moeda)} por ação em 5 anos e o preço ${d.criado >= 0 ? "subiu" : "caiu"}
        ${money(Math.abs(d.criado), a.moeda)} no período — ${d.razao.toFixed(2)} de valor para cada 1 retido.
        ${d.passou ? "Passou: a diretoria reinveste melhor do que você conseguiria sozinho." : "Não passou: esse lucro talvez rendesse mais no seu bolso, como dividendo."}</p>` : ""}
    </div>

    <div class="duas-col">
      <div class="cartao">
        <h2>Os 12 tenets</h2>
        <div class="tenets">${checklist}</div>
      </div>
      <div class="cartao">
        <h2>Inversão: o que mataria esta tese</h2>
        <p class="ajuda">Munger inverte o problema: em vez de listar por que dá certo, listar o que faria dar errado.</p>
        ${b.inversao.length ? `<ul class="lista-diag fraco">${b.inversao.map((x) => `<li>${x}</li>`).join("")}</ul>`
          : `<p class="ajuda">Nenhum risco estrutural saltou dos números — o que não significa que não exista.</p>`}
        <p class="ajuda" style="margin-top:12px">Fosso: <b>${b.moatRotulo}</b>.
          ${b.moatTipos.length ? b.moatTipos.map((m) => `<span class="moat-chip">${m}</span>`).join("") : "Nenhuma fonte de vantagem identificada."}</p>
      </div>
    </div>`;
}

/* ================= CARTEIRA ================= */
function renderCarteira() {
  const linhas = estado.carteira.map((p) => {
    const a = estado.analisadas.find((x) => x.ticker === p.ticker);
    if (!a) return null;
    // valores convertidos para a moeda base; preços seguem na moeda do ativo
    const investido = paraBase(p.qtd * p.precoMedio, a.moeda);
    const atual = paraBase(p.qtd * a.preco, a.moeda);
    return { ...p, a, investido, atual, resultado: atual - investido };
  }).filter(Boolean);

  const totalAtual = linhas.reduce((s, l) => s + l.atual, 0);
  const totalInvestido = linhas.reduce((s, l) => s + l.investido, 0);

  el("corpoCarteira").innerHTML = linhas.length ? linhas.map((l) => {
    const peso = totalAtual ? (l.atual / totalAtual) * 100 : 0;
    const varPct = l.investido ? (l.resultado / l.investido) * 100 : 0;
    return `<tr>
      <td><div class="tk">${l.ticker}<span class="moeda-tag">${l.a.regiao}</span></div><div class="nm">${l.a.setor}</div></td>
      <td class="n">${l.qtd}</td>
      <td class="n">${money(l.precoMedio, l.a.moeda)}</td>
      <td class="n">${money(l.a.preco, l.a.moeda)}</td>
      <td class="n">${money(l.investido, simboloBase())}</td>
      <td class="n">${money(l.atual, simboloBase())}</td>
      <td class="n ${sinal(l.resultado)}">${money(l.resultado, simboloBase())} (${pct(varPct, 1)})</td>
      <td class="n">${pct(peso, 1)}</td>
      <td class="n"><span class="score-bola ${classeScore(l.a.score)}">${l.a.score.toFixed(0)}</span></td>
      <td class="n ${sinal(l.a.val.upside)}">${pct(l.a.val.upside, 0)}</td>
      <td><button class="btn-mini" data-remover="${l.ticker}">remover</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="11" class="vazio">Carteira vazia. Adicione posições acima para ver risco e concentração.</td></tr>`;

  el("corpoCarteira").querySelectorAll("[data-remover]").forEach((b) =>
    b.addEventListener("click", () => {
      estado.carteira = estado.carteira.filter((p) => p.ticker !== b.dataset.remover);
      salvar(LS.carteira, estado.carteira);
      renderCarteira();
    }));

  if (!linhas.length) { el("carteiraResumo").innerHTML = ""; el("riscoCarteira").innerHTML = ""; return; }

  const resultado = totalAtual - totalInvestido;
  const scoreMedio = linhas.reduce((s, l) => s + l.a.score * l.atual, 0) / totalAtual;
  const upsideMedio = linhas.reduce((s, l) => s + (l.a.val.upside || 0) * l.atual, 0) / totalAtual;
  const dyMedio = linhas.reduce((s, l) => s + l.a.ind.dy * l.atual, 0) / totalAtual;
  const betaMedio = linhas.reduce((s, l) => s + l.a.beta * l.atual, 0) / totalAtual;

  el("carteiraResumo").innerHTML = `<div class="resumo">
    <div class="kpi"><div class="rot">Investido</div><div class="val">${money(totalInvestido, simboloBase())}</div>
      <div class="obs">convertido para ${estado.moedaBase}</div></div>
    <div class="kpi"><div class="rot">Valor hoje</div><div class="val">${money(totalAtual, simboloBase())}</div></div>
    <div class="kpi"><div class="rot">Resultado</div><div class="val ${sinal(resultado)}">${money(resultado, simboloBase())}</div>
      <div class="obs">${pct(totalInvestido ? (resultado / totalInvestido) * 100 : 0)}</div></div>
    <div class="kpi"><div class="rot">Score médio</div><div class="val">${scoreMedio.toFixed(0)}</div>
      <div class="obs">ponderado pelo valor</div></div>
    <div class="kpi"><div class="rot">Upside médio</div><div class="val ${sinal(upsideMedio)}">${pct(upsideMedio, 0)}</div></div>
    <div class="kpi"><div class="rot">Aprovados no crivo Buffett</div>
      <div class="val">${linhas.filter((l) => l.a.buff.aprovados >= 10).length}/${linhas.length}</div>
      <div class="obs">com 10 ou mais dos 12 tenets</div></div>
    <div class="kpi"><div class="rot">Yield da carteira</div><div class="val">${pct(dyMedio)}</div>
      <div class="obs">renda anual estimada: ${money(totalAtual * dyMedio / 100, simboloBase())}</div></div>
  </div>`;

  // concentração por setor + alertas de risco
  const porSetor = {};
  linhas.forEach((l) => { porSetor[l.a.setor] = (porSetor[l.a.setor] || 0) + l.atual; });
  const setores = Object.entries(porSetor)
    .map(([s, v]) => [s, (v / totalAtual) * 100]).sort((x, y) => y[1] - x[1]);

  const cor = (p) => (p > 40 ? "var(--vermelho)" : p > 25 ? "var(--laranja)" : "var(--verde)");
  const alertas = [];
  setores.forEach(([s, p]) => { if (p > 30) alertas.push(`Concentração de ${fmt(p, 0)}% em ${s} — uma crise setorial derruba boa parte da carteira.`); });
  linhas.forEach((l) => {
    const peso = (l.atual / totalAtual) * 100;
    if (peso > 25) alertas.push(`${l.ticker} representa ${fmt(peso, 0)}% da carteira — risco individual alto para um único papel.`);
    if (l.a.divEbitda > 3) alertas.push(`${l.ticker} tem dívida líquida de ${fmt(l.a.divEbitda, 1)}x EBITDA — sensível a juros altos.`);
    if (l.a.classe.classe === "ruim") alertas.push(`${l.ticker} está classificada como "${l.a.classe.rotulo}" pelo modelo — vale revisar a tese.`);
  });
  const porRegiao = {};
  linhas.forEach((l) => { porRegiao[l.a.regiao] = (porRegiao[l.a.regiao] || 0) + l.atual; });
  Object.entries(porRegiao).forEach(([r, v]) => {
    const peso = (v / totalAtual) * 100;
    if (peso > 70 && Object.keys(porRegiao).length > 0)
      alertas.push(`${fmt(peso, 0)}% da carteira está em ${r} — concentração de país significa risco de moeda, juro e política em um só lugar.`);
  });
  linhas.forEach((l) => {
    if (l.a.buff.foraDoCirculo)
      alertas.push(`${l.ticker} está fora do círculo de competência que você marcou.`);
  });
  if (betaMedio > 1.15) alertas.push(`Beta médio de ${fmt(betaMedio, 2)} — a carteira cai mais que o índice nas quedas.`);
  if (linhas.length < 5) alertas.push(`Apenas ${linhas.length} ativo(s) — diversificação insuficiente para diluir risco específico.`);

  el("riscoCarteira").innerHTML = `
    <div class="cartao">
      <h2>Concentração por setor</h2>
      <div class="heat">${setores.map(([s, p]) => `
        <div class="heat-linha"><span>${s}</span>
          <div class="heat-barra"><i style="width:${p.toFixed(0)}%;background:${cor(p)}"></i></div>
          <span class="n">${p.toFixed(0)}%</span></div>`).join("")}</div>
    </div>
    <div class="cartao">
      <h2>Alertas de risco</h2>
      ${alertas.length ? `<ul class="lista-diag fraco">${alertas.map((x) => `<li>${x}</li>`).join("")}</ul>`
        : `<p class="ajuda">Nenhum alerta grave de concentração ou alavancagem.</p>`}
      <p class="ajuda" style="margin-top:12px">Para um raio-X completo, use o roteiro
        <b>Bridgewater</b> na aba Prompts — ele já vem preenchido com esta carteira.</p>
    </div>`;
}

/* ================= PROMPTS ================= */
function textoCarteira() {
  if (!estado.carteira.length) return "";
  const linhas = estado.carteira.map((p) => {
    const a = estado.analisadas.find((x) => x.ticker === p.ticker);
    return a ? { t: p.ticker, v: p.qtd * a.preco } : null;
  }).filter(Boolean);
  const total = linhas.reduce((s, l) => s + l.v, 0);
  return linhas.map((l) => `${l.t} ${((l.v / total) * 100).toFixed(0)}%`).join(", ");
}

function totalCarteira() {
  const total = estado.carteira.reduce((s, p) => {
    const a = estado.analisadas.find((x) => x.ticker === p.ticker);
    return s + (a ? p.qtd * a.preco : 0);
  }, 0);
  return total ? money(total) : "";
}

function renderPrompts() {
  el("promptsGrid").innerHTML = PROMPTS.map((p) => `
    <div class="prompt-card" id="pc-${p.id}">
      <div class="casa">${p.casa}</div>
      <h3><span class="num-prompt">${p.num}</span>${p.titulo}</h3>
      <p class="resumo-p">${p.resumo}</p>
      <div class="prompt-campos">
        ${p.campos.map((c) => c.tipo === "textarea"
          ? `<label class="campo"><span>${c.label}</span><textarea style="min-height:70px" data-p="${p.id}" data-c="${c.id}" placeholder="${c.placeholder}">${c.valor || ""}</textarea></label>`
          : `<label class="campo"><span>${c.label}</span><input data-p="${p.id}" data-c="${c.id}" placeholder="${c.placeholder}" value="${c.valor || ""}"></label>`
        ).join("")}
      </div>
      <div class="linha-topo" style="margin:0">
        <button class="btn" data-gerar="${p.id}">Gerar prompt</button>
        <button class="btn-ghost" data-copiar="${p.id}">Copiar</button>
        <span class="status" id="st-${p.id}"></span>
      </div>
      <pre class="prompt-saida" id="out-${p.id}" hidden></pre>
    </div>`).join("");

  el("promptsGrid").querySelectorAll("[data-gerar]").forEach((b) =>
    b.addEventListener("click", () => gerarPrompt(b.dataset.gerar)));
  el("promptsGrid").querySelectorAll("[data-copiar]").forEach((b) =>
    b.addEventListener("click", () => copiarPrompt(b.dataset.copiar)));
}

function valoresPrompt(id) {
  const p = PROMPTS.find((x) => x.id === id);
  const vals = {};
  p.campos.forEach((c) => {
    const campo = document.querySelector(`[data-p="${id}"][data-c="${c.id}"]`);
    const v = campo ? campo.value.trim() : "";
    vals[c.id] = v || `[${c.label.toLowerCase()}]`;
  });
  return vals;
}

function gerarPrompt(id) {
  const p = PROMPTS.find((x) => x.id === id);
  const out = el(`out-${id}`);
  out.textContent = p.montar(valoresPrompt(id));
  out.hidden = false;
  el(`st-${id}`).textContent = "";
  return out.textContent;
}

async function copiarPrompt(id) {
  const texto = el(`out-${id}`).hidden ? gerarPrompt(id) : el(`out-${id}`).textContent;
  const st = el(`st-${id}`);
  try {
    await navigator.clipboard.writeText(texto);
    st.textContent = "copiado ✓"; st.className = "status ok";
  } catch (e) {
    st.textContent = "selecione o texto abaixo e copie"; st.className = "status erro";
  }
  setTimeout(() => { st.textContent = ""; }, 3000);
}

// leva para a aba Prompts já preenchendo o roteiro com a ação/carteira atual
function irParaPrompt(idPrompt, ativo) {
  trocarAba("prompts");
  const preencher = (campo, valor) => {
    const c = document.querySelector(`[data-p="${idPrompt}"][data-c="${campo}"]`);
    if (c && valor) c.value = valor;
  };
  if (ativo) {
    preencher("ticker", `${ativo.ticker} — ${ativo.nome}`);
    preencher("empresa", `${ativo.nome} (${ativo.ticker})`);
    preencher("setor", `${ativo.setor} (${ativo.pais === "BR" ? "Brasil" : "EUA"})`);
  }
  preencher("carteira", textoCarteira());
  preencher("total", totalCarteira());
  gerarPrompt(idPrompt);
  const card = el(`pc-${idPrompt}`);
  if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ================= APRENDER ================= */
const GLOSSARIO = [
  ["P/L (preço sobre lucro)", "Quantos anos de lucro atual você paga ao comprar a ação. P/L 8 significa que a empresa levaria 8 anos para devolver o preço pago, mantendo o lucro de hoje.", "Barato costuma ser abaixo da média do setor — mas P/L baixo demais quase sempre tem um motivo."],
  ["P/VP (preço sobre valor patrimonial)", "Compara o preço com o patrimônio líquido por ação. Abaixo de 1 você paga menos do que o valor contábil da empresa.", "Útil em bancos e seguradoras; enganoso em empresas de tecnologia, onde o valor é intangível."],
  ["ROE", "Retorno sobre o patrimônio líquido: quanto de lucro a empresa gera para cada real dos sócios.", "Acima de 15% ao ano é sinal de negócio rentável e sustentado."],
  ["Dividend yield (DY)", "Dividendo pago nos últimos 12 meses dividido pelo preço da ação.", "Yield alto demais pode ser armadilha: dividendo extraordinário ou preço em queda livre."],
  ["Payout", "Fatia do lucro distribuída como dividendo. O que sobra é reinvestido no crescimento.", "Acima de 85% sinaliza pouca gordura para crescer ou atravessar crise."],
  ["Dívida líquida / EBITDA", "Quantos anos de geração de caixa operacional seriam necessários para quitar a dívida.", "Até 2x é confortável; acima de 3x aperta quando os juros sobem."],
  ["Margem líquida", "Quanto de cada real de receita vira lucro no fim da linha.", "Margem fina significa pouca defesa contra aumento de custo."],
  ["CAGR", "Crescimento anual composto. Suaviza a média de crescimento em vários anos.", "Compare o CAGR do lucro com o da receita: crescer receita sem lucro destrói valor."],
  ["PEG", "P/L dividido pelo crescimento esperado. Ajusta o múltiplo pelo ritmo de expansão.", "Abaixo de 1 sugere que você paga pouco pelo crescimento contratado."],
  ["Beta", "Sensibilidade da ação em relação ao índice. Beta 1,3 sobe e cai cerca de 30% mais que o mercado.", "Beta alto exige posição menor para o mesmo risco em reais."],
  ["Margem de segurança", "Desconto exigido entre o preço pago e o valor estimado. É o colchão para você estar errado nas premissas.", "25% a 35% é o intervalo clássico do value investing."],
  ["Value trap (armadilha de valor)", "Ação que parece barata em todo múltiplo, mas está barata porque o negócio está encolhendo de verdade.", "Antídoto: exigir crescimento de lucro positivo e ROE decente, não só múltiplo baixo."]
];

function renderAprender() {
  el("aprenderConteudo").innerHTML = `
    <div class="cartao">
      <h2>O sistema de Warren Buffett e Charlie Munger, aplicado aqui</h2>
      <p class="ajuda">Buffett e Munger nunca publicaram um algoritmo. O que existe são as cartas anuais da Berkshire,
        as falas nas assembleias e os livros que sistematizaram tudo isso. O crivo desta aba nasce daí:</p>
      <ol class="passos">
        <li><b>Os quatro filtros de Munger</b> — um negócio que entendemos, com vantagem competitiva duradoura,
          conduzido por gente capaz e honesta, a um preço sensato. Nesta ordem: preço é o último filtro, não o primeiro.</li>
        <li><b>Lucro do proprietário</b> (carta de 1986) — lucro contábil, mais depreciação e outros itens não-caixa,
          menos o capex necessário para manter a posição competitiva. Buffett avisou na mesma carta que esse número
          nunca é exato, porque o capex de manutenção é estimado. Aqui ele aparece como um fator explícito e editável
          por empresa, em vez de escondido dentro da conta.</li>
        <li><b>Teste do dólar</b> (carta de 1983) — cada R$ 1 retido pela empresa precisa virar pelo menos R$ 1 de valor
          de mercado para o sócio. É a forma mais direta de avaliar quem aloca o capital.</li>
        <li><b>Desconto pelo juro do título longo</b> — Buffett não usa CAPM nem WACC acadêmico: desconta pelo juro do
          governo mais um prêmio. Nós acrescentamos um prêmio de risco-país e um piso na taxa, para que juro nominal
          baixo não transforme qualquer empresa em barganha.</li>
        <li><b>Margem de segurança</b> (Graham) — o valor intrínseco é uma estimativa com premissas que podem estar
          erradas. O desconto exigido é o colchão para esse erro.</li>
        <li><b>Fosso econômico</b> — marca e intangíveis, vantagem de custo, efeito de rede, custo de troca, escala
          eficiente e licença/regulação. Um fosso largo é o que permite manter retorno sobre capital acima do custo de
          capital por muitos anos.</li>
        <li><b>Círculo de competência e inversão</b> — Munger só investe no que entende e sempre pergunta o que faria a
          tese morrer. Marque seus setores na aba Config e o app passa a avisar; a lista de inversão sai automática dos números.</li>
      </ol>

      <h3 style="margin-top:18px">Onde este app tenta ir além do checklist tradicional</h3>
      <p class="ajuda">Nenhum software reproduz o julgamento de quem construiu a Berkshire — e desconfie de quem prometer
        isso. O que dá para fazer melhor do que um checklist comum:</p>
      <ul class="lista-diag forte">
        <li>Cada tenet mostra o número apurado <em>e</em> o limite exigido. Você discorda? Muda a premissa e vê o efeito na hora.</li>
        <li>O mesmo crivo roda em ${estado.dados.length} empresas de várias regiões ao mesmo tempo, com o juro local de
          cada país — comparar uma ação brasileira com uma japonesa pelo mesmo desconto seria um erro grosseiro.</li>
        <li>Três lentes convivem: a de Buffett (qualidade e fosso), a de Graham e Bazin (preço e dividendo) e a do fluxo
          de caixa descontado. Quando elas discordam, isso aparece em vez de virar uma nota única.</li>
        <li>A inversão de Munger vira lista concreta de riscos, e não uma frase motivacional.</li>
        <li>O modelo diz onde ele mesmo falha: empresa de crescimento acelerado, upside grande demais, setor cíclico no
          pico do ciclo, negócio complexo demais para acompanhar.</li>
      </ul>

      <h3 style="margin-top:18px">Fontes</h3>
      <ul class="fonte-lista">
        <li><a href="https://www.berkshirehathaway.com/letters/letters.html" target="_blank" rel="noopener">Cartas anuais da Berkshire Hathaway</a> — lucro do proprietário (1986) e teste do dólar (1983)</li>
        <li><a href="https://en.wikipedia.org/wiki/Owner_earnings" target="_blank" rel="noopener">Owner earnings</a> — definição e limitações do conceito</li>
        <li><a href="https://www.gurufocus.com/news/158161/charlie-mungers-four-filters-of-investing" target="_blank" rel="noopener">Os quatro filtros de Charlie Munger</a></li>
        <li><a href="https://www.morningstar.com/investing-terms/economic-moat" target="_blank" rel="noopener">Morningstar — os cinco tipos de fosso econômico</a> e ROIC acima do custo de capital</li>
        <li><a href="https://www.wiley.com/en-us/The+Warren+Buffett+Way,+30th+Anniversary+Edition-p-9781394239849" target="_blank" rel="noopener">Robert Hagstrom, <em>The Warren Buffett Way</em></a> — agrupamento dos tenets em negócio, gestão, financeiro e valor</li>
        <li><a href="https://blog.validea.com/quantifying-warren-buffett/" target="_blank" rel="noopener">Critérios quantitativos de <em>Buffettology</em></a> — ROE acima de 15%, dívida quitável em menos de 5 anos, consistência do lucro</li>
      </ul>
      <p class="ajuda" style="margin-top:12px"><b>Honestidade sobre o limite:</b> este app organiza e checa números.
        Buffett e Munger acertaram por décadas por causa de julgamento sobre pessoas, temperamento em crises e paciência
        para ficar anos sem comprar nada. Isso não cabe em software — e é justamente a parte que mais pesa.</p>
    </div>

    <div class="cartao">
      <h2>Como este app decide o que é "barato e vai crescer"</h2>
      <p class="ajuda">Barato não é preço baixo em reais. Uma ação de R$ 2 pode ser cara e uma de R$ 200 pode ser barata.
        Barato é preço abaixo do valor que o negócio gera. O app calcula esse valor por quatro caminhos independentes
        e cruza com crescimento, qualidade e risco.</p>
      <ol class="passos">
        <li><b>Estima o preço justo por 4 métodos</b> — Graham (lucro + patrimônio), Bazin (dividendo sobre yield desejado),
            múltiplo justo do setor e fluxo de caixa descontado. Descarta o maior e o menor e tira a média dos do meio,
            para um método otimista sozinho não puxar o resultado.</li>
        <li><b>Nota "está barata?" (0-100)</b> — earnings yield, P/VP, dividend yield e o desconto contra o preço justo.</li>
        <li><b>Nota "está crescendo?"</b> — CAGR de receita e de lucro em 5 anos, crescimento estimado à frente e PEG.
            É esta nota que separa oportunidade de armadilha de valor.</li>
        <li><b>Nota "tem qualidade?"</b> — ROE, margem líquida e payout. Empresa barata que não dá retorno sobre o capital
            costuma continuar barata.</li>
        <li><b>Nota "risco controlado?"</b> — alavancagem, liquidez corrente, beta e liquidez diária de negociação.</li>
        <li><b>Score final</b> — média ponderada das quatro notas, com pesos que mudam conforme o seu perfil.
            O veredito combina o score com o desconto exigido de margem de segurança.</li>
      </ol>
      <p class="ajuda" style="margin-top:14px"><b>Onde o modelo erra:</b> métodos de valor (Graham, Bazin, múltiplo do setor)
        castigam empresas de crescimento acelerado, que negociam a múltiplos altos justamente porque o lucro de hoje
        é pequeno perto do de amanhã. Se uma empresa que você admira aparece com upside muito negativo, olhe a nota de
        crescimento antes de descartá-la — e o contrário também vale: upside acima de 100% quase nunca é dinheiro fácil,
        é risco que os números não capturam.</p>
      <p class="ajuda"><b>O que o modelo não vê:</b> mudança de gestão, processo judicial,
        risco regulatório, fraude contábil, interferência política em estatal, perda de contrato relevante.
        É exatamente para cobrir esses pontos que existem os roteiros de análise da aba Prompts.</p>
    </div>

    <div class="cartao">
      <h2>Checklist antes de comprar</h2>
      <ol class="passos">
        <li>Entendo como a empresa ganha dinheiro em uma frase?</li>
        <li>O lucro cresceu nos últimos 5 anos ou só a receita?</li>
        <li>Por que está barata? Existe um motivo concreto no noticiário ou nos balanços?</li>
        <li>A dívida cabe na geração de caixa se o juro subir mais 3 pontos?</li>
        <li>Qual o preço máximo que pago (preço justo menos a margem de segurança)?</li>
        <li>Quanto do meu patrimônio isso representa? Aguento ver cair 40% sem vender no pânico?</li>
        <li>O que precisa acontecer para minha tese estar errada — e como vou perceber isso a tempo?</li>
      </ol>
    </div>

    <div class="cartao">
      <h2>Glossário dos indicadores</h2>
      <div class="glossario">
        ${GLOSSARIO.map(([t, d, r]) => `<div class="termo"><h4>${t}</h4><p>${d}</p><div class="regra">${r}</div></div>`).join("")}
      </div>
    </div>`;
}

/* ================= CONFIG ================= */
function renderCirculo() {
  const setores = [...new Set(estado.dados.map((a) => a.setor))].sort();
  el("circulo").innerHTML = setores.map((st) => `
    <label><input type="checkbox" data-circulo="${st}" ${estado.circulo.includes(st) ? "checked" : ""}> <span>${st}</span></label>`).join("");
  el("circulo").querySelectorAll("[data-circulo]").forEach((c) =>
    c.addEventListener("change", () => {
      const st = c.dataset.circulo;
      estado.circulo = c.checked
        ? [...new Set([...estado.circulo, st])]
        : estado.circulo.filter((x) => x !== st);
      salvar(LS.circulo, estado.circulo);
      recalcular();
    }));
}

function renderConfig() {
  el("editorDados").value = JSON.stringify(estado.dados, null, 2);
  el("editorParams").value = JSON.stringify(estado.params, null, 2);
  el("token").value = carregar(LS.token) || "";
  el("moedaBase").value = estado.moedaBase;
  const b = estado.premissasB;
  el("pPremio").value = b.premioRisco; el("vPremio").textContent = b.premioRisco;
  el("pPiso").value = b.taxaMinima; el("vPiso").textContent = b.taxaMinima;
  el("pMargemBuf").value = b.margemBuffett; el("vMargemBuf").textContent = b.margemBuffett;
  renderCirculo();
  const p = estado.premissas;
  el("pTaxa").value = p.taxaDesconto; el("vTaxa").textContent = p.taxaDesconto;
  el("pPerp").value = p.crescPerpetuo; el("vPerp").textContent = p.crescPerpetuo;
  el("pYield").value = p.yieldDesejado; el("vYield").textContent = p.yieldDesejado;
  el("pMargem").value = p.margemSeguranca; el("vMargem").textContent = p.margemSeguranca;
}

async function atualizarPrecos() {
  const token = el("token").value.trim();
  const st = el("statusApi");
  if (!token) { st.textContent = "informe um token da brapi.dev"; st.className = "status erro"; return; }
  salvar(LS.token, token);

  const tickersBR = estado.dados.filter((a) => a.pais === "BR").map((a) => a.ticker);
  if (!tickersBR.length) { st.textContent = "nenhum ativo da B3 na base"; st.className = "status erro"; return; }
  st.textContent = "buscando cotações..."; st.className = "status";

  try {
    let atualizados = 0;
    // a API aceita vários tickers por chamada; divide em lotes de 10
    for (let i = 0; i < tickersBR.length; i += 10) {
      const lote = tickersBR.slice(i, i + 10);
      const r = await fetch(`https://brapi.dev/api/quote/${lote.join(",")}?token=${encodeURIComponent(token)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      (json.results || []).forEach((q) => {
        const a = estado.dados.find((x) => x.ticker === q.symbol);
        if (a && q.regularMarketPrice > 0) {
          a.preco = q.regularMarketPrice;
          if (q.fiftyTwoWeekHigh) a.max52 = q.fiftyTwoWeekHigh;
          if (q.fiftyTwoWeekLow) a.min52 = q.fiftyTwoWeekLow;
          atualizados++;
        }
      });
    }
    salvar(LS.dados, estado.dados);
    estado.origemPrecos = "api";
    el("badgeDados").textContent = "preços via API";
    el("badgeDados").classList.remove("local");
    st.textContent = `${atualizados} cotações atualizadas ✓`; st.className = "status ok";
    recalcular();
    renderConfig();
  } catch (e) {
    st.textContent = `falhou: ${e.message}. Os fundamentos continuam válidos; só o preço não foi atualizado.`;
    st.className = "status erro";
  }
}

function salvarDados() {
  const st = el("statusDados");
  try {
    const novo = JSON.parse(el("editorDados").value);
    if (!Array.isArray(novo) || !novo.length) throw new Error("esperava uma lista de ativos");
    const faltando = novo.find((a) => !a.ticker || typeof a.preco !== "number");
    if (faltando) throw new Error("todo ativo precisa de 'ticker' e 'preco' numérico");
    estado.dados = novo;
    salvar(LS.dados, novo);
    st.textContent = `base salva com ${novo.length} ativos ✓`; st.className = "status ok";
    recalcular();
  } catch (e) {
    st.textContent = `JSON inválido: ${e.message}`; st.className = "status erro";
  }
}

function salvarParams() {
  const st = el("statusParams");
  try {
    const novo = JSON.parse(el("editorParams").value);
    if (!novo.FX || !novo.juros) throw new Error("esperava as chaves 'FX' e 'juros'");
    if (!(novo.FX.BRL > 0)) throw new Error("FX.BRL deve existir e ser maior que zero");
    estado.params = novo;
    salvar(LS.params, novo);
    st.textContent = "parâmetros salvos ✓"; st.className = "status ok";
    recalcular();
  } catch (e) {
    st.textContent = `JSON inválido: ${e.message}`; st.className = "status erro";
  }
}

/* ================= NAVEGAÇÃO E EVENTOS ================= */
function trocarAba(nome) {
  document.querySelectorAll(".aba").forEach((b) => b.classList.toggle("ativa", b.dataset.aba === nome));
  document.querySelectorAll(".painel").forEach((p) => p.classList.toggle("ativo", p.id === `painel-${nome}`));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function preencherSelects() {
  const opcoes = estado.analisadas
    .slice().sort((a, b) => a.ticker.localeCompare(b.ticker))
    .map((a) => `<option value="${a.ticker}">${a.ticker} — ${a.nome}</option>`).join("");
  const sel = el("selAtivo"), car = el("cAtivo");
  const antes = sel.value, antesC = car.value;
  sel.innerHTML = opcoes; car.innerHTML = opcoes;
  sel.value = estado.selecionado || antes || (estado.analisadas[0] || {}).ticker || "";
  car.value = antesC || sel.value;

  const setores = [...new Set(estado.dados.map((a) => a.setor))].sort();
  const fs = el("fSetor"), antesS = fs.value;
  fs.innerHTML = `<option value="">todos</option>` + setores.map((s) => `<option value="${s}">${s}</option>`).join("");
  fs.value = antesS;

  const regioes = [...new Set(estado.analisadas.map((a) => a.regiao))].sort();
  [["fRegiao", "todas"], ["bRegiao", "todas"]].forEach(([id, rot]) => {
    const sel = el(id), antes = sel.value;
    sel.innerHTML = `<option value="">${rot}</option>` + regioes.map((r) => `<option value="${r}">${r}</option>`).join("");
    sel.value = antes;
  });

  const selos = [...new Set(estado.analisadas.map((a) => a.buff.selo.rotulo))].sort();
  const bs = el("bSelo"), antesSelo = bs.value;
  bs.innerHTML = `<option value="">todos</option>` + selos.map((x) => `<option value="${x}">${x}</option>`).join("");
  bs.value = antesSelo;
}

function ligarEventos() {
  el("abas").addEventListener("click", (e) => {
    if (e.target.dataset.aba) trocarAba(e.target.dataset.aba);
  });

  ["fBusca", "fSetor", "fRegiao", "fDivida", "fLucro"].forEach((id) =>
    el(id).addEventListener("input", renderTabela));

  const sliders = [["fScore", "vScore"], ["fUpside", "vUpside"], ["fPL", "vPL"], ["fDY", "vDY"]];
  sliders.forEach(([id, saida]) => el(id).addEventListener("input", () => {
    el(saida).textContent = el(id).value;
    renderTabela();
  }));

  el("limparFiltros").addEventListener("click", () => {
    el("fBusca").value = ""; el("fSetor").value = ""; el("fRegiao").value = "";
    el("fScore").value = 0; el("vScore").textContent = "0";
    el("fUpside").value = -80; el("vUpside").textContent = "-80";
    el("fPL").value = 40; el("vPL").textContent = "40";
    el("fDY").value = 0; el("vDY").textContent = "0";
    el("fDivida").checked = false; el("fLucro").checked = true;
    renderTabela();
  });

  document.querySelectorAll("#tabela th[data-sort]").forEach((th) =>
    th.addEventListener("click", () => {
      const campo = th.dataset.sort;
      estado.ordem = { campo, desc: estado.ordem.campo === campo ? !estado.ordem.desc : true };
      renderTabela();
    }));

  el("perfil").addEventListener("change", () => {
    estado.premissas.perfil = el("perfil").value;
    salvar(LS.premissas, estado.premissas);
    recalcular();
  });

  el("selAtivo").addEventListener("change", () => {
    estado.selecionado = el("selAtivo").value;
    renderDetalhe();
  });

  el("btnAddCarteira").addEventListener("click", () => {
    el("cAtivo").value = estado.selecionado;
    trocarAba("carteira");
  });

  el("formCarteira").addEventListener("submit", (e) => {
    e.preventDefault();
    const ticker = el("cAtivo").value;
    const qtd = +el("cQtd").value;
    const a = estado.analisadas.find((x) => x.ticker === ticker);
    const precoMedio = +el("cPreco").value || (a ? a.preco : 0);
    if (!ticker || qtd <= 0) return;
    const existente = estado.carteira.find((p) => p.ticker === ticker);
    if (existente) {
      const qtdTotal = existente.qtd + qtd;
      existente.precoMedio = (existente.precoMedio * existente.qtd + precoMedio * qtd) / qtdTotal;
      existente.qtd = qtdTotal;
    } else {
      estado.carteira.push({ ticker, qtd, precoMedio });
    }
    salvar(LS.carteira, estado.carteira);
    el("cPreco").value = "";
    renderCarteira();
  });

  const premissasSliders = [
    ["pTaxa", "vTaxa", "taxaDesconto"], ["pPerp", "vPerp", "crescPerpetuo"],
    ["pYield", "vYield", "yieldDesejado"], ["pMargem", "vMargem", "margemSeguranca"]
  ];
  premissasSliders.forEach(([id, saida, chave]) =>
    el(id).addEventListener("input", () => {
      el(saida).textContent = el(id).value;
      estado.premissas[chave] = +el(id).value;
      salvar(LS.premissas, estado.premissas);
      recalcular();
    }));

  // filtros da aba Buffett
  ["bRegiao", "bSelo", "bMoat", "bCirculo"].forEach((id) =>
    el(id).addEventListener("input", renderBuffett));
  [["bTenets", "vTenets"], ["bMargem", "vMargemB"]].forEach(([id, saida]) =>
    el(id).addEventListener("input", () => { el(saida).textContent = el(id).value; renderBuffett(); }));

  document.querySelectorAll("#tabelaBuffett th[data-sortb]").forEach((th) =>
    th.addEventListener("click", () => {
      const campo = th.dataset.sortb;
      estado.ordemB = { campo, desc: estado.ordemB.campo === campo ? !estado.ordemB.desc : true };
      renderBuffett();
    }));

  // premissas do crivo Buffett
  [["pPremio", "vPremio", "premioRisco"], ["pPiso", "vPiso", "taxaMinima"],
   ["pMargemBuf", "vMargemBuf", "margemBuffett"]].forEach(([id, saida, chave]) =>
    el(id).addEventListener("input", () => {
      el(saida).textContent = el(id).value;
      estado.premissasB[chave] = +el(id).value;
      salvar(LS.premissasB, estado.premissasB);
      recalcular();
    }));

  el("moedaBase").addEventListener("change", () => {
    estado.moedaBase = el("moedaBase").value;
    salvar(LS.moedaBase, estado.moedaBase);
    renderCarteira();
  });

  el("btnSalvarParams").addEventListener("click", salvarParams);
  el("btnAtualizar").addEventListener("click", atualizarPrecos);
  el("btnSalvarDados").addEventListener("click", salvarDados);
  el("btnResetDados").addEventListener("click", () => {
    if (!confirm("Restaurar a base original? Suas edições de fundamentos serão perdidas (a carteira é mantida).")) return;
    estado.dados = UNIVERSO.map((a) => ({ ...a }));
    localStorage.removeItem(LS.dados);
    estado.origemPrecos = "local";
    el("badgeDados").textContent = "base local";
    el("badgeDados").classList.add("local");
    recalcular();
    renderConfig();
    el("statusDados").textContent = "base original restaurada ✓";
    el("statusDados").className = "status ok";
  });
}

/* ================= INÍCIO ================= */
function iniciar() {
  el("perfil").value = estado.premissas.perfil;
  el("badgeDados").classList.add("local");
  el("badgeDados").title = DATA_REF;
  ligarEventos();
  renderPrompts();
  renderConfig();
  recalcular();
  renderAprender();
}

document.addEventListener("DOMContentLoaded", iniciar);
