# Métricas de comparação entre Ethereum e Cartesi

Este documento descreve as métricas usadas para comparar as duas arquiteturas e explica como cada uma é medida. Todas partem do mesmo princípio: uma operação só entra na conta depois de confirmada, conforme o critério definido ao final.

## Visão geral

| Métrica | Unidade | O que representa |
|---|---|---|
| Latência | milissegundos (ms) | Tempo entre o envio de uma operação e a sua confirmação |
| Throughput | transações por segundo (tx/s) | Quantidade de operações confirmadas por unidade de tempo |
| Custo em gas | gas (convertido em ETH) | Custo cobrado na rede para registrar a operação |
| CPU e RAM | % de CPU e MB de RAM | Recursos consumidos pelo nó durante a execução |

## Como cada métrica é medida

### Latência

- **Ethereum:** o cronômetro começa quando a transação é enviada ao contrato e para quando o recibo é recebido pelo cliente.
- **Cartesi:** o cronômetro começa quando o input é enviado ao contrato `InputBox` e para quando o notice correspondente aparece na API GraphQL do nó.

### Throughput

- **Ethereum:** envia-se um lote de transações e divide-se o número de recibos obtidos pelo tempo total do lote.
- **Cartesi:** envia-se um lote de inputs e divide-se o número de notices disponíveis pelo tempo total do lote.

### Custo em gas

- **Ethereum:** usa-se o campo `gasUsed` do recibo de cada transação. Para obter o valor em ETH, multiplica-se esse número pelo `effectiveGasPrice`.
- **Cartesi:** usa-se o `gasUsed` da transação que envia o input ao `InputBox`. O processamento dentro da máquina Cartesi acontece fora da cadeia e não consome gas. Se a aplicação gerar vouchers, o gas da execução deles também entra na soma.

### CPU e RAM

- **Ethereum:** acompanha-se o processo do nó Hardhat durante o teste, com `pidstat -u -r -p <pid> 1` ou `htop`.
- **Cartesi:** acompanham-se os contêineres do nó durante o teste, com `docker stats` amostrado a cada segundo.

## O que conta como “confirmado”

No Ethereum, uma operação está confirmada quando o recibo da transação fica disponível com status de sucesso, o que indica que ela foi incluída em um bloco. No Cartesi, uma operação está confirmada quando o notice gerado pela aplicação para aquele input pode ser consultado na API GraphQL do nó.
