"""Exporta o texto de um .docx para Markdown (titulos, listas, tabelas e blocos de codigo)."""
import html
import re
import sys
import zipfile

origem, destino = sys.argv[1], sys.argv[2]
z = zipfile.ZipFile(origem)
x = z.read("word/document.xml").decode("utf8")
corpo = x[x.find("<w:body>") + len("<w:body>"):x.find("</w:body>")]
# styleId -> nome do estilo (o Word pode renomear os ids, ex.: "2" = "heading 1")
nomes = {m.group(1): m.group(2).lower() for m in re.finditer(
    r'<w:style [^>]*w:styleId="([^"]+)".*?<w:name w:val="([^"]+)"', z.read("word/styles.xml").decode("utf8"), re.S)}


def texto(p):
    return html.unescape("".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", p)))


def estilo(p):
    m = re.search(r'<w:pStyle w:val="([^"]+)"', p)
    return nomes.get(m.group(1), m.group(1)).lower() if m else ""


def eh_codigo(p):
    return 'w:fill="F2F2F2"' in p


saida, codigo = [], []


def fechar_codigo():
    if codigo:
        saida.append("```\n" + "\n".join(codigo) + "\n```\n")
        codigo.clear()


for m in re.finditer(r"<w:tbl>.*?</w:tbl>|<w:p[ >].*?</w:p>|<w:p/>", corpo, re.S):
    bloco = m.group(0)
    if bloco.startswith("<w:tbl>"):
        fechar_codigo()
        linhas = []
        for tr in re.findall(r"<w:tr[ >].*?</w:tr>", bloco, re.S):
            celulas = [" ".join(texto(p) for p in re.findall(r"<w:p[ >].*?</w:p>", tc, re.S)).replace("|", "\\|")
                       for tc in re.findall(r"<w:tc>.*?</w:tc>", tr, re.S)]
            linhas.append("| " + " | ".join(celulas) + " |")
        if linhas:
            linhas.insert(1, "|" + "---|" * (linhas[0].count("|") - 1))
            saida.append("\n".join(linhas) + "\n")
        continue
    t = texto(bloco)
    if eh_codigo(bloco):
        codigo.append(t)
        continue
    fechar_codigo()
    if not t.strip():
        continue
    s = estilo(bloco)
    if s.startswith("heading") and s[-1].isdigit():
        saida.append("#" * int(s[-1]) + " " + t + "\n")
    elif s in ("list paragraph", "listparagraph"):
        saida.append("- " + t)
    else:
        if saida and saida[-1].startswith("- "):
            saida.append("")
        saida.append(t + "\n")
fechar_codigo()

cabecalho = ("<!-- Cópia em Markdown gerada automaticamente a partir de Proposta_TCC_Revisada.docx, para leitura "
             "pelo agente PO. Não edite este arquivo: edite o .docx e gere a cópia de novo. -->\n\n")
open(destino, "w", encoding="utf8").write(cabecalho + "\n".join(saida).replace("\n\n\n", "\n\n"))
print("ok", destino)
