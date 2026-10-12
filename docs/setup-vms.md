# Configuração de VMs Linux para Ethereum e Cartesi

Guia completo para configurar duas máquinas virtuais Ubuntu Server 22.04 no VirtualBox (Windows), destinadas ao desenvolvimento e benchmark dos projetos Ethereum e Cartesi.

---

## Ambiente

- **Host:** Windows 10/11
- **CPU:** AMD Ryzen 5600 (6c/12t)
- **RAM:** 16GB
- **Ferramenta:** VirtualBox 7.x
- **OS das VMs:** Ubuntu Server 22.04 LTS

### Arquitetura final

| VM | IP Fixo | Uso | CPUs | RAM |
|---|---|---|---|---|
| vm-ethereum | 192.168.56.10 | Projeto Ethereum / Hardhat | 4 | 4GB |
| vm-cartesi | 192.168.56.11 | Projeto Cartesi / Docker | 4 | 4GB |
| ubuntu-base | — | VM base com snapshot | 4 | 4GB |

---

## 1. Pré-requisitos

Baixe antes de começar:

- [VirtualBox 7.x](https://virtualbox.org/wiki/Downloads) — Windows hosts
- VirtualBox Extension Pack (mesma versão do VirtualBox)
- [Ubuntu Server 22.04 LTS ISO](https://ubuntu.com/download/server)

### Problema crítico — Hyper-V no Windows

O Hyper-V conflita com os drivers de rede Host-Only do VirtualBox e causa o erro `VERR_INTNET_FLT_IF_NOT_FOUND`. Desative antes de qualquer coisa:

```powershell
# PowerShell como Administrador
bcdedit /set hypervisorlaunchtype off
```

> ⚠️ Reinicie o Windows após executar. O WSL2 no Windows 11 não é afetado.

Para reativar no futuro:

```powershell
bcdedit /set hypervisorlaunchtype auto
```

---

## 2. Instalação do VirtualBox e Extension Pack

### VirtualBox

1. Execute o instalador como Administrador
2. Durante a instalação confirme o aviso de reset de rede clicando em **Yes** — esse passo instala o driver Host-Only

### Extension Pack

1. Dê duplo clique no arquivo `.vbox-extpack`
2. Clique em **Install** → role o contrato → **I Agree** → confirme com Sim

### Criar adaptador Host-Only

```powershell
# PowerShell como Administrador
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" hostonlyif create
```

Verifique:

```powershell
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" list hostonlyifs
```

Deve aparecer `VirtualBox Host-Only Ethernet Adapter` com `IPAddress: 192.168.56.1` e `Status: Up`.

---

## 3. Criação da VM Base

### Assistente de criação (Next, Next)

| Campo | Valor |
|---|---|
| Name | ubuntu-base |
| Type | Linux |
| Version | Ubuntu 22.04 LTS (Jammy Jellyfish) 64-bit |
| Skip Unattended Installation | ✅ Marcar obrigatoriamente |
| Base Memory | 4096 MB |
| Processors | 4 |
| Hard Disk | 40GB — Dynamically allocated |

### Settings após criar (VM desligada)

**System → Processor**
- Processors: 4
- Enable PAE/NX: ✅
- Enable Nested VT-x/AMD-V: ✅

Se a opção Nested VT-x/AMD-V estiver acinzentada, execute no PowerShell:

```powershell
& "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" modifyvm "ubuntu-base" --nested-hw-virt on
```

**System → Acceleration**
- Paravirtualization Interface: KVM

**Network → Adapter 1**
- Attached to: NAT (padrão, não alterar)

**Network → Adapter 2**
- Enable Network Adapter: ✅
- Attached to: Host-Only Adapter
- Name: VirtualBox Host-Only Ethernet Adapter

**Storage**
- Controller IDE: adicionar a ISO do Ubuntu Server 22.04

---

## 4. Instalação do Ubuntu Server 22.04

Ligue a VM e siga o instalador:

| Tela | Configuração |
|---|---|
| Idioma | English |
| Atualização do instalador | Continue without updating |
| Teclado | Portuguese (Brazil) |
| Tipo de instalação | Ubuntu Server (não usar minimized) |
| Rede | Confirmar padrão → Done |
| Proxy | Deixar vazio → Done |
| Mirror | Confirmar padrão → Done |
| Storage | Use entire disk + LVM group → Done → Continue |
| Profile | name: dev / server: vm-base / user: dev / senha: (anote) |
| Ubuntu Pro | Skip for now |
| SSH | **Install OpenSSH server: ✅ (obrigatório)** |
| Snaps | Não selecionar nada → Done |

Ao finalizar: **Reboot Now** → Enter para remover o disco → login com `dev`.

---

## 5. Configuração Pós-Instalação

### Conectar via SSH pelo Windows

A partir daqui todos os comandos são executados via SSH no PowerShell do Windows — suporte a Ctrl+V para colar.

```powershell
ssh dev@192.168.56.101
```

### Atualizar o sistema

```bash
sudo apt update && sudo apt upgrade -y
```

> Na tela "Daemons using outdated libraries" mantenha as seleções padrão e pressione OK.

### Instalar ferramentas essenciais

```bash
sudo apt install -y curl git build-essential htop unzip wget
```

### Fixar IP do adaptador Host-Only

Descubra o nome dos adaptadores:

```bash
ip addr show
# enp0s3 → NAT (internet)
# enp0s8 → Host-Only (SSH)
```

Descubra o nome do arquivo netplan:

```bash
ls /etc/netplan/
# geralmente: 50-cloud-init.yaml
```

Edite o arquivo:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
```

Conteúdo após edição:

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      addresses: [192.168.56.10/24]
```

Salve com `Ctrl+X → Y → Enter` e aplique:

```bash
sudo netplan apply
ip addr show enp0s8   # confirmar IP 192.168.56.10
```

### Instalar Node.js via nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
node --version   # v20.x.x
```

### Atualizar npm

```bash
npm install -g npm@latest
```

### Configurar Git

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
git config --global init.defaultBranch main
```

### Instalar Claude Code

```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

### Criar estrutura de pastas

```bash
mkdir -p ~/projetos
```

### Atualização final e desligar

```bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
sudo shutdown now
```

---

## 6. Snapshot da VM Base

Com a VM desligada no VirtualBox:

```
ubuntu-base → aba Snapshots → Take
Nome: base-limpa
Descrição: Ubuntu 22.04 + Node 20 + npm + Git + Claude Code
```

> ✅ Este snapshot é o ponto de retorno seguro. Qualquer problema nas VMs filhas pode ser resolvido clonando novamente a partir daqui.

---

## 7. Clonagem das VMs

Botão direito em `ubuntu-base` → Clone:

| Campo | VM Ethereum | VM Cartesi |
|---|---|---|
| Name | vm-ethereum | vm-cartesi |
| MAC Address Policy | Generate new MAC addresses | Generate new MAC addresses |
| Clone type | Full Clone | Full Clone |
| Snapshots | Current machine state | Current machine state |

### Ajustar hostname e IP da vm-cartesi

Ligue a vm-cartesi, conecte via SSH (ainda no IP .10) e execute:

```bash
sudo nano /etc/netplan/50-cloud-init.yaml
# altere o IP para 192.168.56.11
```

```yaml
    enp0s8:
      addresses: [192.168.56.11/24]
```

```bash
sudo netplan apply
sudo hostnamectl set-hostname vm-cartesi
sudo shutdown now
```

### Ajustar hostname da vm-ethereum

```bash
ssh dev@192.168.56.10
sudo hostnamectl set-hostname vm-ethereum
sudo shutdown now
```

---

## 8. Configurar SSH no Windows

Gere uma chave SSH no PowerShell do Windows:

```powershell
ssh-keygen -t ed25519 -C "dev-vms"
# aceite o caminho padrão, pode deixar sem senha
```

Copie para cada VM (o Windows não possui `ssh-copy-id`, use o equivalente abaixo — será pedida a senha do `dev`):

```powershell
# vm-ethereum
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh dev@192.168.56.10 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

# vm-cartesi
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh dev@192.168.56.11 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

> Se aparecer `REMOTE HOST IDENTIFICATION HAS CHANGED!` (comum após clonar VMs), limpe a entrada antiga com `ssh-keygen -R 192.168.56.10` (ou `.11`) e tente novamente.

Crie o arquivo `C:\Users\SeuUsuario\.ssh\config`:

```
Host vm-ethereum
    HostName 192.168.56.10
    User dev
    IdentityFile ~/.ssh/id_ed25519

Host vm-cartesi
    HostName 192.168.56.11
    User dev
    IdentityFile ~/.ssh/id_ed25519
```

Teste a conexão:

```powershell
ssh vm-ethereum
ssh vm-cartesi
```

---

## 9. Conectar VS Code nas VMs

1. Instale a extensão **Remote - SSH** (Microsoft) no VS Code
2. Clique no botão verde `><` no canto inferior esquerdo
3. Selecione **Connect to Host**
4. Escolha `vm-ethereum` ou `vm-cartesi`

Uma nova janela do VS Code abre dentro da VM — arquivos, terminal e Claude Code rodam 100% no Linux.

### Rodar as VMs em modo headless (sem janela)

```
VirtualBox → VM → Start → Headless Start
```

Economiza recursos — você acessa tudo pelo VS Code via SSH.

---

## 10. Próximos passos

| VM | O que instalar |
|---|---|
| vm-ethereum | Hardhat 3 (Node 22+): `npx hardhat --init` |
| vm-cartesi | Docker Engine + Cartesi CLI |

### vm-ethereum

> O Hardhat 3 exige Node.js 22 ou superior. Se a VM estiver com Node 20, atualize antes:
>
> ```bash
> nvm install 22
> nvm alias default 22
> node --version   # v22.x.x
> ```

```bash
mkdir -p ~/projetos/ethereum
cd ~/projetos/ethereum
npx hardhat --init
```

O `npx hardhat --init` (Hardhat 3) cria o `package.json` e instala as dependências do projeto sozinho — não é preciso `npm init` nem instalação global. Responda o assistente interativo (versão do Hardhat, pasta, tipo de projeto) e aceite instalar as dependências.

Teste:

```bash
npx hardhat --version
npx hardhat test
```

Snapshot após configurar:
```
Nome: ethereum-inicial
Descrição: VM Ethereum pronta com Hardhat
```

### vm-cartesi

```bash
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER
newgrp docker
ls /dev/kvm          # deve retornar /dev/kvm — essencial para Cartesi
npm install -g @cartesi/cli
mkdir -p ~/projetos/cartesi
```

Snapshot após configurar:
```
Nome: cartesi-inicial
Descrição: VM Cartesi pronta com Docker e Cartesi CLI
```

---

## Referência rápida

| Ação | Comando |
|---|---|
| Conectar vm-ethereum | `ssh vm-ethereum` |
| Conectar vm-cartesi | `ssh vm-cartesi` |
| Desligar VM | `sudo shutdown now` |
| Ver IP das interfaces | `ip addr show` |
| Verificar Node | `node --version` |
| Verificar Docker | `docker --version` |
| Verificar KVM | `ls /dev/kvm` |
