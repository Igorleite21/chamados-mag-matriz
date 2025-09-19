const tipoSelect = document.getElementById('tipo');
const categoriaSelect = document.getElementById('categoria');
const subcategoriaSelect = document.getElementById('subcategoria');

// Mock data for categories and subcategories
const categoriasDados = {
  'Incidente': {
    'Hardware': ['Monitor', 'Teclado', 'Mouse', 'CPU', 'Notebook'],
    'Software': ['Sistema Operacional', 'Aplicativo', 'Erro de Acesso'],
    'E-mail': ['Acesso', 'Spam', 'Configuração'],
    'Impressora': ['Tinta', 'Papel', 'Configuração', 'Erro de impressão'],
  },
  'Solicitação': {
    'Hardware': ['Novo Equipamento', 'Upgrade', 'Troca de Componente'],
    'Software': ['Instalação de Programa', 'Acesso a Sistema'],
    'Impressora': ['Configurar rede', 'Reabastecer toner/cartucho'],
    'Auditório': ['Reserva', 'Equipamento', 'Configuração'],
    'Sala de Reunião': ['Reserva', 'Equipamento', 'Configuração'],
  }
};

// Populate the "Tipo" select field from the mock data
Object.keys(categoriasDados).forEach(tipo => {
  tipoSelect.innerHTML += `<option value="${tipo}">${tipo}</option>`;
});

// Event listener for "Tipo" changes to populate "Categoria"
tipoSelect.addEventListener('change', () => {
  const tipoSelecionado = tipoSelect.value;
  categoriaSelect.innerHTML = '<option value="">Selecione...</option>';
  subcategoriaSelect.innerHTML = '<option value="">Selecione a Categoria...</option>';
  if (tipoSelecionado) {
    Object.keys(categoriasDados[tipoSelecionado]).forEach(categoria => {
      categoriaSelect.innerHTML += `<option value="${categoria}">${categoria}</option>`;
    });
  }
});

// Event listener for "Categoria" changes to populate "Subcategoria"
categoriaSelect.addEventListener('change', () => {
  const tipoSelecionado = tipoSelect.value;
  const categoriaSelecionada = categoriaSelect.value;
  subcategoriaSelect.innerHTML = '<option value="">Selecione...</option>';
  if (tipoSelecionado && categoriaSelecionada) {
    categoriasDados[tipoSelecionado][categoriaSelecionada].forEach(subcategoria => {
      subcategoriaSelect.innerHTML += `<option value="${subcategoria}">${subcategoria}</option>`;
    });
  }
});

// --- Local data storage ---
let chamados = JSON.parse(localStorage.getItem("chamados") || "[]");

function salvarChamados() {
  localStorage.setItem("chamados", JSON.stringify(chamados));
}

// --- Form logic ---
const formChamado = document.getElementById('form-chamado');
formChamado.addEventListener('submit', (e) => {
  e.preventDefault();

  const proximoTicket = chamados.length > 0 ? chamados[chamados.length - 1].ticket + 1 : 1;
  const agora = new Date();
  const dataFormatada = agora.toLocaleDateString("pt-BR");
  const horaFormatada = agora.toLocaleTimeString("pt-BR");

  const chamado = {
    ticket: proximoTicket,
    data: dataFormatada,
    hora: horaFormatada,
    solicitante: document.getElementById('solicitante').value,
    atendente: document.getElementById('atendente').value,
    departamento: document.getElementById('departamento').value,
    tipo: tipoSelect.value,
    categoria: categoriaSelect.value,
    subcategoria: subcategoriaSelect.value,
    descricao: document.getElementById('descricao').value,
  };

  chamados.push(chamado);
  salvarChamados();
  alert(`Chamado Nº ${proximoTicket} salvo com sucesso!`);
  formChamado.reset();
  carregarChamados();
});

// --- Reports ---
const corpoTabela = document.getElementById('corpo-tabela');
function carregarChamados() {
  const mes = parseInt(document.getElementById('mes').value);
  const ano = parseInt(document.getElementById('ano').value);

  corpoTabela.innerHTML = "";
  let filtrados;

  if (mes && ano) {
    filtrados = chamados.filter(c => {
      const [dia, mesChamado, anoChamado] = c.data.split('/').map(Number);
      return mesChamado === mes && anoChamado === ano;
    });
  } else {
    filtrados = chamados;
  }

  if (filtrados.length === 0) {
    corpoTabela.innerHTML = '<tr><td colspan="9">Nenhum chamado encontrado</td></tr>';
    return;
  }

  filtrados.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.ticket}</td>
      <td>${c.data} ${c.hora}</td>
      <td>${c.solicitante}</td>
      <td>${c.atendente}</td>
      <td>${c.departamento}</td>
      <td>${c.tipo}</td>
      <td>${c.categoria}</td>
      <td>${c.subcategoria}</td>
      <td>${c.descricao}</td>
    `;
    corpoTabela.appendChild(tr);
  });
}

document.getElementById("btn-buscar").addEventListener("click", carregarChamados);

// --- Export logic ---
function exportarParaCSV(data, filename) {
  const headers = ["Ticket", "Data", "Hora", "Solicitante", "Atendente", "Departamento", "Tipo", "Categoria", "Subcategoria", "Descrição"];
  let csv = headers.join(";") + "\n";
  data.forEach(c => {
    csv += [c.ticket, c.data, c.hora, c.solicitante, c.atendente, c.departamento, c.tipo, c.categoria, c.subcategoria, `"${c.descricao.replace(/"/g, '""')}"`].join(";") + "\n";
  });
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

document.getElementById("btn-export-csv-mensal").addEventListener("click", () => {
  const mes = parseInt(document.getElementById('mes').value);
  const ano = parseInt(document.getElementById('ano').value);

  if (!mes || !ano) {
    return alert("Por favor, selecione o mês e o ano para o relatório mensal.");
  }

  const filtrados = chamados.filter(c => {
    const [dia, mesChamado, anoChamado] = c.data.split('/').map(Number);
    return mesChamado === mes && anoChamado === ano;
  });

  if (filtrados.length === 0) {
    return alert("Nenhum chamado encontrado para o período selecionado.");
  }

  exportarParaCSV(filtrados, `relatorio_mensal_${mes}-${ano}.csv`);
});

document.getElementById("btn-export-csv-semanal").addEventListener("click", () => {
  const agora = new Date();
  const inicioSemana = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - agora.getDay());
  const fimSemana = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - agora.getDay() + 6);

  const filtrados = chamados.filter(c => {
    const [dia, mes, ano] = c.data.split('/').map(Number);
    const dataChamado = new Date(ano, mes - 1, dia);
    return dataChamado >= inicioSemana && dataChamado <= fimSemana;
  });

  if (filtrados.length === 0) {
    return alert("Nenhum chamado encontrado para a semana atual.");
  }

  exportarParaCSV(filtrados, `relatorio_semanal_${inicioSemana.toLocaleDateString('pt-BR')}.csv`);
});

// For PDF export (requires an external library like jsPDF)
function exportarParaPDF(data, filename, title) {
  // Check if jsPDF library is available
  if (typeof jsPDF === 'undefined') {
    alert("Biblioteca jsPDF não encontrada. Certifique-se de que está incluída no seu HTML.");
    return;
  }

  const doc = new jsPDF();
  const columns = ["Ticket", "Data", "Hora", "Solicitante", "Atendente", "Departamento", "Tipo", "Categoria", "Descrição"];
  const rows = data.map(c => [
    c.ticket,
    c.data,
    c.hora,
    c.solicitante,
    c.atendente,
    c.departamento,
    c.tipo,
    c.categoria,
    c.descricao
  ]);

  doc.text(title, 14, 20);
  doc.autoTable({
    startY: 30,
    head: [columns],
    body: rows,
    styles: {
      fontSize: 8
    },
    headStyles: {
      fillColor: [0, 123, 255]
    }
  });
  doc.save(filename);
}

document.getElementById("btn-export-pdf-mensal").addEventListener("click", () => {
  const mes = parseInt(document.getElementById('mes').value);
  const ano = parseInt(document.getElementById('ano').value);

  if (!mes || !ano) {
    return alert("Por favor, selecione o mês e o ano para o relatório mensal.");
  }

  const filtrados = chamados.filter(c => {
    const [dia, mesChamado, anoChamado] = c.data.split('/').map(Number);
    return mesChamado === mes && anoChamado === ano;
  });

  if (filtrados.length === 0) {
    return alert("Nenhum chamado encontrado para o período selecionado.");
  }

  exportarParaPDF(filtrados, `relatorio_mensal_${mes}-${ano}.pdf`, `Relatório Mensal de Chamados - ${mes}/${ano}`);
});

document.getElementById("btn-export-pdf-semanal").addEventListener("click", () => {
  const agora = new Date();
  const inicioSemana = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - agora.getDay());
  const fimSemana = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - agora.getDay() + 6);

  const filtrados = chamados.filter(c => {
    const [dia, mes, ano] = c.data.split('/').map(Number);
    const dataChamado = new Date(ano, mes - 1, dia);
    return dataChamado >= inicioSemana && dataChamado <= fimSemana;
  });

  if (filtrados.length === 0) {
    return alert("Nenhum chamado encontrado para a semana atual.");
  }

  exportarParaPDF(filtrados, `relatorio_semanal_${inicioSemana.toLocaleDateString('pt-BR')}.pdf`, `Relatório Semanal de Chamados`);
});

// Load current month on page load
window.onload = () => {
  const hoje = new Date();
  document.getElementById('mes').value = hoje.getMonth() + 1;
  document.getElementById('ano').value = hoje.getFullYear();
  carregarChamados();
};