# Métricas de comparação — Ethereum × Cartesi

| Métrica | Unidade | Como medir no Ethereum | Como medir no Cartesi |
|---|---|---|---|
| Latência | ms | Tempo entre o envio da transação (`sendTransaction`) e o recebimento do recibo (`waitForTransactionReceipt`) no cliente viem | Tempo entre o envio do input ao `InputBox` (`cartesi send`) e o momento em que o notice correspondente aparece na API GraphQL do nó |
| Throughput | tx/s (transações confirmadas por segundo) | Número de recibos obtidos dividido pelo tempo total de um lote de transações | Número de notices disponíveis dividido pelo tempo total de um lote de inputs |
| Custo em gas | gas (e ETH = gas × `effectiveGasPrice`) | Campo `gasUsed` do recibo de cada transação ao contrato | Campo `gasUsed` do recibo da transação `addInput` no `InputBox` (o processamento dentro da máquina Cartesi não consome gas); somar o gas de execução de vouchers, se houver |
| CPU/RAM | % de CPU e MB de RAM | Uso do processo do nó Hardhat durante o teste (`pidstat -u -r -p <pid> 1` ou `htop`) | Uso dos contêineres do nó Cartesi durante o teste (`docker stats --no-stream`, amostrado a cada 1 s) |

## Critério de “confirmado”

- **Ethereum:** uma operação é considerada confirmada quando o recibo da transação está disponível, com `status = success`, indicando que ela foi incluída em um bloco.
- **Cartesi:** uma operação é considerada confirmada quando o notice gerado pela aplicação para aquele input está disponível para consulta na API GraphQL do nó.
