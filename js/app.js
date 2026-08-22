/* ============================================================
   APP — liga a base de dados, o motor de análise e a interface
   ============================================================ */

const LS = { dados: "ar_dados", carteira: "ar_carteira", premissas: "ar_premissas", token: "ar_token" };

const estado = {
  dados: carregar(LS.dados) || ACOES.map((a) => ({ ...a })),
  carteira: carregar(LS.carteira) || [],
  premissas: { ...PREMISSAS_PADRAO, ...(carregar(LS.premissas) || {}) },
  analisadas: [],
  ordem: { campo: "score", desc: true },
  selecionado: null,
  origemPrecos: "local"
};

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
  estado.analisadas = analisarTodos(estado.dados, estado.premissas);
  renderResumo();
  renderTabela();
  preencherSelects();
  renderDetalhe();
  renderCarteira();
}

/* ================= RADAR ================= */
function filtrar() {
  const busca = el("fBusca").value.trim().toLowerCase();
  const setor = el("fSetor").value;
  const pais = el("fPais").value;
  const minScore = +el("fScore").value;
  const minUpside = +el("fUpside").value;
  const maxPL = +el("fPL").value;
  const minDY = +el("fDY").value;
  const semDivida = el("fDivida").checked;
  const soLucro = el("fLucro").checked;

  return estado.analisadas.filter((a) => {
    if (busca && !(a.ticker.toLowerCase().includes(busca) || a.nome.toLowerCase().includes(busca))) return false;
    if (setor && a.setor !== setor) return false;
    if (pais && a.pais !== pais) return false;
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
    roe: (a) => a.roe, cresc: (a) => a.crescEst, score: (a) => a.score
  }[campo] || ((a) => a.score);

  return lista.slice().sort((x, y) => {
    const vx = chave(x), vy = chave(y);
    const cmp = typeof vx === "string" ? vx.localeCompare(vy) : vx - vy;
    return desc ? -cmp : cmp;
  });
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
      <td><div class="tk">${a.ticker}</div><div class="nm">${a.nome}</div></td>
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
    <div class="kpi"><div class="rot">Negociando abaixo de 10x lucro</div><div class="val">${baratas}</div>
      <div class="obs">P/L menor que 10</div></div>
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

/* ================= CARTEIRA ================= */
function renderCarteira() {
  const linhas = estado.carteira.map((p) => {
    const a = estado.analisadas.find((x) => x.ticker === p.ticker);
    if (!a) return null;
    const investido = p.qtd * p.precoMedio;
    const atual = p.qtd * a.preco;
    return { ...p, a, investido, atual, resultado: atual - investido };
  }).filter(Boolean);

  const totalAtual = linhas.reduce((s, l) => s + l.atual, 0);
  const totalInvestido = linhas.reduce((s, l) => s + l.investido, 0);

  el("corpoCarteira").innerHTML = linhas.length ? linhas.map((l) => {
    const peso = totalAtual ? (l.atual / totalAtual) * 100 : 0;
    const varPct = l.investido ? (l.resultado / l.investido) * 100 : 0;
    return `<tr>
      <td><div class="tk">${l.ticker}</div><div class="nm">${l.a.setor}</div></td>
      <td class="n">${l.qtd}</td>
      <td class="n">${money(l.precoMedio, l.a.moeda)}</td>
      <td class="n">${money(l.a.preco, l.a.moeda)}</td>
      <td class="n">${money(l.investido, l.a.moeda)}</td>
      <td class="n">${money(l.atual, l.a.moeda)}</td>
      <td class="n ${sinal(l.resultado)}">${money(l.resultado, l.a.moeda)} (${pct(varPct, 1)})</td>
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
    <div class="kpi"><div class="rot">Investido</div><div class="val">${money(totalInvestido)}</div></div>
    <div class="kpi"><div class="rot">Valor hoje</div><div class="val">${money(totalAtual)}</div></div>
    <div class="kpi"><div class="rot">Resultado</div><div class="val ${sinal(resultado)}">${money(resultado)}</div>
      <div class="obs">${pct(totalInvestido ? (resultado / totalInvestido) * 100 : 0)}</div></div>
    <div class="kpi"><div class="rot">Score médio</div><div class="val">${scoreMedio.toFixed(0)}</div>
      <div class="obs">ponderado pelo valor</div></div>
    <div class="kpi"><div class="rot">Upside médio</div><div class="val ${sinal(upsideMedio)}">${pct(upsideMedio, 0)}</div></div>
    <div class="kpi"><div class="rot">Yield da carteira</div><div class="val">${pct(dyMedio)}</div>
      <div class="obs">renda anual estimada: ${money(totalAtual * dyMedio / 100)}</div></div>
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
function renderConfig() {
  el("editorDados").value = JSON.stringify(estado.dados, null, 2);
  el("token").value = carregar(LS.token) || "";
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
}

function ligarEventos() {
  el("abas").addEventListener("click", (e) => {
    if (e.target.dataset.aba) trocarAba(e.target.dataset.aba);
  });

  ["fBusca", "fSetor", "fPais", "fDivida", "fLucro"].forEach((id) =>
    el(id).addEventListener("input", renderTabela));

  const sliders = [["fScore", "vScore"], ["fUpside", "vUpside"], ["fPL", "vPL"], ["fDY", "vDY"]];
  sliders.forEach(([id, saida]) => el(id).addEventListener("input", () => {
    el(saida).textContent = el(id).value;
    renderTabela();
  }));

  el("limparFiltros").addEventListener("click", () => {
    el("fBusca").value = ""; el("fSetor").value = ""; el("fPais").value = "";
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

  el("btnAtualizar").addEventListener("click", atualizarPrecos);
  el("btnSalvarDados").addEventListener("click", salvarDados);
  el("btnResetDados").addEventListener("click", () => {
    if (!confirm("Restaurar a base original? Suas edições de fundamentos serão perdidas (a carteira é mantida).")) return;
    estado.dados = ACOES.map((a) => ({ ...a }));
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
  renderAprender();
  renderConfig();
  recalcular();
}

document.addEventListener("DOMContentLoaded", iniciar);
