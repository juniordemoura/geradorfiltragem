// ================================================
//   TRIAGEM COM IA — TECH-ZL · ADS 2026
//   empresa.js — Lógica completa da página Para Empresas
// ================================================

// ---- ESTADO ----
let vagas    = [];
let contVaga = 0;
let apiKey   = '';

// ---- BOOT ----
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  verificarApiKey();
  adicionarVaga(); // já inicia com 1 vaga em branco
});

// ================================================
//   NAVBAR HAMBURGER
// ================================================
function initNavbar() {
  const hb   = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (hb && menu) {
    hb.addEventListener('click', () => menu.classList.toggle('aberto'));
  }
}

function fecharMenu() {
  document.getElementById('mobile-menu')?.classList.remove('aberto');
}

// ================================================
//   MODAL API KEY
// ================================================
function abrirConfigApi() {
  const modal = document.getElementById('modal-api');
  if (modal) {
    modal.classList.add('aberto');
    const input = document.getElementById('api-key-input');
    if (input && apiKey) input.value = apiKey;
    setTimeout(() => input?.focus(), 100);
  }
}

function fecharConfigApi(evento) {
  if (evento && evento.target !== document.getElementById('modal-api')) return;
  document.getElementById('modal-api')?.classList.remove('aberto');
}

function salvarApiKey() {
  const input = document.getElementById('api-key-input');
  const valor = input ? input.value.trim() : '';

  if (!valor || !valor.startsWith('sk-ant-')) {
    mostrarToast('Insira uma chave válida (começa com sk-ant-...)', 'erro');
    return;
  }

  apiKey = valor;
  sessionStorage.setItem('techzl_api_key', valor);
  document.getElementById('modal-api')?.classList.remove('aberto');
  verificarApiKey();
  mostrarToast('Chave de API salva com sucesso!', 'ok');
}

function verificarApiKey() {
  // Tenta recuperar da sessão
  const salva = sessionStorage.getItem('techzl_api_key');
  if (salva) apiKey = salva;

  const aviso = document.getElementById('aviso-api');
  if (aviso) {
    aviso.classList.toggle('oculto', !!apiKey);
  }
}

// Fechar modal com ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('modal-api')?.classList.remove('aberto');
  }
});

// ================================================
//   VAGAS — CRUD
// ================================================
function adicionarVaga(titulo = '', area = '', requisitos = '', descricao = '', nivel = '') {
  contVaga++;
  vagas.push({
    id: 'vaga-' + contVaga,
    titulo,
    area,
    requisitos,
    descricao,
    nivel
  });
  renderizarVagas();
}

function removerVaga(id) {
  if (vagas.length <= 1) {
    mostrarToast('Mantenha pelo menos uma vaga cadastrada.', 'erro');
    return;
  }
  vagas = vagas.filter(v => v.id !== id);
  renderizarVagas();
}

function atualizarVaga(id, campo, valor) {
  const item = vagas.find(v => v.id === id);
  if (item) item[campo] = valor;
}

function renderizarVagas() {
  const container = document.getElementById('lista-vagas');
  if (!container) return;
  container.innerHTML = '';

  vagas.forEach((vaga, i) => {
    const card = document.createElement('div');
    card.className = 'vaga-card';
    card.innerHTML = `
      <div class="vaga-card__topo">
        <span class="vaga-card__num">Vaga ${i + 1}</span>
        <button class="vaga-card__rem" onclick="removerVaga('${vaga.id}')">Remover</button>
      </div>
      <div class="campo-linha">
        <div class="campo">
          <label>Título da vaga <span class="obrig">*</span></label>
          <input type="text" value="${esc(vaga.titulo)}"
            oninput="atualizarVaga('${vaga.id}', 'titulo', this.value)"
            placeholder="Ex: Desenvolvedor Front-End" />
        </div>
        <div class="campo">
          <label>Área / Departamento</label>
          <input type="text" value="${esc(vaga.area)}"
            oninput="atualizarVaga('${vaga.id}', 'area', this.value)"
            placeholder="Ex: Tecnologia, RH, Financeiro" />
        </div>
      </div>
      <div class="campo-linha">
        <div class="campo">
          <label>Nível de experiência</label>
          <select onchange="atualizarVaga('${vaga.id}', 'nivel', this.value)">
            <option value="" ${!vaga.nivel ? 'selected' : ''}>Selecione...</option>
            <option value="Estágio"       ${vaga.nivel === 'Estágio'       ? 'selected' : ''}>Estágio</option>
            <option value="Júnior"        ${vaga.nivel === 'Júnior'        ? 'selected' : ''}>Júnior</option>
            <option value="Pleno"         ${vaga.nivel === 'Pleno'         ? 'selected' : ''}>Pleno</option>
            <option value="Sênior"        ${vaga.nivel === 'Sênior'        ? 'selected' : ''}>Sênior</option>
            <option value="Especialista"  ${vaga.nivel === 'Especialista'  ? 'selected' : ''}>Especialista</option>
            <option value="Gerencial"     ${vaga.nivel === 'Gerencial'     ? 'selected' : ''}>Gerencial</option>
          </select>
        </div>
        <div class="campo">
          <label>Requisitos principais <small>(vírgula)</small></label>
          <input type="text" value="${esc(vaga.requisitos)}"
            oninput="atualizarVaga('${vaga.id}', 'requisitos', this.value)"
            placeholder="JavaScript, React, Git, inglês" />
        </div>
      </div>
      <div class="campo">
        <label>Descrição da vaga / Responsabilidades</label>
        <textarea rows="3"
          oninput="atualizarVaga('${vaga.id}', 'descricao', this.value)"
          placeholder="Descreva as principais atividades, responsabilidades e benefícios da vaga...">${esc(vaga.descricao)}</textarea>
      </div>
    `;
    container.appendChild(card);
  });
}

// ================================================
//   PASSO 1 → 2: GERAR PROMPTS
// ================================================
function gerarPrompts() {
  const nomeEmpresa  = document.getElementById('nome-empresa')?.value.trim() || 'a empresa';
  const setorEmpresa = document.getElementById('setor-empresa')?.value.trim() || '';

  const vagasValidas = vagas.filter(v => v.titulo.trim());
  if (vagasValidas.length === 0) {
    mostrarToast('Preencha o título de pelo menos uma vaga antes de continuar.', 'erro');
    return;
  }

  const container = document.getElementById('lista-prompts');
  if (!container) return;
  container.innerHTML = '';

  vagasValidas.forEach((vaga, i) => {
    const prompt = gerarTextoPrompt(vaga, nomeEmpresa, setorEmpresa);

    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.innerHTML = `
      <div class="prompt-card__topo">
        <span class="prompt-card__titulo">📋 Vaga ${i + 1}: ${esc(vaga.titulo)}${vaga.nivel ? ' — ' + esc(vaga.nivel) : ''}</span>
        <div class="prompt-card__acoes">
          <button class="btn-copiar" onclick="copiarPrompt(this, 'prompt-txt-${vaga.id}')">📋 Copiar</button>
        </div>
      </div>
      <textarea
        id="prompt-txt-${vaga.id}"
        class="prompt-card__textarea"
        rows="8"
        spellcheck="false"
        readonly
      >${esc(prompt)}</textarea>
    `;
    container.appendChild(card);
  });

  // Popular select da triagem
  const select = document.getElementById('select-vaga-analise');
  if (select) {
    select.innerHTML = '<option value="">Selecione uma vaga...</option>';
    vagasValidas.forEach((vaga, i) => {
      const opt = document.createElement('option');
      opt.value = vaga.id;
      opt.textContent = `Vaga ${i + 1}: ${vaga.titulo}${vaga.nivel ? ' — ' + vaga.nivel : ''}`;
      select.appendChild(opt);
    });
  }

  // Mostrar passo 2
  document.getElementById('passo-1').style.display = 'none';
  const p2 = document.getElementById('passo-2');
  p2.style.display = 'block';
  setTimeout(() => p2.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function gerarTextoPrompt(vaga, empresa, setor) {
  const requisitos = vaga.requisitos
    ? `\nRequisitos principais: ${vaga.requisitos}`
    : '';
  const descricao = vaga.descricao
    ? `\nDescrição / responsabilidades: ${vaga.descricao}`
    : '';
  const nivel = vaga.nivel ? `\nNível de experiência: ${vaga.nivel}` : '';
  const area  = vaga.area  ? `\nÁrea / departamento: ${vaga.area}` : '';
  const setorTexto = setor ? ` (setor: ${setor})` : '';

  return `Você é um especialista em recrutamento e seleção de talentos para a empresa ${empresa}${setorTexto}.

Analise o(s) currículo(s) abaixo para a vaga de ${vaga.titulo}.

DADOS DA VAGA:
- Cargo: ${vaga.titulo}${nivel}${area}${requisitos}${descricao}

INSTRUÇÕES DE ANÁLISE:
Para cada candidato, forneça:
1. Nome do candidato
2. Pontuação geral de 0 a 10 (compatibilidade com a vaga)
3. Status: APROVADO (≥ 7) | EM ANÁLISE (4–6) | NÃO RECOMENDADO (≤ 3)
4. Pontos fortes em relação à vaga
5. Pontos de atenção ou lacunas
6. Recomendação final resumida

Seja objetivo, imparcial e baseie-se exclusivamente nas informações fornecidas nos currículos.

CURRÍCULOS DOS CANDIDATOS:
[Cole aqui os currículos dos candidatos]`;
}

function atualizarPrompts() {
  // Apenas reagir se o passo 2 estiver visível
  if (document.getElementById('passo-2')?.style.display !== 'none') {
    gerarPrompts();
  }
}

// ================================================
//   NAVEGAÇÃO ENTRE PASSOS
// ================================================
function voltarPasso1() {
  document.getElementById('passo-2').style.display = 'none';
  const p1 = document.getElementById('passo-1');
  p1.style.display = 'block';
  setTimeout(() => p1.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function irParaPasso3() {
  document.getElementById('passo-2').style.display = 'none';
  const p3 = document.getElementById('passo-3');
  p3.style.display = 'block';
  verificarApiKey();
  setTimeout(() => p3.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function voltarPasso2() {
  document.getElementById('passo-3').style.display = 'none';
  const p2 = document.getElementById('passo-2');
  p2.style.display = 'block';
  setTimeout(() => p2.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

// ================================================
//   TRIAGEM COM IA (Claude API)
// ================================================
async function analisarCandidatos() {
  if (!apiKey) {
    abrirConfigApi();
    return;
  }

  const vagaId = document.getElementById('select-vaga-analise')?.value;
  const textoCVs = document.getElementById('texto-cvs')?.value.trim();

  if (!vagaId) {
    mostrarToast('Selecione uma vaga para análise.', 'erro');
    return;
  }
  if (!textoCVs || textoCVs.length < 30) {
    mostrarToast('Cole o(s) currículo(s) dos candidatos antes de analisar.', 'erro');
    return;
  }

  const vaga = vagas.find(v => v.id === vagaId);
  if (!vaga) {
    mostrarToast('Vaga não encontrada. Volte ao passo 1.', 'erro');
    return;
  }

  const nomeEmpresa  = document.getElementById('nome-empresa')?.value.trim() || 'a empresa';
  const setorEmpresa = document.getElementById('setor-empresa')?.value.trim() || '';

  // UI: loading
  const btnAnalisar = document.getElementById('btn-analisar');
  const resultadoDiv = document.getElementById('resultado-analise');

  if (btnAnalisar) {
    btnAnalisar.disabled = true;
    btnAnalisar.textContent = '⏳ Analisando...';
  }

  resultadoDiv.innerHTML = `
    <div class="loading-ia">
      <div class="spinner"></div>
      <span>A IA está analisando os currículos. Aguarde...</span>
    </div>
  `;

  // Prompt para a API
  const promptSistema = `Você é um especialista em recrutamento e seleção de talentos. Analise currículos de forma objetiva, profissional e imparcial. Sempre responda em português do Brasil.`;

  const promptUsuario = `Analise os currículos abaixo para a vaga na empresa ${nomeEmpresa}${setorEmpresa ? ' (' + setorEmpresa + ')' : ''}.

DADOS DA VAGA:
- Cargo: ${vaga.titulo}
${vaga.nivel      ? '- Nível: ' + vaga.nivel + '\n'      : ''}${vaga.area       ? '- Área: ' + vaga.area + '\n'       : ''}${vaga.requisitos  ? '- Requisitos: ' + vaga.requisitos + '\n'  : ''}${vaga.descricao   ? '- Descrição: ' + vaga.descricao + '\n'   : ''}
CURRÍCULOS:
${textoCVs}

---

Para cada candidato encontrado nos currículos, forneça uma análise estruturada com:

**Nome do Candidato:** [nome ou "Candidato X" se não identificado]
**Pontuação:** [número de 0 a 10]
**Status:** [APROVADO / EM ANÁLISE / NÃO RECOMENDADO]
**Pontos fortes:** [lista dos principais pontos positivos em relação à vaga]
**Pontos de atenção:** [lacunas ou pontos negativos]
**Recomendação:** [texto curto com recomendação final]

Separe cada candidato com "---".
Seja objetivo, justo e baseie-se apenas nos dados fornecidos.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: promptSistema,
        messages: [{ role: 'user', content: promptUsuario }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    const textoResposta = data.content?.map(b => b.text || '').join('\n') || '';

    renderizarResultados(textoResposta, vaga);

  } catch (err) {
    console.error('Erro na análise:', err);
    resultadoDiv.innerHTML = `
      <div class="erro-ia">
        <span>❌</span>
        <div>
          <strong>Erro ao chamar a IA:</strong> ${esc(err.message)}<br>
          <small>Verifique se sua chave de API está correta e se tem créditos disponíveis.</small>
        </div>
      </div>
    `;
  } finally {
    if (btnAnalisar) {
      btnAnalisar.disabled = false;
      btnAnalisar.textContent = '🤖 Analisar com IA';
    }
  }
}

// ================================================
//   RENDERIZAR RESULTADOS DA IA
// ================================================
function renderizarResultados(texto, vaga) {
  const resultadoDiv = document.getElementById('resultado-analise');
  if (!resultadoDiv) return;

  // Tentar separar por candidatos (por "---")
  const blocos = texto.split(/\n---+\n?/).map(b => b.trim()).filter(Boolean);

  let html = `
    <div class="resultado-header">
      <h3>Resultado da Triagem: ${esc(vaga.titulo)}</h3>
      <span class="badge-ia">✨ IA</span>
    </div>
  `;

  if (blocos.length === 0) {
    html += `<p style="color:var(--cinza);font-size:14px;">${texto.replace(/\n/g, '<br>')}</p>`;
  } else {
    blocos.forEach(bloco => {
      html += parsearBlocoCandidato(bloco);
    });
  }

  resultadoDiv.innerHTML = html;
  setTimeout(() => resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function parsearBlocoCandidato(bloco) {
  // Extrair campos do bloco de texto
  const nome     = extrairCampo(bloco, ['Nome do Candidato', 'Nome']) || 'Candidato';
  const pontuacao = extrairCampo(bloco, ['Pontuação', 'Nota', 'Score']) || '—';
  const status    = extrairCampo(bloco, ['Status']) || '';
  const pontos    = extrairCampo(bloco, ['Pontos fortes', 'Pontos Fortes']) || '';
  const atencao   = extrairCampo(bloco, ['Pontos de atenção', 'Pontos de Atenção', 'Atenção']) || '';
  const recom     = extrairCampo(bloco, ['Recomendação', 'Recomendacao']) || '';

  const statusNorm = normalizarStatus(status);
  const classeCard = {
    'aprovado': 'candidato-card--aprovado',
    'em-analise': 'candidato-card--em-analise',
    'reprovado': 'candidato-card--reprovado'
  }[statusNorm] || '';

  const classeBadge = {
    'aprovado': 'status-badge--aprovado',
    'em-analise': 'status-badge--em-analise',
    'reprovado': 'status-badge--reprovado'
  }[statusNorm] || '';

  const labelStatus = {
    'aprovado': '✅ Aprovado',
    'em-analise': '⚠️ Em Análise',
    'reprovado': '❌ Não Recomendado'
  }[statusNorm] || status;

  // Montar HTML
  let analiseHTML = '';
  if (pontos)   analiseHTML += `<p><strong>✅ Pontos fortes:</strong> ${esc(pontos)}</p>`;
  if (atencao)  analiseHTML += `<p style="margin-top:6px"><strong>⚠️ Atenção:</strong> ${esc(atencao)}</p>`;
  if (recom)    analiseHTML += `<p style="margin-top:6px"><strong>💬 Recomendação:</strong> ${esc(recom)}</p>`;

  // Se não conseguiu parsear, mostrar o bloco bruto
  if (!analiseHTML) {
    analiseHTML = `<p>${bloco.replace(/\*\*/g, '').replace(/\n/g, '<br>')}</p>`;
  }

  return `
    <div class="candidato-card ${classeCard}">
      <div class="candidato-card__topo">
        <span class="candidato-card__nome">${esc(nome)}</span>
        <div class="candidato-card__nota">
          ${pontuacao !== '—' ? `<span class="nota-badge">${esc(pontuacao)}/10</span>` : ''}
          ${statusNorm ? `<span class="status-badge ${classeBadge}">${labelStatus}</span>` : ''}
        </div>
      </div>
      <div class="candidato-card__analise">${analiseHTML}</div>
    </div>
  `;
}

function extrairCampo(texto, chaves) {
  for (const chave of chaves) {
    // Tenta match com ** (negrito markdown) ou sem
    const regex = new RegExp(`(?:\\*{1,2})?${chave}(?:\\*{1,2})?\\s*[:\\-]\\s*(.+?)(?=\\n(?:\\*{1,2})?(?:Nome|Pontuação|Nota|Status|Pontos|Atenção|Recomendação|Score|Candidato)|$)`, 'is');
    const match = texto.match(regex);
    if (match) return match[1].replace(/\*\*/g, '').trim();
  }
  return '';
}

function normalizarStatus(status) {
  const s = (status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('aprovado') || s.includes('approved')) return 'aprovado';
  if (s.includes('analise') || s.includes('analysis') || s.includes('review')) return 'em-analise';
  if (s.includes('nao') || s.includes('reprovado') || s.includes('rejected')) return 'reprovado';
  return '';
}

// ================================================
//   COPIAR PROMPT
// ================================================
function copiarPrompt(btn, textareaId) {
  const ta = document.getElementById(textareaId);
  if (!ta) return;

  navigator.clipboard.writeText(ta.value).then(() => {
    btn.textContent = '✅ Copiado!';
    btn.classList.add('copiado');
    setTimeout(() => {
      btn.textContent = '📋 Copiar';
      btn.classList.remove('copiado');
    }, 2000);
  }).catch(() => {
    // Fallback para browsers antigos
    ta.select();
    document.execCommand('copy');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => { btn.textContent = '📋 Copiar'; }, 2000);
  });
}

// ================================================
//   LIMPAR TUDO
// ================================================
function limparTudo() {
  if (!confirm('Tem certeza que deseja limpar todos os dados?')) return;

  vagas = [];
  contVaga = 0;

  const nomeEmp  = document.getElementById('nome-empresa');
  const setorEmp = document.getElementById('setor-empresa');
  if (nomeEmp)  nomeEmp.value  = '';
  if (setorEmp) setorEmp.value = '';

  const textaCVs = document.getElementById('texto-cvs');
  if (textaCVs) textaCVs.value = '';

  const resultadoDiv = document.getElementById('resultado-analise');
  if (resultadoDiv) resultadoDiv.innerHTML = '';

  // Voltar ao passo 1
  document.getElementById('passo-2').style.display = 'none';
  document.getElementById('passo-3').style.display = 'none';
  document.getElementById('passo-1').style.display = 'block';

  adicionarVaga();
  mostrarToast('Dados limpos com sucesso.', 'ok');
}

// ================================================
//   TOAST NOTIFICATIONS
// ================================================
function mostrarToast(msg, tipo = 'ok') {
  // Remove toast existente
  document.querySelector('.toast-notif')?.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notif';
  toast.textContent = msg;

  Object.assign(toast.style, {
    position:     'fixed',
    bottom:       '28px',
    right:        '24px',
    zIndex:       '9999',
    background:   tipo === 'ok' ? '#1B3A6B' : '#DC2626',
    color:        '#fff',
    padding:      '12px 20px',
    borderRadius: '8px',
    fontSize:     '13.5px',
    fontWeight:   '600',
    boxShadow:    '0 4px 20px rgba(0,0,0,.2)',
    animation:    'nenhum',
    transition:   'opacity .3s',
    fontFamily:   "'Inter', sans-serif",
    maxWidth:     '320px'
  });

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, 3000);
}

// ================================================
//   UTILITÁRIOS
// ================================================
function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
