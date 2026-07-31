/* ==========================================================================
   NFCloud — store de dados (mock, em memória)
   Baseado nos exemplos do Figma e no Backlog de Histórias de Usuário (Notion).
   Estado compartilhado: emitir nota reflete no dashboard e no histórico.
   ========================================================================== */
const Store = (() => {
  const emissor = {
    nome: 'Hugo Silva',
    razaoSocial: 'Hugo Comércio e Serviços LTDA',
    cnpj: '12.345.678/0001-95',
    certificadoValidade: '31/12/2026',
  };

  const provedores = [
    { nome: 'Sebrae', tag: 'principal', status: 'Online' },
    { nome: 'Sefaz',  tag: '',          status: 'Online' },
  ];

  // Catálogo de produtos (US04) — NCM/CFOP/alíquotas realistas p/ o protótipo funcionar
  let produtos = [
    { id: 'p1', descricao: 'Produto Exemplo 1', ncm: '8471.30.19', cfop: '5102', valorUnit: 245.00, icms: 12, pis: 1.65, cofins: 7.60, isento: false },
    { id: 'p2', descricao: 'Serviço de Consultoria', ncm: '0000.00.00', cfop: '5933', valorUnit: 500.00, icms: 0, pis: 0.65, cofins: 3.00, isento: true },
    { id: 'p3', descricao: 'Notebook 14"', ncm: '8471.30.12', cfop: '5405', valorUnit: 3200.00, icms: 18, pis: 1.65, cofins: 7.60, isento: false },
    { id: 'p4', descricao: 'Cadeira de Escritório', ncm: '9401.30.00', cfop: '5102', valorUnit: 780.00, icms: 12, pis: 1.65, cofins: 7.60, isento: false },
    { id: 'p5', descricao: 'Licença de Software (anual)', ncm: '4907.00.00', cfop: '5949', valorUnit: 1200.00, icms: 0, pis: 0.65, cofins: 3.00, isento: true },
  ];

  // Clientes (US03)
  let clientes = [
    { id: 'c1', nome: 'Empresa Exemplo Ltda',  email: 'contato@empresaexemplo.com', doc: '12.345.678/0001-00', ie: '123.456.789-111', situacao: 'Ativa' },
    { id: 'c2', nome: 'Usuário Exemplo Silva',  email: 'usuario@exemplo.com',        doc: '18.432.000/0001-00', ie: 'ISENTO',           situacao: 'Ativa' },
    { id: 'c3', nome: 'Empresa ABC',            email: 'financeiro@abc.com',         doc: '45.111.222/0001-33', ie: '222.333.444-555', situacao: 'Ativa' },
    { id: 'c4', nome: 'João da Silva',          email: 'joao@email.com',             doc: '111.222.333-44',     ie: 'ISENTO',           situacao: 'Ativa' },
    { id: 'c5', nome: 'Maria Sousa',            email: 'maria@email.com',            doc: '222.333.444-55',     ie: 'ISENTO',           situacao: 'Inativa' },
  ];

  /* ---- Datas ----------------------------------------------------------------
     As notas de exemplo são ancoradas na data de hoje, e não em datas fixas.
     Sem isso os filtros de período (Hoje / Últimos 7 dias / Este mês) nunca
     batem com os dados — foi exatamente o defeito apontado no Teste de
     Usabilidade de 14/07/2026.                                              */
  const pad   = n => String(n).padStart(2, '0');
  const fmtBR = d => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
  const deBR  = s => { const [d,m,y] = s.split('/').map(Number); return new Date(y, m-1, d); };
  const HOJE  = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
  const diasAtras = n => { const d = new Date(HOJE); d.setDate(d.getDate() - n); return d; };
  const chaveDe = (d, numero) =>
    `${pad(d.getDate())}${pad(d.getMonth()+1)}${String(d.getFullYear()).slice(2)} 2600 0000 0000 ${numero}`;

  // Notas emitidas (US09) — 'dias' = quantos dias atrás a nota foi emitida
  const seed = [
    { numero: 1526, cliente: 'Ana Oliveira',        valor:   300.00, dias:  0, hora: '10:45', status: 'Autorizada' },
    { numero: 1525, cliente: 'Empresa ABC',         valor: 25200.00, dias:  0, hora: '10:25', status: 'Autorizada' },
    { numero: 1524, cliente: 'Maria Sousa',         valor:   500.00, dias:  0, hora: '10:20', status: 'Rejeitada'  },
    { numero: 1523, cliente: 'João da Silva',       valor:   300.00, dias:  1, hora: '17:15', status: 'Autorizada' },
    { numero: 1522, cliente: 'Maria da Silva',      valor:   300.00, dias:  1, hora: '17:02', status: 'Autorizada' },
    { numero: 1521, cliente: 'Pedro da Silva',      valor:   300.00, dias:  4, hora: '15:40', status: 'Autorizada' },
    { numero: 1520, cliente: 'Antonio da Silva',    valor:   300.00, dias:  8, hora: '09:11', status: 'Cancelada'  },
    { numero: 1519, cliente: 'Empresa Exemplo Ltda',valor:  1800.00, dias: 35, hora: '14:20', status: 'Autorizada' },
  ];
  let notas = seed.map(({ dias, ...n }) => {
    const d = diasAtras(dias);
    return {
      ...n,
      data: fmtBR(d),
      chave: n.status === 'Autorizada' ? chaveDe(d, n.numero) : '—',
      // Toda nota registra por qual serviço foi transmitida (RN08).
      provedor: n.status === 'Rejeitada' ? '—' : 'Sebrae',
      porContingencia: false,
    };
  });

  /* Modelos de venda recorrente (US07) — o cliente repete as mesmas vendas
     todo mês; salvar o conjunto cliente + itens evita refazer a nota do zero. */
  let modelos = [
    { id: 'm1', nome: 'Mensalidade — Licença de Software',
      clienteId: 'c3', itens: [{ produtoId: 'p5', qtd: 1, valorUnit: 1200.00 }] },
    { id: 'm2', nome: 'Kit escritório (mesa + cadeira)',
      clienteId: 'c1', itens: [{ produtoId: 'p4', qtd: 4, valorUnit: 780.00 }] },
  ];

  const cfg = {
    emailNotificacao: 'hugo@nfcloud.com.br',
    boletoAtivo: true,
    provedorPadrao: 'Sebrae',
    provedorContingencia: 'Sefaz',
  };

  let seqNota = 1526;

  const ehHoje  = dataBR => dataBR === fmtBR(HOJE);
  const ehDoMes = dataBR => dataBR.slice(3) === fmtBR(HOJE).slice(3);

  return {
    emissor, provedores, cfg, HOJE, fmtBR,
    get clientes(){ return clientes; },
    get notas(){ return notas; },
    get produtos(){ return produtos; },
    get modelos(){ return modelos; },

    /* Métricas do dashboard derivadas das próprias notas. Antes eram números
       fixos (3.145 notas / R$ 1.500.090) que contradiziam a tabela logo abaixo. */
    get headline(){
      const mes  = notas.filter(n => ehDoMes(n.data));
      const hoje = notas.filter(n => ehHoje(n.data));
      const aut  = mes.filter(n => n.status === 'Autorizada');
      return {
        emitidasMes:    mes.length,
        emitidasHoje:   hoje.length,
        autorizadas:    aut.length,
        canceladas:     mes.filter(n => n.status === 'Cancelada').length,
        rejeitadasHoje: hoje.filter(n => n.status === 'Rejeitada').length,
        faturadoMes:    aut.reduce((s, n) => s + n.valor, 0),
      };
    },

    addCliente(c){
      c.id = 'c' + (Date.now());
      clientes.unshift(c);
      return c;
    },
    updateCliente(id, patch){
      const i = clientes.findIndex(c => c.id === id);
      if (i > -1) clientes[i] = { ...clientes[i], ...patch };
    },
    removeCliente(id){ clientes = clientes.filter(c => c.id !== id); },
    findCliente(id){ return clientes.find(c => c.id === id); },

    /* ---- Catálogo de produtos (US04) — UC02 "Gerenciar Catálogo de Produtos".
       As regras fiscais (NCM/CFOP/alíquotas/isenção) ficam vinculadas ao
       produto, e é isso que permite o auto-preenchimento da nota (US06). */
    addProduto(p){
      p.id = 'p' + Date.now();
      produtos.unshift(p);
      return p;
    },
    updateProduto(id, patch){
      const i = produtos.findIndex(p => p.id === id);
      if (i > -1) produtos[i] = { ...produtos[i], ...patch };
    },
    /* Produto usado por um modelo não pode sumir e deixar o modelo quebrado. */
    produtoEmUso(id){ return modelos.some(m => m.itens.some(it => it.produtoId === id)); },
    removeProduto(id){
      if (this.produtoEmUso(id)) return false;
      produtos = produtos.filter(p => p.id !== id);
      return true;
    },
    findProduto(id){ return produtos.find(p => p.id === id); },

    /* ---- Modelos de venda recorrente (US07) ---- */
    addModelo(m){
      m.id = 'm' + Date.now();
      modelos.unshift(m);
      return m;
    },
    removeModelo(id){ modelos = modelos.filter(m => m.id !== id); },
    findModelo(id){ return modelos.find(m => m.id === id); },

    /* RN08 / UC05 — Escolhe o serviço de transmissão: o padrão quando está no ar,
       o de contingência quando não está. A nota transmitida é a mesma, sem
       alteração de dados. Se nenhum dos dois responder, ela não é perdida:
       fica pendente e pode ser retransmitida sem novo preenchimento. */
    _rotear(){
      const padrao = provedores.find(p => p.nome === cfg.provedorPadrao);
      const backup = provedores.find(p => p.nome === cfg.provedorContingencia);
      if (padrao && padrao.status === 'Online') return { via: padrao.nome, porContingencia: false };
      if (backup && backup.status === 'Online') return { via: backup.nome, porContingencia: true };
      return { via: null, porContingencia: false };
    },

    emitirNota({ cliente, valor }){
      seqNota += 1;
      const now = new Date();
      const { via, porContingencia } = this._rotear();
      const base = {
        numero: seqNota,
        cliente,
        valor,
        data: fmtBR(now),
        hora: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      };

      if (!via){
        const nota = { ...base, status: 'Pendente', chave: '—', provedor: '—', porContingencia: false };
        notas.unshift(nota);
        return nota;
      }

      // ~85% autorizada, resto rejeitada — simula o retorno do serviço
      const aut = Math.random() > 0.15;
      const nota = {
        ...base,
        status: aut ? 'Autorizada' : 'Rejeitada',
        chave: aut ? chaveDe(now, seqNota) : '—',
        provedor: aut ? via : '—',
        porContingencia,
      };
      notas.unshift(nota);
      return nota;   // headline é derivada de `notas`, não precisa de contador manual
    },

    /* US08 — retransmite uma nota que ficou pendente, sem refazer o preenchimento. */
    retransmitirNota(numero){
      const n = notas.find(n => n.numero === Number(numero));
      if (!n || n.status !== 'Pendente') return null;
      const { via, porContingencia } = this._rotear();
      if (!via) return n;                       // segue pendente
      const aut = Math.random() > 0.15;
      n.status = aut ? 'Autorizada' : 'Rejeitada';
      n.chave = aut ? chaveDe(deBR(n.data), n.numero) : '—';
      n.provedor = aut ? via : '—';
      n.porContingencia = porContingencia;
      return n;
    },

    /* RN08 — nota autorizada não pode ser excluída, apenas cancelada. */
    cancelarNota(numero){
      const n = notas.find(n => n.numero === Number(numero));
      if (!n || n.status !== 'Autorizada') return null;
      n.status = 'Cancelada';
      return n;
    },

    // agrega soma total por período (US11)
    somaPeriodo(){
      return this.notas
        .filter(n => n.status === 'Autorizada')
        .reduce((s,n) => s + n.valor, 0);
    },
  };
})();

const BRL = v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
