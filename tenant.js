/* ============================================================
   TENANT — camada de identidade da barbearia
   Gerado pelo personalizador em 2026-08-14. Não edite à mão:
   recarregue a ficha _ficha-tenant.json no personalizador e gere de novo.
   ============================================================ */
(function () {
  'use strict'

  window.TENANT = {
  "slug": "lucas-bugs-hair-stylist",
  "nome": "LUCAS BUGS | Hair Stylist",
  "nomeCurto": "LUCAS BUGS | Hair Stylist",
  "cidade": "Montenegro",
  "uf": "RS",
  "ddd": "51",
  "api": "https://api.lucasbugshair.com.br",
  "site": "https://lucasbugshair.com.br",
  "storagePrefix": "appsuabarbearia",
  "unidadesConfig": [
    {
      "slug": "centro",
      "nome": "Centro"
    }
  ],
  "tema": {
    "modo": "escuro",
    "primaria": "#00eba4",
    "primariaClara": "#ffffff",
    "fundo": "#000000",
    "preto": "#0d1526",
    "branco": "#ffffff",
    "fontes": {
      "titulo": "Archivo Black",
      "texto": "Inter",
      "pesos": {
        "titulo": "400",
        "texto": "400;500;600;700"
      }
    },
    "primariaRgb": "0,235,164"
  },
  "modo": "escuro",
  "fontes": {
    "titulo": "Archivo Black",
    "texto": "Inter",
    "pesos": {
      "titulo": "400",
      "texto": "400;500;600;700"
    }
  },
  "tokens": {
    "--bg": "#000000",
    "--bg2": "#0b0b0b",
    "--bg3": "#161616",
    "--bg4": "#212121",
    "--black": "#000000",
    "--white": "#ffffff",
    "--cream": "#e6fdf6",
    "--muted": "#949494",
    "--muted2": "#707070",
    "--border": "rgba(255,255,255,0.1)",
    "--border2": "rgba(255,255,255,0.18)",
    "--gold": "#00eba4",
    "--gold-light": "#ffffff",
    "--gold-dim": "rgba(0,235,164,0.12)",
    "--gold-border": "rgba(0,235,164,0.3)",
    "--border-strong": "rgba(0,235,164,0.4)",
    "--on-primary": "#0d0d10",
    "--green": "#2ecc71",
    "--green-dim": "rgba(46,204,113,0.14)",
    "--green-text": "#54d58b",
    "--on-green": "#0d1526",
    "--red": "#ef5350",
    "--red-dim": "rgba(239,83,80,0.14)",
    "--red-text": "#f27270",
    "--amber": "#f0b429",
    "--amber-dim": "rgba(240,180,41,0.16)",
    "--blue": "#4b9bf5",
    "--blue-dim": "rgba(75,155,245,0.14)",
    "--blue-text": "#6badf7",
    "--roxo": "#a97bf0",
    "--roxo-dim": "rgba(169,123,240,0.14)",
    "--roxo-text": "#b893f3",
    "--overlay": "rgba(0,0,0,0.05)",
    "--overlay2": "rgba(0,0,0,0.1)",
    "--wpp": "#25D366",
    "--wpp-dim": "rgba(37,211,102,0.12)",
    "--serie-1": "#2a78d6",
    "--serie-2": "#eb6834",
    "--serie-3": "#1baf7a",
    "--serie-4": "#eda100",
    "--serie-5": "#e87ba4",
    "--serie-6": "#008300",
    "--serie-7": "#4a3aa7",
    "--serie-8": "#e34948",
    "--ag-bg": "#ffffff",
    "--ag-bg-header": "#f1f2f4",
    "--ag-bg-time": "#f8f8f9",
    "--ag-line": "rgba(0,0,0,0.10)",
    "--ag-line-full": "rgba(0,0,0,0.22)",
    "--ag-text": "#111111",
    "--ag-text-muted": "#6b7280",
    "--ag-hover": "rgba(0,0,0,0.045)",
    "--ag-mine-bg": "rgba(0,150,105,0.10)",
    "--ag-mine-border": "rgba(0,150,105,0.45)",
    "--ev-agendado-bar": "#2a71c8",
    "--ev-agendado-bg": "#e4edfa",
    "--ev-agendado-text": "#1a4a80",
    "--ev-concluido-bar": "#1faa5f",
    "--ev-concluido-bg": "#e1f5e9",
    "--ev-concluido-text": "#14663a",
    "--ev-atrasado-bar": "#c2650a",
    "--ev-atrasado-bg": "#fdeedc",
    "--ev-atrasado-text": "#8a4a06",
    "--ev-nao-veio-bar": "#e04340",
    "--ev-nao-veio-bg": "#fde5e4",
    "--ev-nao-veio-text": "#96201e",
    "--ev-bloqueado-bar": "#8a8a8a",
    "--ev-bloqueado-bg": "#eaeaec",
    "--ev-bloqueado-text": "#54545a"
  }
}

  // ---------- 1. Tokens de cor em runtime ----------
  // A rampa inteira já foi escrita no :root de cada HTML pelo gerador — isso
  // aqui é a segunda camada: permite ajustar a identidade sem reprocessar os
  // arquivos, porque estilo inline no <html> ganha de qualquer folha de estilo.
  try {
    var r = document.documentElement
    var tokens = window.TENANT.tokens || {}
    Object.keys(tokens).forEach(function (k) { r.style.setProperty(k, tokens[k]) })
    r.setAttribute('data-tema', window.TENANT.modo || 'escuro')

    // A agenda redeclarava --ag-* e --ev-* no próprio bloco, o que travava
    // aquela parte da tela no tema antigo. Agora vem tudo do :root.
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta && tokens['--bg']) meta.setAttribute('content', tokens['--bg'])
  } catch (e) {}

  // ---------- 2. Unidades vindas do banco ----------
  // Substitui os <option> que antes eram UUID fixo no HTML.
  var CACHE_KEY = window.TENANT.storagePrefix + '_unidades_cache'

  function token () {
    return localStorage.getItem(window.TENANT.storagePrefix + '_token') ||
           localStorage.getItem('cli_token') || ''
  }

  function preencher (unidades) {
    if (!unidades || !unidades.length) return
    window.TENANT.unidadesCarregadas = unidades
    var selects = document.querySelectorAll('select[data-unidades]')
    Array.prototype.forEach.call(selects, function (sel) {
      if (sel.dataset.unidadesOk === '1') return
      var selecionado = sel.value
      unidades.forEach(function (u) {
        if (sel.querySelector('option[value="' + u.id + '"]')) return
        var o = document.createElement('option')
        o.value = u.id
        o.textContent = (sel.dataset.unidadesPrefixo || '') + u.nome
        sel.appendChild(o)
      })
      sel.dataset.unidadesOk = '1'
      if (selecionado) sel.value = selecionado
      sel.dispatchEvent(new Event('unidades:pronto', { bubbles: true }))
    })
    document.dispatchEvent(new CustomEvent('tenant:unidades', { detail: unidades }))
  }

  function carregar () {
    // 1º pinta com o cache (evita select vazio no primeiro frame)
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null')
      if (c && c.length) preencher(c)
    } catch (e) {}

    // SEM TOKEN NÃO CONSULTA.
    //
    // Este arquivo é carregado por todas as telas, inclusive a de acesso. Sem
    // esta linha, a tela de login pedia /unidades e levava 401 a cada
    // carregamento — aparecia no Network e não servia para nada, já que quem
    // não entrou não tem unidade para escolher.
    if (!token()) return

    fetch(window.TENANT.api + '/unidades', {
      headers: token() ? { Authorization: 'Bearer ' + token() } : {}
    })
      .then(function (r) { return r.ok ? r.json() : null })
      .then(function (data) {
        var lista = Array.isArray(data) ? data : (data && data.unidades) || []
        lista = lista.filter(function (u) { return u && u.id && u.nome })
        if (!lista.length) return
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(lista)) } catch (e) {}
        preencher(lista)
      })
      .catch(function () {})
  }

  // ---------- 3. Helpers ----------
  function normalizar (s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '')
  }

  // slug configurado da unidade (casa o UUID do banco com a ficha do cliente pelo nome)
  window.TENANT.slugDaUnidade = function (id) {
    var u = window.TENANT.unidadePorId(id)
    if (!u) return null
    var achou = (window.TENANT.unidadesConfig || []).filter(function (c) {
      return normalizar(c.nome) === normalizar(u.nome)
    })[0]
    return achou ? achou.slug : null
  }

  // Ordem dos blocos da agenda multi-unidade: a unidade do usuário vem primeiro.
  // Substitui o mapa de UUIDs que era fixo no dashboard — funciona com N unidades.
  window.TENANT.ordemBlocos = function (id) {
    var todos = (window.TENANT.unidadesConfig || []).map(function (c) { return 'bloco-' + c.slug })
    if (!todos.length) return null
    var meu = window.TENANT.slugDaUnidade(id)
    if (!meu) return todos
    var meuBloco = 'bloco-' + meu
    return [meuBloco].concat(todos.filter(function (b) { return b !== meuBloco }))
  }

  // API pública para as telas
  window.TENANT.unidades = function () { return window.TENANT.unidadesCarregadas || [] }
  window.TENANT.unidadePorId = function (id) {
    return (window.TENANT.unidadesCarregadas || []).filter(function (u) { return u.id === id })[0] || null
  }
  window.TENANT.recarregarUnidades = carregar

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', carregar)
  } else {
    carregar()
  }
})()
