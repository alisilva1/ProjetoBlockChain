# Agentes do TCC — como usar

As regras de escopo, os papéis, o ambiente, os caminhos e os comandos ficam no `CLAUDE.md` da raiz. Este arquivo explica só a operação.

## Ambiente
O Claude Code roda no **Windows**, onde fica este repositório: é o cérebro. As VMs só executam (build, testes, nós locais, benchmark). O código chega a elas por `git push vm-ethereum main` / `git push vm-cartesi main`, e o GitHub recebe o push a partir da VM.

A proposta do TCC (`.docx` e `docs/specs/Proposta_TCC_Revisada.md`) fica só no Windows, fora do git, porque o repositório é público.

## Agentes
| Agente | Papel | Escreve em | Acionado por |
|---|---|---|---|
| `po` | Especificação → histórias + Gherkin; guardião do escopo | `docs/backlog/` | `/ciclo` |
| `dev` | Código + testes da stack da história | `ethereum/`, `cartesi/`, `dapp/` | `/ciclo` |
| `qa` | Testes, cobertura, rastreabilidade, paridade, escopo | `docs/qa/` | `/ciclo` |
| `auditor-web3` | Segurança e determinismo | `docs/seguranca/` | `/ciclo` |
| `benchmark` | Medição justa, CSV e estatística | `bench/`, `docs/benchmark/` | manual, nos marcos |
| `documentador` | ADRs e rascunhos da monografia (Could) | `docs/adr/`, `docs/tcc/` | manual |

## Fluxo
```
/ciclo novo
  └─ po → backlog PENDENTE_APROVACAO → PARA e espera você
você: "Aprovado"  (ou /aprovar)
  └─ APROVADO → dev → qa ─reprovou (máx. 3)→ dev
                         ├─ 3ª reprovação → para e escala para você
                         └─ aprovou → auditor-web3 ─Alto→ volta ao dev
                                                   └─ liberada → push (VM → GitHub) → próxima história
/ciclo US-007      → implementa só uma história já aprovada
"use o agente benchmark para rodar o lote de 500"   (nos marcos)
```

## Como o escopo é controlado
- **Uma fonte:** só o PO lê `docs/specs/`; DEV, QA e Auditor trabalham a partir do backlog aprovado.
- **Uma porta de entrada:** histórias só entram pelo PO e só valem depois do "Aprovado". Toda versão nova do backlog volta para `PENDENTE_APROVACAO` e registra o que mudou.
- **Duas barreiras:** o DEV não implementa nada sem AC (registra a sugestão em `docs/qa/notas-dev.md`); o QA reprova funcionalidade extra.
- **Congelamento:** depois de 06/11/2026, só correções.

## Onde as travas não são absolutas
- **Checkpoint do PO:** subagentes não esperam input. A trava fica no arquivo: o PO grava `PENDENTE_APROVACAO`, só a sessão principal muda para `APROVADO` depois do seu "Aprovado", e o DEV recusa trabalhar sem esse status.
- **Ferramentas:** o campo `tools:` limita cada agente (o PO não tem `Bash`, o QA não tem `Edit`). Os limites por pasta são instruções do prompt, não bloqueio técnico; confira os diffs.
- **Loop do QA:** o limite de 3 tentativas é contado pelo campo `Tentativa` dos bugs.

## Preparar uma VM nova como remoto (ex.: vm-cartesi na Fase 2)
```
ssh vm-cartesi "cd ~/projetos/ProjetoBlockChain && git pull && git config receive.denyCurrentBranch updateInstead"
git remote add vm-cartesi vm-cartesi:projetos/ProjetoBlockChain
```
