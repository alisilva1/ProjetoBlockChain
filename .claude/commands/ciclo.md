---
description: Orquestra o ciclo PO → aprovação humana → DEV → QA (máx. 3 tentativas) → Auditor Web3 → push
argument-hint: "[novo | US-NNN]  (novo = refinar docs/specs/; US-NNN = implementar uma história aprovada)"
---

Você é o orquestrador do ciclo de desenvolvimento do TCC. Você coordena os subagentes; não escreve código nem backlog.
Argumento recebido: `$ARGUMENTS`

## Fase 1 — PO (argumento `novo` ou vazio)
1. Acione o subagente `po` para gerar ou atualizar `docs/backlog/backlog.md` a partir de `docs/specs/`.
2. Mostre ao usuário:
   - o resumo do PO;
   - as histórias (ID, título, prioridade, fase, stack, paridade);
   - o que mudou desde a versão anterior (Histórico de versões);
   - as perguntas em aberto.
3. **PARE AQUI.** Peça: `Revise docs/backlog/backlog.md. Digite "Aprovado" para liberar o DEV, ou descreva os ajustes.`
   Não acione o DEV nesta resposta, em nenhuma hipótese.

Na mensagem seguinte do usuário:
- Se for exatamente "Aprovado" (sem ressalvas), execute os passos do comando `/aprovar` e siga para a Fase 2.
- Se houver ajustes, acione o `po` com os ajustes e volte ao passo 2.

## Fase 2 — DEV (uma história por vez)
1. Confirme `status: APROVADO` em `docs/backlog/backlog.md`. Se não houver, pare e avise.
2. Escolha a história: a indicada no argumento ou, se não houver, a primeira `[Must]` não entregue da **fase atual** (`CLAUDE.md`, seção 2). Se a fase depender de uma VM desligada, pare e pergunte ao usuário.
3. Acione o `dev` com: "Implemente US-NNN conforme docs/backlog/backlog.md."
4. Se a resposta terminar com `BLOQUEADO`, pare e mostre o motivo.

## Fase 3 — QA (loop de correção)
1. Acione o `qa` com: "Valide US-NNN."
2. `APROVADA` → Fase 4.
3. `REPROVADA` → acione o `dev` com: "Corrija BUG-NNN[, BUG-NNN] da US-NNN conforme docs/qa/bugs/." e volte ao passo 1.
4. `ESCALADA PARA HUMANO` → **pare**, mostre o resumo dos bugs e peça uma decisão.
O limite é de 3 reprovações por história. Não o contorne.

## Fase 4 — Auditoria e push
1. Se a história alterou `ethereum/contracts/` ou o backend Cartesi, acione o `auditor-web3` com: "Audite US-NNN."
2. `BLOQUEADA` → volte à Fase 3, passo 3, com o bug do auditor (conta como tentativa).
3. `LIBERADA` (ou história sem contrato/backend) → publique no GitHub: `git push vm-<stack> main` e `ssh vm-<stack> "cd ~/projetos/ProjetoBlockChain && git push origin main"`. Confirme que `docs/specs/Proposta_TCC_Revisada.md` não está versionado. Siga para a próxima história `[Must]` da fase.

## Ao final
Mostre uma tabela: `História | Stack | Status | Tentativas de QA | Achados de auditoria | Relatórios`.
Lembre que `benchmark` e `documentador` são acionados manualmente nos marcos.
