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
  const produtos = [
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

  // Notas emitidas (US09) — reproduz os exemplos das duas dashboards do Figma
  let notas = [
    { numero: 1526, cliente: 'Ana Oliveira',    valor: 300.00,    data: '25/02/2026', hora: '10:45', status: 'Autorizada', chave: '2602 2600 0000 0000 1526' },
    { numero: 1525, cliente: 'Empresa ABC',     valor: 25200.00,  data: '25/02/2026', hora: '10:25', status: 'Autorizada', chave: '2602 2600 0000 0000 1525' },
    { numero: 1524, cliente: 'Maria Sousa',     valor: 500.00,    data: '25/02/2026', hora: '10:20', status: 'Rejeitada',  chave: '—' },
    { numero: 1523, cliente: 'João da Silva',   valor: 300.00,    data: '25/02/2026', hora: '10:15', status: 'Autorizada', chave: '2602 2600 0000 0000 1523' },
    { numero: 1522, cliente: 'Maria da Silva',  valor: 300.00,    data: '24/02/2026', hora: '17:02', status: 'Autorizada', chave: '2402 2600 0000 0000 1522' },
    { numero: 1521, cliente: 'Pedro da Silva',  valor: 300.00,    data: '24/02/2026', hora: '15:40', status: 'Autorizada', chave: '2402 2600 0000 0000 1521' },
    { numero: 1520, cliente: 'Antonio da Silva',valor: 300.00,    data: '20/02/2026', hora: '09:11', status: 'Autorizada', chave: '2002 2600 0000 0000 1520' },
  ];

  // Métricas de topo (headline) exibidas no dashboard do Figma
  const headline = {
    emitidasMes: 3145,
    emitidasHoje: 145,
    autorizadas: 3145,
    canceladas: 12,
    rejeitadasHoje: 12,
    faturadoMes: 1500090.00,
  };

  const cfg = {
    emailNotificacao: 'hugo@nfcloud.com.br',
    boletoAtivo: true,
    provedorPadrao: 'Sebrae',
    provedorContingencia: 'Sefaz',
  };

  let seqNota = 1526;

  return {
    emissor, provedores, produtos, headline, cfg,
    get clientes(){ return clientes; },
    get notas(){ return notas; },

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

    emitirNota({ cliente, valor }){
      seqNota += 1;
      // ~85% autorizada, resto rejeitada — simula retorno da SEFAZ/Sebrae
      const aut = Math.random() > 0.15;
      const now = new Date();
      const dd = String(now.getDate()).padStart(2,'0');
      const mm = String(now.getMonth()+1).padStart(2,'0');
      const nota = {
        numero: seqNota,
        cliente,
        valor,
        data: `${dd}/${mm}/${now.getFullYear()}`,
        hora: `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`,
        status: aut ? 'Autorizada' : 'Rejeitada',
        chave: aut ? `${dd}${mm}${String(now.getFullYear()).slice(2)} 2600 0000 0000 ${seqNota}` : '—',
      };
      notas.unshift(nota);
      headline.emitidasHoje += 1;
      headline.emitidasMes += 1;
      if (aut){ headline.autorizadas += 1; headline.faturadoMes += valor; }
      else { headline.rejeitadasHoje += 1; }
      return nota;
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
