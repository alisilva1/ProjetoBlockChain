# Métricas de comparação entre Ethereum e Cartesi

Este documento descreve as métricas usadas para comparar as duas arquiteturas e explica como cada uma é medida. Ele acompanha a seção 8 da proposta revisada. Todas as métricas partem do mesmo princípio: uma operação só entra na conta depois de confirmada, conforme o critério definido ao final.

As duas versões rodam em máquinas virtuais com os mesmos recursos (4 vCPUs, 4 GB de RAM), em rede local, e recebem os mesmos lotes de notas (100, 500 e 1.000), na mesma ordem e a partir das mesmas carteiras.

## Visão geral

| Métrica | Unidade | O que representa |
|---|---|---|
| Gás por nota | gas (convertido em ETH) | Custo cobrado na rede para registrar uma nota |
| Gás do sorteio | gas (convertido em ETH) | Custo do commit da semente somado ao custo do sorteio |
| Latência por nota | milissegundos (ms) | Tempo entre o envio de uma nota e a sua confirmação |
| Vazão | notas por segundo | Quantidade de notas confirmadas por unidade de tempo |
| Escalabilidade | variação percentual | Como as métricas acima mudam entre os lotes de 100, 500 e 1.000 notas |
| Correção | contagem de notas | Rejeições esperadas comparadas com as rejeições obtidas |
| CPU e RAM | % de CPU e MB de RAM | Recursos consumidos pelo nó durante a execução |

## Como cada métrica é medida

### Gás por nota

- **Ethereum:** campo `gasUsed` do recibo da transação `registerPurchase`. Para obter o valor em ETH, multiplica-se esse número pelo `effectiveGasPrice`.
- **Cartesi:** campo `gasUsed` do recibo da transação `addInput` que envia o input `REGISTER_PURCHASE` ao `InputBox`. O processamento dentro da Cartesi Machine acontece fora da cadeia e não consome gás.

### Gás do sorteio

- **Ethereum:** soma do `gasUsed` das transações `commitSeed` e `runRaffle`.
- **Cartesi:** soma do `gasUsed` dos `addInput` de `COMMIT_SEED` e `RUN_RAFFLE`, mais o gás da execução do voucher de ancoragem, quando ele for usado.

### Latência por nota

- **Ethereum:** o cronômetro começa quando a transação é enviada e para quando o recibo é recebido pelo cliente.
- **Cartesi:** o cronômetro começa quando o input é enviado ao `InputBox` e para quando o notice correspondente aparece na API GraphQL do nó.

### Vazão

- **Ethereum:** envia-se um lote de notas e divide-se o número de recibos obtidos pelo tempo total do lote.
- **Cartesi:** envia-se um lote de notas e divide-se o número de notices disponíveis pelo tempo total do lote.

### Escalabilidade

Nas duas versões, comparam-se o gás médio por nota, a latência média e a vazão entre os lotes de 100, 500 e 1.000 notas, expressando a variação em relação ao lote de 100.

### Correção

O simulador sabe de antemão quais notas devem ser rejeitadas (loja não cadastrada ou removida, nota duplicada, fora do período, valor insuficiente) e com qual motivo. Nas duas versões, contam-se as notas aceitas e rejeitadas e confere-se cada motivo obtido com o esperado.

- **Ethereum:** motivo do `revert` da transação.
- **Cartesi:** motivo do report emitido pela Cartesi Machine.

### CPU e RAM

- **Ethereum:** acompanha-se o processo do nó Hardhat durante o teste, com `pidstat -u -r -p <pid> 1`.
- **Cartesi:** acompanham-se os contêineres do nó durante o teste, com `docker stats` amostrado a cada segundo.

## O que conta como “confirmado”

No Ethereum, uma operação está confirmada quando o recibo da transação fica disponível com status de sucesso, o que indica que ela foi incluída em um bloco. No Cartesi, uma operação está confirmada quando o notice gerado pela aplicação para aquele input pode ser consultado na API GraphQL do nó.
