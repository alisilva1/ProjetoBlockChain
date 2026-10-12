# Ethereum — Hardhat 3

Subprojeto Ethereum do ProjetoBlockChain, desenvolvido na **vm-ethereum** (192.168.56.10).

- Hardhat 3 com TypeScript, Viem e Node Test Runner (`node:test`)
- Testes em Solidity (compatíveis com Foundry) e em TypeScript
- Deploy com Hardhat Ignition
- Requer **Node.js 22+**

## Instalação

Depois de clonar o repositório:

```bash
cd ethereum
npm ci
```

## Comandos

| Comando | O que faz |
|---|---|
| `npm run compile` | Compila os contratos |
| `npm test` | Roda todos os testes (Solidity + TypeScript) |
| `npm run test:solidity` | Só os testes Solidity (`contracts/*.t.sol`) |
| `npm run test:nodejs` | Só os testes TypeScript (`test/`) |
| `npm run node` | Sobe uma blockchain local em `127.0.0.1:8545` |
| `npm run deploy:local` | Faz deploy do `Counter` numa rede simulada |
| `npm run clean` | Apaga `artifacts/` e `cache/` |

## Estrutura

```
ethereum/
├── contracts/          # Contratos Solidity e testes .t.sol
├── test/               # Testes TypeScript (node:test + viem)
├── ignition/modules/   # Módulos de deploy (Hardhat Ignition)
├── scripts/            # Scripts avulsos
└── hardhat.config.ts   # Configuração (compilador, redes)
```

## Redes configuradas

| Rede | Tipo | Uso |
|---|---|---|
| `hardhatMainnet` | simulada (L1) | testes locais |
| `hardhatOp` | simulada (OP Stack) | testes locais de L2 |
| `sepolia` | HTTP | testnet pública |

### Deploy na Sepolia

As credenciais **não** ficam em arquivo nem no git — são guardadas no keystore criptografado do Hardhat:

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
npx hardhat ignition deploy --network sepolia ignition/modules/Counter.ts
```

> ⚠️ Use uma carteira exclusiva de testes. Nunca coloque chaves privadas em `.env` versionado ou no código.
