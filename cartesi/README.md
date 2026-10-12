# Cartesi — Rollups (TypeScript)

Subprojeto Cartesi do ProjetoBlockChain, desenvolvido na **vm-cartesi** (192.168.56.11).

- Backend em TypeScript rodando dentro da Cartesi Machine (Linux RISC-V)
- Criado com `cartesi create cartesi --template typescript` (Cartesi CLI 1.5, SDK 0.9)
- Requer Docker com suporte a `linux/riscv64` e a Cartesi CLI (`npm install -g @cartesi/cli`)

## Comandos

Execute dentro da pasta `cartesi/`:

| Comando | O que faz |
|---|---|
| `cartesi doctor` | Verifica se o ambiente (Docker, buildx, riscv64) está pronto |
| `cartesi build` | Gera a imagem RISC-V e a Cartesi Machine (`.cartesi/`) |
| `cartesi run` | Sobe o nó local (Anvil + Rollups node) com a aplicação |
| `cartesi send generic` | Envia um input para a aplicação (advance) |
| `cartesi clean` | Remove os artefatos do build |

> O `cartesi build` leva alguns minutos e precisa ser refeito a cada mudança no código.

## Estrutura

```
cartesi/
├── src/index.ts     # Backend: handlers de advance (altera estado) e inspect (leitura)
├── schema.ts        # Gera os tipos da API do rollup (src/schema.d.ts)
├── Dockerfile       # Build em 2 estágios: compila em amd64, roda em riscv64
├── package.json     # Dependências do backend (yarn, dentro do Docker)
└── .cartesi/        # Saída do build (ignorada pelo git)
```

## Como funciona

O backend fica em loop chamando `POST /finish` no rollup HTTP server (`ROLLUP_HTTP_SERVER_URL`):

- **advance_state** → input enviado on-chain; o handler pode alterar estado e gerar notices, vouchers e reports. Retorna `accept` ou `reject`.
- **inspect_state** → consulta somente leitura, sem custo de gas.
