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
        <a href="#dashboard" class="login__forgot">Esqueci minha senha</a>
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

/* ---------- Componentes reutilizáveis ---------- */
function statCard(title, value, {money=false, neg=false, delta=''}={}){
  const num = money
    ? `<div class="num money${neg?' neg':''}"><small>R$</small> ${Number(value).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>`
    : `<div class="num${neg?' neg':''}">${Number(value).toLocaleString('pt-BR')}</div>`;
  return `<div class="stat"><h4>${title}</h4>${num}${delta?`<div class="delta">${delta}</div>`:''}</div>`;
}
function statusBadge(s){ return `<span class="status ${s==='Autorizada'?'ok':'no'}">${s}</span>`; }

/* ---------- Dashboard (frame DashBoard) ---------- */
let dashPeriodo = 'mes';
function filtrarNotas(periodo){
  const ns = Store.notas;
  if (periodo === 'tudo') return ns;
  const ref = '25/02/2026';
  if (periodo === 'hoje') return ns.filter(n => n.data === ref);
  if (periodo === 'mes')  return ns.filter(n => n.data.slice(3) === '02/2026');
  if (periodo === '7')    return ns.filter(n => ['25/02/2026','24/02/2026','20/02/2026'].includes(n.data));
  return ns;
}
function viewDashboard(){
  const h = Store.headline;
  const content = `
    <div class="page-head">
      <h2>Resumo Geral</h2>
      <span class="pill">Período:
        <select id="periodo">
          <option value="hoje">Hoje</option>
          <option value="7">Últimos 7 dias</option>
          <option value="mes" selected>Este mês</option>
          <option value="tudo">Tudo</option>
        </select>
      </span>
    </div>
    <div class="stats">
      ${statCard('Notas emitidas (Mês)', h.emitidasMes, {delta:'<span class="up">+12%</span> em relação a ontem'})}
      ${statCard('Notas autorizadas', h.autorizadas, {delta:'<span class="up">+8%</span> em relação a ontem'})}
      ${statCard('Notas canceladas', h.canceladas, {delta:'<span class="down">-4%</span> em relação a ontem'})}
      ${statCard('Total faturado (Mês)', h.faturadoMes, {money:true, delta:'<span class="up">+1%</span> em relação ao mês anterior'})}
    </div>
    <div class="dash-grid">
      <div class="table-card">
        <table class="tbl"><thead><tr>
          <th>Número</th><th>Destinatário</th><th>Valor</th><th>Data</th><th>Status</th>
        </tr></thead><tbody id="dashRows"></tbody></table>
      </div>
      <div class="side-cards">
        <div class="mini-card">
          <h4>Status dos Provedores</h4>
          ${Store.provedores.map(p=>`
            <div class="prov">
              <div class="name">${esc(p.nome)}${p.tag?` <span class="muted" style="font-size:15px;font-weight:500">(${p.tag})</span>`:''}</div>
              <div class="st on">${p.status}</div>
            </div>`).join('')}
        </div>
        <div class="mini-card" style="text-align:center">
          <h4>Alertas Recentes</h4>
          <p class="alert-line">Notas emitidas hoje: <b>${h.emitidasHoje}</b></p>
          <p class="alert-line">Última nota autorizada há <b>2 minutos</b></p>
        </div>
      </div>
    </div>`;
  app.innerHTML = shell('#dashboard', content);
  const renderRows = () => {
    const rows = filtrarNotas(dashPeriodo).slice(0,6);
    document.getElementById('dashRows').innerHTML = rows.length ? rows.map(n=>`
      <tr><td>${n.numero}</td><td>${esc(n.cliente)}</td><td>${BRL(n.valor)}</td><td>${n.data}</td><td>${statusBadge(n.status)}</td></tr>
    `).join('') : `<tr><td colspan="5" class="muted center">Nenhuma nota no período.</td></tr>`;
  };
  const sel = document.getElementById('periodo');
  sel.value = dashPeriodo;
  sel.addEventListener('change', e => { dashPeriodo = e.target.value; renderRows(); });
  renderRows();
  wireShell();
}

/* ---------- Dashboard2 (frame DashBoard2) ---------- */
function viewDashboard2(){
  const h = Store.headline;
  const rows = Store.notas.slice(0,8).map(n=>`
    <tr><td>${n.numero}</td><td>${esc(n.cliente)}</td><td>${BRL(n.valor)}</td><td>${n.data} ${n.hora||''}</td><td>${statusBadge(n.status)}</td></tr>
  `).join('');
  const content = `
    <div class="page-head">
      <h2>Resumo Geral</h2>
      <span class="pill">Período: <select><option>Hoje</option><option>Este mês</option></select></span>
    </div>
    <div class="stats">
      ${statCard('Notas emitidas Hoje', h.emitidasHoje, {delta:'<span class="up">+12%</span> em relação a ontem'})}
      ${statCard('Notas emitidas Mês', h.emitidasMes, {delta:'<span class="up">+8%</span> em relação a ontem'})}
      ${statCard('Notas rejeitadas Hoje', h.rejeitadasHoje, {neg:true, delta:'<span class="down">-4%</span> em relação a ontem'})}
      ${statCard('Total faturado Mês', h.faturadoMes, {money:true, delta:'<span class="up">+1%</span> em relação ao mês anterior'})}
    </div>
    <div class="table-card">
      <table class="tbl"><thead><tr>
        <th>Nº de notas</th><th>Cliente</th><th>Valor</th><th>Data</th><th>Status</th>
      </tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  app.innerHTML = shell('#dashboard', content);
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
      <h2>Emitir Nota Fiscal</h2>
      <button class="btn" id="btnEmitir">Emitir Nota</button>
    </div>
    <div class="emit-grid">
      <div>
        <div class="card" style="margin-bottom:22px">
          <h3 style="font-size:22px;margin-bottom:18px">Destinatário</h3>
          <div class="field"><label>Cliente</label>
            <select class="input" id="emitCliente">${clienteOpts}</select>
          </div>
          <div class="row">
            <div class="field"><label>Natureza da operação</label>
              <select class="input"><option>Venda de mercadoria</option><option>Prestação de serviço</option><option>Devolução</option></select>
            </div>
            <div class="field"><label>Data de emissão</label>
              <input class="input" type="text" value="25/02/2026" readonly>
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
      <td><button class="iconbtn del" data-f="rm" title="Remover">${ICON.trash}</button></td>
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
    <div class="page-head"><h2>Cadastrar Cliente</h2></div>
    <div class="card card-lg" style="margin-bottom:26px">
      <form id="cliForm">
        <div class="field"><label>Nome/Razão Social</label>
          <input class="input" id="cNome" placeholder="Nome Exemplo" required></div>
        <div class="field"><label>Email</label>
          <input class="input" id="cEmail" type="email" placeholder="emailexemplo@email.com"></div>
        <div class="row">
          <div class="field"><label>CPF/CNPJ</label>
            <input class="input" id="cDoc" placeholder="12.345.678/0001-95"></div>
          <div class="field"><label>Inscrição Estadual</label>
            <input class="input" id="cIe" placeholder="16.123456.1"></div>
          <div class="field" style="max-width:200px"><label>Situação</label>
            <select class="input" id="cSit"><option>Ativa</option><option>Inativa</option></select></div>
        </div>
        <div style="display:flex;gap:14px;justify-content:center;margin-top:8px">
          <button class="btn icon" type="submit" title="Salvar">${ICON.save}</button>
          <button class="btn icon" type="button" id="cLimpar" title="Excluir/Limpar">${ICON.trash}</button>
        </div>
      </form>
    </div>

    <div class="page-head"><h2>Buscar Cliente</h2></div>
    <div class="card card-lg">
      <div style="max-width:380px;margin-bottom:18px">
        <div style="position:relative">
          <input class="input" id="cBusca" placeholder="Buscar por nome ou documento…" value="${esc(cliBusca)}" style="padding-right:44px">
          <span class="in-ic" style="position:absolute;right:14px;top:50%;transform:translateY(-50%);color:#9aa">${ICON.consultar}</span>
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
  const fields = { nome:'cNome', email:'cEmail', doc:'cDoc', ie:'cIe', situacao:'cSit' };
  const loadForm = c => { document.getElementById('cNome').value=c.nome; document.getElementById('cEmail').value=c.email||''; document.getElementById('cDoc').value=c.doc||''; document.getElementById('cIe').value=c.ie||''; document.getElementById('cSit').value=c.situacao||'Ativa'; cliEdit=c.id; };
  const clearForm = () => { form.reset(); cliEdit=null; };

  function renderRows(){
    const q = cliBusca.trim().toLowerCase();
    const list = Store.clientes.filter(c => !q || c.nome.toLowerCase().includes(q) || (c.doc||'').toLowerCase().includes(q));
    document.getElementById('cliRows').innerHTML = list.length ? list.map(c=>`
      <tr>
        <td>${esc(c.nome)}</td><td>${esc(c.doc)}</td><td>${esc(c.ie||'—')}</td>
        <td><span class="status ${c.situacao==='Ativa'?'ok':'no'}">${c.situacao}</span></td>
        <td><div class="actions">
          <button class="iconbtn" data-edit="${c.id}" title="Editar">${ICON.save}</button>
          <button class="iconbtn del" data-del="${c.id}" title="Excluir">${ICON.trash}</button>
        </div></td>
      </tr>`).join('') : `<tr><td colspan="5" class="muted center">Nenhum cliente encontrado.</td></tr>`;
  }
  form.addEventListener('submit', e=>{
    e.preventDefault();
    const data = { nome:cNome.value.trim(), email:cEmail.value.trim(), doc:cDoc.value.trim(), ie:cIe.value.trim(), situacao:cSit.value };
    if (!data.nome) return toast('Informe o nome/razão social.', 'err');
    if (cliEdit){ Store.updateCliente(cliEdit, data); toast('Cliente atualizado.', 'ok'); }
    else { Store.addCliente(data); toast('Cliente cadastrado.', 'ok'); }
    clearForm(); renderRows();
  });
  document.getElementById('cLimpar').addEventListener('click', ()=>{
    if (cliEdit){ Store.removeCliente(cliEdit); toast('Cliente excluído.', 'ok'); clearForm(); renderRows(); }
    else clearForm();
  });
  document.getElementById('cBusca').addEventListener('input', e=>{ cliBusca=e.target.value; renderRows(); });
  document.getElementById('cliRows').addEventListener('click', e=>{
    const ed=e.target.closest('[data-edit]'); const dl=e.target.closest('[data-del]');
    if (ed){ loadForm(Store.findCliente(ed.dataset.edit)); window.scrollTo({top:0,behavior:'smooth'}); }
    if (dl){ Store.removeCliente(dl.dataset.del); toast('Cliente excluído.', 'ok'); renderRows(); }
  });
  renderRows();
  wireShell();
}

/* ---------- Consultar Nota / Histórico (US09) ---------- */
let consFiltro = { status:'', busca:'' };
function viewConsultar(){
  const content = `
    <div class="page-head">
      <h2>Consultar Notas</h2>
      <button class="btn" id="btnZip">${ICON.download} Exportar .ZIP</button>
    </div>
    <div class="card" style="margin-bottom:22px">
      <div class="row">
        <div class="field" style="margin:0"><label>Buscar</label>
          <input class="input" id="qBusca" placeholder="Número ou destinatário…"></div>
        <div class="field" style="margin:0;max-width:220px"><label>Status</label>
          <select class="input" id="qStatus"><option value="">Todos</option><option>Autorizada</option><option>Rejeitada</option></select></div>
      </div>
    </div>
    <div class="table-card">
      <div style="overflow-x:auto">
        <table class="tbl"><thead><tr>
          <th>Número</th><th>Destinatário</th><th>Valor</th><th>Data</th><th>Hora</th><th>Status</th><th>Chave de acesso</th><th></th>
        </tr></thead><tbody id="consRows"></tbody></table>
      </div>
    </div>`;
  app.innerHTML = shell('#consultar', content);

  function list(){
    const q=consFiltro.busca.trim().toLowerCase();
    return Store.notas.filter(n=>
      (!consFiltro.status || n.status===consFiltro.status) &&
      (!q || String(n.numero).includes(q) || n.cliente.toLowerCase().includes(q)));
  }
  function renderRows(){
    const l=list();
    document.getElementById('consRows').innerHTML = l.length ? l.map(n=>`
      <tr>
        <td>${n.numero}</td><td>${esc(n.cliente)}</td><td>${BRL(n.valor)}</td>
        <td>${n.data}</td><td>${n.hora||'—'}</td><td>${statusBadge(n.status)}</td>
        <td style="font-size:14px;color:#555">${esc(n.chave)}</td>
        <td>${n.status==='Autorizada'?`<button class="iconbtn" data-xml="${n.numero}" title="Baixar XML">${ICON.download}</button>`:''}</td>
      </tr>`).join('') : `<tr><td colspan="8" class="muted center">Nenhuma nota encontrada.</td></tr>`;
  }
  const dl=(name,content,type)=>{ const b=new Blob([content],{type}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download=name; a.click(); URL.revokeObjectURL(u); };
  const xmlOf=n=>`<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc versao="4.00">\n  <NFe><infNFe>\n    <ide><nNF>${n.numero}</nNF><dhEmi>${n.data} ${n.hora||''}</dhEmi></ide>\n    <dest><xNome>${esc(n.cliente)}</xNome></dest>\n    <total><vNF>${n.valor.toFixed(2)}</vNF></total>\n    <status>${n.status}</status><chNFe>${n.chave.replace(/\\s/g,'')}</chNFe>\n  </infNFe></NFe>\n</nfeProc>`;

  document.getElementById('qBusca').addEventListener('input', e=>{consFiltro.busca=e.target.value;renderRows();});
  document.getElementById('qStatus').addEventListener('change', e=>{consFiltro.status=e.target.value;renderRows();});
  document.getElementById('consRows').addEventListener('click', e=>{
    const x=e.target.closest('[data-xml]'); if(x){ const n=Store.notas.find(n=>n.numero==x.dataset.xml); dl(`NFe-${n.numero}.xml`, xmlOf(n),'application/xml'); toast(`XML da nota ${n.numero} baixado.`, 'ok'); }
  });
  document.getElementById('btnZip').addEventListener('click', ()=>{
    const aut=list().filter(n=>n.status==='Autorizada');
    if(!aut.length) return toast('Nenhuma nota autorizada para exportar.', 'err');
    dl(`NFe-pacote-${aut.length}-notas.xml`, aut.map(xmlOf).join('\n\n'), 'application/xml');
    toast(`Pacote com ${aut.length} XML(s) gerado (simulação do .ZIP).`, 'ok');
  });
  renderRows();
  wireShell();
}

/* ---------- Relatórios (US11 — soma total por período) ---------- */
function viewRelatorios(){
  const aut = Store.notas.filter(n=>n.status==='Autorizada');
  const soma = aut.reduce((s,n)=>s+n.valor,0);
  const rej = Store.notas.filter(n=>n.status==='Rejeitada').length;
  const content = `
    <div class="page-head"><h2>Relatório Financeiro Consolidado</h2>
      <span class="pill">Período: <select><option>Este mês</option><option>Últimos 7 dias</option><option>Ano</option></select></span>
    </div>
    <div class="card card-lg" style="text-align:center;margin-bottom:22px">
      <p class="muted" style="font-size:18px;margin-bottom:8px">Faturamento total no período (notas autorizadas)</p>
      <div style="font-size:64px;font-weight:800;color:var(--accent)">${BRL(soma)}</div>
    </div>
    <div class="stats" style="grid-template-columns:repeat(3,1fr)">
      ${statCard('Notas autorizadas', aut.length)}
      ${statCard('Notas rejeitadas', rej, {neg:rej>0})}
      ${statCard('Ticket médio', aut.length?soma/aut.length:0, {money:true})}
    </div>`;
  app.innerHTML = shell('#relatorios', content);
  wireShell();
}

/* ---------- Configurações (US02/08/10/12) ---------- */
function viewConfig(){
  const e=Store.emissor, c=Store.cfg;
  const content = `
    <div class="page-head"><h2>Configurações</h2></div>
    <div class="card card-lg" style="margin-bottom:22px">
      <h3 style="font-size:20px;margin-bottom:18px">Perfil do Emissor</h3>
      <div class="row">
        <div class="field"><label>Razão Social</label><input class="input" id="sRazao" value="${esc(e.razaoSocial)}"></div>
        <div class="field"><label>CNPJ</label><input class="input" id="sCnpj" value="${esc(e.cnpj)}"></div>
      </div>
      <div class="field" style="max-width:340px"><label>Certificado Digital — validade</label>
        <input class="input" id="sCert" value="${esc(e.certificadoValidade)}"></div>
      <p class="muted" style="font-size:14px">O certificado expira em <b>${esc(e.certificadoValidade)}</b>. Renove antes do vencimento.</p>
    </div>
    <div class="card card-lg" style="margin-bottom:22px">
      <h3 style="font-size:20px;margin-bottom:18px">Emissão &amp; Contingência</h3>
      <div class="row">
        <div class="field"><label>Provedor padrão</label>
          <select class="input" id="sProv"><option ${c.provedorPadrao==='Sebrae'?'selected':''}>Sebrae</option><option ${c.provedorPadrao==='Sefaz'?'selected':''}>Sefaz</option></select></div>
        <div class="field"><label>Contingência (failover)</label>
          <select class="input" id="sCont"><option ${c.provedorContingencia==='Sefaz'?'selected':''}>Sefaz</option><option ${c.provedorContingencia==='Sebrae'?'selected':''}>Sebrae</option></select></div>
      </div>
    </div>
    <div class="card card-lg" style="margin-bottom:22px">
      <h3 style="font-size:20px;margin-bottom:18px">Notificações &amp; Cobrança</h3>
      <div class="field"><label>E-mail de notificação por emissão</label><input class="input" id="sEmail" value="${esc(c.emailNotificacao)}"></div>
      <label style="display:flex;gap:10px;align-items:center;font-weight:500;cursor:pointer">
        <input type="checkbox" id="sBoleto" ${c.boletoAtivo?'checked':''}> Gerar boleto automaticamente ao autorizar a nota
      </label>
    </div>
    <button class="btn" id="sSave">${ICON.save} Salvar configurações</button>`;
  app.innerHTML = shell('#config', content);
  document.getElementById('sSave').addEventListener('click', ()=>{
    Store.cfg.emailNotificacao=document.getElementById('sEmail').value;
    Store.cfg.boletoAtivo=document.getElementById('sBoleto').checked;
    Store.cfg.provedorPadrao=document.getElementById('sProv').value;
    Store.cfg.provedorContingencia=document.getElementById('sCont').value;
    toast('Configurações salvas.', 'ok');
  });
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
  '#dashboard': viewDashboard,
  '#dashboard2': viewDashboard2,
  '#emitir': viewEmitir,
  '#clientes': viewClientes,
  '#consultar': viewConsultar,
  '#relatorios': viewRelatorios,
  '#config': viewConfig,
  '#integracoes': () => viewPlaceholder('#integracoes','Integrações','🔗','Conexões com APIs de cobrança, ERPs e webhooks. Em construção neste protótipo.'),
  '#ajuda': () => viewPlaceholder('#ajuda','Ajuda','💬','Central de ajuda e suporte. Em construção neste protótipo.'),
};

function router(){
  const route = location.hash || '#login';
  (ROUTES[route] || viewLogin)();
  window.scrollTo(0,0);
}
window.addEventListener('hashchange', router);
router();
