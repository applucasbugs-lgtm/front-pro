// ============================================================
// APP LUCAS BUGS | HAIR STYLIST — API Client
// Coloque este arquivo na mesma pasta dos HTMLs
// ============================================================

// Endereço do backend. Vem do tenant.js (uma linha só para editar quando o
// backend mudar de URL); o valor abaixo é só o padrão de fábrica.
const API_URL = (window.TENANT && window.TENANT.api) || 'https://api.lucasbugshair.com.br'

// ---- Token ----
function getToken() {
  return localStorage.getItem('appsuabarbearia_token')
}

function setToken(token) {
  localStorage.setItem('appsuabarbearia_token', token)
}

function getUsuario() {
  const u = localStorage.getItem('appsuabarbearia_usuario')
  return u ? JSON.parse(u) : null
}

function setUsuario(usuario) {
  localStorage.setItem('appsuabarbearia_usuario', JSON.stringify(usuario))
}

function logout() {
  localStorage.removeItem('appsuabarbearia_token')
  localStorage.removeItem('appsuabarbearia_usuario')
  // Se já estamos na tela de acesso, redirecionar recarregaria a mesma página.
  // Era o que fazia o login piscar sem parar: uma chamada dava 401, o logout
  // recarregava, a chamada acontecia de novo, e assim por diante.
  var aqui = (location.pathname.split('/').pop() || 'index.html').toLowerCase()
  if (aqui === '' || aqui === 'index.html' || aqui === 'appsuabarbearia-login.html') return
  window.location.href = 'index.html'
}

// ---- Requisição base ----
async function req(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = 'Bearer ' + token

  const opts = { method, headers }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(API_URL + path, opts)

  if (res.status === 401) {
    logout()
    return
  }

  // Resposta sem corpo JSON (502, 504, HTML de erro do gateway) quebrava aqui
  // com "Unexpected token", escondendo o erro de verdade.
  let data = null
  try { data = await res.json() } catch (e) { data = null }

  if (!res.ok) {
    const err = new Error((data && data.erro) || ('Erro ' + res.status))
    err.status = res.status          // permite a tela tratar 403, 404, 500...
    err.corpo = data
    throw err
  }
  return data
}

// ---- Auth ----
const Auth = {
  async login(emailOuTelefone, senha) {
    // Normaliza — se for telefone converte para e-mail não, backend lida
    const data = await req('POST', '/auth/login', {
      email: emailOuTelefone,
      senha
    })
    setToken(data.token)
    setUsuario(data.usuario)
    return data.usuario
  },

  async cadastroCliente(dados) {
    const data = await req('POST', '/auth/cadastro-cliente', dados)
    setToken(data.token)
    setUsuario(data.usuario)
    return data.usuario
  },

  async esqueciSenha(email) {
    return req('POST', '/auth/esqueci-senha', { email })
  }
}

// ---- Agendamentos ----
const Agendamentos = {
  hoje(unidade_id)            { return req('GET', '/agendamentos/hoje' + (unidade_id ? '?unidade_id=' + unidade_id : '')) },
  listar(params = {})         { return req('GET', '/agendamentos?' + new URLSearchParams(params)) },
  horariosDisponiveis(params) { return req('GET', '/agendamentos/horarios-disponiveis?' + new URLSearchParams(params)) },
  criar(dados)                { return req('POST', '/agendamentos', dados) },
  atualizarStatus(id, status) { return req('PUT', '/agendamentos/' + id + '/status', { status }) }
}

// ---- Comandas ----
const Comandas = {
  listar(params = {})          { return req('GET', '/comandas?' + new URLSearchParams(params)) },
  buscar(id)                   { return req('GET', '/comandas/' + id) },
  abrir(dados)                 { return req('POST', '/comandas', dados) },
  adicionarItem(id, item)      { return req('POST', '/comandas/' + id + '/itens', item) },
  removerItem(id, itemId)      { return req('DELETE', '/comandas/' + id + '/itens/' + itemId) },
  finalizar(id, forma, desc)   { return req('PUT', '/comandas/' + id + '/finalizar', { forma_pgto: forma, desconto: desc || 0 }) }
}

// ---- Financeiro ----
const Financeiro = {
  resumo(params = {})     { return req('GET', '/financeiro/resumo?' + new URLSearchParams(params)) },
  comissoes(params = {})  { return req('GET', '/financeiro/comissoes?' + new URLSearchParams(params)) },
  minhaComissao(params={}){ return req('GET', '/financeiro/comissao-propria?' + new URLSearchParams(params)) }
}

// ---- Relatórios ----
const Relatorios = {
  servicos(params = {})  { return req('GET', '/relatorios/servicos?' + new URLSearchParams(params)) },
  retencao()             { return req('GET', '/relatorios/retencao') },
  estoque()              { return req('GET', '/relatorios/estoque') }
}

// ---- Cadastros ----
const Unidades      = {
  listar()        { return req('GET', '/unidades') },
  criar(d)        { return req('POST', '/unidades', d) },
  atualizar(id,d) { return req('PUT', '/unidades/' + id, d) }
}

const Colaboradores = {
  listar(params={})  { return req('GET', '/colaboradores?' + new URLSearchParams(params)) },
  criar(d)           { return req('POST', '/colaboradores', d) },
  atualizar(id,d)    { return req('PUT', '/colaboradores/' + id, d) }
}

const Clientes = {
  listar(params={})  { return req('GET', '/clientes?' + new URLSearchParams(params)) },
  meu()              { return req('GET', '/clientes/meu') },
  atualizar(id,d)    { return req('PUT', '/clientes/' + id, d) }
}

const Servicos = {
  listar(params={})  { return req('GET', '/servicos?' + new URLSearchParams(params)) },
  criar(d)           { return req('POST', '/servicos', d) },
  atualizar(id,d)    { return req('PUT', '/servicos/' + id, d) }
}

const Produtos = {
  listar(params={})       { return req('GET', '/produtos?' + new URLSearchParams(params)) },
  porBarcode(barcode)     { return req('GET', '/produtos/por-barcode/' + barcode) },
  criar(d)                { return req('POST', '/produtos', d) },
  atualizar(id,d)         { return req('PUT', '/produtos/' + id, d) },
  entrada(d)              { return req('POST', '/estoque/entrada', d) }
}

const Planos = {
  listar()           { return req('GET', '/planos') },
  criar(d)           { return req('POST', '/planos', d) },
  assinaturas()      { return req('GET', '/assinaturas') },
  vincular(d)        { return req('POST', '/assinaturas', d) }
}

// ---- Redirecionamento por perfil ----
function redirecionarPorPerfil(perfil) {
  const rotas = {
    proprietario: 'appsuabarbearia-dashboard.html',
    gerente:      'appsuabarbearia-dashboard.html',
    colaborador:  'appsuabarbearia-dashboard.html',
    caixa:        'appsuabarbearia-dashboard.html',
    cliente:      'appsuabarbearia-cliente.html'
  }
  window.location.href = rotas[perfil] || 'appsuabarbearia-login.html'
}

// ---- Guard — redireciona para login se não autenticado ----
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'appsuabarbearia-login.html'
    return null
  }
  return getUsuario()
}

// ============================================================================
// AVISO DE ATENDIMENTO HUMANO — vale em TODAS as telas
//
// Quando a IA passa uma conversa para uma pessoa, o Lucas precisa saber na
// hora, esteja ele na agenda, no caixa ou no financeiro. Antes o aviso só
// existia dentro da tela do WhatsApp, onde ele quase nunca está.
//
// Fica aqui no api.js porque é o único arquivo carregado por todas as telas.
// ============================================================================
(function () {
  // Na tela do WhatsApp e no login não faz sentido: numa ele já está vendo,
  // na outra ainda não entrou.
  var pagina = (location.pathname.split('/').pop() || '').toLowerCase()
  if (pagina.indexOf('whatsapp') !== -1 || pagina.indexOf('login') !== -1) return

  var vistos = {}
  var caixa = null
  var primeiraRodada = true

  // Bipe curto gerado na hora — sem depender de arquivo de áudio.
  function bipe () {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      var ctx = new Ctx()
      // Dois toques: chama atenção sem ser estridente.
      ;[0, 0.18].forEach(function (atraso) {
        var osc = ctx.createOscillator(), vol = ctx.createGain()
        osc.connect(vol); vol.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = 880
        vol.gain.setValueAtTime(0.0001, ctx.currentTime + atraso)
        vol.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + atraso + 0.02)
        vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + atraso + 0.15)
        osc.start(ctx.currentTime + atraso)
        osc.stop(ctx.currentTime + atraso + 0.16)
      })
      setTimeout(function () { try { ctx.close() } catch (e) {} }, 600)
    } catch (e) {}
  }

  function garantirCaixa () {
    if (caixa) return caixa
    caixa = document.createElement('div')
    caixa.style.cssText =
      'position:fixed;top:16px;right:16px;z-index:99999;display:flex;' +
      'flex-direction:column;gap:8px;max-width:330px;font-family:inherit'
    document.body.appendChild(caixa)
    return caixa
  }

  function mostrar (alerta) {
    var card = document.createElement('div')
    card.style.cssText =
      'background:#1b1a18;border:1px solid rgba(201,168,76,.45);border-left:4px solid #c9a84c;' +
      'border-radius:11px;padding:13px 15px;color:#f2f0ea;box-shadow:0 8px 26px rgba(0,0,0,.5);' +
      'cursor:pointer;font-size:13px;line-height:1.45;animation:none'
    card.innerHTML =
      '<div style="font-weight:600;color:#e8d49a;margin-bottom:3px">💬 Cliente pediu atendimento</div>' +
      '<div style="font-size:13px">' + (alerta.nome_contato || alerta.numero || 'Cliente') + '</div>' +
      '<div style="font-size:11.5px;color:#8a8578;margin-top:5px">Clique para abrir a conversa</div>'
    card.onclick = function () {
      location.href = 'appsuabarbearia-whatsapp.html'
    }
    garantirCaixa().appendChild(card)
    // Some sozinho depois de 30s — mas a conversa continua marcada no painel.
    setTimeout(function () { try { card.remove() } catch (e) {} }, 30000)
  }

  async function checar () {
    if (document.hidden) return
    try {
      var lista = await req('GET', '/whatsapp/alertas')
      if (!Array.isArray(lista)) return
      var novos = lista.filter(function (a) { return !vistos[a.id] })
      lista.forEach(function (a) { vistos[a.id] = true })

      // Na primeira rodada só memoriza: quem abriu o sistema agora não deve
      // levar um susto com alertas de horas atrás.
      if (primeiraRodada) { primeiraRodada = false; return }

      if (novos.length) {
        bipe()
        novos.forEach(mostrar)
      }
    } catch (e) {}
  }

  window.addEventListener('load', function () {
    if (typeof req !== 'function') return
    // SEM TOKEN NÃO VIGIA NADA.
    //
    // Este arquivo é carregado por TODAS as telas, inclusive a de acesso. Sem
    // esta linha, a tela de login chamava /whatsapp/alertas a cada 20s, levava
    // 401 e se recarregava — parecia que a página estava piscando sozinha.
    if (!getToken()) return
    checar()
    setInterval(checar, 20000)
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && getToken()) checar()
    })
  })
})()
