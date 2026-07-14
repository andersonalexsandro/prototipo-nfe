# NFCloud — Protótipo de Telas (Automação de Emissão de NF-e)

Protótipo navegável do sistema **NFCloud — Automação de Notas Fiscais**, projeto da
disciplina de **Modelagem de Dados** (UFPB – Campus IV). Reproduz o design do Figma em
**HTML, CSS e JavaScript puro**, sem framework nem etapa de build, para rodar como
**site estático** (GitHub Pages).

## Telas

| Tela | Descrição |
|------|-----------|
| **Login** | Acesso ao sistema (sem autenticação real — protótipo). |
| **Dashboard** | Resumo geral: cards de indicadores, notas recentes, status dos provedores (Sebrae/Sefaz) e alertas. |
| **Emitir Nota** | Emissão de NF-e: seleção de cliente, itens com auto-preenchimento fiscal (NCM/CFOP/ICMS/PIS/COFINS) e cálculo do total em tempo real. |
| **Consultar Notas** | Histórico com busca/filtro por status e exportação de XML (individual e em pacote). |
| **Clientes** | Cadastro (CRUD) e busca de clientes. |
| **Relatórios** | Faturamento consolidado por período. |
| **Configurações** | Perfil do emissor/certificado, provedor + contingência, e-mail e boleto. |

> Funcionalidades derivadas do **Backlog de Histórias de Usuário** do projeto (US01–US12).
> Todos os dados são **fictícios (mock)** e mantidos em memória durante a navegação.

## Rodar localmente

Não precisa instalar nada. Basta abrir `index.html` no navegador, ou servir a pasta:

```bash
python3 -m http.server 8000
# acesse http://localhost:8000
```

## Publicar no GitHub Pages

1. Suba o repositório para o GitHub.
2. **Settings → Pages → Build and deployment → Source: _Deploy from a branch_**, branch `main` / `/root`.
3. O site fica disponível em `https://<usuario>.github.io/<repositorio>/`.

A navegação usa *hash routing* (`#dashboard`, `#emitir`, …), então funciona sem problemas
quando o site é servido de um subdiretório.

## Estrutura

```
prototipo-nfe/
├── index.html
├── css/styles.css      # design system (cores/tipografia do Figma)
├── js/
│   ├── data.js         # store + dados mock
│   ├── ui.js           # ícones SVG, logo, ilustração, toast
│   └── app.js          # rotas + telas + interatividade
└── assets/favicon.svg
```
