/* ============================================================
   AJUDA — tour guiado e busca de respostas

   Um arquivo só, carregado por todas as telas. Cada tela diz
   qual tour é o dela:

     <script src="ajuda.js" data-tour="dashboard"></script>

   O tour aponta para elementos REAIS da tela, não para imagens.
   Se um botão mudar de lugar, a bolha acompanha; se sumir,
   aquele passo é pulado. Nunca fica desatualizado.
   ============================================================ */
(function () {
  'use strict'

  var TOUR = null, PASSO = 0, TELA = null

  function tela () {
    if (TELA !== null) return TELA
    var s = document.currentScript || document.querySelector('script[data-tour]')
    TELA = (s && s.getAttribute('data-tour')) || ''
    return TELA
  }

  function esc (t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  // ---------------------------------------------------------- estilos ----
  function estilos () {
    if (document.getElementById('ajuda-css')) return
    var st = document.createElement('style')
    st.id = 'ajuda-css'
    st.textContent = [
      '.aj-fundo{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:9000}',
      '.aj-buraco{position:fixed;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,.72),0 0 0 2px var(--gold,#00E5A0);z-index:9001;pointer-events:none;transition:all .22s ease}',
      '.aj-bolha{position:fixed;z-index:9002;max-width:330px;background:var(--bg2,#0F0F0F);border:0.5px solid var(--border2,#2A2A2A);border-radius:13px;padding:17px 19px;box-shadow:0 18px 44px rgba(0,0,0,.55)}',
      '.aj-bolha h4{font-size:14.5px;font-weight:600;color:var(--white,#F5F5F5);margin:0 0 6px}',
      '.aj-bolha p{font-size:13.5px;color:var(--muted,#8A8A8A);margin:0 0 15px;line-height:1.55}',
      '.aj-rod{display:flex;justify-content:space-between;align-items:center;gap:10px}',
      '.aj-cont{font-size:11.5px;color:var(--muted,#8A8A8A)}',
      '.aj-bt{background:transparent;border:0.5px solid var(--border2,#2A2A2A);border-radius:8px;padding:8px 15px;color:var(--muted,#8A8A8A);font-size:12.5px;cursor:pointer;font-family:inherit}',
      '.aj-bt:hover{border-color:var(--white,#F5F5F5);color:var(--white,#F5F5F5)}',
      '.aj-bt-p{background:var(--gold,#00E5A0);border-color:transparent;color:#062E22;font-weight:600}',

      '.aj-btn-flut{position:fixed;right:22px;bottom:22px;width:48px;height:48px;border-radius:50%;background:var(--gold,#00E5A0);border:0;color:#062E22;font-size:21px;font-weight:700;cursor:pointer;z-index:8000;box-shadow:0 6px 20px rgba(0,0,0,.4);font-family:inherit}',
      '.aj-btn-flut:hover{filter:brightness(1.08)}',

      '.aj-painel{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:8500;display:none}',
      '.aj-painel.on{display:block}',
      '.aj-cx{position:absolute;right:0;top:0;bottom:0;width:min(460px,100%);background:var(--bg2,#0F0F0F);border-left:0.5px solid var(--border,#1F1F1F);display:flex;flex-direction:column}',
      '.aj-topo{padding:19px 22px;border-bottom:0.5px solid var(--border,#1F1F1F);display:flex;justify-content:space-between;align-items:flex-start;gap:14px}',
      '.aj-topo h3{font-size:16px;font-weight:600;color:var(--white,#F5F5F5);margin:0}',
      '.aj-topo div.s{font-size:12.5px;color:var(--muted,#8A8A8A);margin-top:2px}',
      '.aj-corpo{flex:1;overflow-y:auto;padding:16px 22px 22px}',
      '.aj-campo{display:flex;gap:8px;margin-bottom:16px}',
      '.aj-campo input{flex:1;background:var(--bg3,#151515);border:0.5px solid var(--border2,#2A2A2A);border-radius:9px;padding:11px 13px;color:var(--white,#F5F5F5);font-size:14px;font-family:inherit}',
      '.aj-item{padding:12px 0;border-bottom:0.5px solid var(--border,#1F1F1F);font-size:13.5px;color:var(--muted,#8A8A8A);cursor:pointer}',
      '.aj-item:hover{color:var(--white,#F5F5F5)}',
      '.aj-resp{background:var(--bg3,#151515);border-radius:11px;padding:16px 18px;margin-bottom:14px}',
      '.aj-resp h4{font-size:14px;color:var(--white,#F5F5F5);margin:0 0 10px;font-weight:600}',
      '.aj-resp ol{margin:0;padding-left:19px}',
      '.aj-resp li{font-size:13.5px;color:var(--muted,#8A8A8A);margin-bottom:7px;line-height:1.55}'
    ].join('\n')
    document.head.appendChild(st)
  }

  // ------------------------------------------------------------ tour ----
  function fecharTour () {
    ['aj-fundo', 'aj-buraco', 'aj-bolha'].forEach(function (c) {
      var el = document.querySelector('.' + c); if (el) el.remove()
    })
  }

  function mostrarPasso () {
    fecharTour()
    if (!TOUR || PASSO >= TOUR.passos.length) { concluir(); return }

    var passo = TOUR.passos[PASSO]
    var alvo = null
    // Vários seletores separados por vírgula: usa o primeiro que existir E
    // estiver visível. Assim o tour não quebra se a tela mudar.
    String(passo.alvo || '').split(',').some(function (sel) {
      var e = document.querySelector(sel.trim())
      if (e && e.getBoundingClientRect().width > 0) { alvo = e; return true }
      return false
    })

    // Elemento não existe nesta tela? Pula sem avisar — melhor que apontar
    // para o nada.
    if (!alvo) { PASSO++; mostrarPasso(); return }

    alvo.scrollIntoView({ block: 'center', behavior: 'smooth' })

    setTimeout(function () {
      var r = alvo.getBoundingClientRect()
      var fundo = document.createElement('div'); fundo.className = 'aj-fundo'
      var buraco = document.createElement('div'); buraco.className = 'aj-buraco'
      buraco.style.cssText = 'top:' + (r.top - 5) + 'px;left:' + (r.left - 5) + 'px;width:' + (r.width + 10) + 'px;height:' + (r.height + 10) + 'px'

      var bolha = document.createElement('div'); bolha.className = 'aj-bolha'
      var ultimo = PASSO === TOUR.passos.length - 1
      bolha.innerHTML =
        '<h4>' + esc(passo.titulo) + '</h4>'
        + '<p>' + esc(passo.texto) + '</p>'
        + '<div class="aj-rod">'
        +   '<span class="aj-cont">' + (PASSO + 1) + ' de ' + TOUR.passos.length + '</span>'
        +   '<span style="display:flex;gap:8px">'
        +     '<button class="aj-bt" data-aj="sair">Sair</button>'
        +     '<button class="aj-bt aj-bt-p" data-aj="prox">' + (ultimo ? 'Entendi' : 'Próximo') + '</button>'
        +   '</span>'
        + '</div>'

      document.body.appendChild(fundo)
      document.body.appendChild(buraco)
      document.body.appendChild(bolha)

      // Encaixa a bolha abaixo do alvo; se não couber, acima.
      var bh = bolha.getBoundingClientRect().height
      var topo = r.bottom + 14
      if (topo + bh > window.innerHeight - 12) topo = Math.max(12, r.top - bh - 14)
      var esq = Math.min(Math.max(12, r.left), window.innerWidth - 346)
      bolha.style.top = topo + 'px'
      bolha.style.left = esq + 'px'

      bolha.querySelector('[data-aj="sair"]').onclick = function () { fecharTour(); concluir() }
      bolha.querySelector('[data-aj="prox"]').onclick = function () { PASSO++; mostrarPasso() }
    }, 260)
  }

  function concluir () {
    fecharTour()
    if (!tela()) return
    try { req('POST', '/ajuda/tour/' + tela() + '/visto', {}) } catch (e) {}
  }

  async function abrirTour (forcar) {
    if (!tela() || typeof req !== 'function') return
    try {
      var d = await req('GET', '/ajuda/tour/' + tela())
      if (!d || !d.tem) return
      if (d.visto && !forcar) return
      TOUR = d; PASSO = 0
      estilos(); mostrarPasso()
    } catch (e) {}
  }

  // ----------------------------------------------------------- ajuda ----
  function abrirAjuda () {
    estilos()
    var p = document.getElementById('aj-painel')
    if (!p) {
      p = document.createElement('div')
      p.id = 'aj-painel'; p.className = 'aj-painel'
      p.innerHTML =
        '<div class="aj-cx">'
        + '<div class="aj-topo">'
        +   '<div><h3>Ajuda</h3><div class="s">Escreva sua dúvida ou escolha abaixo.</div></div>'
        +   '<button class="aj-bt" data-aj="fechar">&times;</button>'
        + '</div>'
        + '<div class="aj-corpo">'
        +   '<div class="aj-campo">'
        +     '<input id="aj-q" placeholder="Ex: como fecho o caixa?">'
        +     '<button class="aj-bt aj-bt-p" data-aj="buscar">Buscar</button>'
        +   '</div>'
        +   '<div id="aj-saida"></div>'
        +   '<div id="aj-lista"></div>'
        + '</div>'
        + '</div>'
      document.body.appendChild(p)

      p.onclick = function (e) { if (e.target === p) p.classList.remove('on') }
      p.querySelector('[data-aj="fechar"]').onclick = function () { p.classList.remove('on') }
      p.querySelector('[data-aj="buscar"]').onclick = perguntar
      p.querySelector('#aj-q').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') perguntar()
      })
      carregarLista()
    }
    p.classList.add('on')
    setTimeout(function () { var i = document.getElementById('aj-q'); if (i) i.focus() }, 80)
  }

  async function carregarLista () {
    var el = document.getElementById('aj-lista'); if (!el) return
    try {
      var lista = await req('GET', '/ajuda/perguntas') || []
      el.innerHTML = '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted,#8A8A8A);margin:8px 0 4px">Dúvidas comuns</div>'
        + lista.map(function (r) {
            return '<div class="aj-item" data-id="' + esc(r.id) + '">' + esc(r.pergunta) + '</div>'
          }).join('')
      el.querySelectorAll('.aj-item').forEach(function (it) {
        it.onclick = function () { abrirResposta(it.getAttribute('data-id')) }
      })
    } catch (e) { el.innerHTML = '' }
  }

  async function abrirResposta (id) {
    try { mostrarResposta(await req('GET', '/ajuda/resposta/' + id)) } catch (e) {}
  }

  async function perguntar () {
    var q = (document.getElementById('aj-q') || {}).value || ''
    if (!q.trim()) return
    var saida = document.getElementById('aj-saida')
    saida.innerHTML = '<div class="aj-resp"><p style="margin:0;font-size:13.5px;color:var(--muted,#8A8A8A)">Procurando…</p></div>'
    try {
      mostrarResposta(await req('POST', '/ajuda/perguntar', { pergunta: q.trim() }))
    } catch (e) {
      saida.innerHTML = '<div class="aj-resp"><p style="margin:0;font-size:13.5px;color:var(--muted,#8A8A8A)">Não consegui buscar agora. Tente de novo.</p></div>'
    }
  }

  function mostrarResposta (d) {
    var saida = document.getElementById('aj-saida'); if (!saida || !d) return

    // Não achou: diz que não sabe, em vez de empurrar qualquer coisa.
    if (!d.achou) {
      saida.innerHTML = '<div class="aj-resp">'
        + '<p style="margin:0 0 10px;font-size:13.5px;color:var(--muted,#8A8A8A)">' + esc(d.mensagem) + '</p>'
        + (d.parecidas || []).map(function (p) {
            return '<div class="aj-item" data-id="' + esc(p.id) + '">' + esc(p.pergunta) + '</div>'
          }).join('')
        + '</div>'
      saida.querySelectorAll('.aj-item').forEach(function (it) {
        it.onclick = function () { abrirResposta(it.getAttribute('data-id')) }
      })
      return
    }

    saida.innerHTML = '<div class="aj-resp">'
      + '<h4>' + esc(d.pergunta) + '</h4>'
      + '<ol>' + d.passos.map(function (p) { return '<li>' + esc(p) + '</li>' }).join('') + '</ol>'
      + (d.tela ? '<button class="aj-bt aj-bt-p" style="margin-top:12px" data-aj="ir">Me leva lá</button>' : '')
      + '</div>'
    var ir = saida.querySelector('[data-aj="ir"]')
    if (ir) ir.onclick = function () { window.location.href = d.tela }
  }

  // ------------------------------------------------------------ botão ---
  function botao () {
    if (document.getElementById('aj-btn')) return
    var b = document.createElement('button')
    b.id = 'aj-btn'; b.className = 'aj-btn-flut'; b.textContent = '?'
    b.title = 'Ajuda — clique. Para rever o tour desta tela, segure.'
    b.onclick = abrirAjuda
    // Segurar repete o tour da tela, sem ocupar espaço com um segundo botão.
    var t
    b.onmousedown = function () { t = setTimeout(function () { abrirTour(true) }, 700) }
    b.onmouseup = b.onmouseleave = function () { clearTimeout(t) }
    document.body.appendChild(b)
  }

  window.AjudaSistema = { abrir: abrirAjuda, tour: function () { abrirTour(true) } }

  window.addEventListener('load', function () {
    if (typeof getToken === 'function' && !getToken()) return   // fora do login, nada
    estilos(); botao()
    setTimeout(function () { abrirTour(false) }, 1200)
  })
})()
