---
description: Registra a aprovação humana do backlog (muda status para APROVADO). Só execute quando o usuário tiver digitado "Aprovado".
---

1. Leia `docs/backlog/backlog.md`.
2. Se o status atual não for `PENDENTE_APROVACAO`, avise o usuário e pare.
3. No frontmatter, troque `status: PENDENTE_APROVACAO` por `status: APROVADO` e adicione `aprovado_em: <data de hoje AAAA-MM-DD>`. Não altere mais nada no arquivo.
4. Faça commit apenas desse arquivo: `docs(backlog): aprova backlog versão N`.
5. Confirme ao usuário: "Backlog versão N aprovado. O DEV está liberado."
