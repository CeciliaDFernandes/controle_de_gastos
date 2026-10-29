"use strict";

/* =========================================================
   Controle de Gastos — script.js
   Organização: constantes → estado → persistência → funções
   de tela → eventos. A tela é sempre desenhada a partir do
   array "gastos" (o array é o caderno; a tela é a fotocópia).
   ========================================================= */

/* ---------- Constantes ---------- */

const CHAVE_GASTOS = "controleGastos.gastos";
const CHAVE_ORCAMENTO = "controleGastos.orcamento";

const NOMES_CATEGORIAS = {
  alimentacao: "Alimentação",
  transporte: "Transporte",
  lazer: "Lazer",
  estudos: "Estudos",
  outros: "Outros",
};

const CATEGORIAS = Object.keys(NOMES_CATEGORIAS);

/* ---------- Elementos da página ---------- */

const formGasto = document.getElementById("formGasto");
const campoDescricao = document.getElementById("descricao");
const campoValor = document.getElementById("valor");
const campoCategoria = document.getElementById("categoria");
const paragrafoMensagem = document.getElementById("mensagem");
const listaGastos = document.getElementById("listaGastos");
const paragrafoVazio = document.getElementById("vazio");
const totalGeralEl = document.getElementById("totalGeral");

const campoOrcamento = document.getElementById("orcamento");
const avisoOrcamento = document.getElementById("avisoOrcamento");
const filtroCategoria = document.getElementById("filtroCategoria");

const elementosTotalCategoria = {};
for (const categoria of CATEGORIAS) {
  elementosTotalCategoria[categoria] = document.getElementById(
    `total-${categoria}`
  );
}

const blocoTotal =
  document.getElementById("blocoTotal") ||
  (totalGeralEl ? totalGeralEl.parentElement : null);

/* ---------- Estado ---------- */

let gastos = carregarGastos();
let orcamento = carregarOrcamento();

/* ---------- Utilidades ---------- */

function criarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatarDinheiro(valor) {
  const arredondado = Math.round(valor * 100) / 100;
  return arredondado.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/* ---------- Persistência ---------- */

function carregarGastos() {
  try {
    const texto = localStorage.getItem(CHAVE_GASTOS);
    if (!texto) return [];

    const dados = JSON.parse(texto);
    if (!Array.isArray(dados)) return [];

    return dados
      .filter((item) => item && typeof item.descricao === "string")
      .filter(
        (item) =>
          typeof item.valor === "number" &&
          Number.isFinite(item.valor) &&
          item.valor > 0
      )
      .filter((item) => Boolean(NOMES_CATEGORIAS[item.categoria]))
      .map((item) => ({
        id: item.id != null ? String(item.id) : criarId(),
        descricao: item.descricao,
        valor: item.valor,
        categoria: item.categoria,
      }));
  } catch (erro) {
    console.error("Não foi possível carregar os gastos:", erro);
    return [];
  }
}

function salvarGastos() {
  try {
    localStorage.setItem(CHAVE_GASTOS, JSON.stringify(gastos));
  } catch (erro) {
    console.error("Não foi possível salvar os gastos:", erro);
  }
}

function carregarOrcamento() {
  const texto = localStorage.getItem(CHAVE_ORCAMENTO);
  if (texto === null) return 0;
  const numero = Number(texto);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function salvarOrcamento() {
  localStorage.setItem(CHAVE_ORCAMENTO, String(orcamento));
}

/* ---------- Mensagens ---------- */

function mostrarMensagem(texto, tipo) {
  if (!paragrafoMensagem) return;
  paragrafoMensagem.textContent = texto;
  paragrafoMensagem.classList.remove("erro", "sucesso");
  paragrafoMensagem.classList.add(tipo);
}

/* ---------- Validação ---------- */

function validarGasto(descricao, valorTexto, categoria) {
  if (descricao.trim() === "") return "Informe uma descrição para o gasto.";
  if (valorTexto.trim() === "") return "Informe o valor do gasto.";

  const valor = Number(valorTexto);
  if (Number.isNaN(valor)) return "O valor precisa ser um número.";
  if (valor <= 0) return "O valor deve ser maior que zero.";
  if (!categoria) return "Selecione uma categoria.";
  if (!NOMES_CATEGORIAS[categoria]) return "Selecione uma categoria válida.";

  return null;
}

/* ---------- Cálculos ---------- */

function calcularTotais() {
  const porCategoria = {};
  for (const categoria of CATEGORIAS) porCategoria[categoria] = 0;

  let total = 0;
  for (const gasto of gastos) {
    total += gasto.valor;
    if (porCategoria[gasto.categoria] !== undefined) {
      porCategoria[gasto.categoria] += gasto.valor;
    }
  }

  return { total, porCategoria };
}

/* ---------- Desenho da tela ---------- */

function criarLinha(gasto) {
  const linha = document.createElement("tr");
  linha.dataset.id = gasto.id;

  const celulaDescricao = document.createElement("td");
  celulaDescricao.textContent = gasto.descricao;

  const celulaCategoria = document.createElement("td");
  const badge = document.createElement("span");
  badge.classList.add("badge", gasto.categoria);
  badge.textContent = NOMES_CATEGORIAS[gasto.categoria];
  celulaCategoria.appendChild(badge);

  const celulaValor = document.createElement("td");
  celulaValor.classList.add("valor");
  celulaValor.textContent = formatarDinheiro(gasto.valor);

  const celulaAcoes = document.createElement("td");
  const botaoRemover = document.createElement("button");
  botaoRemover.type = "button";
  botaoRemover.classList.add("remover");
  botaoRemover.textContent = "Remover";
  celulaAcoes.appendChild(botaoRemover);

  linha.append(celulaDescricao, celulaCategoria, celulaValor, celulaAcoes);
  return linha;
}

function renderizarLista() {
  listaGastos.textContent = "";

  const filtro = filtroCategoria ? filtroCategoria.value : "";
  const visiveis = NOMES_CATEGORIAS[filtro]
    ? gastos.filter((gasto) => gasto.categoria === filtro)
    : gastos;

  for (const gasto of visiveis) {
    listaGastos.appendChild(criarLinha(gasto));
  }

  return visiveis;
}

function atualizarTotais(total, porCategoria) {
  if (totalGeralEl) totalGeralEl.textContent = formatarDinheiro(total);

  for (const categoria of CATEGORIAS) {
    const elemento = elementosTotalCategoria[categoria];
    if (elemento) {
      elemento.textContent = formatarDinheiro(porCategoria[categoria] || 0);
    }
  }
}

function atualizarEstadoVazio(quantidadeVisivel) {
  if (!paragrafoVazio) return;

  const temGastos = gastos.length > 0;
  const filtro = filtroCategoria ? filtroCategoria.value : "";
  const filtroSemResultado =
    temGastos && filtro !== "" && quantidadeVisivel === 0;

  if (!temGastos) {
    paragrafoVazio.textContent = "Nenhum gasto cadastrado ainda.";
  } else if (filtroSemResultado) {
    paragrafoVazio.textContent = "Nenhum gasto nesta categoria.";
  }

  paragrafoVazio.classList.toggle("oculto", quantidadeVisivel > 0);
}

function atualizarOrcamento(total) {
  const temOrcamento = orcamento > 0;
  const estourou = temOrcamento && total > orcamento;

  if (blocoTotal) blocoTotal.classList.toggle("estourou", estourou);
  if (!avisoOrcamento) return;

  if (estourou) {
    const excedente = total - orcamento;
    avisoOrcamento.textContent =
      `Você ultrapassou o orçamento em ${formatarDinheiro(excedente)}.`;
  } else {
    avisoOrcamento.textContent = "";
  }
}

function renderizar() {
  const visiveis = renderizarLista();
  const { total, porCategoria } = calcularTotais();
  atualizarTotais(total, porCategoria);
  atualizarEstadoVazio(visiveis.length);
  atualizarOrcamento(total);
}

/* ---------- Ações ---------- */

function adicionarGasto(descricao, valor, categoria) {
  gastos.push({
    id: criarId(),
    descricao: descricao,
    valor: Math.round(valor * 100) / 100,
    categoria: categoria,
  });
  salvarGastos();
  renderizar();
}

function removerGasto(id) {
  gastos = gastos.filter((gasto) => gasto.id !== String(id));
  salvarGastos();
  renderizar();
}

/* ---------- Eventos ---------- */

formGasto.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const descricao = campoDescricao.value;
  const valorTexto = campoValor.value;
  const categoria = campoCategoria.value;

  const erro = validarGasto(descricao, valorTexto, categoria);
  if (erro) {
    mostrarMensagem(erro, "erro");
    return;
  }

  adicionarGasto(descricao.trim(), Number(valorTexto), categoria);
  formGasto.reset();
  campoDescricao.focus();
  mostrarMensagem("Gasto adicionado com sucesso!", "sucesso");
});

listaGastos.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".remover");
  if (!botao) return;
  const linha = botao.closest("tr");
  if (!linha) return;
  removerGasto(linha.dataset.id);
});

if (campoOrcamento) {
  campoOrcamento.value = orcamento > 0 ? String(orcamento) : "";
  campoOrcamento.addEventListener("input", () => {
    const numero = Number(campoOrcamento.value);
    orcamento =
      campoOrcamento.value.trim() !== "" &&
      Number.isFinite(numero) && numero > 0
        ? numero
        : 0;
    salvarOrcamento();
    atualizarOrcamento(calcularTotais().total);
  });
}

if (filtroCategoria) {
  filtroCategoria.addEventListener("change", renderizar);
}

/* ---------- Inicialização ---------- */

renderizar();
