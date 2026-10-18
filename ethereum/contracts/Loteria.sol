// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.34;

contract Loteria {
  struct Faixa {
    address dono;
    uint256 fim; // exclusivo: a faixa cobre os bilhetes [fim anterior, fim)
  }

  address public immutable owner;
  uint256 public precoBilhete; // em centavos
  uint256 public totalBilhetes;
  bool public sorteado;
  uint256 public bilheteSorteado;
  address public vencedor;

  mapping(uint64 => bool) public cnpjParticipante;
  mapping(bytes32 => bool) public notaRegistrada;
  mapping(address => uint256) public bilhetesDe;
  Faixa[] public faixas;

  event NotaRegistrada(address indexed participante, uint64 cnpj, uint256 bilhetes);
  event Sorteio(address indexed vencedor, uint256 bilhete);

  modifier somenteOwner() {
    require(msg.sender == owner, "somente owner");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function cadastrarCnpj(uint64 cnpj) external somenteOwner {
    require(cnpjValido(cnpj), "CNPJ invalido");
    cnpjParticipante[cnpj] = true;
  }

  // Bilhetes de notas ja registradas continuam valendo.
  function removerCnpj(uint64 cnpj) external somenteOwner {
    require(cnpjParticipante[cnpj], "loja nao participa");
    delete cnpjParticipante[cnpj];
  }

  function definirPreco(uint256 centavos) external somenteOwner {
    require(centavos > 0, "preco invalido");
    precoBilhete = centavos;
  }

  function registrarNota(uint64 cnpj, string calldata chaveAcesso, uint256 valorCentavos) external {
    require(!sorteado, "sorteio encerrado");
    require(precoBilhete > 0, "preco nao definido");
    require(cnpjValido(cnpj), "CNPJ invalido");
    require(cnpjParticipante[cnpj], "loja nao participa");

    bytes32 hashChave = keccak256(bytes(chaveAcesso));
    require(!notaRegistrada[hashChave], "nota ja registrada");

    uint256 bilhetes = valorCentavos / precoBilhete;
    require(bilhetes > 0, "valor abaixo do preco");

    notaRegistrada[hashChave] = true;
    totalBilhetes += bilhetes;
    bilhetesDe[msg.sender] += bilhetes;
    faixas.push(Faixa(msg.sender, totalBilhetes));

    emit NotaRegistrada(msg.sender, cnpj, bilhetes);
  }

  function sortear() external somenteOwner returns (address) {
    require(!sorteado, "sorteio ja realizado");
    require(totalBilhetes > 0, "sem bilhetes");

    sorteado = true;
    bilheteSorteado = block.prevrandao % totalBilhetes;
    vencedor = donoDoBilhete(bilheteSorteado);

    emit Sorteio(vencedor, bilheteSorteado);
    return vencedor;
  }

  // Busca binaria: primeira faixa cujo fim e maior que o bilhete.
  function donoDoBilhete(uint256 bilhete) public view returns (address) {
    require(bilhete < totalBilhetes, "bilhete inexistente");
    uint256 lo;
    uint256 hi = faixas.length - 1;
    while (lo < hi) {
      uint256 mid = (lo + hi) / 2;
      if (faixas[mid].fim > bilhete) hi = mid;
      else lo = mid + 1;
    }
    return faixas[lo].dono;
  }

  // CNPJ como numero de 14 digitos (zeros a esquerda sao implicitos).
  function cnpjValido(uint64 cnpj) public pure returns (bool) {
    if (cnpj > 99_999_999_999_999) return false;

    uint8[14] memory d;
    for (uint256 i = 14; i > 0; i--) {
      d[i - 1] = uint8(cnpj % 10);
      cnpj /= 10;
    }

    bool todosIguais = true;
    for (uint256 i = 1; i < 14; i++) {
      if (d[i] != d[0]) todosIguais = false;
    }
    if (todosIguais) return false;

    return d[12] == _digitoVerificador(d, 12) && d[13] == _digitoVerificador(d, 13);
  }

  // Pesos 2..9 da direita para a esquerda, reiniciando apos o 9.
  function _digitoVerificador(uint8[14] memory d, uint256 n) private pure returns (uint8) {
    uint256 soma;
    for (uint256 i; i < n; i++) {
      soma += uint256(d[i]) * (((n - 1 - i) % 8) + 2);
    }
    uint256 resto = soma % 11;
    return resto < 2 ? 0 : uint8(11 - resto);
  }
}
