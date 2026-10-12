# ProjetoBlockChain

Desenvolvimento e benchmark de aplicações em **Ethereum** e **Cartesi**.

## Estrutura

| Pasta | Conteúdo | Onde é desenvolvido |
|---|---|---|
| [ethereum/](ethereum/) | Projeto Hardhat 3 (TypeScript + Viem) | vm-ethereum (192.168.56.10) |
| [cartesi/](cartesi/) | Projeto Cartesi Rollups | vm-cartesi (192.168.56.11) |
| [docs/](docs/) | Documentação do ambiente | — |

## Ambiente

As duas VMs Ubuntu Server 22.04 rodam no VirtualBox. O passo a passo completo de criação e configuração está em [docs/setup-vms.md](docs/setup-vms.md).

## Fluxo de trabalho

Cada VM tem um clone completo deste repositório em `~/projetos/ProjetoBlockChain` e trabalha apenas na sua pasta:

```bash
git pull          # antes de começar
# ... trabalhar em ethereum/ ou cartesi/ ...
git add .
git commit -m "descrição"
git push          # ao terminar
```

## Ethereum

```bash
cd ethereum
npm install
npx hardhat test
```
