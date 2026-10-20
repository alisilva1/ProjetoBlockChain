# ProjetoBlockChain

Trabalho de Conclusão de Curso: loteria digital baseada em notas fiscais, implementada em duas arquiteturas funcionalmente equivalentes — execução on-chain na **Ethereum** e processamento off-chain com **Cartesi Rollups** — para comparar custo, latência, vazão, escalabilidade, correção e uso de recursos.

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `ethereum/` | Contrato inteligente e testes (Hardhat 3) |
| `cartesi/` | Aplicação Cartesi Rollups e testes |
| `dapp/` | Interface do usuário |
| `bench/` | Simulador de carga e cenários do benchmark |
| `docs/` | Métricas, backlog, relatórios de QA, auditorias, resultados e guia das VMs |

## Ambiente
Duas VMs Ubuntu Server 22.04 com os mesmos recursos (4 vCPUs, 4 GB de RAM): ver [docs/setup-vms.md](docs/setup-vms.md).

## Processo
O desenvolvimento segue o fluxo PO → aprovação → DEV → QA → auditoria, com agentes do Claude Code: ver [docs/agentes/README.md](docs/agentes/README.md).
