/* ==========================================================================
   NFCloud — gerador de arquivo .ZIP (método "stored", sem compressão).
   O fluxo "Processo de Consultas Gerenciais e Exportação de Histórico"
   (diagramas do projeto) exige "Compactar XMLs em um Único Pacote .ZIP".
   Antes o protótipo concatenava os XMLs num arquivo só — não era um pacote.
   Sem dependência externa: o protótipo continua sem build e sem CDN.
   ========================================================================== */
const Zip = (() => {
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++){
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c >>> 0;
    }
    return t;
  })();

  function crc32(bytes){
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  /* Data/hora no formato MS-DOS usado pelo cabeçalho do ZIP. */
  function dosTime(d){
    return ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xFFFF;
  }
  function dosDate(d){
    return (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xFFFF;
  }

  /* Escreve inteiros little-endian, como o formato exige. */
  function push16(arr, v){ arr.push(v & 0xFF, (v >>> 8) & 0xFF); }
  function push32(arr, v){ arr.push(v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF); }

  /**
   * Monta um Blob .zip a partir de [{ nome, conteudo }].
   * @param {{nome:string, conteudo:string}[]} arquivos
   * @returns {Blob}
   */
  function criar(arquivos){
    const enc = new TextEncoder();
    const agora = new Date();
    const hora = dosTime(agora), data = dosDate(agora);
    const partes = [];        // pedaços do arquivo final, na ordem
    const central = [];       // entradas do diretório central
    let offset = 0;

    arquivos.forEach(({ nome, conteudo }) => {
      const nomeBytes = enc.encode(nome);
      const dados = enc.encode(conteudo);
      const crc = crc32(dados);

      const local = [];
      push32(local, 0x04034b50);           // assinatura do cabeçalho local
      push16(local, 20);                   // versão mínima
      push16(local, 0);                    // flags
      push16(local, 0);                    // método 0 = stored
      push16(local, hora); push16(local, data);
      push32(local, crc);
      push32(local, dados.length);         // tamanho comprimido
      push32(local, dados.length);         // tamanho original
      push16(local, nomeBytes.length);
      push16(local, 0);                    // sem campo extra

      partes.push(new Uint8Array(local), nomeBytes, dados);

      const cd = [];
      push32(cd, 0x02014b50);              // assinatura do diretório central
      push16(cd, 20); push16(cd, 20);
      push16(cd, 0); push16(cd, 0);
      push16(cd, hora); push16(cd, data);
      push32(cd, crc);
      push32(cd, dados.length); push32(cd, dados.length);
      push16(cd, nomeBytes.length);
      push16(cd, 0); push16(cd, 0);        // extra, comentário
      push16(cd, 0); push16(cd, 0);        // disco, atributos internos
      push32(cd, 0);                       // atributos externos
      push32(cd, offset);                  // deslocamento do cabeçalho local
      central.push(new Uint8Array(cd), nomeBytes);

      offset += local.length + nomeBytes.length + dados.length;
    });

    const tamCentral = central.reduce((s, p) => s + p.length, 0);
    const fim = [];
    push32(fim, 0x06054b50);               // fim do diretório central
    push16(fim, 0); push16(fim, 0);
    push16(fim, arquivos.length); push16(fim, arquivos.length);
    push32(fim, tamCentral);
    push32(fim, offset);
    push16(fim, 0);                        // sem comentário

    return new Blob([...partes, ...central, new Uint8Array(fim)], { type: 'application/zip' });
  }

  return { criar };
})();
