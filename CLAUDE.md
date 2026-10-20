# ProjetoBlockChain — TCC "Loteria de Notas Fiscais: Ethereum × Cartesi Rollups"

Duas aplicações funcionalmente equivalentes (Ethereum on-chain e Cartesi Rollups), um DApp e um simulador de carga, para comparar custo, latência, vazão, escalabilidade, correção e uso de CPU/RAM.

- Congelamento de escopo: **06/11/2026** (depois disso o PO só aceita correções).
- Defesa: **20/11/2026**.

## 1. Ambiente: Windows é o cérebro, as VMs são operacionais

| Máquina | Papel | O que roda |
|---|---|---|
| Windows (este repositório) | **Cérebro** | Claude Code, todos os agentes, edição de código e documentos, commits |
| vm-ethereum (`ssh vm-ethereum`, 192.168.56.10) | Operacional | build, testes, cobertura, nó Hardhat, benchmark Ethereum |
| vm-cartesi (`ssh vm-cartesi`, 192.168.56.11) | Operacional | build, testes, `cartesi run`, benchmark Cartesi (desligada até o usuário liberar) |

- Código é editado **só no Windows**. Nunca edite arquivos dentro das VMs.
- Cada VM tem uma cópia do repositório em `~/projetos/ProjetoBlockChain` e é um remoto git do Windows (`vm-ethereum`, `vm-cartesi`), configurado com `receive.denyCurrentBranch updateInstead`.
- Para testar: commit no Windows → `git push vm-ethereum main` → comando via `ssh` (seção 6).
- O GitHub (`origin`, repositório **público**) só recebe push a partir da VM, que tem a chave: `ssh vm-ethereum "cd ~/projetos/ProjetoBlockChain && git push origin main"`.
- No Bash do Claude Code, `ssh`/`git push` para as VMs só funcionam fora do sandbox.

## 2. Fonte de verdade

| Ordem | Documento | Quem lê |
|---|---|---|
| 1 | `docs/specs/` — `Proposta_TCC_Revisada.md` (regras, nomes, textos de rejeição, fluxos) e `metricas.md` | PO, Benchmark |
| 2 | `docs/backlog/backlog.md` com `status: APROVADO` | DEV, QA, Auditor |
| 3 | Código e testes | — |

- Só o PO lê `docs/specs/`. Os demais agentes trabalham a partir do backlog aprovado.
- **`Proposta_TCC_Revisada.md` e o `.docx` ficam fora do git** (`.gitignore`): existem só no Windows. Não copie trechos longos da proposta para arquivos versionados.
- A cópia `.md` é gerada a partir do `.docx`; não edite à mão. Regerar (o Windows não tem Python):
  ```
  scp Proposta_TCC_Revisada.docx docs/exportar_proposta_md.py vm-ethereum:/tmp/
  ssh vm-ethereum "python3 /tmp/exportar_proposta_md.py /tmp/Proposta_TCC_Revisada.docx /tmp/Proposta_TCC_Revisada.md"
  scp vm-ethereum:/tmp/Proposta_TCC_Revisada.md docs/specs/
  ```
- Conflito entre documentos, ou regra que a proposta não define: **pergunte ao usuário**; não escolha sozinho.

## 3. Escopo

O projeto recomeçou do zero em 19/10/2026: nada do código anterior é reaproveitado.

### Fases
| Fase | Entrega | Onde | Prioridade |
|---|---|---|---|
| 1 | Setup do projeto Hardhat 3 + `LotteryContract` (Ethereum) | `ethereum/`, vm-ethereum | Must |
| 2 | Setup do template Cartesi + aplicação equivalente (inclui badge, `metaHash`, `winnersRoot`) | `cartesi/`, vm-cartesi | Must |
| 3 | Simulador de carga e benchmark | `bench/`, `docs/benchmark/` | Must |
| 4 | DApp (seção 3.1 da proposta) | `dapp/` | Must |
| — | PostgreSQL + indexador; `ServiceRegistry` + voucher de ancoragem | `cartesi/` | Could (só depois do benchmark) |
| — | Documentador (ADRs, rascunhos da monografia) | `docs/adr/`, `docs/tcc/` | Could |

A primeira história de cada fase é o setup do projeto daquela pasta.

### Fora de escopo / Futuro
Chainlink VRF (a proposta usa commit–reveal), login do operador por assinatura (SIWE), envio por relayer, implantação em testnet/mainnet.

### Regras de controle de escopo
1. **Só o PO cria ou altera histórias**, e só a partir de `docs/specs/`. Toda versão nova do backlog volta para `PENDENTE_APROVACAO`.
2. **Nada é implementado sem `AC-NNN.N` aprovado.** O DEV registra ideias em `docs/qa/notas-dev.md` e segue sem implementar; o QA reprova funcionalidade extra (tipo `escopo`).
3. Mudança de regra de negócio começa na proposta (`.docx` → regerar `docs/specs/`) e só depois chega ao backlog e ao código.
4. Depois do congelamento, o PO só registra correções ou move itens para "Fora de escopo / Futuro".
5. **Paridade por fase:** cada história tem `[Stack: eth | cartesi | dapp]`. A história Cartesi reimplementa os mesmos ACs da Ethereum (mesma regra, ordem e texto de rejeição) e cita a história de origem. Regra nova em um lado exige a história equivalente no outro.

## 4. Papéis dos agentes

| Agente | Lê | Escreve | Nunca | Sinal de saída |
|---|---|---|---|---|
| `po` | `docs/specs/`, este arquivo | `docs/backlog/` | lê ou escreve código; aprova o próprio backlog | `CHECKPOINT PO: ...` |
| *usuário* | backlog | — | — | digita **"Aprovado"** → `/aprovar` |
| `dev` | backlog aprovado, bugs, este arquivo | código e testes da fase | edita `docs/backlog/` ou `docs/specs/`; push para o GitHub | `ENTREGA DEV: ...` / `BLOQUEADO: ...` |
| `qa` | backlog, entrega do DEV | `docs/qa/` | edita código ou testes | `QA: ... APROVADA / REPROVADA / ESCALADA` |
| `auditor-web3` | história, relatório do QA, diff | `docs/seguranca/` (e bug em `docs/qa/bugs/` se Alto) | edita código | `AUDITORIA: ... LIBERADA / BLOQUEADA` |
| `benchmark` | `docs/specs/metricas.md`, código | `bench/`, `docs/benchmark/` | altera ou otimiza código de produção | `BENCHMARK: ...` |
| `documentador` | `docs/` e `git log` | `docs/adr/`, `docs/tcc/` | inventa números | lista de PENDENTES |
| sessão principal | tudo | status do backlog (`/aprovar`) | implementa histórias por conta própria | push para o GitHub no fim do `/ciclo` |

Fluxo: `/ciclo novo` → PO → **"Aprovado"** → DEV → QA (máx. 3 reprovações) → Auditor (contratos/backend) → push. Benchmark e Documentador são acionados manualmente nos marcos.

## 5. Mapa do repositório
| O quê | Caminho |
|---|---|
| Especificação (entrada do PO; proposta fora do git) | `docs/specs/` |
| Backlog | `docs/backlog/backlog.md` |
| Relatórios, bugs e notas do DEV | `docs/qa/relatorio-US-NNN.md`, `docs/qa/bugs/BUG-NNN.md`, `docs/qa/notas-dev.md` |
| Auditorias | `docs/seguranca/auditoria-US-NNN.md` |
| Benchmark | `bench/` (scripts e cenários), `docs/benchmark/` (dados e relatórios) |
| ADRs e texto do TCC | `docs/adr/`, `docs/tcc/` |
| Guia das VMs | `docs/setup-vms.md` |
| Ethereum (criado na Fase 1) | `ethereum/` — `contracts/`, `test/`, `ignition/` |
| Cartesi (criado na Fase 2) | `cartesi/` — `src/`, testes em `src/**/*.test.ts` |
| DApp (Fase 4) | `dapp/` (tecnologia a definir pelo PO com o usuário) |

## 6. Comandos por stack
Sempre depois de `git push vm-<stack> main`. Prefixo: `ssh vm-ethereum "cd ~/projetos/ProjetoBlockChain/ethereum && source ~/.nvm/nvm.sh && <comando>"` (na Cartesi, `vm-cartesi` e `cartesi/`).

| Ação | Ethereum (Hardhat 3, viem, `node:test`) | Cartesi (CLI 1.5, SDK 0.9, TypeScript, vitest) |
|---|---|---|
| Instalar | `npm ci` | `yarn install` |
| Testes | `npm test` | `npx vitest run` |
| Cobertura | `npx hardhat test --coverage` | `npx vitest run --coverage` (requer `@vitest/coverage-v8`) |
| Gás por função | `npx hardhat test --gas-stats` | — |
| Build | `npx hardhat compile` | `cartesi build` |
| Nó local | `npx hardhat node` | `cartesi run` |

Os comandos exatos são confirmados na história de setup de cada fase. `cartesi send` é interativo; não use em scripts.

## 7. Limites de qualidade
- Cobertura mínima: 90% de linhas e 85% de branches em `ethereum/contracts/` e na lógica de domínio do Cartesi.
- Achado de segurança Alto bloqueia a entrega.
- Mesma entrada com resultado diferente entre stacks = bug de paridade (Alta).
- Cartesi determinístico: sem `Date.now`, `new Date()`, `Math.random`, rede ou ordem não garantida; tempo e bloco só do `metadata` do input.

## 8. Convenções
- IDs: `RN-NN` (regra), `US-NNN` (história), `AC-NNN.N` (critério), `BUG-NNN`, `ADR-NNN`. IDs aprovados nunca são renumerados.
- Gherkin é especificação (fica no backlog); a rastreabilidade é pelo nome do teste: `it("AC-001.1 ...")` / `test("AC-001.1 ...")`.
- Dinheiro sempre em centavos inteiros; `tickets = min(floor(totalValue / valuePerTicket), 500)`.
- Nomes de funções, eventos e inputs em inglês; textos de rejeição em português, sem acento, iguais nos dois lados (seção 5.2 da proposta).
- Commits: Conventional Commits em português, escopo `eth|cartesi|dapp|shared|bench|docs` e ID no final: `feat(eth): registra nota fiscal [US-001]`.
- Nunca commitar chaves privadas, mnemonics, `.env`, URLs de RPC com token nem a proposta.
