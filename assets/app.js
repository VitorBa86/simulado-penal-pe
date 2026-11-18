/* Simulados Polícia Penal PE — app estático (sem dependências) */
(function(){
"use strict";

/* ---------- constantes ---------- */
var DISC = {
  LP:"Língua Portuguesa", ETI:"Ética no Serviço Público", LEG:"Legislação Estadual", INF:"Noções de Informática",
  ADM:"Direito Administrativo", CON:"Direito Constitucional", PEN:"Direito Penal", PPE:"Direito Processual Penal",
  LES:"Legislação Especial", EXE:"Execução Penal", DH:"Direitos Humanos"
};
var DISC_ORDER = ["LP","ETI","LEG","INF","ADM","CON","PEN","PPE","LES","EXE","DH"];
var TRAPS = {
  ABS:   ["Absoluto falso", "A opção usa “sempre”, “somente”, “exclusivamente”, “em qualquer hipótese” numa regra que tem exceção."],
  VIZ:   ["Instituto vizinho", "Descreve um instituto e dá o nome de outro parecido (concussão × corrupção, flagrante impróprio × presumido...)."],
  NUM:   ["Número trocado", "Prazo, fração, percentual ou quantidade alterados — às vezes pelo número de outra lei."],
  COMP:  ["Sujeito ou competência trocada", "Atribui o ato à autoridade, ao órgão ou à pessoa errada."],
  EXC:   ["Exceção esquecida", "Apresenta a regra geral onde a lei abre exceção expressa (ou o contrário)."],
  SUBJ:  ["Elemento subjetivo trocado", "Troca dolo por culpa ou dispensa a finalidade específica que o tipo exige."],
  ALC:   ["Alcance ampliado ou reduzido", "Acrescenta ou retira uma palavra que muda quem ou o que a regra alcança."],
  DESAT: ["Lei desatualizada", "A afirmação era verdadeira pela redação antiga da lei ou por entendimento superado."],
  INV:   ["Conceitos invertidos", "Troca entre si os efeitos, teorias ou características de dois institutos."],
  SENSO: ["Bom senso enganoso", "Soa razoável na prática do dia a dia, mas contraria a norma."],
  EXTRAP:["Extrapolação do texto", "Afirma mais do que o texto diz: transforma condição em prioridade, possibilidade em certeza."],
  REF:   ["Referente trocado", "O pronome ou a expressão retoma outro termo, plausível pela concordância, mas não pelo sentido."],
  GRAM:  ["Armadilha gramatical", "Uma parte correta da frase mascara o erro gramatical em outra parte."],
  CALC:  ["Cálculo incompleto", "Resultado parcial: falta somar, cumular ou aplicar uma regra do cálculo."],
  LIT:   ["Literalidade alterada", "Copia o texto da lei e troca uma única palavra que muda o sentido."]
};
var LETTERS = ["A","B","C","D","E"];
var LS = {
  state: function(id){ return "ppe_sim_state_v1_" + id; },
  hist: "ppe_sim_hist_v1",
  disc: function(id){ return "ppe_sim_disc_v1_" + id; },
  theme: "ppe_sim_theme"
};
var MIN_NFPO = 30;

/* ---------- utilitários ---------- */
function $(s, r){ return (r||document).querySelector(s); }
function $all(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
function load(k, d){ try{ var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }
function save(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
function del(k){ try{ localStorage.removeItem(k); }catch(e){} }
function pct(a, b){ return b ? Math.round(a * 100 / b) : 0; }
function fmtTime(s){ s = Math.max(0, Math.floor(s)); var h = Math.floor(s/3600), m = Math.floor(s%3600/60), x = s%60; return h + ":" + (m<10?"0":"") + m + ":" + (x<10?"0":"") + x; }
function fmtDur(s){ s = Math.round(s); var h = Math.floor(s/3600), m = Math.round(s%3600/60); return h ? h + "h" + (m<10?"0":"") + m : m + " min"; }
function fmtDate(t){ var d = new Date(t); return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}); }
function mulberry32(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd){ for (var i = arr.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
function colorFor(p){ return p >= 70 ? "var(--ok)" : p >= 50 ? "var(--yellow)" : "var(--bad)"; }

/* ---------- preparação dos simulados (embaralhamento fixo) ---------- */
var SIMS = (window.SIMULADOS || []).slice().sort(function(a,b){ return a.id - b.id; });
var PREP = {};
function prep(sim){
  if (PREP[sim.id]) return PREP[sim.id];
  var rnd = mulberry32(sim.id * 7919 + 17);
  var seq = []; for (var k = 0; k < Math.ceil(sim.q.length/5); k++) seq.push(0,1,2,3,4);
  shuffle(seq, rnd);
  var out = sim.q.map(function(q, i){
    var opts, c, trap;
    if (q.fixa){ opts = q.o.slice(); c = q.c; trap = (q.pi != null ? q.pi : -1); }
    else {
      var pos = seq[i]; var rest = [0,1,2,3,4].filter(function(x){ return x !== pos; }); shuffle(rest, rnd);
      opts = new Array(5); opts[pos] = q.o[0]; c = pos; trap = rest[0];
      for (var j = 1; j < 5; j++) opts[rest[j-1]] = q.o[j];
    }
    return { i:i, n:i+1, d:q.d, a:q.a, t:q.t, e:q.e, opts:opts, c:c, trap:trap, x:q.x, p:q.p || null, bloco: i < 20 ? "P1" : "P2" };
  });
  PREP[sim.id] = out; return out;
}
function simById(id){ for (var i = 0; i < SIMS.length; i++) if (SIMS[i].id == id) return SIMS[i]; return null; }

/* ---------- histórico ---------- */
function hist(){ return load(LS.hist, []); }
function histFor(id){ return hist().filter(function(h){ return h.simId == id; }); }
function addHist(rec){ var h = hist(); h.push(rec); save(LS.hist, h); }

/* ---------- tema ---------- */
(function(){ var t = load(LS.theme, null); if (t) document.documentElement.setAttribute("data-theme", t); })();
function toggleTheme(){
  var cur = document.documentElement.getAttribute("data-theme");
  var dark = cur ? cur === "dark" : window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  var nt = dark ? "light" : "dark"; document.documentElement.setAttribute("data-theme", nt); save(LS.theme, nt);
}

/* ---------- layout base ---------- */
var app = document.getElementById("app");
var timerHandle = null;
function stopTimer(){ if (timerHandle){ clearInterval(timerHandle); timerHandle = null; } }
function topbar(extra){
  return '<header class="top"><div class="wrap">' +
    '<a class="brand" href="#/"><span class="brand-badge"><svg width="20" height="20" viewBox="0 0 64 64"><path d="M32 6l22 8v16c0 14-10 24-22 28C20 54 10 44 10 30V14z" fill="#1B2A4A"/><path d="M23 32l6 6 12-13" stroke="#F5B700" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
    '<span><b>SIMULADOS DA APROVAÇÃO</b><small>Polícia Penal PE • Cebraspe</small></span></a>' +
    '<span class="sp"></span>' + (extra || '') +
    '<button class="tbtn" data-act="theme" aria-label="Alternar tema claro/escuro">◐</button>' +
    '</div></header>';
}
function render(html){ app.innerHTML = html; window.scrollTo(0,0); }
document.addEventListener("click", function(ev){
  var t = ev.target.closest("[data-act='theme']"); if (t){ toggleTheme(); }
});

/* ---------- modal ---------- */
function modal(html, bind){
  var bg = document.createElement("div"); bg.className = "modal-bg";
  bg.innerHTML = '<div class="modal card" role="dialog" aria-modal="true">' + html + '</div>';
  document.body.appendChild(bg);
  function close(){ if (bg.parentNode) bg.parentNode.removeChild(bg); document.removeEventListener("keydown", onk); }
  function onk(e){ if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onk);
  bg.addEventListener("click", function(e){ if (e.target === bg) close(); });
  if (bind) bind(bg, close);
  var f = bg.querySelector("button"); if (f) f.focus();
  return close;
}

/* =================== HOME =================== */
function viewHome(){
  stopTimer();
  var H = hist();
  var provas = H.filter(function(h){ return h.mode === "prova" && h.total === 60; });
  var media = provas.length ? (provas.reduce(function(s,h){ return s + h.acertos; }, 0) / provas.length) : null;
  var cards = SIMS.map(function(s){
    var hs = histFor(s.id).filter(function(h){ return h.mode === "prova" && h.total === 60; });
    var best = hs.reduce(function(m,h){ return Math.max(m, h.acertos); }, -1);
    var st = load(LS.state(s.id), null);
    var chips = '<span class="chip">60 questões</span><span class="chip">20 gerais + 40 específicas</span>';
    if (best >= 0) chips += '<span class="chip ' + (best >= MIN_NFPO ? "ok" : "bad") + '">Melhor: ' + best + '/60</span>';
    if (st) chips += '<span class="chip warn">Em andamento</span>';
    return '<article class="card sim">' +
      '<div class="num">Simulado ' + s.id + ' • ' + esc(s.tema || "") + '</div>' +
      '<h3>' + esc(s.titulo) + '</h3><p>' + esc(s.descricao || "") + '</p>' +
      '<div class="meta">' + chips + '</div>' +
      '<div class="acts">' +
        (st ? '<button class="btn btn-primary" data-go="resume" data-id="' + s.id + '">Continuar</button>' +
              '<button class="btn btn-ghost" data-go="start" data-id="' + s.id + '">Recomeçar</button>'
            : '<button class="btn btn-primary" data-go="start" data-id="' + s.id + '">Iniciar simulado</button>') +
        (hs.length ? '<a class="btn btn-ghost" href="#/resultado/' + hs[hs.length-1].aid + '">Último resultado</a>' : '') +
      '</div></article>';
  }).join("");
  if (!SIMS.length) cards = '<div class="card pad empty">Nenhum simulado encontrado na pasta <code>data/</code>.</div>';

  render(topbar('<a class="tbtn" href="#/painel">Meu desempenho</a>') +
    '<section class="hero"><div class="wrap">' +
      '<span class="kicker">EDITAL Nº 1 SAD-SEAP/PE 2026 • POLICIAL PENAL</span>' +
      '<h1>5 simulados no <span>padrão Cebraspe</span></h1>' +
      '<p>Cada simulado reproduz a estrutura das provas objetivas do edital: 60 questões de múltipla escolha (A a E), com a mesma distribuição de conteúdos, as pegadinhas que a banca mais usa e correção completa no final.</p>' +
      '<div class="facts">' +
        '<div class="fact"><b>60</b><span>questões (P1 20 + P2 40)</span></div>' +
        '<div class="fact"><b>A–E</b><span>uma única correta</span></div>' +
        '<div class="fact"><b>4h30</b><span>objetivas + discursiva</span></div>' +
        '<div class="fact"><b>30</b><span>pontos mínimos (NFPO)</span></div>' +
      '</div></div></section>' +
    '<main class="wrap lift">' +
      (media != null ? '<div class="card pad" style="margin-bottom:14px;display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div><div class="note">Sua média nos simulados completos</div><div class="cond" style="font-size:34px;font-weight:800;line-height:1">' + media.toFixed(1).replace(".",",") + ' <span style="font-size:18px;color:var(--muted)">/ 60</span></div></div><span class="chip ' + (media >= MIN_NFPO ? "ok" : "bad") + '">' + provas.length + ' simulado' + (provas.length>1?"s":"") + ' feito' + (provas.length>1?"s":"") + '</span><span class="sp" style="flex:1"></span><a class="btn btn-dark btn-sm" href="#/painel">Ver painel completo</a></div>' : '') +
      '<div class="grid-sims">' + cards + '</div>' +
      '<section class="section"><h2>Como funciona</h2>' +
        '<div class="howto">' +
          '<div class="card pad"><h3>1. Escolha o modo</h3><p><b>Prova:</b> cronômetro de 4h30 e gabarito só no final, como no dia. <b>Treino:</b> comentário logo após cada resposta.</p></div>' +
          '<div class="card pad"><h3>2. Faça como na prova</h3><p>Risque alternativas (✕), marque questões para revisar e use o mapa de questões. O progresso fica salvo neste navegador.</p></div>' +
          '<div class="card pad"><h3>3. Estude o resultado</h3><p>Nota, situação em relação ao mínimo de 30 pontos, desempenho por disciplina, assuntos que mais errou e as pegadinhas em que caiu.</p></div>' +
        '</div></section>' +
      '<p class="foot">Questões inéditas, elaboradas a partir do conteúdo programático do edital (item 20), de provas anteriores e dos padrões de cobrança da Cebraspe. Não são questões oficiais. Legislação conforme a redação vigente em novembro de 2026; confira eventuais retificações do edital.</p>' +
    '</main>');

  $all("[data-go]").forEach(function(b){
    b.addEventListener("click", function(){
      var id = +b.getAttribute("data-id");
      if (b.getAttribute("data-go") === "resume"){ location.hash = "#/prova/" + id; return; }
      startDialog(id);
    });
  });
}

function startDialog(id, qids, forceMode){
  var sim = simById(id); if (!sim) return;
  var mode = forceMode || "prova", lim = 16200;
  var subset = qids && qids.length;
  modal(
    '<h3>' + esc(sim.titulo) + (subset ? ' • ' + qids.length + ' questões' : '') + '</h3>' +
    '<p>' + (subset ? 'Refaça apenas as questões que você errou ou deixou em branco.' : 'Escolha como quer fazer este simulado.') + '</p>' +
    '<div class="toggle" data-k="mode"><button data-v="prova" class="' + (mode==="prova"?"on":"") + '">Modo prova</button><button data-v="treino" class="' + (mode==="treino"?"on":"") + '">Modo treino</button></div>' +
    '<div class="toggle" data-k="lim"><button data-v="16200" class="on">4h30</button><button data-v="12600">3h30</button><button data-v="0">Sem limite</button></div>' +
    '<p class="note" style="margin-top:-6px">No dia, as 4h30 incluem a discursiva. Para treinar só as objetivas, reserve cerca de 1h para a redação (3h30).</p>' +
    (load(LS.state(id), null) && !subset ? '<p class="note" style="color:var(--bad)">Há um simulado em andamento: ele será descartado.</p>' : '') +
    '<div class="acts"><button class="btn btn-ghost" data-x="cancel">Cancelar</button><button class="btn btn-primary" data-x="go">Começar</button></div>',
    function(root, close){
      $all(".toggle", root).forEach(function(tg){
        $all("button", tg).forEach(function(b){
          b.addEventListener("click", function(){
            $all("button", tg).forEach(function(x){ x.classList.remove("on"); }); b.classList.add("on");
            if (tg.getAttribute("data-k") === "mode") mode = b.getAttribute("data-v"); else lim = +b.getAttribute("data-v");
          });
        });
      });
      $("[data-x='cancel']", root).addEventListener("click", close);
      $("[data-x='go']", root).addEventListener("click", function(){
        var all = prep(sim).map(function(q){ return q.i; });
        save(LS.state(id), { simId:id, mode:mode, qids: subset ? qids : all, ans:{}, cut:{}, flag:{}, locked:{}, cur:0, elapsed:0, limit:lim, started:Date.now() });
        close(); location.hash = "#/prova/" + id + "?t=" + Date.now();
      });
    });
}

/* =================== PROVA =================== */
function viewExam(id){
  stopTimer();
  var sim = simById(id); if (!sim){ location.hash = "#/"; return; }
  var st = load(LS.state(id), null); if (!st){ location.hash = "#/"; return; }
  var Q = prep(sim);
  var lastSave = 0;

  function persist(force){ var now = Date.now(); if (force || now - lastSave > 3000){ save(LS.state(id), st); lastSave = now; } }
  function q(){ return Q[st.qids[st.cur]]; }
  function answered(){ return st.qids.filter(function(i){ return st.ans[i] != null; }).length; }

  function gridHTML(){
    var p1 = [], p2 = [];
    st.qids.forEach(function(qi, k){
      var cls = (st.ans[qi] != null ? "ans " : "") + (k === st.cur ? "cur " : "") + (st.flag[qi] ? "fl" : "");
      var b = '<button class="' + cls + '" data-k="' + k + '" aria-label="Questão ' + Q[qi].n + '">' + Q[qi].n + '</button>';
      (Q[qi].bloco === "P1" ? p1 : p2).push(b);
    });
    return (p1.length ? '<div class="grid-lbl">P1 • Conhecimentos gerais</div><div class="grid-q">' + p1.join("") + '</div>' : '') +
           (p2.length ? '<div class="grid-lbl">P2 • Conhecimentos específicos</div><div class="grid-q">' + p2.join("") + '</div>' : '') +
           '<div class="legend"><span><i style="background:var(--navy)"></i>Respondida</span><span><i style="background:var(--surface);border:1px solid var(--line)"></i>Em branco</span><span><i style="background:var(--orange);border-radius:50%"></i>Revisar</span></div>';
  }

  function feedbackHTML(qq){
    var a = st.ans[qq.i]; var ok = a === qq.c;
    var h = '<div class="fb"><h4 style="color:' + (ok ? "var(--ok)" : "var(--bad)") + '">' + (ok ? "✔ Você acertou." : "✘ Resposta incorreta. Gabarito: " + LETTERS[qq.c]) + '</h4><p>' + esc(qq.x) + '</p>';
    if (qq.p && !ok){
      var T = TRAPS[qq.p[0]] || [qq.p[0], ""];
      h += '<div class="trap"><b>' + (a === qq.trap ? "Você caiu na pegadinha: " : "Pegadinha da questão: ") + esc(T[0]) + '.</b> ' + esc(qq.p[1]) + '</div>';
    }
    return h + '</div>';
  }

  function textoHTML(qq){
    if (!qq.t || !sim.textos || !sim.textos[qq.t]) return "";
    var T = sim.textos[qq.t];
    return '<details class="texto"' + (st.txtClosed ? '' : ' open') + '><summary>📄 ' + esc(T.titulo) + ' <span class="note" style="font-weight:500">(as questões ' + textRange(qq.t) + ' referem-se a ele)</span></summary><div class="body">' +
      T.corpo.map(function(p, k){ return '<p><span class="pn">§' + (k+1) + '</span>' + esc(p) + '</p>'; }).join("") +
      (T.fonte ? '<div class="fonte">' + esc(T.fonte) + '</div>' : '') + '</div></details>';
  }
  function textRange(t){ var ns = Q.filter(function(x){ return x.t === t; }).map(function(x){ return x.n; }); return ns.length ? ns[0] + " a " + ns[ns.length-1] : ""; }

  function draw(){
    var qq = q(); var locked = st.mode === "treino" && st.locked[qq.i];
    var cut = st.cut[qq.i] || [];
    var opts = qq.opts.map(function(o, k){
      var cls = "opt";
      if (st.ans[qq.i] === k) cls += " sel";
      if (cut.indexOf(k) >= 0) cls += " cut";
      if (locked){ if (k === qq.c) cls += " right"; else if (st.ans[qq.i] === k) cls += " wrong"; }
      return '<div class="' + cls + '" role="radio" aria-checked="' + (st.ans[qq.i] === k) + '" tabindex="0" data-o="' + k + '"><span class="l">' + LETTERS[k] + '</span><span class="t">' + esc(o) + '</span>' +
        (locked ? '' : '<button class="x" data-cut="' + k + '" title="Riscar alternativa" aria-label="Riscar alternativa ' + LETTERS[k] + '">✕</button>') + '</div>';
    }).join("");
    var left = st.limit ? st.limit - st.elapsed : null;
    var navBtns = '<button class="btn btn-ghost" data-nav="prev" ' + (st.cur === 0 ? "disabled" : "") + '>← Anterior</button>' +
      '<button class="btn btn-ghost flag ' + (st.flag[qq.i] ? "on" : "") + '" data-nav="flag">⚑ ' + (st.flag[qq.i] ? "Marcada" : "Revisar") + '</button>' +
      '<span class="sp"></span>' +
      (st.cur < st.qids.length - 1 ? '<button class="btn btn-dark" data-nav="next">Próxima →</button>' : '<button class="btn btn-primary" data-nav="finish">Finalizar</button>');

    render(topbar('<button class="tbtn" data-nav="finish">Finalizar</button>') +
      '<main class="wrap"><div class="exam">' +
        '<section>' +
          '<div class="qhead"><span class="qnum">' + qq.n + '</span><span><div class="qdisc">' + esc(DISC[qq.d]) + '</div><div class="qbloco">' + (qq.bloco === "P1" ? "P1 • Conhecimentos gerais" : "P2 • Conhecimentos específicos") + (st.mode === "treino" ? " • modo treino" : "") + '</div></span></div>' +
          textoHTML(qq) +
          '<div class="card pad"><p class="enun">' + esc(qq.e) + '</p><div class="opts" role="radiogroup">' + opts + '</div>' +
          (locked ? feedbackHTML(qq) : '') + '</div>' +
          '<div class="qnav desk">' + navBtns + '</div>' +
        '</section>' +
        '<aside class="side" id="side">' +
          '<div class="card pad"><div class="note">' + (st.limit ? "Tempo restante" : "Tempo decorrido") + '</div><div class="timer" id="tmr">' + fmtTime(st.limit ? left : st.elapsed) + '</div>' +
          '<div style="margin-top:12px" class="note">' + answered() + ' de ' + st.qids.length + ' respondidas</div><div class="prog" style="margin-top:6px"><i style="width:' + pct(answered(), st.qids.length) + '%"></i></div></div>' +
          '<div class="card pad">' + gridHTML() + '</div>' +
          '<button class="btn btn-primary" data-nav="finish">Finalizar e ver resultado</button>' +
          '<button class="btn btn-ghost mob-close" data-nav="closegrid" style="display:none">Fechar mapa</button>' +
        '</aside>' +
      '</div></main>' +
      '<div class="mobilebar"><span class="timer" id="tmr2">' + fmtTime(st.limit ? left : st.elapsed) + '</span>' +
        '<button class="btn btn-ghost btn-sm" data-nav="grid">' + answered() + '/' + st.qids.length + ' ▦</button><span class="sp"></span>' +
        '<button class="btn btn-ghost btn-sm" data-nav="prev" ' + (st.cur === 0 ? "disabled" : "") + ' aria-label="Anterior">←</button>' +
        '<button class="btn btn-ghost btn-sm flag ' + (st.flag[qq.i] ? "on" : "") + '" data-nav="flag" aria-label="Marcar para revisar">⚑</button>' +
        (st.cur < st.qids.length - 1 ? '<button class="btn btn-dark btn-sm" data-nav="next">Próxima →</button>' : '<button class="btn btn-primary btn-sm" data-nav="finish">Finalizar</button>') +
      '</div>');
    bind();
  }

  function choose(k){
    var qq = q(); if (st.mode === "treino" && st.locked[qq.i]) return;
    st.ans[qq.i] = (st.ans[qq.i] === k && st.mode !== "treino") ? null : k;
    if (st.ans[qq.i] == null) delete st.ans[qq.i];
    var c = st.cut[qq.i] || []; var ix = c.indexOf(k); if (ix >= 0) c.splice(ix, 1);
    if (st.mode === "treino" && st.ans[qq.i] != null) st.locked[qq.i] = true;
    persist(true); var y = window.scrollY; draw(); window.scrollTo(0, y);
  }
  function go(k){ if (k < 0 || k >= st.qids.length) return; st.cur = k; persist(true); draw(); }

  function bind(){
    var dt = $("details.texto"); if (dt) dt.addEventListener("toggle", function(){ st.txtClosed = !dt.open; persist(true); });
    $all(".opt[data-o]").forEach(function(el){
      el.addEventListener("click", function(e){ if (e.target.closest("[data-cut]")) return; choose(+el.getAttribute("data-o")); });
      el.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); choose(+el.getAttribute("data-o")); } });
    });
    $all("[data-cut]").forEach(function(b){
      b.addEventListener("click", function(e){
        e.stopPropagation(); var k = +b.getAttribute("data-cut"); var qq = q();
        var c = st.cut[qq.i] = st.cut[qq.i] || []; var ix = c.indexOf(k);
        if (ix >= 0) c.splice(ix, 1); else { c.push(k); if (st.ans[qq.i] === k) delete st.ans[qq.i]; }
        persist(true); var y = window.scrollY; draw(); window.scrollTo(0, y);
      });
    });
    $all(".grid-q button").forEach(function(b){ b.addEventListener("click", function(){ var s = $("#side"); if (s) s.classList.remove("show"); go(+b.getAttribute("data-k")); }); });
    $all("[data-nav]").forEach(function(b){
      b.addEventListener("click", function(){
        var a = b.getAttribute("data-nav");
        if (a === "prev") go(st.cur - 1);
        else if (a === "next") go(st.cur + 1);
        else if (a === "flag"){ var qq = q(); if (st.flag[qq.i]) delete st.flag[qq.i]; else st.flag[qq.i] = true; persist(true); var y = window.scrollY; draw(); window.scrollTo(0,y); }
        else if (a === "finish") confirmFinish();
        else if (a === "grid"){ var s = $("#side"); s.classList.add("show"); $(".mob-close", s).style.display = ""; }
        else if (a === "closegrid"){ $("#side").classList.remove("show"); }
      });
    });
  }

  function confirmFinish(timeUp){
    var blank = st.qids.length - answered();
    var flags = Object.keys(st.flag).length;
    if (timeUp){ finish(); return; }
    modal('<h3>Finalizar o simulado?</h3><p>' +
      (blank ? '<b>' + blank + ' questão' + (blank>1?"ões":"") + ' em branco.</b> Na prova, questão em branco vale zero e erro não desconta: chute com critério antes de entregar. ' : 'Todas as questões foram respondidas. ') +
      (flags ? flags + ' marcada' + (flags>1?"s":"") + ' para revisar.' : '') + '</p>' +
      '<div class="acts"><button class="btn btn-ghost" data-x="back">Voltar à prova</button><button class="btn btn-primary" data-x="ok">Finalizar</button></div>',
      function(root, close){
        $("[data-x='back']", root).addEventListener("click", close);
        $("[data-x='ok']", root).addEventListener("click", function(){ close(); finish(); });
      });
  }

  function finish(){
    stopTimer();
    var res = score(sim, st.qids, st.ans);
    var rec = { aid: "a" + Date.now().toString(36), simId: id, mode: st.mode, date: Date.now(), tempo: st.elapsed,
      qids: st.qids, ans: st.ans, acertos: res.acertos, erros: res.erros, brancos: res.brancos, total: st.qids.length, p1: res.p1, p2: res.p2 };
    addHist(rec); del(LS.state(id));
    location.hash = "#/resultado/" + rec.aid;
  }

  function onKey(e){
    if (!$("#tmr")) return;
    if (document.querySelector(".modal-bg")) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key.toUpperCase(); var ix = LETTERS.indexOf(k);
    if (ix >= 0){ e.preventDefault(); choose(ix); }
    else if (e.key === "ArrowRight"){ go(st.cur + 1); }
    else if (e.key === "ArrowLeft"){ go(st.cur - 1); }
  }
  if (window.__examKey) document.removeEventListener("keydown", window.__examKey);
  window.__examKey = onKey; document.addEventListener("keydown", onKey);

  draw();
  timerHandle = setInterval(function(){
    if (document.hidden) return;
    st.elapsed++;
    var shown = st.limit ? st.limit - st.elapsed : st.elapsed;
    [$("#tmr"), $("#tmr2")].forEach(function(el){ if (el){ el.textContent = fmtTime(shown); el.classList.toggle("low", !!st.limit && shown <= 900); } });
    persist(false);
    if (st.limit && shown <= 0){ persist(true); var mb = document.querySelector(".modal-bg"); if (mb) mb.remove(); finish(); }
  }, 1000);
  window.__examSave = function(){ if (load(LS.state(id), null)) save(LS.state(id), st); };
}

/* =================== CORREÇÃO =================== */
function score(sim, qids, ans){
  var Q = prep(sim); var r = { acertos:0, erros:0, brancos:0, p1:0, p2:0, p1t:0, p2t:0, disc:{}, assunto:{}, trap:{}, trapHit:0, items:[] };
  qids.forEach(function(i){
    var q = Q[i]; var a = ans[i]; var st = a == null ? "b" : (a === q.c ? "c" : "e");
    var hit = st === "e" && a === q.trap;
    r.items.push({ q:q, a:(a == null ? null : a), st:st, hit:hit });
    if (q.bloco === "P1") r.p1t++; else r.p2t++;
    var D = r.disc[q.d] = r.disc[q.d] || { c:0, t:0, e:0, b:0 }; D.t++;
    if (st === "c"){ r.acertos++; D.c++; if (q.bloco === "P1") r.p1++; else r.p2++; }
    else {
      if (st === "e"){ r.erros++; D.e++; } else { r.brancos++; D.b++; }
      var key = q.d + "|" + q.a; var A = r.assunto[key] = r.assunto[key] || { d:q.d, a:q.a, n:0, qs:[] }; A.n++; A.qs.push(q.n);
      if (st === "e" && q.p){ var T = r.trap[q.p[0]] = r.trap[q.p[0]] || { n:0, hit:0, qs:[] }; T.n++; T.qs.push(q.n); if (hit){ T.hit++; r.trapHit++; } }
    }
  });
  return r;
}

/* =================== RESULTADO =================== */
function ring(p, color){
  var R = 70, C = 2 * Math.PI * R, off = C * (1 - p / 100);
  return '<svg class="ring" viewBox="0 0 170 170" aria-hidden="true"><circle cx="85" cy="85" r="' + R + '" fill="none" stroke="var(--surface-2)" stroke-width="16"/>' +
    '<circle cx="85" cy="85" r="' + R + '" fill="none" stroke="' + color + '" stroke-width="16" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 85 85)"/>' +
    '<text x="85" y="84" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="40" fill="var(--text)">' + p + '%</text>' +
    '<text x="85" y="108" text-anchor="middle" font-family="Barlow" font-size="13" fill="var(--muted)">de acerto</text></svg>';
}
function barsHTML(disc){
  return '<div class="bars">' + DISC_ORDER.filter(function(d){ return disc[d]; }).map(function(d){
    var D = disc[d], p = pct(D.c, D.t);
    return '<div class="bar"><div class="n">' + DISC[d] + '<small>' + D.c + ' de ' + D.t + (D.b ? ' • ' + D.b + ' em branco' : '') + '</small></div>' +
      '<div class="track"><i style="width:' + Math.max(p, 2) + '%;background:' + colorFor(p) + '"></i></div><div class="v">' + p + '%</div></div>';
  }).join("") + '</div>';
}

function viewResult(aid, tab){
  stopTimer();
  var rec = hist().filter(function(h){ return h.aid === aid; })[0];
  if (!rec){ location.hash = "#/"; return; }
  var sim = simById(rec.simId); if (!sim){ location.hash = "#/"; return; }
  var r = score(sim, rec.qids, rec.ans);
  var full = rec.total === 60;
  var prev = hist().filter(function(h){ return h.mode === "prova" && h.total === 60 && h.aid !== aid; });
  var mediaPrev = prev.length ? prev.reduce(function(s,h){ return s + h.acertos; }, 0) / prev.length : null;
  var allFull = hist().filter(function(h){ return h.mode === "prova" && h.total === 60; });
  var mediaAll = allFull.length ? allFull.reduce(function(s,h){ return s + h.acertos; }, 0) / allFull.length : null;
  var p = pct(r.acertos, rec.total);
  tab = tab || "resumo";

  var trapsSorted = Object.keys(r.trap).map(function(k){ return { k:k, v:r.trap[k] }; }).sort(function(a,b){ return b.v.n - a.v.n; });
  var assSorted = Object.keys(r.assunto).map(function(k){ return r.assunto[k]; }).sort(function(a,b){ return b.n - a.n || DISC_ORDER.indexOf(a.d) - DISC_ORDER.indexOf(b.d); });
  var discWorst = DISC_ORDER.filter(function(d){ return r.disc[d]; }).map(function(d){ return { d:d, p:pct(r.disc[d].c, r.disc[d].t) }; }).sort(function(a,b){ return a.p - b.p; });

  var statusHTML = full
    ? (r.acertos >= MIN_NFPO ? '<span class="status ok">Acima do mínimo (NFPO ≥ 30)</span>' : '<span class="status bad">Abaixo do mínimo: eliminaria (NFPO &lt; 30)</span>')
    : '<span class="status" style="background:var(--surface-2)">Treino parcial</span>';

  var resumo =
    '<div class="two">' +
      '<div class="card pad"><h3 style="font-size:22px;margin-bottom:12px">Desempenho por disciplina</h3>' + barsHTML(r.disc) + '</div>' +
      '<div style="display:flex;flex-direction:column;gap:14px">' +
        '<div class="card pad"><h3 style="font-size:22px;margin-bottom:4px">Onde você mais perdeu pontos</h3>' +
          (assSorted.length ? '<ul class="list">' + assSorted.slice(0,5).map(function(A){ return '<li><span class="cnt">' + A.n + '</span><span class="tx">' + esc(A.a) + '<small>' + DISC[A.d] + ' • questões ' + A.qs.join(", ") + '</small></span></li>'; }).join("") + '</ul>' : '<p class="empty">Nenhum erro. Gabaritou!</p>') +
        '</div>' +
        '<div class="card pad"><h3 style="font-size:22px;margin-bottom:4px">Pegadinhas que mais te pegaram</h3>' +
          (trapsSorted.length ? '<ul class="list">' + trapsSorted.slice(0,4).map(function(t){ var T = TRAPS[t.k] || [t.k,""]; return '<li><span class="cnt w">' + t.v.n + '</span><span class="tx"><b>' + esc(T[0]) + '</b><small>' + esc(T[1]) + '</small></span></li>'; }).join("") + '</ul>' : '<p class="empty">Você não caiu em nenhuma pegadinha.</p>') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="card pad" style="margin-top:14px"><h3 style="font-size:22px;margin-bottom:6px">Plano de revisão sugerido</h3>' + planHTML(discWorst, assSorted, trapsSorted, r) + '</div>';

  var discTab = '<div class="card pad">' + barsHTML(r.disc) +
    '<p class="note" style="margin-top:14px">P1 (conhecimentos gerais): ' + r.p1 + ' de ' + r.p1t + ' • P2 (conhecimentos específicos): ' + r.p2 + ' de ' + r.p2t + '. Verde ≥ 70% • amarelo 50–69% • vermelho &lt; 50%.</p></div>';

  var trapTab = '<div class="card pad">' +
    (trapsSorted.length ? '<p class="sub" style="margin:0 0 6px">Nos seus erros, estes foram os mecanismos de armadilha. Em <b>' + r.trapHit + '</b> deles você marcou exatamente a alternativa-pegadinha da questão.</p><ul class="list">' +
      trapsSorted.map(function(t){ var T = TRAPS[t.k] || [t.k,""]; return '<li><span class="cnt w">' + t.v.n + '</span><span class="tx"><b>' + esc(T[0]) + '</b> — ' + esc(T[1]) + '<small>Questões ' + t.v.qs.join(", ") + (t.v.hit ? ' • marcou a pegadinha em ' + t.v.hit : '') + '</small></span></li>'; }).join("") + '</ul>'
      : '<p class="empty">Nenhuma pegadinha te derrubou neste simulado.</p>') +
    '<h3 style="font-size:20px;margin:18px 0 6px">Como a Cebraspe monta as armadilhas</h3><ul class="list">' +
    Object.keys(TRAPS).map(function(k){ return '<li><span class="tx"><b>' + esc(TRAPS[k][0]) + '</b><small>' + esc(TRAPS[k][1]) + '</small></span></li>'; }).join("") + '</ul></div>';

  var assTab = '<div class="card pad">' + (assSorted.length ? '<ul class="list">' + assSorted.map(function(A){ return '<li><span class="cnt">' + A.n + '</span><span class="tx">' + esc(A.a) + '<small>' + DISC[A.d] + ' • questões ' + A.qs.join(", ") + '</small></span></li>'; }).join("") + '</ul>' : '<p class="empty">Nenhum assunto com erro.</p>') + '</div>';

  var html = topbar('<a class="tbtn" href="#/painel">Meu desempenho</a>') +
    '<main class="wrap" style="padding-top:20px;padding-bottom:40px">' +
      '<div class="qdisc" style="margin-bottom:4px">' + esc(sim.titulo) + ' • ' + (rec.mode === "treino" ? "modo treino" : "modo prova") + ' • ' + fmtDate(rec.date) + '</div>' +
      '<h1 style="font-size:clamp(28px,5vw,40px);margin-bottom:16px">Seu resultado</h1>' +
      '<div class="res-hero">' +
        '<div class="card score">' + ring(p, colorFor(p)) + '<div class="big">' + r.acertos + '<span style="font-size:22px;color:var(--muted)"> / ' + rec.total + '</span></div><div class="lbl">' + (full ? "NFPO estimada (1 ponto por acerto)" : "acertos") + '</div>' + statusHTML + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:12px">' +
          '<div class="kpis">' +
            kpi(r.acertos, "Acertos", "") + kpi(r.erros, "Erros", "") + kpi(r.brancos, "Em branco", r.brancos ? '<span class="down">valem zero</span>' : "") +
            (full ? kpi(r.p1 + "/20", "P1 • Gerais", pct(r.p1,20) + "%") + kpi(r.p2 + "/40", "P2 • Específicos", pct(r.p2,40) + "%") : kpi(r.trapHit, "Pegadinhas exatas", "")) +
            kpi(fmtDur(rec.tempo), "Tempo", rec.total ? "≈ " + fmtDur(rec.tempo / rec.total) + " por questão" : "") +
          '</div>' +
          '<div class="card pad" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">' +
            (full && mediaPrev != null ? '<div><div class="note">Média dos seus simulados anteriores</div><b class="cond" style="font-size:26px">' + mediaPrev.toFixed(1).replace(".",",") + '/60</b> <span class="' + (r.acertos >= mediaPrev ? "up" : "down") + '" style="font-weight:700">' + (r.acertos >= mediaPrev ? "▲ +" : "▼ ") + (r.acertos - mediaPrev).toFixed(1).replace(".",",") + '</span></div>' : '') +
            (mediaAll != null ? '<div><div class="note">Sua média geral</div><b class="cond" style="font-size:26px">' + mediaAll.toFixed(1).replace(".",",") + '/60</b></div>' : '') +
            '<div><div class="note">Caiu na pegadinha exata</div><b class="cond" style="font-size:26px">' + r.trapHit + '</b> <span class="note">de ' + r.erros + ' erros</span></div>' +
            '<span style="flex:1"></span>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
              ((r.erros + r.brancos) ? '<button class="btn btn-primary btn-sm" data-r="redo-wrong">Refazer erradas (' + (r.erros + r.brancos) + ')</button>' : '') +
              '<button class="btn btn-ghost btn-sm" data-r="redo">Refazer simulado</button>' +
              '<button class="btn btn-ghost btn-sm" data-r="print">Imprimir</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<nav class="tabs" role="tablist">' + [["resumo","Resumo"],["disciplinas","Disciplinas"],["pegadinhas","Pegadinhas"],["assuntos","Assuntos"],["questoes","Correção comentada"],["discursiva","Discursiva"]].map(function(t){ return '<button role="tab" class="' + (tab === t[0] ? "on" : "") + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</nav>' +
      '<div id="tabc"></div>' +
      '<p style="margin-top:24px"><a class="btn btn-ghost" href="#/">← Voltar aos simulados</a></p>' +
    '</main>';
  render(html);

  function showTab(t){
    tab = t; $all(".tabs button").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-tab") === t); });
    var c = $("#tabc");
    if (t === "resumo") c.innerHTML = resumo;
    else if (t === "disciplinas") c.innerHTML = discTab;
    else if (t === "pegadinhas") c.innerHTML = trapTab;
    else if (t === "assuntos") c.innerHTML = assTab;
    else if (t === "questoes") reviewTab(c, r, sim);
    else if (t === "discursiva") discTabRender(c, sim);
    try{ history.replaceState(null, "", "#/resultado/" + aid + "/" + t); }catch(e){}
  }
  $all(".tabs button").forEach(function(b){ b.addEventListener("click", function(){ showTab(b.getAttribute("data-tab")); }); });
  $all("[data-r]").forEach(function(b){
    b.addEventListener("click", function(){
      var a = b.getAttribute("data-r");
      if (a === "redo") startDialog(sim.id);
      else if (a === "print") window.print();
      else if (a === "redo-wrong"){ var ids = r.items.filter(function(it){ return it.st !== "c"; }).map(function(it){ return it.q.i; }); startDialog(sim.id, ids, "treino"); }
    });
  });
  showTab(tab);
}
function kpi(v, k, d){ return '<div class="card kpi"><div class="v">' + v + '</div><div class="k">' + k + '</div>' + (d ? '<div class="d">' + d + '</div>' : '') + '</div>'; }

function planHTML(discWorst, assSorted, trapsSorted, r){
  if (!r.erros && !r.brancos) return '<p style="margin:0">Desempenho perfeito. Mantenha o ritmo com revisões espaçadas e faça o próximo simulado no modo prova, com cronômetro.</p>';
  var weak = discWorst.filter(function(x){ return x.p < 70; }).slice(0,3);
  var items = [];
  if (weak.length) items.push('<li><b>Prioridade:</b> ' + weak.map(function(x){ return DISC[x.d] + ' (' + x.p + '%)'; }).join(", ") + '. Revise os mapas desses módulos antes do próximo simulado.</li>');
  if (assSorted.length) items.push('<li><b>Assuntos para revisar hoje:</b> ' + assSorted.slice(0,4).map(function(a){ return esc(a.a); }).join("; ") + '.</li>');
  if (trapsSorted.length){ var T = TRAPS[trapsSorted[0].k] || [trapsSorted[0].k,""]; items.push('<li><b>Treine o olhar para “' + esc(T[0]) + '”:</b> ' + esc(T[1]) + ' Nas próximas questões, procure primeiro essa palavra de risco em cada alternativa.</li>'); }
  if (r.brancos) items.push('<li><b>Não deixe em branco:</b> nesta prova o erro não desconta ponto. Elimine as alternativas absurdas e marque a mais provável.</li>');
  items.push('<li>Use <b>“Refazer erradas”</b> no modo treino para fixar a correção logo em seguida.</li>');
  return '<ul style="margin:6px 0 0;padding-left:20px">' + items.join("") + '</ul>';
}

function reviewTab(c, r, sim){
  var filt = "erradas", disc = "";
  function draw(){
    var items = r.items.filter(function(it){
      if (disc && it.q.d !== disc) return false;
      if (filt === "erradas") return it.st === "e";
      if (filt === "branco") return it.st === "b";
      if (filt === "certas") return it.st === "c";
      if (filt === "pegadinha") return it.hit;
      return true;
    });
    var cnt = { todas:r.items.length, erradas:r.erros, branco:r.brancos, certas:r.acertos, pegadinha:r.trapHit };
    var fh = '<div class="filters">' + [["erradas","Erradas"],["pegadinha","Caí na pegadinha"],["branco","Em branco"],["certas","Certas"],["todas","Todas"]].map(function(f){ return '<button data-f="' + f[0] + '" class="' + (filt === f[0] ? "on" : "") + '">' + f[1] + ' (' + cnt[f[0]] + ')</button>'; }).join("") +
      '<select aria-label="Filtrar por disciplina" data-disc><option value="">Todas as disciplinas</option>' + DISC_ORDER.filter(function(d){ return r.disc[d]; }).map(function(d){ return '<option value="' + d + '"' + (disc === d ? " selected" : "") + '>' + DISC[d] + '</option>'; }).join("") + '</select></div>';
    var body = items.length ? items.map(function(it){ return reviewCard(it, sim); }).join("") : '<div class="card pad empty">Nenhuma questão neste filtro.</div>';
    c.innerHTML = fh + body;
    $all("[data-f]", c).forEach(function(b){ b.addEventListener("click", function(){ filt = b.getAttribute("data-f"); draw(); }); });
    $("[data-disc]", c).addEventListener("change", function(e){ disc = e.target.value; draw(); });
  }
  draw();
}
function reviewCard(it, sim){
  var q = it.q;
  var badge = it.st === "c" ? '<span class="chip ok">Acertou</span>' : it.st === "e" ? '<span class="chip bad">Errou</span>' : '<span class="chip">Em branco</span>';
  if (it.hit) badge += '<span class="chip warn">Caiu na pegadinha</span>';
  var opts = q.opts.map(function(o, k){
    var cls = "opt"; var tags = "";
    if (k === q.c){ cls += " right"; tags += '<span class="tag g">Gabarito</span>'; }
    else if (it.a === k){ cls += " wrong"; }
    if (it.a === k) tags += '<span class="tag y">Sua resposta</span>';
    if (k === q.trap && it.st !== "c") tags += '<span class="tag p">Pegadinha</span>';
    return '<div class="' + cls + '"><span class="l">' + LETTERS[k] + '</span><span class="t">' + esc(o) + ' ' + tags + '</span></div>';
  }).join("");
  var T = q.p ? (TRAPS[q.p[0]] || [q.p[0], ""]) : null;
  var txt = q.t && sim.textos && sim.textos[q.t] ? '<div class="note" style="margin-bottom:6px">Questão referente ao ' + esc(sim.textos[q.t].titulo) + ' (veja no início da prova).</div>' : '';
  return '<article class="card rev"><div class="rh"><b>' + q.n + '</b><span class="qdisc">' + DISC[q.d] + '</span><span class="note">• ' + esc(q.a) + '</span><span style="flex:1"></span>' + badge + '</div>' + txt +
    '<p class="enun" style="font-size:16px">' + esc(q.e) + '</p><div class="opts">' + opts + '</div>' +
    '<div class="cmt"><b class="h">Comentário</b>' + esc(q.x) + '</div>' +
    (T ? '<div class="cmt trap"><b class="h">Pegadinha • ' + esc(T[0]) + '</b>' + esc(q.p[1]) + '</div>' : '') + '</article>';
}

function discTabRender(c, sim){
  var D = sim.discursiva; if (!D){ c.innerHTML = '<div class="card pad empty">Sem proposta discursiva neste simulado.</div>'; return; }
  var saved = load(LS.disc(sim.id), { txt:"", ck:[] });
  c.innerHTML = '<div class="card pad disc">' +
    '<div class="qdisc">P3 • Prova discursiva • até 30 linhas • 10 pontos</div><h3 style="font-size:26px;margin:4px 0 10px">' + esc(D.tema) + '</h3>' +
    '<p style="margin:0 0 6px">' + esc(D.comando) + '</p><ol>' + D.topicos.map(function(t){ return '<li>' + esc(t) + '</li>'; }).join("") + '</ol>' +
    '<label for="dtxt" class="note">Seu texto (salvo automaticamente neste navegador)</label>' +
    '<textarea id="dtxt" placeholder="Escreva aqui seu texto dissertativo...">' + esc(saved.txt) + '</textarea>' +
    '<div class="note" id="dcount" style="margin-top:6px"></div>' +
    '<h3 style="font-size:22px;margin:18px 0 6px">Espelho de correção (autoavaliação)</h3><p class="note" style="margin:0 0 6px">Marque o que o seu texto contempla. A Cebraspe avalia conteúdo e domínio da modalidade escrita.</p>' +
    D.espelho.map(function(e, k){ return '<label class="check"><input type="checkbox" data-ck="' + k + '"' + (saved.ck.indexOf(k) >= 0 ? " checked" : "") + '><span>' + esc(e) + '</span></label>'; }).join("") +
    '<div class="note" id="dck" style="margin-top:8px"></div></div>';
  var ta = $("#dtxt", c);
  function upd(){
    var words = (ta.value.trim().match(/\S+/g) || []).length;
    var lines = ta.value.split("\n").reduce(function(s, l){ return s + Math.max(1, Math.ceil(l.length / 72)); }, 0);
    if (!ta.value.trim()) lines = 0;
    $("#dcount", c).innerHTML = words + ' palavras • ≈ ' + lines + ' linhas manuscritas' + (lines > 30 ? ' <b style="color:var(--bad)">(acima do limite de 30)</b>' : '');
    var ck = $all("[data-ck]", c).filter(function(x){ return x.checked; }).map(function(x){ return +x.getAttribute("data-ck"); });
    $("#dck", c).textContent = ck.length + ' de ' + D.espelho.length + ' critérios atendidos.';
    save(LS.disc(sim.id), { txt: ta.value, ck: ck });
  }
  ta.addEventListener("input", upd); $all("[data-ck]", c).forEach(function(x){ x.addEventListener("change", upd); }); upd();
}

/* =================== PAINEL =================== */
function viewPanel(){
  stopTimer();
  var H = hist().slice().sort(function(a,b){ return a.date - b.date; });
  var full = H.filter(function(h){ return h.mode === "prova" && h.total === 60; });
  var media = full.length ? full.reduce(function(s,h){ return s + h.acertos; }, 0) / full.length : null;
  var best = full.reduce(function(m,h){ return Math.max(m, h.acertos); }, 0);
  var agg = {}, trap = {};
  H.forEach(function(h){
    var sim = simById(h.simId); if (!sim) return;
    var r = score(sim, h.qids, h.ans);
    Object.keys(r.disc).forEach(function(d){ var A = agg[d] = agg[d] || { c:0, t:0, e:0, b:0 }; A.c += r.disc[d].c; A.t += r.disc[d].t; A.e += r.disc[d].e; A.b += r.disc[d].b; });
    Object.keys(r.trap).forEach(function(k){ trap[k] = (trap[k] || 0) + r.trap[k].n; });
  });
  var trapsSorted = Object.keys(trap).sort(function(a,b){ return trap[b] - trap[a]; });
  var evo = full.length ? '<div style="display:flex;align-items:flex-end;gap:8px;height:140px;padding-top:10px">' + full.slice(-12).map(function(h){ var p = pct(h.acertos, 60); return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0"><span style="font-size:12px;font-weight:700">' + h.acertos + '</span><div title="' + fmtDate(h.date) + '" style="width:100%;max-width:42px;height:' + Math.max(p, 3) + '%;background:' + colorFor(p) + ';border-radius:6px 6px 2px 2px"></div><span class="note" style="font-size:11px">S' + h.simId + '</span></div>'; }).join("") + '</div><p class="note">Linha de corte eliminatória: 30 acertos (50%).</p>' : '<p class="empty">Faça um simulado completo no modo prova para ver sua evolução.</p>';

  render(topbar('<a class="tbtn" href="#/">Simulados</a>') +
    '<main class="wrap" style="padding-top:20px;padding-bottom:40px">' +
    '<h1 style="font-size:clamp(28px,5vw,40px);margin-bottom:14px">Meu desempenho</h1>' +
    '<div class="kpis" style="margin-bottom:14px">' +
      kpi(media != null ? media.toFixed(1).replace(".",",") : "—", "Média (simulados completos)", media != null ? pct(media,60) + "% de acerto" : "") +
      kpi(full.length ? best + "/60" : "—", "Melhor nota", "") +
      kpi(H.length, "Tentativas registradas", full.length + " completas no modo prova") +
    '</div>' +
    '<div class="two">' +
      '<div class="card pad"><h3 style="font-size:22px">Evolução</h3>' + evo + '</div>' +
      '<div class="card pad"><h3 style="font-size:22px;margin-bottom:4px">Pegadinhas que mais te pegam</h3>' + (trapsSorted.length ? '<ul class="list">' + trapsSorted.slice(0,6).map(function(k){ var T = TRAPS[k] || [k,""]; return '<li><span class="cnt w">' + trap[k] + '</span><span class="tx"><b>' + esc(T[0]) + '</b><small>' + esc(T[1]) + '</small></span></li>'; }).join("") + '</ul>' : '<p class="empty">Sem dados ainda.</p>') + '</div>' +
    '</div>' +
    '<div class="card pad" style="margin-top:14px"><h3 style="font-size:22px;margin-bottom:12px">Acerto acumulado por disciplina</h3>' + (Object.keys(agg).length ? barsHTML(agg) : '<p class="empty">Sem dados ainda.</p>') + '</div>' +
    '<div class="card pad" style="margin-top:14px"><h3 style="font-size:22px;margin-bottom:8px">Histórico</h3>' +
      (H.length ? '<div class="tablewrap"><table class="hist"><thead><tr><th>Data</th><th>Simulado</th><th>Modo</th><th>Acertos</th><th>Tempo</th><th></th></tr></thead><tbody>' +
        H.slice().reverse().map(function(h){ var s = simById(h.simId); return '<tr><td>' + fmtDate(h.date) + '</td><td>' + esc(s ? s.titulo : "Simulado " + h.simId) + '</td><td>' + (h.mode === "treino" ? "Treino" : "Prova") + '</td><td class="n">' + h.acertos + '/' + h.total + '</td><td>' + fmtDur(h.tempo) + '</td><td><a href="#/resultado/' + h.aid + '">ver</a></td></tr>'; }).join("") +
        '</tbody></table></div><p style="margin-top:12px"><button class="btn btn-ghost btn-sm" data-clear>Apagar histórico</button></p>' : '<p class="empty">Nenhuma tentativa ainda.</p>') +
    '</div></main>');
  var cl = $("[data-clear]");
  if (cl) cl.addEventListener("click", function(){
    modal('<h3>Apagar histórico?</h3><p>Todas as tentativas e médias salvas neste navegador serão removidas.</p><div class="acts"><button class="btn btn-ghost" data-x="n">Cancelar</button><button class="btn btn-dark" data-x="y">Apagar</button></div>', function(root, close){
      $("[data-x='n']", root).addEventListener("click", close);
      $("[data-x='y']", root).addEventListener("click", function(){ del(LS.hist); close(); viewPanel(); });
    });
  });
}

/* =================== roteador =================== */
function route(){
  var h = location.hash.replace(/^#\/?/, "").split("?")[0].split("/");
  if (h[0] === "prova" && h[1]) viewExam(+h[1]);
  else if (h[0] === "resultado" && h[1]) viewResult(h[1], h[2]);
  else if (h[0] === "painel") viewPanel();
  else viewHome();
}
window.addEventListener("beforeunload", function(){ if (timerHandle && window.__examSave) window.__examSave(); });
window.addEventListener("hashchange", function(){ if (timerHandle && window.__examSave) window.__examSave(); window.__examSave = null; route(); });
route();
})();
