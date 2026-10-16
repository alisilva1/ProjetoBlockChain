import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";
import { getAddress } from "viem";

// 11.222.333/0001-81 e 00.000.000/0001-91 sao CNPJs com digitos verificadores validos.
const CNPJ = 11222333000181n;
const CNPJ_ZEROS = 191n;
const PRECO = 1000n; // R$ 10,00

describe("Loteria", async function () {
  const { viem } = await network.create();
  const [owner, alice, bob] = await viem.getWalletClients();

  async function deployComLoja() {
    const loteria = await viem.deployContract("Loteria");
    await loteria.write.definirPreco([PRECO]);
    await loteria.write.cadastrarCnpj([CNPJ]);
    return loteria;
  }

  it("faz o deploy com o owner e sem bilhetes", async function () {
    const loteria = await viem.deployContract("Loteria");

    assert.equal(await loteria.read.owner(), getAddress(owner.account.address));
    assert.equal(await loteria.read.precoBilhete(), 0n);
    assert.equal(await loteria.read.totalBilhetes(), 0n);
    assert.equal(await loteria.read.sorteado(), false);
  });

  it("valida CNPJ pelos digitos verificadores", async function () {
    const loteria = await deployComLoja();

    assert.equal(await loteria.read.cnpjValido([CNPJ]), true);
    assert.equal(await loteria.read.cnpjValido([CNPJ_ZEROS]), true);
    assert.equal(await loteria.read.cnpjValido([11222333000182n]), false); // DV errado
    assert.equal(await loteria.read.cnpjValido([11111111111111n]), false); // digitos repetidos
    assert.equal(await loteria.read.cnpjValido([0n]), false);
    assert.equal(await loteria.read.cnpjValido([100000000000000n]), false); // 15 digitos

    await viem.assertions.revertWith(loteria.write.cadastrarCnpj([11222333000182n]), "CNPJ invalido");
    await viem.assertions.revertWith(
      loteria.write.registrarNota([11222333000182n, "chave", 2500n], { account: alice.account }),
      "CNPJ invalido",
    );
    await viem.assertions.revertWith(
      loteria.write.registrarNota([CNPJ_ZEROS, "chave", 2500n], { account: alice.account }),
      "loja nao participa",
    );
  });

  it("permite cadastro de CNPJ e preco somente pelo owner", async function () {
    const loteria = await viem.deployContract("Loteria");

    await viem.assertions.revertWith(
      loteria.write.cadastrarCnpj([CNPJ], { account: alice.account }),
      "somente owner",
    );
    await viem.assertions.revertWith(
      loteria.write.definirPreco([PRECO], { account: alice.account }),
      "somente owner",
    );

    await loteria.write.cadastrarCnpj([CNPJ]);
    await loteria.write.definirPreco([PRECO]);
    assert.equal(await loteria.read.cnpjParticipante([CNPJ]), true);
    assert.equal(await loteria.read.precoBilhete(), PRECO);
  });

  it("gera 2 bilhetes para uma nota de R$ 25 e bloqueia nota repetida", async function () {
    const loteria = await deployComLoja();

    await viem.assertions.emitWithArgs(
      loteria.write.registrarNota([CNPJ, "chave-1", 2500n], { account: alice.account }),
      loteria,
      "NotaRegistrada",
      [getAddress(alice.account.address), CNPJ, 2n],
    );
    assert.equal(await loteria.read.totalBilhetes(), 2n);
    assert.equal(await loteria.read.bilhetesDe([alice.account.address]), 2n);

    await viem.assertions.revertWith(
      loteria.write.registrarNota([CNPJ, "chave-1", 2500n], { account: bob.account }),
      "nota ja registrada",
    );
    await viem.assertions.revertWith(
      loteria.write.registrarNota([CNPJ, "chave-2", 999n], { account: alice.account }),
      "valor abaixo do preco",
    );
  });

  it("acumula as faixas de bilhetes entre usuarios", async function () {
    const loteria = await deployComLoja();

    await loteria.write.registrarNota([CNPJ, "chave-1", 2500n], { account: alice.account }); // 0-1
    await loteria.write.registrarNota([CNPJ, "chave-2", 3000n], { account: bob.account }); // 2-4
    await loteria.write.registrarNota([CNPJ, "chave-3", 1000n], { account: alice.account }); // 5

    assert.equal(await loteria.read.totalBilhetes(), 6n);
    assert.equal(await loteria.read.bilhetesDe([alice.account.address]), 3n);
    assert.equal(await loteria.read.bilhetesDe([bob.account.address]), 3n);

    const a = getAddress(alice.account.address);
    const b = getAddress(bob.account.address);
    const esperado = [a, a, b, b, b, a];
    for (let i = 0; i < esperado.length; i++) {
      assert.equal(await loteria.read.donoDoBilhete([BigInt(i)]), esperado[i]);
    }
    await viem.assertions.revertWith(loteria.read.donoDoBilhete([6n]), "bilhete inexistente");
  });

  it("sorteia uma unica vez e retorna um participante", async function () {
    const loteria = await deployComLoja();

    await viem.assertions.revertWith(loteria.write.sortear(), "sem bilhetes");

    await loteria.write.registrarNota([CNPJ, "chave-1", 2500n], { account: alice.account });
    await loteria.write.registrarNota([CNPJ, "chave-2", 3000n], { account: bob.account });

    await viem.assertions.revertWith(loteria.write.sortear({ account: alice.account }), "somente owner");

    await loteria.write.sortear();
    const vencedor = await loteria.read.vencedor();
    const bilhete = await loteria.read.bilheteSorteado();

    assert.equal(await loteria.read.sorteado(), true);
    assert.ok(bilhete < 5n);
    assert.equal(vencedor, await loteria.read.donoDoBilhete([bilhete]));
    assert.ok([getAddress(alice.account.address), getAddress(bob.account.address)].includes(vencedor));

    await viem.assertions.revertWith(loteria.write.sortear(), "sorteio ja realizado");
    await viem.assertions.revertWith(
      loteria.write.registrarNota([CNPJ, "chave-3", 1000n], { account: alice.account }),
      "sorteio encerrado",
    );
  });
});
