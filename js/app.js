/* ==========================================================================
   NFCloud — app (router + views + interatividade). Vanilla JS, sem build.
   ========================================================================== */
const app = document.getElementById('app');

const NAV = [
  { route:'#dashboard',   icon:'dashboard',   label:'Dashboard',    alias:['#dashboard2'] },
  { route:'#emitir',      icon:'emitir',      label:'Emitir Nota' },
  { route:'#consultar',   icon:'consultar',   label:'Consultar Nota' },
  { route:'#integracoes', icon:'integracoes', label:'Integrações' },
  { route:'#relatorios',  icon:'relatorios',  label:'Relatórios' },
  { route:'#clientes',    icon:'clientes',    label:'Clientes' },
  { route:'#produtos',    icon:'produtos',    label:'Produtos' },
  { route:'#config',      icon:'config',      label:'Configurações' },
];

/* ---------- Shell (sidebar + topbar) ---------- */
function shell(active, content){
  const isActive = r => r === active || (NAV.find(n=>n.route===r)?.alias||[]).includes(active);
  const links = NAV.map(n =>
    `<a href="${n.route}" class="${isActive(n.route)?'active':''}">${ICON[n.icon]}<span>${n.label}</span></a>`
  ).join('');
  return `
  <div class="scrim" id="scrim"></div>
  <div class="shell">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar__logo">${logoSVG('light')}</div>
      <nav class="nav">${links}</nav>
      <div class="nav__spacer"></div>
      <div class="nav__bottom">
        <nav class="nav">
          <a href="#ajuda" class="${active==='#ajuda'?'active':''}">${ICON.ajuda}<span>Ajuda</span></a>
          <a href="#login" data-logout>${ICON.sair}<span>Sair</span></a>
        </nav>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="menu-btn" id="menuBtn" aria-label="Menu">&#9776;</button>
        <span class="hello">Olá, ${esc(Store.emissor.nome)}</span>
        <span class="avatar" style="color:#3627FF">${ICON.user}</span>
      </header>
      <main class="content">${content}</main>
    </div>
  </div>`;
}

/* ==========================================================================
   VIEWS
   ========================================================================== */

/* ---------- Login ---------- */
function viewLogin(){
  app.innerHTML = `
  <div class="login">
    <div class="login__aside">
      <div class="login__brand">${logoSVG('dark', 1.5)}</div>
      ${loginArt()}
    </div>
    <div class="login__main">
      <form class="login__form" id="loginForm">
        <h1>Bem-vindo de volta!</h1>
        <p class="sub">Acesse sua conta para continuar</p>
        <div class="field">
          <label>Email</label>
          <input class="input" type="email" placeholder="seu@email.com" value="hugo@nfcloud.com.br">
        </div>
        <div class="field">
          <label>Senha</label>
          <input class="input" type="password" placeholder="Sua senha" value="demodemodemo">
        </div>
        <a href="#recuperar" class="login__forgot">Esqueci minha senha</a>
        <div style="height:14px"></div>
        <button class="btn block" type="submit">Entrar</button>
      </form>
    </div>
  </div>`;
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    location.hash = '#dashboard';
  });
}

/* ---------- Recuperação de senha -------------------------------------------
   Tela criada em resposta ao Teste de Usabilidade: o link "Esqueci minha senha"
   apontava para o dashboard, ou seja, dava acesso à conta sem autenticar.     */
function viewRecuperar(){
  app.innerHTML = `
  <div class="login">
    <div class="login__aside">
      <div class="login__brand">${logoSVG('dark', 1.5)}</div>
      ${loginArt()}
    </div>
    <div class="login__main">
      <form class="login__form" id="recForm">
        <h1>Recuperar acesso</h1>
        <p class="sub">Enviaremos um link de redefinição para o seu e-mail</p>
        <div class="field">
          <label for="recEmail">E-mail cadastrado</label>
          <input class="input" id="recEmail" type="email" placeholder="seu@email.com" required>
        </div>
        <div id="recAviso" class="aviso" hidden></div>
        <button class="btn block" type="submit">Enviar link de redefinição</button>
        <div style="height:14px"></div>
        <a href="#login" class="login__forgot">Voltar para o login</a>
      </form>
    </div>
  </div>`;
  document.getElementById('recForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('recEmail').value.trim();
    const aviso = document.getElementById('recAviso');
    aviso.hidden = false;
    aviso.className = 'aviso ok';
    aviso.innerHTML = `Se <b>${esc(email)}</b> estiver cadastrado, o link de redefinição chegará em alguns minutos.
      Verifique também a caixa de spam.`;
    toast('Link de redefinição enviado (demo).', 'ok');
  });
}

/* ---------- Componentes reutilizáveis ---------- */
function statCard(title, value, {money=false, neg=false, delta='', primary=false}={}){
  const alerta = neg && Number(value) > 0;   // zero rejeitadas não é um alerta
  const num = money
    ? `<div class="num money${alerta?' neg':''}"><small>R$</small> ${Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>`
    : `<div class="num${alerta?' neg':''}">${Number(value).toLocaleString('pt-BR')}</div>`;
  return `<div class="stat${primary?' stat--primary':''}"><h4>${title}</h4>${num}${delta?`<div class="delta">${delta}</div>`:''}</div>`;
}
const STATUS_CLASS = { 'Autorizada':'ok', 'Rejeitada':'no', 'Cancelada':'warn' };
function statusBadge(s){ return `<span class="status ${STATUS_CLASS[s]||'no'}">${s}</span>`; }

/* ---------- Filtro de período (componente único) ----------------------------
   Antes cada tela declarava o seu próprio <select> de período e três deles
   (Dashboard2, Consultar, Relatórios) não filtravam nada — defeito relatado no
   Teste de Usabilidade de 14/07/2026. Agora há um componente e uma função só. */
const PERIODOS = [
  { v:'hoje', label:'Hoje' },
  { v:'7',    label:'Últimos 7 dias' },
  { v:'mes',  label:'Este mês' },
  { v:'tudo', label:'Tudo' },
  { v:'custom', label:'Intervalo personalizado' },
];
/* A pílula compacta (Dashboard/Relatórios) só oferece os presets — o intervalo
   personalizado exige dois campos de data e vive na tela de Consultar Notas. */
function periodoPill(id, sel){
  const opts = PERIODOS.filter(p => p.v !== 'custom')
    .map(p => `<option value="${p.v}" ${p.v===sel?'selected':''}>${p.label}</option>`).join('');
  return `<span class="pill"><label for="${id}">Período:</label>
    <select id="${id}" aria-label="Filtrar notas por período">${opts}</select></span>`;
}
const parseBR = s => { const [d,m,y] = s.split('/').map(Number); return new Date(y, m-1, d); };
/* Converte o valor de um <input type="date"> (AAAA-MM-DD) em Date local.
   `new Date('2026-07-30')` seria interpretado como UTC e, em fuso negativo,
   voltaria um dia — era essa a origem das notas que "sumiam" da borda do filtro. */
const parseISO = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
const diaDe = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Filtra notas por período. `range` = {de, ate} em AAAA-MM-DD, só p/ 'custom'.
 * Todos os intervalos são fechados nas duas pontas (a nota do dia "até" entra).
 */
function filtrarNotas(periodo, notas = Store.notas, range = null){
  if (periodo === 'tudo') return notas;
  const hoje = Store.HOJE;

  if (periodo === 'hoje') return notas.filter(n => n.data === Store.fmtBR(hoje));
  if (periodo === 'mes')  return notas.filter(n => n.data.slice(3) === Store.fmtBR(hoje).slice(3));
  if (periodo === '7'){
    const inicio = new Date(hoje); inicio.setDate(inicio.getDate() - 6);
    // O limite superior faltava: uma nota com data futura entrava em "últimos 7 dias".
    return notas.filter(n => { const d = parseBR(n.data); return d >= inicio && d <= hoje; });
  }
  if (periodo === 'custom'){
    if (!range || (!range.de && !range.ate)) return notas;   // intervalo vazio = sem filtro
    const de  = range.de  ? parseISO(range.de)  : null;
    const ate = range.ate ? parseISO(range.ate) : null;
    if (de && ate && de > ate) return [];                    // intervalo invertido não casa nada
    return notas.filter(n => {
      const d = diaDe(parseBR(n.data));
      return (!de || d >= de) && (!ate || d <= ate);
    });
  }
  return notas;
}
function wirePeriodo(id, valor, onChange){
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.value = valor;
  sel.addEventListener('change', e => onChange(e.target.value));
}
const rotuloPeriodo = v => (PERIODOS.find(p => p.v === v) || {}).label || '';

/* ---------- Dashboard (frame DashBoard) ---------- */
let dashPeriodo = 'mes';
function viewDashboard(){
  const ultima = Store.notas.find(n => n.status === 'Autorizada');
  const content = `
    <div class="page-head">
      <div>
        <h2>Resumo Geral</h2>
        <p class="page-sub">Acompanhe as emissões e o faturamento do período selecionado.</p>
      </div>
      ${periodoPill('periodo', dashPeriodo)}
    </div>
    <div class="stats" id="dashStats"></div>
    <div class="dash-grid">
      <div class="table-card">
        <div class="card-head">
          <h3>Últimas notas emitidas</h3>
          <a href="#consultar" class="link-more">Ver todas</a>
        </div>
        <div style="overflow-x:auto">
          <table class="tbl"><thead><tr>
            <th>Número</th><th>Destinatário</th><th>Valor</th><th>Data</th><th>Status</th>
          </tr></thead><tbody id="dashRows"></tbody></table>
        </div>
      </div>
      <div class="side-cards">
        <div class="mini-card">
          <h4>Status dos Provedores</h4>
          ${Store.provedores.map(p=>`
            <div class="prov">
              <div class="name">${esc(p.nome)}${p.tag?` <span class="muted prov__tag">(${p.tag})</span>`:''}</div>
              <div class="st on">${p.status}</div>
            </div>`).join('')}
        </div>
        <div class="mini-card">
          <h4>Alertas Recentes</h4>
          <p class="alert-line" id="alertaHoje"></p>
          <p class="alert-line">Última nota autorizada: ${ultima
            ? `<b>nº ${ultima.numero}</b> em ${ultima.data} às ${ultima.hora}`
            : '<b>nenhuma</b>'}</p>
        </div>
      </div>
    </div>`;
  app.innerHTML = shell('#dashboard', content);

  // Cartões e tabela respondem ao mesmo filtro — antes os cartões eram fixos.
  const renderDash = () => {
    const sel  = filtrarNotas(dashPeriodo);
    const aut  = sel.filter(n => n.status === 'Autorizada');
    const rot  = rotuloPeriodo(dashPeriodo).toLowerCase();
    const faturado = aut.reduce((s,n) => s + n.valor, 0);

    document.getElementById('dashStats').innerHTML = [
      statCard('Notas emitidas',   sel.length,                              {delta:`no período: ${rot}`}),
      statCard('Notas autorizadas',aut.length,                              {delta:`${sel.length?Math.round(aut.length/sel.length*100):0}% do total emitido`}),
      statCard('Rejeitadas / canceladas', sel.filter(n=>n.status!=='Autorizada').length, {neg:true, delta:'exigem reemissão ou registro'}),
      statCard('Total faturado',   faturado,                                {money:true, primary:true, delta:`soma das notas autorizadas — ${rot}`}),
    ].join('');

    const rows = sel.slice(0,6);
    document.getElementById('dashRows').innerHTML = rows.length ? rows.map(n=>`
      <tr><td>${n.numero}</td><td>${esc(n.cliente)}</td><td>${BRL(n.valor)}</td><td>${n.data}</td><td>${statusBadge(n.status)}</td></tr>
    `).join('') : `<tr><td colspan="5" class="muted center">Nenhuma nota no período selecionado.</td></tr>`;

    document.getElementById('alertaHoje').innerHTML =
      `Notas emitidas hoje: <b>${Store.headline.emitidasHoje}</b>`;
  };

  wirePeriodo('periodo', dashPeriodo, v => { dashPeriodo = v; renderDash(); });
  renderDash();
  wireShell();
}

/* ---------- Dashboard2 (frame DashBoard2) ---------- */
let dash2Periodo = 'mes';
function viewDashboard2(){
  const content = `
    <div class="page-head">
      <div>
        <h2>Resumo Geral</h2>
        <p class="page-sub">Visão detalhada — emissões, rejeições e faturamento.</p>
      </div>
      ${periodoPill('periodo2', dash2Periodo)}
    </div>
    <div class="stats" id="dash2Stats"></div>
    <div class="table-card">
      <div class="card-head"><h3>Notas do período</h3></div>
      <div style="overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>Número</th><th>Cliente</th><th>Valor</th><th>Data</th><th>Status</th>
        </tr></thead><tbody id="dash2Rows"></tbody></table>
      </div>
    </div>`;
  app.innerHTML = shell('#dashboard', content);

  const render = () => {
    const sel = filtrarNotas(dash2Periodo);
    const aut = sel.filter(n => n.status === 'Autorizada');
    const rot = rotuloPeriodo(dash2Periodo).toLowerCase();
    document.getElementById('dash2Stats').innerHTML = [
      statCard('Notas emitidas hoje', Store.headline.emitidasHoje, {delta:'referência: hoje'}),
      statCard('Notas no período',    sel.length,                  {delta:rot}),
      statCard('Rejeitadas no período', sel.filter(n=>n.status==='Rejeitada').length, {neg:true, delta:'precisam de reemissão'}),
      statCard('Total faturado',      aut.reduce((s,n)=>s+n.valor,0), {money:true, primary:true, delta:`notas autorizadas — ${rot}`}),
    ].join('');
    document.getElementById('dash2Rows').innerHTML = sel.length ? sel.slice(0,8).map(n=>`
      <tr><td>${n.numero}</td><td>${esc(n.cliente)}</td><td>${BRL(n.valor)}</td><td>${n.data} ${n.hora||''}</td><td>${statusBadge(n.status)}</td></tr>
    `).join('') : `<tr><td colspan="5" class="muted center">Nenhuma nota no período selecionado.</td></tr>`;
  };
  wirePeriodo('periodo2', dash2Periodo, v => { dash2Periodo = v; render(); });
  render();
  wireShell();
}

/* ---------- Emitir Nota (frame Emitir Nota) ---------- */
let emitState = { clienteId:'', itens:[ { produtoId:'p1', qtd:10, valorUnit:245.00 } ] };
function prod(id){ return Store.produtos.find(p=>p.id===id); }

function viewEmitir(){
  const clienteOpts = ['<option value="">Selecione o cliente…</option>']
    .concat(Store.clientes.map(c=>`<option value="${c.id}" ${emitState.clienteId===c.id?'selected':''}>${esc(c.nome)} — ${esc(c.doc)}</option>`)).join('');
  const content = `
    <div class="page-head">
      <div>
        <h2>Emitir Nota Fiscal</h2>
        <p class="page-sub">Destinatário, itens e transmissão em <b>uma única tela</b> — sem etapas intermediárias.</p>
      </div>
      <button class="btn" id="btnEmitir">Emitir Nota</button>
    </div>
    <div class="emit-grid">
      <div>
        <!-- US07 — vendas que se repetem todo mês não precisam ser remontadas. -->
        <div class="card" style="margin-bottom:22px">
          <div class="card-head"><h3>Modelo de venda recorrente</h3></div>
          <div class="row" style="align-items:end">
            <div class="field" style="margin:0"><label for="emitModelo">Carregar modelo salvo</label>
              <select class="input" id="emitModelo">
                <option value="">Começar do zero…</option>
                ${Store.modelos.map(m=>`<option value="${m.id}">${esc(m.nome)}</option>`).join('')}
              </select></div>
            <div class="field" style="margin:0;flex:none">
              <button class="btn ghost" type="button" id="btnSalvarModelo">${ICON.save} Salvar como modelo</button></div>
          </div>
        </div>
        <div class="card" style="margin-bottom:22px">
          <div class="card-head"><h3>Destinatário</h3></div>
          <div class="field"><label for="emitCliente">Cliente</label>
            <select class="input" id="emitCliente">${clienteOpts}</select>
          </div>
          <div class="row">
            <div class="field"><label for="emitNatureza">Natureza da operação</label>
              <select class="input" id="emitNatureza"><option>Venda de mercadoria</option><option>Prestação de serviço</option><option>Devolução</option></select>
            </div>
            <div class="field"><label for="emitData">Data de emissão</label>
              <input class="input" id="emitData" type="text" value="${Store.fmtBR(Store.HOJE)}" readonly>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="itens-head">
            <h3>Itens da Nota</h3>
            <button class="btn ghost sm" id="btnAddItem">${ICON.plus} Adicionar Item</button>
          </div>
          <div style="overflow-x:auto">
            <table class="tbl" id="itensTbl"><thead><tr>
              <th>Produto</th><th>NCM</th><th>CFOP</th><th>Qtd</th><th>Valor Unid.</th><th>Valor Total</th><th>Tributação</th><th></th>
            </tr></thead><tbody id="itensBody"></tbody></table>
          </div>
        </div>
      </div>
      <div class="resumo">
        <h4>Resumo da Nota</h4>
        <div class="box">
          <div class="ln"><span>Subtotal do produto</span><b id="rSub">R$ 0,00</b></div>
          <div class="ln"><span>Valor do ICMS</span><b id="rIcms">R$ 0,00</b></div>
          <div class="ln"><span>Valor do PIS</span><b id="rPis">R$ 0,00</b></div>
          <div class="ln"><span>Valor do COFINS</span><b id="rCofins">R$ 0,00</b></div>
          <hr>
          <div class="total-lbl">Valor Total da Nota:</div>
          <div class="total" id="rTotal">R$ 0,00</div>
        </div>
      </div>
    </div>`;
  app.innerHTML = shell('#emitir', content);

  const produtoOpts = sel => ['<option value="">Selecione…</option>']
    .concat(Store.produtos.map(p=>`<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.descricao)}</option>`)).join('');

  function rowHTML(it, i){
    const p = prod(it.produtoId) || {};
    const trib = p.isento ? 'Isento' : (p.icms!=null?`ICMS ${p.icms}%`:'—');
    return `<tr data-i="${i}" data-icms="${p.icms||0}" data-pis="${p.pis||0}" data-cofins="${p.cofins||0}">
      <td><select class="input" data-f="produto" style="min-width:180px">${produtoOpts(it.produtoId)}</select></td>
      <td data-c="ncm">${p.ncm||'—'}</td>
      <td data-c="cfop">${p.cfop||'—'}</td>
      <td><input class="input" data-f="qtd" type="number" min="0" step="1" value="${it.qtd}" style="width:80px"></td>
      <td><input class="input" data-f="vu" type="number" min="0" step="0.01" value="${Number(it.valorUnit).toFixed(2)}" style="width:120px"></td>
      <td data-c="total">${BRL(it.qtd*it.valorUnit)}</td>
      <td data-c="trib"><span class="tag">${trib}</span></td>
      <td><button class="iconbtn del" data-f="rm" type="button" aria-label="Remover item ${esc(p.descricao||'sem produto')}" title="Remover item da nota">${ICON.trash}</button></td>
    </tr>`;
  }
  function renderItens(){
    document.getElementById('itensBody').innerHTML =
      emitState.itens.length ? emitState.itens.map(rowHTML).join('')
      : `<tr><td colspan="8" class="muted center">Nenhum item. Clique em “Adicionar Item”.</td></tr>`;
    recalc();
  }
  function recalc(){
    let sub=0,icms=0,pis=0,cofins=0;
    document.querySelectorAll('#itensBody tr[data-i]').forEach(tr=>{
      const qtd = parseFloat(tr.querySelector('[data-f=qtd]').value)||0;
      const vu  = parseFloat(tr.querySelector('[data-f=vu]').value)||0;
      const tot = qtd*vu;
      tr.querySelector('[data-c=total]').textContent = BRL(tot);
      sub+=tot;
      icms   += tot*(parseFloat(tr.dataset.icms)||0)/100;
      pis    += tot*(parseFloat(tr.dataset.pis)||0)/100;
      cofins += tot*(parseFloat(tr.dataset.cofins)||0)/100;
    });
    const total = sub+icms+pis+cofins;
    document.getElementById('rSub').textContent    = BRL(sub);
    document.getElementById('rIcms').textContent   = BRL(icms);
    document.getElementById('rPis').textContent    = BRL(pis);
    document.getElementById('rCofins').textContent = BRL(cofins);
    document.getElementById('rTotal').textContent  = BRL(total);
    emitState._total = total;
  }
  function syncState(){
    emitState.itens = [...document.querySelectorAll('#itensBody tr[data-i]')].map(tr=>({
      produtoId: tr.querySelector('[data-f=produto]').value,
      qtd: parseFloat(tr.querySelector('[data-f=qtd]').value)||0,
      valorUnit: parseFloat(tr.querySelector('[data-f=vu]').value)||0,
    }));
  }

  document.getElementById('itensBody').addEventListener('input', e=>{
    if (e.target.dataset.f==='qtd'||e.target.dataset.f==='vu') recalc();
  });
  document.getElementById('itensBody').addEventListener('change', e=>{
    if (e.target.dataset.f==='produto'){
      const tr = e.target.closest('tr');
      const p = prod(e.target.value)||{};
      tr.dataset.icms=p.icms||0; tr.dataset.pis=p.pis||0; tr.dataset.cofins=p.cofins||0;
      tr.querySelector('[data-c=ncm]').textContent = p.ncm||'—';
      tr.querySelector('[data-c=cfop]').textContent = p.cfop||'—';
      tr.querySelector('[data-c=trib]').innerHTML = `<span class="tag">${p.isento?'Isento':(p.icms!=null?`ICMS ${p.icms}%`:'—')}</span>`;
      if (p.valorUnit!=null) tr.querySelector('[data-f=vu]').value = p.valorUnit.toFixed(2);
      recalc();
    }
  });
  document.getElementById('itensBody').addEventListener('click', e=>{
    const rm = e.target.closest('[data-f=rm]');
    if (rm){ syncState(); const i=+rm.closest('tr').dataset.i; emitState.itens.splice(i,1); renderItens(); }
  });
  document.getElementById('btnAddItem').addEventListener('click', ()=>{
    syncState(); emitState.itens.push({ produtoId:'', qtd:1, valorUnit:0 }); renderItens();
  });
  document.getElementById('emitCliente').addEventListener('change', e=> emitState.clienteId=e.target.value);
  document.getElementById('emitModelo').addEventListener('change', e=>{
    const m = Store.findModelo(e.target.value);
    if (!m) return;
    // Cópia dos itens: editar a nota não pode alterar o modelo salvo.
    emitState.clienteId = m.clienteId;
    emitState.itens = m.itens.map(it => ({ ...it }));
    document.getElementById('emitCliente').value = m.clienteId;
    renderItens();
    toast(`Modelo “${m.nome}” carregado. Revise e emita.`, 'ok');
  });
  document.getElementById('btnSalvarModelo').addEventListener('click', ()=>{
    syncState();
    if (!emitState.clienteId) return toast('Selecione o cliente antes de salvar o modelo.', 'err');
    if (!emitState.itens.some(it => it.produtoId)) return toast('Adicione ao menos um item ao modelo.', 'err');
    const nome = prompt('Nome do modelo de venda recorrente:');
    if (!nome || !nome.trim()) return;
    Store.addModelo({ nome: nome.trim(), clienteId: emitState.clienteId, itens: emitState.itens.map(it=>({...it})) });
    toast(`Modelo “${nome.trim()}” salvo.`, 'ok');
    location.hash = '#emitir'; router();      // recarrega a lista de modelos
  });
  document.getElementById('btnEmitir').addEventListener('click', ()=>{
    syncState();
    const cli = Store.findCliente(emitState.clienteId);
    if (!cli) return toast('Selecione um cliente para a nota.', 'err');
    if (!emitState.itens.length || emitState._total<=0) return toast('Adicione ao menos um item válido.', 'err');
    const nota = Store.emitirNota({ cliente: cli.nome, valor: emitState._total });
    if (nota.status==='Autorizada') toast(`Nota ${nota.numero} autorizada! ${BRL(nota.valor)}`, 'ok');
    else toast(`Nota ${nota.numero} rejeitada pela SEFAZ. Revise os dados.`, 'err');
    emitState = { clienteId:'', itens:[] };
    setTimeout(()=>{ location.hash='#consultar'; }, 700);
  });

  renderItens();
  wireShell();
}

/* ---------- Clientes (frame CadastrarCliente) ---------- */
let cliEdit = null;        // id em edição
let cliBusca = '';
function viewClientes(){
  const content = `
    <div class="page-head">
      <div>
        <h2>Clientes</h2>
        <p class="page-sub">Cadastre uma vez e reutilize os dados em todas as próximas notas.</p>
      </div>
    </div>
    <div class="card card-lg" style="margin-bottom:26px">
      <div class="card-head"><h3 id="cliFormTitulo">Cadastrar cliente</h3></div>
      <form id="cliForm">
        <div class="field"><label for="cNome">Nome/Razão Social</label>
          <input class="input" id="cNome" placeholder="Nome Exemplo" required></div>
        <div class="field"><label for="cEmail">Email</label>
          <input class="input" id="cEmail" type="email" placeholder="emailexemplo@email.com"></div>
        <div class="row">
          <div class="field"><label for="cDoc">CPF/CNPJ</label>
            <input class="input" id="cDoc" placeholder="12.345.678/0001-95"></div>
          <div class="field"><label for="cIe">Inscrição Estadual</label>
            <input class="input" id="cIe" placeholder="16.123456.1"></div>
          <div class="field" style="max-width:200px"><label for="cSit">Situação</label>
            <select class="input" id="cSit"><option>Ativa</option><option>Inativa</option></select></div>
        </div>
        <div class="form-actions">
          <button class="btn" type="submit">${ICON.save} <span id="cliSubmitLbl">Salvar cliente</span></button>
          <button class="btn ghost" type="button" id="cLimpar">Limpar formulário</button>
        </div>
      </form>
    </div>

    <div class="card card-lg">
      <div class="card-head"><h3>Clientes cadastrados</h3></div>
      <div style="max-width:380px;margin-bottom:18px">
        <label class="sr-only" for="cBusca">Buscar cliente</label>
        <div class="input-ic">
          <input class="input" id="cBusca" placeholder="Buscar por nome ou documento…" value="${esc(cliBusca)}">
          <span class="in-ic" aria-hidden="true">${ICON.consultar}</span>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>Nome/Razão Social</th><th>CPF/CNPJ</th><th>Inscrição Estadual</th><th>Situação</th><th></th>
        </tr></thead><tbody id="cliRows"></tbody></table>
      </div>
    </div>`;
  app.innerHTML = shell('#clientes', content);

  const form = document.getElementById('cliForm');
  const titulo = document.getElementById('cliFormTitulo');
  const submitLbl = document.getElementById('cliSubmitLbl');
  const setModo = editando => {
    titulo.textContent = editando ? 'Editar cliente' : 'Cadastrar cliente';
    submitLbl.textContent = editando ? 'Salvar alterações' : 'Salvar cliente';
  };
  const loadForm = c => {
    document.getElementById('cNome').value=c.nome;
    document.getElementById('cEmail').value=c.email||'';
    document.getElementById('cDoc').value=c.doc||'';
    document.getElementById('cIe').value=c.ie||'';
    document.getElementById('cSit').value=c.situacao||'Ativa';
    cliEdit=c.id; setModo(true);
  };
  const clearForm = () => { form.reset(); cliEdit=null; setModo(false); };
  // RN02 — duplicidade é verificada pelo documento, ignorando pontuação.
  const soDigitos = s => (s||'').replace(/\D/g,'');
  const docDuplicado = (doc, ignorarId) => {
    const d = soDigitos(doc);
    return d && Store.clientes.some(c => c.id !== ignorarId && soDigitos(c.doc) === d);
  };

  function renderRows(){
    const q = cliBusca.trim().toLowerCase();
    const list = Store.clientes.filter(c => !q || c.nome.toLowerCase().includes(q) || (c.doc||'').toLowerCase().includes(q));
    document.getElementById('cliRows').innerHTML = list.length ? list.map(c=>`
      <tr>
        <td>${esc(c.nome)}</td><td>${esc(c.doc)}</td><td>${esc(c.ie||'—')}</td>
        <td><span class="status ${c.situacao==='Ativa'?'ok':'no'}">${c.situacao}</span></td>
        <td><div class="actions">
          <button class="iconbtn" data-edit="${c.id}" aria-label="Editar ${esc(c.nome)}" title="Editar cliente">${ICON.edit}</button>
          <button class="iconbtn del" data-del="${c.id}" aria-label="Excluir ${esc(c.nome)}" title="Excluir cliente">${ICON.trash}</button>
        </div></td>
      </tr>`).join('') : `<tr><td colspan="5" class="muted center">Nenhum cliente encontrado.</td></tr>`;
  }
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const data = { nome:cNome.value.trim(), email:cEmail.value.trim(), doc:cDoc.value.trim(), ie:cIe.value.trim(), situacao:cSit.value };
    if (!data.nome) return toast('Informe o nome/razão social.', 'err');
    if (docDuplicado(data.doc, cliEdit))
      return toast('Já existe um cliente com esse CPF/CNPJ. Edite o cadastro existente.', 'err');
    if (cliEdit){ Store.updateCliente(cliEdit, data); toast('Cliente atualizado.', 'ok'); }
    else { Store.addCliente(data); toast('Cliente cadastrado.', 'ok'); }
    clearForm(); renderRows();
  });
  // Antes este botão excluía o cliente quando o formulário estava em edição —
  // ação destrutiva atrás de um rótulo de "limpar". Exclusão agora só na tabela.
  document.getElementById('cLimpar').addEventListener('click', clearForm);
  document.getElementById('cBusca').addEventListener('input', e=>{ cliBusca=e.target.value; renderRows(); });
  document.getElementById('cliRows').addEventListener('click', e=>{
    const ed=e.target.closest('[data-edit]'); const dl=e.target.closest('[data-del]');
    if (ed){ loadForm(Store.findCliente(ed.dataset.edit)); window.scrollTo({top:0,behavior:'smooth'}); }
    if (dl){ Store.removeCliente(dl.dataset.del); toast('Cliente excluído.', 'ok'); renderRows(); }
  });
  renderRows();
  wireShell();
}

/* ---------- Produtos e regras fiscais (US04) --------------------------------
   UC02 "Gerenciar Catálogo de Produtos" + fluxo "Cadastro de Produtos e Regras
   Fiscais". É o cadastro que sustenta o auto-preenchimento da nota (US06):
   NCM, CFOP e alíquotas vêm daqui quando o produto é escolhido na emissão.   */
let prodEdit = null;
let prodBusca = '';
function viewProdutos(){
  const content = `
    <div class="page-head">
      <div>
        <h2>Produtos e Regras Fiscais</h2>
        <p class="page-sub">NCM, CFOP e alíquotas ficam no produto — na emissão a nota se preenche <b>sozinha</b>.</p>
      </div>
    </div>
    <div class="card card-lg" style="margin-bottom:26px">
      <div class="card-head"><h3 id="prodFormTitulo">Cadastrar produto</h3></div>
      <form id="prodForm">
        <div class="field"><label for="pDesc">Descrição do produto ou serviço</label>
          <input class="input" id="pDesc" placeholder="Notebook 14&quot;" required></div>
        <div class="row">
          <div class="field"><label for="pNcm">NCM</label>
            <input class="input" id="pNcm" placeholder="8471.30.12"></div>
          <div class="field"><label for="pCfop">CFOP</label>
            <input class="input" id="pCfop" placeholder="5102"></div>
          <div class="field"><label for="pVu">Valor unitário (R$)</label>
            <input class="input" id="pVu" type="number" min="0" step="0.01" placeholder="0,00"></div>
        </div>
        <div class="row">
          <div class="field"><label for="pIcms">ICMS (%)</label>
            <input class="input" id="pIcms" type="number" min="0" max="100" step="0.01" value="0"></div>
          <div class="field"><label for="pPis">PIS (%)</label>
            <input class="input" id="pPis" type="number" min="0" max="100" step="0.01" value="0"></div>
          <div class="field"><label for="pCofins">COFINS (%)</label>
            <input class="input" id="pCofins" type="number" min="0" max="100" step="0.01" value="0"></div>
        </div>
        <label class="check" style="margin-bottom:18px">
          <input type="checkbox" id="pIsento">
          <span>Isenção recorrente de ICMS</span>
        </label>
        <div class="form-actions">
          <button class="btn" type="submit">${ICON.save} <span id="prodSubmitLbl">Salvar produto</span></button>
          <button class="btn ghost" type="button" id="pLimpar">Limpar formulário</button>
        </div>
      </form>
    </div>

    <div class="card card-lg">
      <div class="card-head"><h3>Catálogo cadastrado</h3></div>
      <div style="max-width:380px;margin-bottom:18px">
        <label class="sr-only" for="pBusca">Buscar produto</label>
        <div class="input-ic">
          <input class="input" id="pBusca" placeholder="Buscar por descrição ou NCM…" value="${esc(prodBusca)}">
          <span class="in-ic" aria-hidden="true">${ICON.consultar}</span>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>Descrição</th><th>NCM</th><th>CFOP</th><th>Valor unit.</th><th>Tributação</th><th>Ações</th>
        </tr></thead><tbody id="prodRows"></tbody></table>
      </div>
    </div>`;
  app.innerHTML = shell('#produtos', content);

  const form = document.getElementById('prodForm');
  const titulo = document.getElementById('prodFormTitulo');
  const submitLbl = document.getElementById('prodSubmitLbl');
  const setModo = editando => {
    titulo.textContent = editando ? 'Editar produto' : 'Cadastrar produto';
    submitLbl.textContent = editando ? 'Salvar alterações' : 'Salvar produto';
  };
  const loadForm = p => {
    pDesc.value = p.descricao; pNcm.value = p.ncm||''; pCfop.value = p.cfop||'';
    pVu.value = p.valorUnit ?? ''; pIcms.value = p.icms ?? 0;
    pPis.value = p.pis ?? 0; pCofins.value = p.cofins ?? 0; pIsento.checked = !!p.isento;
    pIcms.disabled = !!p.isento;
    prodEdit = p.id; setModo(true);
  };
  const clearForm = () => { form.reset(); pIcms.disabled = false; prodEdit = null; setModo(false); };

  function renderRows(){
    const q = prodBusca.trim().toLowerCase();
    const list = Store.produtos.filter(p => !q
      || p.descricao.toLowerCase().includes(q) || (p.ncm||'').toLowerCase().includes(q));
    document.getElementById('prodRows').innerHTML = list.length ? list.map(p=>`
      <tr>
        <td>${esc(p.descricao)}</td><td>${esc(p.ncm||'—')}</td><td>${esc(p.cfop||'—')}</td>
        <td>${BRL(p.valorUnit||0)}</td>
        <td><span class="tag">${p.isento ? 'Isento' : `ICMS ${p.icms||0}%`}</span></td>
        <td><div class="actions">
          <button class="iconbtn" data-edit="${p.id}" aria-label="Editar ${esc(p.descricao)}" title="Editar produto">${ICON.edit}</button>
          <button class="iconbtn del" data-del="${p.id}" aria-label="Excluir ${esc(p.descricao)}" title="Excluir produto">${ICON.trash}</button>
        </div></td>
      </tr>`).join('') : `<tr><td colspan="6" class="muted center">Nenhum produto encontrado.</td></tr>`;
  }

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const descricao = pDesc.value.trim();
    if (!descricao) return toast('Informe a descrição do produto.', 'err');
    const isento = pIsento.checked;
    const data = {
      descricao,
      ncm: pNcm.value.trim(), cfop: pCfop.value.trim(),
      valorUnit: parseFloat(pVu.value)||0,
      // Isenção e alíquota de ICMS são contraditórias: a isenção manda.
      icms: isento ? 0 : (parseFloat(pIcms.value)||0),
      pis: parseFloat(pPis.value)||0,
      cofins: parseFloat(pCofins.value)||0,
      isento,
    };
    if (prodEdit){ Store.updateProduto(prodEdit, data); toast('Produto atualizado.', 'ok'); }
    else { Store.addProduto(data); toast('Produto cadastrado.', 'ok'); }
    clearForm(); renderRows();
  });
  document.getElementById('pLimpar').addEventListener('click', clearForm);
  document.getElementById('pBusca').addEventListener('input', e=>{ prodBusca=e.target.value; renderRows(); });
  document.getElementById('prodRows').addEventListener('click', e=>{
    const ed=e.target.closest('[data-edit]'), dl=e.target.closest('[data-del]');
    if (ed){ loadForm(Store.findProduto(ed.dataset.edit)); window.scrollTo({top:0,behavior:'smooth'}); }
    if (dl){
      if (!Store.removeProduto(dl.dataset.del))
        return toast('Este produto está em um modelo de venda recorrente. Remova-o do modelo antes.', 'err');
      if (prodEdit === dl.dataset.del) clearForm();
      toast('Produto excluído.', 'ok'); renderRows();
    }
  });
  // Isenção zera o ICMS na hora, para o formulário não mostrar dois estados em conflito.
  document.getElementById('pIsento').addEventListener('change', e=>{
    const icms = document.getElementById('pIcms');
    icms.disabled = e.target.checked;
    if (e.target.checked) icms.value = 0;
  });
  renderRows();
  wireShell();
}

/* ---------- Consultar Nota / Histórico (US09) ---------- */
let consFiltro = { status:'', busca:'', periodo:'tudo', de:'', ate:'' };
function viewConsultar(){
  const content = `
    <div class="page-head">
      <div>
        <h2>Consultar Notas</h2>
        <p class="page-sub">Histórico completo em nuvem. Exporte várias notas de uma vez, em um <b>único pacote .zip</b>.</p>
      </div>
      <button class="btn" id="btnZip" title="Baixar as notas autorizadas do filtro atual em um pacote .zip">${ICON.download} Exportar pacote .zip</button>
    </div>
    <div class="card" style="margin-bottom:22px">
      <div class="row">
        <div class="field" style="margin:0"><label for="qBusca">Buscar</label>
          <input class="input" id="qBusca" placeholder="Número ou destinatário…"></div>
        <div class="field" style="margin:0;max-width:220px"><label for="qPeriodo">Período</label>
          <select class="input" id="qPeriodo">
            ${PERIODOS.map(p=>`<option value="${p.v}" ${p.v===consFiltro.periodo?'selected':''}>${p.label}</option>`).join('')}
          </select></div>
        <div class="field" style="margin:0;max-width:220px"><label for="qStatus">Status</label>
          <select class="input" id="qStatus">
            <option value="">Todos</option><option>Autorizada</option><option>Rejeitada</option><option>Cancelada</option>
          </select></div>
      </div>
      <div class="row" id="qRange" style="margin-top:18px" ${consFiltro.periodo==='custom'?'':'hidden'}>
        <div class="field" style="margin:0;max-width:220px"><label for="qDe">Data inicial</label>
          <input class="input" id="qDe" type="date" value="${consFiltro.de}"></div>
        <div class="field" style="margin:0;max-width:220px"><label for="qAte">Data final</label>
          <input class="input" id="qAte" type="date" value="${consFiltro.ate}"></div>
        <div class="field" style="margin:0;align-self:end">
          <button class="btn ghost" type="button" id="qLimparData">Limpar datas</button></div>
      </div>
      <div id="qAvisoData" class="aviso warn" hidden></div>
    </div>
    <div class="table-card">
      <div class="card-head">
        <h3 id="consCount">Notas encontradas</h3>
      </div>
      <div style="overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>Número</th><th>Destinatário</th><th>Valor</th><th>Data</th><th>Hora</th><th>Status</th><th>Chave de acesso</th><th>Ações</th>
        </tr></thead><tbody id="consRows"></tbody></table>
      </div>
    </div>`;
  app.innerHTML = shell('#consultar', content);

  function list(){
    const q=consFiltro.busca.trim().toLowerCase();
    return filtrarNotas(consFiltro.periodo, Store.notas, consFiltro).filter(n=>
      (!consFiltro.status || n.status===consFiltro.status) &&
      (!q || String(n.numero).includes(q) || n.cliente.toLowerCase().includes(q)));
  }
  /* O intervalo invertido antes zerava a lista sem explicar por quê. */
  function avisoData(){
    const el = document.getElementById('qAvisoData');
    const invertido = consFiltro.periodo==='custom' && consFiltro.de && consFiltro.ate
      && parseISO(consFiltro.de) > parseISO(consFiltro.ate);
    el.hidden = !invertido;
    if (invertido) el.textContent = 'A data inicial é posterior à data final. Inverta as datas para ver resultados.';
    return invertido;
  }
  function renderRows(){
    avisoData();
    const l=list();
    document.getElementById('consCount').textContent =
      l.length ? `${l.length} nota${l.length>1?'s':''} encontrada${l.length>1?'s':''}` : 'Nenhuma nota encontrada';
    document.getElementById('consRows').innerHTML = l.length ? l.map(n=>`
      <tr>
        <td>${n.numero}</td><td>${esc(n.cliente)}</td><td>${BRL(n.valor)}</td>
        <td>${n.data}</td><td>${n.hora||'—'}</td><td>${statusBadge(n.status)}</td>
        <td class="chave">${esc(n.chave)}</td>
        <td><div class="actions">${n.status==='Autorizada'?`
          <button class="iconbtn" data-xml="${n.numero}" aria-label="Baixar arquivo da nota ${n.numero}" title="Baixar arquivo da nota">${ICON.download}</button>
          <button class="iconbtn del" data-cancel="${n.numero}" aria-label="Cancelar nota ${n.numero}" title="Cancelar nota">${ICON.cancelar}</button>`:''}
        </div></td>
      </tr>`).join('') : `<tr><td colspan="8" class="muted center">Nenhuma nota encontrada com esses filtros.</td></tr>`;
  }
  const baixarBlob=(name,blob)=>{ const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); URL.revokeObjectURL(u); };
  const dl=(name,content,type)=> baixarBlob(name, new Blob([content],{type}));
  const xmlOf=n=>`<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc versao="4.00">\n  <NFe><infNFe>\n    <ide><nNF>${n.numero}</nNF><dhEmi>${n.data} ${n.hora||''}</dhEmi></ide>\n    <dest><xNome>${esc(n.cliente)}</xNome></dest>\n    <total><vNF>${n.valor.toFixed(2)}</vNF></total>\n    <status>${n.status}</status><chNFe>${n.chave.replace(/\\s/g,'')}</chNFe>\n  </infNFe></NFe>\n</nfeProc>`;

  document.getElementById('qBusca').addEventListener('input', e=>{consFiltro.busca=e.target.value;renderRows();});
  document.getElementById('qStatus').addEventListener('change', e=>{consFiltro.status=e.target.value;renderRows();});
  document.getElementById('qPeriodo').addEventListener('change', e=>{
    consFiltro.periodo=e.target.value;
    document.getElementById('qRange').hidden = consFiltro.periodo!=='custom';
    renderRows();
  });
  document.getElementById('qDe').addEventListener('change', e=>{consFiltro.de=e.target.value;renderRows();});
  document.getElementById('qAte').addEventListener('change', e=>{consFiltro.ate=e.target.value;renderRows();});
  document.getElementById('qLimparData').addEventListener('click', ()=>{
    consFiltro.de=''; consFiltro.ate='';
    document.getElementById('qDe').value=''; document.getElementById('qAte').value='';
    renderRows();
  });
  document.getElementById('consRows').addEventListener('click', e=>{
    const x=e.target.closest('[data-xml]');
    if(x){
      const n=Store.notas.find(n=>n.numero==x.dataset.xml);
      dl(`NFe-${n.numero}.xml`, xmlOf(n),'application/xml');
      return toast(`Arquivo da nota ${n.numero} baixado.`, 'ok');
    }
    const c=e.target.closest('[data-cancel]');
    if(c){
      const n=Store.cancelarNota(c.dataset.cancel);
      if(!n) return toast('Só notas autorizadas podem ser canceladas.', 'err');
      toast(`Nota ${n.numero} cancelada. O registro é mantido no histórico.`, 'ok');
      renderRows();
    }
  });
  // US09 — os XMLs autorizados saem em UM pacote .zip, não em vários downloads.
  document.getElementById('btnZip').addEventListener('click', ()=>{
    const aut=list().filter(n=>n.status==='Autorizada');
    if(!aut.length) return toast('Nenhuma nota autorizada no filtro atual para exportar.', 'err');
    const zip = Zip.criar(aut.map(n => ({ nome:`NFe-${n.numero}.xml`, conteudo:xmlOf(n) })));
    baixarBlob(`NFe-pacote-${aut.length}-notas.zip`, zip);
    toast(`Pacote .zip com ${aut.length} nota(s) gerado.`, 'ok');
  });
  renderRows();
  wireShell();
}

/* ---------- Relatórios (US11 — soma total por período) ---------- */
let relPeriodo = 'mes';
function viewRelatorios(){
  const content = `
    <div class="page-head">
      <div>
        <h2>Relatório Financeiro Consolidado</h2>
        <p class="page-sub">Soma total das notas por período — como solicitado na entrevista.</p>
      </div>
      ${periodoPill('relPeriodo', relPeriodo)}
    </div>
    <div class="card card-lg total-card" style="margin-bottom:22px">
      <p class="total-card__lbl">Faturamento total no período <span id="relRot"></span></p>
      <div class="total-card__num" id="relSoma">R$ 0,00</div>
      <p class="muted total-card__hint">Considera apenas notas autorizadas.</p>
    </div>
    <div class="stats" id="relStats" style="grid-template-columns:repeat(3,1fr)"></div>`;
  app.innerHTML = shell('#relatorios', content);

  const render = () => {
    const sel  = filtrarNotas(relPeriodo);
    const aut  = sel.filter(n=>n.status==='Autorizada');
    const rej  = sel.filter(n=>n.status==='Rejeitada').length;
    const soma = aut.reduce((s,n)=>s+n.valor,0);
    document.getElementById('relRot').textContent  = `(${rotuloPeriodo(relPeriodo).toLowerCase()})`;
    document.getElementById('relSoma').textContent = BRL(soma);
    document.getElementById('relStats').innerHTML = [
      statCard('Notas autorizadas', aut.length),
      statCard('Notas rejeitadas',  rej, {neg:true}),
      statCard('Ticket médio',      aut.length?soma/aut.length:0, {money:true}),
    ].join('');
  };
  wirePeriodo('relPeriodo', relPeriodo, v => { relPeriodo = v; render(); });
  render();
  wireShell();
}

/* ---------- Configurações (US02/08/10/12) ---------- */
function viewConfig(){
  const e=Store.emissor, c=Store.cfg;
  const content = `
    <div class="page-head"><h2>Configurações</h2></div>
    <div class="card card-lg" style="margin-bottom:22px">
      <div class="card-head"><h3>Perfil do Emissor</h3></div>
      <div class="row">
        <div class="field"><label>Razão Social</label><input class="input" id="sRazao" value="${esc(e.razaoSocial)}"></div>
        <div class="field"><label>CNPJ</label><input class="input" id="sCnpj" value="${esc(e.cnpj)}"></div>
      </div>
      <div class="field" style="max-width:340px"><label>Certificado Digital — validade</label>
        <input class="input" id="sCert" value="${esc(e.certificadoValidade)}"></div>
      <p class="muted" style="font-size:14px">O certificado expira em <b>${esc(e.certificadoValidade)}</b>. Renove antes do vencimento.</p>
    </div>
    <div class="card card-lg" style="margin-bottom:22px">
      <div class="card-head"><h3>Emissão e Contingência</h3></div>
      <div class="row">
        <div class="field"><label>Provedor padrão</label>
          <select class="input" id="sProv"><option ${c.provedorPadrao==='Sebrae'?'selected':''}>Sebrae</option><option ${c.provedorPadrao==='Sefaz'?'selected':''}>Sefaz</option></select></div>
        <div class="field"><label>Contingência (failover)</label>
          <select class="input" id="sCont"><option ${c.provedorContingencia==='Sefaz'?'selected':''}>Sefaz</option><option ${c.provedorContingencia==='Sebrae'?'selected':''}>Sebrae</option></select></div>
      </div>
    </div>
    <div class="card card-lg" style="margin-bottom:22px">
      <div class="card-head"><h3>Cobrança e avisos</h3></div>
      <p class="muted" style="margin:0">
        A geração de boleto junto da nota e o e-mail de aviso a cada emissão são configurados em
        <a href="#integracoes">Integrações</a>.
      </p>
    </div>
    <button class="btn" id="sSave">${ICON.save} Salvar configurações</button>`;
  app.innerHTML = shell('#config', content);
  document.getElementById('sSave').addEventListener('click', ()=>{
    const padrao = document.getElementById('sProv').value;
    const cont   = document.getElementById('sCont').value;
    if (padrao === cont)
      return toast('O serviço de contingência precisa ser diferente do padrão.', 'err');
    Store.emissor.razaoSocial = document.getElementById('sRazao').value.trim();
    Store.emissor.cnpj = document.getElementById('sCnpj').value.trim();
    Store.emissor.certificadoValidade = document.getElementById('sCert').value.trim();
    Store.cfg.provedorPadrao = padrao;
    Store.cfg.provedorContingencia = cont;
    toast('Configurações salvas.', 'ok');
  });
  wireShell();
}

/* ---------- Integrações (US08 failover + US10 cobrança + US12 aviso) --------
   Esta tela era um placeholder "em construção" — apontado no Teste de
   Usabilidade como menu sem funcionalidade. Agora demonstra o failover.      */
function viewIntegracoes(){
  const c = Store.cfg;
  const content = `
    <div class="page-head">
      <div>
        <h2>Integrações</h2>
        <p class="page-sub">Serviços usados para transmitir a nota e para gerar a cobrança.</p>
      </div>
    </div>

    <div class="card card-lg" style="margin-bottom:22px">
      <div class="card-head">
        <h3>Serviços de emissão</h3>
        <button class="btn ghost sm" id="btnSimular">Simular falha do serviço padrão</button>
      </div>
      <p class="muted" style="margin:0 0 18px">
        O sistema envia a nota para o serviço padrão. Se ele estiver fora do ar, a mesma nota é
        reenviada automaticamente para o serviço de contingência, sem que você precise preencher nada de novo.
      </p>
      <div id="provList"></div>
      <div id="provAviso" class="aviso" hidden></div>
    </div>

    <div class="card card-lg" style="margin-bottom:22px">
      <div class="card-head"><h3>Cobrança — boleto bancário</h3></div>
      <p class="muted" style="margin:0 0 16px">
        Quando ativado, o boleto é gerado assim que a nota é autorizada, com o
        <b>mesmo valor</b> e a <b>mesma data de vencimento</b> da nota.
      </p>
      <label class="check">
        <input type="checkbox" id="iBoleto" ${c.boletoAtivo?'checked':''}>
        <span>Gerar boleto automaticamente ao autorizar a nota</span>
      </label>
      <p class="muted" style="font-size:14px;margin-top:12px">
        O boleto nunca é gerado antes da autorização — uma nota rejeitada não gera cobrança.
      </p>
    </div>

    <div class="card card-lg">
      <div class="card-head"><h3>Aviso por e-mail</h3></div>
      <div class="field" style="max-width:420px">
        <label for="iEmail">E-mail avisado a cada nota emitida</label>
        <input class="input" id="iEmail" value="${esc(c.emailNotificacao)}">
      </div>
      <p class="muted" style="font-size:14px;margin:0">
        O aviso traz número, destinatário, valor e a chave de acesso da nota.
      </p>
    </div>`;
  app.innerHTML = shell('#integracoes', content);

  const renderProv = () => {
    document.getElementById('provList').innerHTML = Store.provedores.map(p => {
      const ehPadrao = p.nome === c.provedorPadrao;
      const online = p.status === 'Online';
      return `<div class="prov prov--row">
        <div>
          <div class="name">${esc(p.nome)}</div>
          <div class="muted" style="font-size:14px">${ehPadrao?'Serviço padrão':'Serviço de contingência'}</div>
        </div>
        <div class="st ${online?'on':'off'}">${p.status}</div>
      </div>`;
    }).join('');
  };
  document.getElementById('btnSimular').addEventListener('click', () => {
    const padrao = Store.provedores.find(p => p.nome === c.provedorPadrao);
    const backup = Store.provedores.find(p => p.nome === c.provedorContingencia);
    const aviso  = document.getElementById('provAviso');
    if (!padrao || !backup) return;
    if (padrao.status === 'Online'){
      padrao.status = 'Indisponível';
      aviso.hidden = false; aviso.className = 'aviso warn';
      aviso.innerHTML = `<b>${esc(padrao.nome)} está fora do ar.</b> As próximas notas serão transmitidas
        por <b>${esc(backup.nome)}</b> automaticamente, com a mesma estrutura de dados.`;
      toast(`Falha em ${padrao.nome}. Contingência ${backup.nome} assumiu.`, 'ok');
    } else {
      padrao.status = 'Online';
      aviso.hidden = false; aviso.className = 'aviso ok';
      aviso.innerHTML = `<b>${esc(padrao.nome)} voltou a responder.</b> A transmissão retornou ao serviço padrão.`;
      toast(`${padrao.nome} restabelecido.`, 'ok');
    }
    renderProv();
  });
  document.getElementById('iBoleto').addEventListener('change', e => {
    Store.cfg.boletoAtivo = e.target.checked;
    toast(e.target.checked ? 'Boleto será gerado junto da nota.' : 'Geração de boleto desativada.', 'ok');
  });
  document.getElementById('iEmail').addEventListener('change', e => {
    Store.cfg.emailNotificacao = e.target.value.trim();
    toast('E-mail de aviso atualizado.', 'ok');
  });
  renderProv();
  wireShell();
}

/* ---------- Placeholder (telas sem frame no Figma) ---------- */
function viewPlaceholder(route, titulo, emoji, desc){
  app.innerHTML = shell(route, `
    <div class="page-head"><h2>${titulo}</h2></div>
    <div class="placeholder">
      <div class="big">${emoji}</div>
      <h3>${titulo}</h3>
      <p>${desc}</p>
    </div>`);
  wireShell();
}

/* ==========================================================================
   Shell wiring (menu mobile + logout) + Router
   ========================================================================== */
function wireShell(){
  const mb=document.getElementById('menuBtn'), sb=document.getElementById('sidebar'), sc=document.getElementById('scrim');
  if(mb) mb.addEventListener('click', ()=>{ sb.classList.toggle('open'); sc.classList.toggle('show'); });
  if(sc) sc.addEventListener('click', ()=>{ sb.classList.remove('open'); sc.classList.remove('show'); });
  document.querySelectorAll('[data-logout]').forEach(a=>a.addEventListener('click', ()=>toast('Sessão encerrada (demo).')));
}

const ROUTES = {
  '#login': viewLogin,
  '#recuperar': viewRecuperar,
  '#dashboard': viewDashboard,
  '#dashboard2': viewDashboard2,
  '#emitir': viewEmitir,
  '#clientes': viewClientes,
  '#produtos': viewProdutos,
  '#consultar': viewConsultar,
  '#integracoes': viewIntegracoes,
  '#relatorios': viewRelatorios,
  '#config': viewConfig,
  '#ajuda': () => viewPlaceholder('#ajuda','Ajuda','💬','Central de ajuda e suporte. Fora do escopo acordado com o cliente nesta versão.'),
};

function router(){
  const route = location.hash || '#login';
  (ROUTES[route] || viewLogin)();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', router);
router();
