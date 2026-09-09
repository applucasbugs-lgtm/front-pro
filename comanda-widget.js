/* ============================================================
   COMANDA WIDGET — a MESMA comanda do Operacional, num arquivo
   só, usada também pelo Dashboard. Carregue com:
       <script src="comanda-widget.js"></script>
   e configure os ganchos de cada tela:
       ComandaWidget.init({ toast: fn, onFinalizar: fn });
   Para abrir:
       ComandaWidget.abrir({ agendamento_id, cliente_nome,
                             servico_nome, valor, cliente_id, canal });
   ============================================================ */
(function () {
  'use strict';
  // -------- estado --------
  var comandaId = null, agId = null, canal = '', clienteId = null;
  var itens = [], tipo = 'servico';
  var _enviando = false;
  var pontosUsados = 0, saldoPts = 0; // resgate de fidelidade
  var splitOn = false, splitRows = [];
  var barbeiros = [];
  var planoSit = null;
  var _planoNovo = null; // plano escolhido no atendimento p/ ativar ao finalizar
  var cache = { servicos: [], produtos: [], planos: [] };
  var hooks = { toast: function (m) { try { alert(m); } catch (e) {} }, onFinalizar: function () {} };
  var brl = function (v) { return 'R$ ' + (Number(v) || 0).toFixed(2).replace('.', ','); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };
  // -------- CSS (mesmas regras do Operacional, prefixadas cw-) --------
  var css = ''
    + '.cw-ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:498;display:none;justify-content:flex-end;align-items:stretch}'
    + '.cw-ov.open{display:flex}'
    + '.cw-drawer{width:500px;max-width:100%;height:100vh;background:var(--bg2,#161616);border-left:0.5px solid var(--border2,#333);display:flex;flex-direction:column;animation:cwSlide .25s ease;overflow:hidden;font-family:"DM Sans",sans-serif}'
    + '@keyframes cwSlide{from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1}}'
    + '.cw-dh{padding:18px 20px;border-bottom:0.5px solid var(--border,#2a2a2a);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}'
    + '.cw-dh-title{font-size:15px;font-weight:500;color:var(--white,#fff)}'
    + '.cw-dh-sub{font-size:12px;color:var(--muted,#888);margin-top:2px}'
    + '.cw-dc-btn{width:32px;height:32px;border-radius:6px;background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted,#888)}'
    + '.cw-dc-btn:hover{background:var(--bg4,#262626);color:var(--white,#fff)}'
    + '.cw-dc-btn svg{width:16px;height:16px}'
    + '.cw-db{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px}'
    + '.cw-db>*{flex-shrink:0}'
    + '.cw-df{padding:16px 20px;border-top:0.5px solid var(--border,#2a2a2a);display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0}'
    + '.cw-fsec{font-size:11px;font-weight:500;color:var(--gold,#074391);text-transform:uppercase;letter-spacing:.08em;margin-top:4px}'
    + '.cw-card{background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:10px;overflow:hidden}'
    + '.cw-item-row{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:0.5px solid var(--border,#2a2a2a)}'
    + '.cw-item-type{font-size:10px;color:var(--muted,#888)}'
    + '.cw-drawer input[type=number]::-webkit-inner-spin-button,.cw-drawer input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}'
    + '.cw-drawer input[type=number]{-moz-appearance:textfield;appearance:textfield}'
    + '.cw-qty{display:flex;align-items:center;gap:4px;flex-shrink:0}'
    + '.cw-qty-btn{width:22px;height:22px;border-radius:5px;border:0.5px solid var(--border2,#333);background:var(--bg3,#1e1e1e);color:var(--gold-light,#e0c878);font-size:15px;font-weight:600;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:0}'
    + '.cw-qty-btn:hover{border-color:var(--gold,#074391)}'
    + '.cw-qty-n{min-width:18px;text-align:center;font-size:13px;font-weight:500;color:var(--white,#fff)}'
    + '.cw-ib{width:28px;height:28px;border-radius:6px;background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);display:flex;align-items:center;justify-content:center;color:var(--muted,#888)}'
    + '.cw-ib:hover{background:var(--bg4,#262626)}'
    + '.cw-ib.del:hover{background:var(--red-dim,rgba(160,53,53,.15));border-color:rgba(160,53,53,.4)}'
    + '.cw-ib svg{width:15px;height:15px}'
    + '.cw-total-row{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-top:0.5px solid var(--border,#2a2a2a)}'
    + '.cw-total-label{font-size:13px;color:var(--muted,#888)}'
    + '.cw-total-val{font-size:15px;font-weight:500;color:var(--white,#fff)}'
    + '.cw-total-final{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:var(--gold-dim,rgba(7,67,145,.15));border-top:0.5px solid var(--gold-border,rgba(7,67,145,.4))}'
    + '.cw-total-final-label{font-size:14px;font-weight:500;color:var(--gold-light,#e0c878)}'
    + '.cw-total-final-val{font-family:"Playfair Display",serif;font-size:24px;color:var(--gold-light,#e0c878)}'
    + '.cw-frow{display:grid;gap:12px;grid-template-columns:1fr 1fr}'
    + '.cw-fg{display:flex;flex-direction:column;gap:6px}'
    + '.cw-form-label{font-size:11px;font-weight:500;color:var(--muted,#888);text-transform:uppercase;letter-spacing:.07em}'
    + '.cw-form-select{background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:8px;padding:10px 12px;font-family:inherit;font-size:13px;color:var(--white,#fff);outline:none;width:100%}'
    + '.cw-form-select:focus{border-color:var(--gold,#074391)}'
    + '.cw-btn{padding:10px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;border:0.5px solid var(--border2,#333)}'
    + '.cw-btn-ghost{background:var(--bg3,#1e1e1e);color:var(--white,#fff)}'
    + '.cw-btn-ghost:hover{opacity:.85}'
    + '.cw-btn-success{background:var(--green-dim,rgba(45,122,79,.15));color:#4caf7d;border:0.5px solid rgba(45,122,79,0.3)}'
    + '.cw-btn-success:hover{opacity:.85}'
    + '.cw-tipo-btn{font-size:11px;padding:3px 10px;border-radius:6px;cursor:pointer;font-family:inherit;border:0.5px solid var(--border,#2a2a2a);background:none;color:var(--muted,#888)}'
    + '.cw-tipo-btn.sel{border-color:var(--gold-border,rgba(7,67,145,.4));background:var(--gold-dim,rgba(7,67,145,.15));color:var(--gold-light,#e0c878)}'
    + '.cw-barcode{border:0.5px dashed var(--border2,#333);border-radius:10px;padding:14px;text-align:center;cursor:pointer}'
    + '.cw-barcode:hover{border-color:var(--gold,#074391)}'
    + '.cw-barcode svg{width:28px;height:28px;color:var(--muted,#888);margin:0 auto 8px}'
    + '.cw-barcode-hint{font-size:12px;color:var(--muted,#888)}'
    + '.cw-pgto-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}'
    + '.cw-pgto-btn{background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:8px;padding:10px;text-align:center;cursor:pointer;transition:all .15s;font-family:inherit}'
    + '.cw-pgto-btn:hover{background:var(--gold-dim,rgba(7,67,145,.15));border-color:var(--gold-border,rgba(7,67,145,.4))}'
    + '.cw-pgto-btn.sel{background:var(--gold-dim,rgba(7,67,145,.15));border-color:var(--gold,#074391);box-shadow:inset 0 0 0 1.5px var(--gold,#074391)}'
    + '.cw-pgto-btn.sel .cw-pgto-label{color:var(--gold-light,#e0c878);font-weight:600}'
    + '.cw-pgto-btn.sel .cw-pgto-icon{transform:scale(1.08)}'
    + '.cw-pgto-icon{font-size:18px;margin-bottom:4px}'
    + '.cw-pgto-label{font-size:12px;color:var(--white,#fff);font-weight:500}'
    + '.cw-cashback{background:rgba(76,175,125,0.06);border:0.5px solid rgba(76,175,125,0.2);border-radius:8px;padding:10px 14px}'
    + '.cw-plano-badge{border-radius:10px;padding:10px 12px;font-size:12px;font-weight:500}'
    + '.cw-plano-card{border-radius:10px;padding:10px 12px;font-size:12px;line-height:1.7}'
    + '.cw-plano-card b{font-weight:700}'
    + '.cw-plano-card .cw-plano-head{font-size:13px;font-weight:700;margin-bottom:3px}'
    + '.cw-plano-ok{background:rgba(76,175,80,.12);border:0.5px solid rgba(76,175,80,.4);color:#7fd089}'
    + '.cw-plano-warn{background:rgba(230,120,20,.12);border:0.5px solid rgba(230,120,20,.4);color:#e6913c}'
    + '#cw-plano:empty{display:none}'
    + '.cw-split-toggle{margin-top:8px;font-size:12px;color:var(--gold,#074391);cursor:pointer;user-select:none;display:inline-block}'
    + '.cw-split-toggle:hover{text-decoration:underline}'
    + '.cw-split-toggle.on{color:var(--white,#fff)}'
    + '.cw-split{margin-top:8px;background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px}'
    + '.cw-split-row{display:flex;gap:8px;align-items:center}'
    + '.cw-split-row select{flex:1;min-width:0;background:var(--bg2,#181818);border:0.5px solid var(--border2,#333);border-radius:6px;color:var(--white,#fff);font-size:13px;padding:6px;font-family:inherit}'
    + '.cw-split-row input{width:88px;background:var(--bg2,#181818);border:0.5px solid var(--border2,#333);border-radius:6px;color:var(--gold-light,#e0c878);font-size:13px;padding:6px;text-align:right;font-family:inherit}'
    + '.cw-split-rm{cursor:pointer;color:var(--muted,#888);font-size:18px;padding:0 2px;line-height:1}'
    + '.cw-split-rm:hover{color:var(--white,#fff)}'
    + '.cw-split-add{font-size:12px;color:var(--gold,#074391);cursor:pointer;user-select:none}'
    + '.cw-split-add:hover{text-decoration:underline}'
    + '.cw-split-status{font-size:12px;font-weight:600;text-align:center;padding:2px}'
    + '.cw-split-status.ok{color:#4caf7d}'
    + '.cw-split-status.bad{color:var(--gold-light,#e0c878)}'
    + '.cw-cli{margin-bottom:12px}'
    + '.cw-cli-input{width:100%;background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:8px;padding:9px 12px;font-size:13px;color:var(--white,#fff);font-family:inherit;outline:none;box-sizing:border-box}'
    + '.cw-cli-res{background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:8px;margin-top:4px;max-height:150px;overflow-y:auto}'
    + '.cw-cli-opt{padding:8px 12px;font-size:13px;color:var(--white,#fff);cursor:pointer;border-bottom:0.5px solid var(--border,#2a2a2a)}'
    + '.cw-cli-opt:hover{background:var(--bg4,#262626)}'
    + '.cw-cli-opt small{color:var(--muted,#888)}'
    + '.cw-cli-sel{display:flex;align-items:center;justify-content:space-between;background:var(--gold-dim,rgba(7,67,145,.12));border:0.5px solid var(--gold-border,rgba(7,67,145,.3));border-radius:8px;padding:8px 12px;margin-top:4px}'
    + '.cw-cli-sel-nome{font-size:13px;color:var(--white,#fff)}'
    + '.cw-cli-x{cursor:pointer;color:var(--muted,#888);font-size:16px;line-height:1}';
  // -------- HTML (espelha o drawer do Operacional, partes visíveis) --------
  var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  var TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H5L4 6"/></svg>';
  var BARCODE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 5v14M12 5v6M17 5v14"/></svg>';
  var html = ''
    + '<div class="cw-ov" id="cw-ov">'
    + '<div class="cw-drawer">'
    + '  <div class="cw-dh"><div><div class="cw-dh-title">Comanda</div><div class="cw-dh-sub" id="cw-sub">\u2014</div></div><div class="cw-dc-btn" id="cw-x">' + X + '</div></div>'
    + '  <div class="cw-db">'
    + '    <div id="cw-plano"></div>'
    + '    <div class="cw-cli" id="cw-cliente" style="display:none">'
    + '      <label class="cw-form-label">Cliente (opcional)</label>'
    + '      <input class="cw-cli-input" id="cw-cli-input" placeholder="Nome ou WhatsApp..." autocomplete="off">'
    + '      <div class="cw-cli-res" id="cw-cli-res" style="display:none"></div>'
    + '      <div class="cw-cli-sel" id="cw-cli-sel" style="display:none"><span class="cw-cli-sel-nome" id="cw-cli-sel-nome"></span><span class="cw-cli-x" id="cw-cli-x">\u00d7</span></div>'
    + '    </div>'
    + '    <div class="cw-fsec">Itens da comanda</div>'
    + '    <div class="cw-card">'
    + '      <div id="cw-itens"></div>'
    + '      <div class="cw-total-row"><span class="cw-total-label">Subtotal</span><span class="cw-total-val" id="cw-subtotal">R$ 0,00</span></div>'
    + '      <div class="cw-total-row" id="cw-row-desc-pts" style="display:none"><span class="cw-total-label">Desconto fidelidade</span><span class="cw-total-val" id="cw-desc-pts" style="color:#4caf7d">\u2212 R$ 0,00</span></div>'
    + '      <div class="cw-total-row" id="cw-row-desc-assin" style="display:none"><span class="cw-total-label">Desconto assinante (15% em servi\u00e7os)</span><span class="cw-total-val" id="cw-desc-assin" style="color:#4caf7d">\u2212 R$ 0,00</span></div>'
    + '      <div class="cw-total-final"><span class="cw-total-final-label">Total</span><span class="cw-total-final-val" id="cw-total">R$ 0,00</span></div>'
    + '    </div>'
    + '    <div id="cw-desc-assin-box"></div>'
    + '    <div id="cw-split-barb-box"></div>'
    + '    <div class="cw-fsec" style="display:flex;align-items:center;justify-content:space-between"><span>Adicionar item</span>'
    + '      <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="cw-tipo-btn sel" id="cw-tab-servico">Servi\u00e7o</button><button class="cw-tipo-btn" id="cw-tab-barbearia">Produto Barbearia</button><button class="cw-tipo-btn" id="cw-tab-bar">Bar</button></div>'
    + '    </div>'
    + '    <div class="cw-frow">'
    + '      <div class="cw-fg"><label class="cw-form-label">Selecionar <span id="cw-tlabel">servi\u00e7o</span></label><select class="cw-form-select" id="cw-sel"><option value="">Selecionar...</option></select></div>'
    + '      <div class="cw-fg" id="cw-item-barbeiro-wrap" style="display:none"><label class="cw-form-label">Barbeiro <span style="color:var(--gold,#074391)">*</span></label><select class="cw-form-select" id="cw-item-barbeiro"><option value="">Barbeiro...</option></select></div>'
    + '      <div class="cw-fg"><label class="cw-form-label">&nbsp;</label><button class="cw-btn cw-btn-ghost" style="width:100%" id="cw-add">+ Adicionar</button></div>'
    + '    </div>'
    + '    <label id="cw-ficha-wrap" style="display:none;align-items:center;gap:8px;margin-top:2px;cursor:pointer;font-size:12px;color:var(--gold-light,#e0c878)">'
    + '      <input type="checkbox" id="cw-ficha-chk" style="accent-color:var(--gold,#074391)"> \ud83c\udf7a Usar ficha do bar (\u2212R$8) <span id="cw-ficha-disp" style="color:var(--muted,#888)"></span>'
    + '    </label>'
    + '    <div class="cw-barcode">' + BARCODE + '<div class="cw-barcode-hint">Clique para ler c\u00f3digo de barras (EAN)</div></div>'
    + '    <div class="cw-fsec">Forma de pagamento</div>'
    + '    <div class="cw-pgto-grid">'
    + '      <div class="cw-pgto-btn" data-forma="cart\u00e3o d\u00e9bito"><div class="cw-pgto-icon">\ud83d\udcb3</div><div class="cw-pgto-label">Cart\u00e3o D\u00e9bito</div></div>'
    + '      <div class="cw-pgto-btn" data-forma="cart\u00e3o cr\u00e9dito"><div class="cw-pgto-icon">\ud83d\udcb3</div><div class="cw-pgto-label">Cart\u00e3o Cr\u00e9dito</div></div>'
    + '      <div class="cw-pgto-btn" data-forma="pix"><div class="cw-pgto-icon">\ud83d\udcf1</div><div class="cw-pgto-label">Pix</div></div>'
    + '      <div class="cw-pgto-btn" data-forma="dinheiro"><div class="cw-pgto-icon">\ud83d\udcb5</div><div class="cw-pgto-label">Dinheiro</div></div>'
    + '    </div>'
    + '    <div class="cw-split-toggle" id="cw-split-toggle">\u2797 Dividir pagamento</div>'
    + '    <div class="cw-split" id="cw-split" style="display:none"></div>'
    + '    <div class="cw-cashback"><div style="font-size:12px;font-weight:500;color:#4caf7d">\u2b50 Pontos de fidelidade</div>'
    + '      <div id="cw-saldo-line" style="font-size:11px;color:var(--muted,#888);margin-top:2px;display:none">Saldo atual: <strong id="cw-saldo" style="color:var(--white,#fff)">0 pontos</strong></div>'
    + '      <div style="font-size:11px;color:var(--muted,#888);margin-top:2px">Ao finalizar, o cliente receber\u00e1 <strong id="cw-cashback-pts" style="color:var(--white,#fff)">0 pontos</strong> (1pt por R$1 em servi\u00e7os)</div>'
    + '      <div id="cw-resgate" style="display:none;margin-top:8px;border-top:0.5px solid var(--border,#2a2a2a);padding-top:8px">'
    + '        <div style="font-size:11px;color:var(--muted,#888)">Usar pontos nos produtos <span style="opacity:.85">(30 pts = R$1 \u00b7 m\u00e1x 150 por produto \u00b7 600 por comanda)</span></div>'
    + '        <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap">'
    + '          <input id="cw-resgate-pts" type="number" min="0" step="30" value="0" style="width:84px;background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:6px;color:var(--white,#fff);font-size:13px;padding:5px 8px;text-align:right;font-family:inherit;outline:none">'
    + '          <span style="font-size:12px;color:var(--muted,#888)">pts = <strong id="cw-resgate-rs" style="color:#4caf7d">R$ 0,00</strong></span>'
    + '          <button type="button" id="cw-resgate-max" style="font-size:11px;padding:4px 10px;border-radius:6px;border:0.5px solid rgba(76,175,125,.4);background:rgba(76,175,125,.1);color:#4caf7d;cursor:pointer;font-family:inherit">usar m\u00e1ximo</button>'
    + '        </div>'
    + '        <div id="cw-resgate-hint" style="font-size:10px;color:var(--muted,#888);margin-top:4px"></div>'
    + '      </div>'
    + '    </div>'
    + '  </div>'
    + '  <div class="cw-df">'
    + '    <button class="cw-btn cw-btn-ghost" id="cw-cancelar" style="flex:1;min-width:100px">Cancelar</button>'
    + '    <button class="cw-btn cw-btn-ghost" id="cw-reabrir" style="flex:1;min-width:120px;color:var(--gold,#074391);border-color:var(--gold-border,rgba(7,67,145,.4))">\ud83d\udd13 Reabrir</button>'
    + '    <button class="cw-btn cw-btn-success" id="cw-finalizar" style="flex:2;min-width:160px">\u2713 Finalizar</button>'
    + '  </div>'
    + '</div></div>';
  var el = {};
  function mount() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var wrap = document.createElement('div'); wrap.innerHTML = html;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
    el.ov = document.getElementById('cw-ov');
    el.sub = document.getElementById('cw-sub');
    el.plano = document.getElementById('cw-plano');
    el.itens = document.getElementById('cw-itens');
    el.subtotal = document.getElementById('cw-subtotal');
    el.rowDescAssin = document.getElementById('cw-row-desc-assin');
    el.descAssin = document.getElementById('cw-desc-assin');
    el.descAssinBox = document.getElementById('cw-desc-assin-box');
    el.splitBarbBox = document.getElementById('cw-split-barb-box');
    el.total = document.getElementById('cw-total');
    el.sel = document.getElementById('cw-sel');
    el.tlabel = document.getElementById('cw-tlabel');
    el.tabServico = document.getElementById('cw-tab-servico');
    el.tabBarbearia = document.getElementById('cw-tab-barbearia');
    el.tabBar = document.getElementById('cw-tab-bar');
    el.itemBarbeiro = document.getElementById('cw-item-barbeiro');
    el.itemBarbeiroWrap = document.getElementById('cw-item-barbeiro-wrap');
    el.fichaWrap = document.getElementById('cw-ficha-wrap');
    el.fichaChk = document.getElementById('cw-ficha-chk');
    el.fichaDisp = document.getElementById('cw-ficha-disp');
    el.cashbackPts = document.getElementById('cw-cashback-pts');
    el.saldo = document.getElementById('cw-saldo');
    el.saldoLine = document.getElementById('cw-saldo-line');
    el.rowDescPts = document.getElementById('cw-row-desc-pts');
    el.descPts = document.getElementById('cw-desc-pts');
    el.resgate = document.getElementById('cw-resgate');
    el.resgatePts = document.getElementById('cw-resgate-pts');
    el.resgateRs = document.getElementById('cw-resgate-rs');
    el.resgateHint = document.getElementById('cw-resgate-hint');
    el.resgateMax = document.getElementById('cw-resgate-max');
    el.fin = document.getElementById('cw-finalizar');
    el.ov.addEventListener('click', function (e) { if (e.target === el.ov) close(); });
    document.getElementById('cw-x').addEventListener('click', close);
    document.getElementById('cw-cancelar').addEventListener('click', close);
    document.getElementById('cw-add').addEventListener('click', addItem);
    document.getElementById('cw-reabrir').addEventListener('click', reabrir);
    el.fin.addEventListener('click', finalizar);
    if (el.resgatePts) el.resgatePts.addEventListener('input', onResgateInput);
    if (el.resgateMax) el.resgateMax.addEventListener('click', usarMaximoResgate);
    el.tabServico.addEventListener('click', function () { setTipo('servico'); });
    el.tabBarbearia.addEventListener('click', function () { setTipo('barbearia'); });
    el.tabBar.addEventListener('click', function () { setTipo('bar'); });
    var togEl = document.getElementById('cw-split-toggle');
    if (togEl) togEl.addEventListener('click', toggleSplit);
    var splitBox = document.getElementById('cw-split');
    if (splitBox) {
      splitBox.addEventListener('click', function (e) {
        if (e.target.closest('#cw-split-add')) { splitAdd(); return; }
        var rm = e.target.closest('[data-srm]'); if (rm) { splitRemove(parseInt(rm.getAttribute('data-srm'), 10)); return; }
      });
      splitBox.addEventListener('input', function (e) {
        var inp = e.target.closest('input[data-sfield="valor"]'); if (!inp) return;
        splitEditarValor(parseInt(inp.getAttribute('data-sidx'), 10), inp.value);
      });
      splitBox.addEventListener('change', function (e) {
        var sel = e.target.closest('select[data-sfield="forma"]'); if (!sel) return;
        var i = parseInt(sel.getAttribute('data-sidx'), 10);
        if (splitRows[i]) splitRows[i].forma = sel.value;
        atualizarSplitStatus();
      });
    }
    Array.prototype.forEach.call(el.ov.querySelectorAll('.cw-pgto-btn'), function (b) {
      b.addEventListener('click', function () { selPgto(b); });
    });
    var cliInput = document.getElementById('cw-cli-input');
    if (cliInput) cliInput.addEventListener('input', function () { buscarClienteCW(this.value); });
    var cliRes = document.getElementById('cw-cli-res');
    if (cliRes) cliRes.addEventListener('click', function (e) {
      var o = e.target.closest('[data-cid]'); if (!o) return;
      selecionarClienteCW(o.getAttribute('data-cid'), o.getAttribute('data-cnome'));
    });
    var cliX = document.getElementById('cw-cli-x');
    if (cliX) cliX.addEventListener('click', limparClienteCW);
    // delegação na lista de itens (remover / editar nome / editar valor)
    el.itens.addEventListener('click', function (e) {
      var q = e.target.closest('.cw-qty-btn');
      if (q) { changeQty(parseInt(q.getAttribute('data-idx'), 10), q.getAttribute('data-qact') === 'inc' ? 1 : -1); return; }
      var sp = e.target.closest('.cw-split-barb');   // ITEM 6: dividir serviço entre 2 barbeiros
      if (sp) { abrirSplitBarbeiro(parseInt(sp.getAttribute('data-idx'), 10)); return; }
      var d = e.target.closest('.cw-ib.del'); if (!d) return;
      removeItem(parseInt(d.getAttribute('data-idx'), 10));
    });
    el.itens.addEventListener('change', function (e) {
      var inp = e.target.closest('input[data-idx]'); if (!inp) return;
      var i = parseInt(inp.getAttribute('data-idx'), 10);
      if (inp.getAttribute('data-field') === 'nome') editarNome(i, inp.value);
      else editarValor(i, inp.value);
    });
  }
  function itemFromServer(it) {
    return { id: it.id, nome: it.descricao || 'Item',
      tipo: it.tipo === 'produto' ? 'Produto' : (it.tipo === 'plano' ? 'Plano' : 'Servi\u00e7o'),
      valor: Number(it.valor_unit) || 0, quantidade: it.quantidade || 1,
      servico_id: it.servico_id || null, produto_id: it.produto_id || null,
      colaborador_id: it.colaborador_id || null,
      plano: it.tipo === 'plano',
      ficha: !!it.ficha_bar };
  }
  function abrir(p) {
    p = p || {};
    agId = p.agendamento_id || null; clienteId = p.cliente_id || null; canal = p.canal || '';
    comandaId = null; itens = []; tipo = 'servico'; planoSit = null;
    _enviando = false;
    pontosUsados = 0; saldoPts = 0;
    resetSplit();
    if (el.fin) { el.fin.disabled = false; }
    var avulsa = canal === 'avulsa';
    var cliBox = document.getElementById('cw-cliente');
    if (cliBox) cliBox.style.display = avulsa ? '' : 'none';
    if (avulsa) {
      var selc = document.getElementById('cw-cli-sel'); if (selc) selc.style.display = 'none';
      var inpc = document.getElementById('cw-cli-input'); if (inpc) inpc.value = '';
      var resc = document.getElementById('cw-cli-res'); if (resc) { resc.style.display = 'none'; resc.innerHTML = ''; }
      el.sub.textContent = p.cliente_nome || 'Venda avulsa';
    } else {
      el.sub.textContent = (p.cliente_nome || 'Cliente') + (p.servico_nome ? ' \u00b7 ' + p.servico_nome : '');
    }
    if (el.itemBarbeiro) el.itemBarbeiro.value = '';
    loadBarbeiros();
    el.plano.innerHTML = '';
    Array.prototype.forEach.call(el.ov.querySelectorAll('.cw-pgto-btn'), function (b) { b.classList.remove('sel'); });
    setTipoButtons();
    el.ov.classList.add('open');
    mostrarPlano(clienteId);
    // NÃO carrega o saldo aqui: ele é carregado DEPOIS de restaurar o resgate,
    // dentro do bloco async abaixo (senão o render zera os pontos restaurados).
    (async function () {
      var pontosRestaurados = false;   // evita buscar a comanda duas vezes
      if (avulsa) {
        itens = []; comandaId = null;
      } else if (canal === 'comanda' && p.comanda_id) {
        comandaId = p.comanda_id;
        try {
          var cm = await req('GET', '/comandas/' + p.comanda_id);
          itens = (cm && cm.itens_comanda ? cm.itens_comanda : []).map(itemFromServer);
          // Restaura o resgate de pontos já aplicado nesta comanda (item 2: não perde ao reabrir).
          if (cm && cm.pontos_resgatados != null) pontosUsados = parseInt(cm.pontos_resgatados) || 0;
          pontosRestaurados = true;
          if (cm && cm.clientes && cm.clientes.id) { clienteId = cm.clientes.id; mostrarPlano(clienteId); }
        } catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui abrir a comanda'); itens = []; }
      } else if (canal === 'appbarber' && agId) {
        var okApp = false;
        try {
          var r = await req('POST', '/appbarber/abrir/' + agId, {});
          if (r && r.comanda) { comandaId = r.comanda.id; itens = (r.itens || []).map(itemFromServer); okApp = true; }
        } catch (e) {}
        if (!okApp) {
          // Agendamento marcado como AppBarber, mas SEM item-espelho do AppBarber
          // (ex.: agendamento futuro importado). Abre como agendamento normal do
          // sistema: cria a comanda e libera plano/renovar/pontos como nos demais.
          try {
            var ab2 = await req('POST', '/agendamentos/' + agId + '/abrir-comanda', {});
            if (ab2 && ab2.comanda_id) { comandaId = ab2.comanda_id; itens = (ab2.itens || []).map(itemFromServer); canal = 'sistema'; }
          } catch (e2) {}
          if (!comandaId) { itens = [{ nome: p.servico_nome || 'Servi\u00e7o', tipo: 'Servi\u00e7o', valor: parseFloat(p.valor) || 0 }]; }
        }
      } else if (agId) {
        // Agendamento do sistema: cria/reaproveita uma comanda ABERTA já na abertura,
        // assim produtos, fichas e o zerar do plano ficam salvos na hora (não só ao finalizar).
        try {
          var ab = await req('POST', '/agendamentos/' + agId + '/abrir-comanda', {});
          comandaId = (ab && ab.comanda_id) ? ab.comanda_id : null;
          itens = (ab && ab.itens ? ab.itens : []).map(itemFromServer);
        } catch (e) {
          // fallback: modo local antigo, caso não consiga criar a comanda
          comandaId = null;
          itens = [{ nome: p.servico_nome || 'Servi\u00e7o', tipo: 'Servi\u00e7o', valor: parseFloat(p.valor) || 0 }];
        }
      } else {
        itens = [{ nome: p.servico_nome || 'Servi\u00e7o', tipo: 'Servi\u00e7o', valor: parseFloat(p.valor) || 0 }];
      }
      window._comandaId = comandaId; // mantém compat com edição travada

      // ---- ITEM 2: restaura o resgate de pontos já aplicado nesta comanda ----
      // Antes isso só acontecia no canal 'comanda'. Abrindo pela AGENDA (agendamento
      // do sistema ou AppBarber), o resgate salvo nunca era restaurado.
      // Agora vale para QUALQUER caminho que tenha uma comanda no servidor.
      if (comandaId && !pontosRestaurados) {
        try {
          var cmR = await req('GET', '/comandas/' + comandaId);
          if (cmR && cmR.pontos_resgatados != null) pontosUsados = parseInt(cmR.pontos_resgatados) || 0;
          if (!clienteId && cmR && cmR.clientes && cmR.clientes.id) clienteId = cmR.clientes.id;
        } catch (e) { /* sem resgate salvo: segue com 0 */ }
      }

      await loadCatalog();

      // ⚠️ ORDEM CRÍTICA: o saldo TEM que ser carregado ANTES do render().
      // O render() faz  if (pontosUsados > maxUsavel()) pontosUsados = maxUsavel()
      // e o maxUsavel() depende do saldo. Se o render rodasse antes do saldo chegar,
      // o saldo seria 0, o teto seria 0 e os pontos restaurados eram ZERADOS na hora
      // (o desconto "sumia" ao reabrir — era ESTE o bug).
      await carregarSaldo(clienteId);

      render();
      await mostrarPlano(clienteId); // carrega o plano e zera serviços cobertos
    })();
  }
  function close() {
    flushResgate();            // manda o resgate pendente ANTES de perder cliente/comanda
    el.ov.classList.remove('open');
    comandaId = null; agId = null; itens = []; clienteId = null; planoSit = null; _planoNovo = null; window._comandaId = null;
    pontosUsados = 0; saldoPts = 0;
    descAssinanteOn = false;   // ITEM 4: não vaza o desconto pro próximo atendimento
    splitBarbIdx = null;       // ITEM 6: fecha o painel de divisão
  }
  async function mostrarPlano(cid) {
    if (!cid) { planoSit = null; renderAddPlanoOption(); return; }
    if (_planoNovo) return; // plano novo já escolhido neste atendimento: mantém o card
    try {
      var s = await req('GET', '/clientes/' + cid + '/situacao-plano');
      if (!s || !s.assinante) { planoSit = null; renderAddPlanoOption(); return; }
      planoSit = s;
      var emDia = s.situacao === 'em_dia';
      var nome = (s.plano && s.plano.nome) ? s.plano.nome : 'Plano';
      var restantes = s.cotas_restantes != null
        ? s.cotas_restantes
        : Math.max(0, (s.visitas_semana || 1) - (s.visitas_usadas || 0));
      var diasTxt = '';
      if (s.data_renovacao) {
        var hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        var dr = new Date(String(s.data_renovacao).slice(0, 10) + 'T00:00:00');
        var dias = Math.ceil((dr - hoje) / 86400000);
        diasTxt = dias > 1 ? ('Faltam <b>' + dias + ' dias</b> para renovar')
                : dias === 1 ? 'Falta <b>1 dia</b> para renovar'
                : dias === 0 ? '<b>Renova hoje</b>'
                : ('Renova\u00e7\u00e3o vencida h\u00e1 <b>' + (-dias) + ' dia(s)</b>');
      }
      var linhas = [];
      linhas.push('<div class="cw-plano-head">\ud83d\udc51 Assinante \u2014 ' + esc(nome) + (emDia ? '' : ' \u00b7 \u26a0\ufe0f atrasado') + '</div>');
      if (diasTxt) linhas.push('<div>\ud83d\udcc5 ' + diasTxt + '</div>');
      linhas.push('<div>\ud83c\udf7a <b>' + (s.fichas_disponiveis != null ? s.fichas_disponiveis : (s.fichas_bar_mes || 0)) + '</b> de ' + (s.fichas_bar_mes || 0) + ' fichas de bar dispon\u00edveis</div>');
      if (s.barbeiro_titular) linhas.push('<div>\ud83d\udc88 Barbeiro respons\u00e1vel: <b>' + esc(s.barbeiro_titular) + '</b></div>');
      var _total = s.cotas_total != null ? s.cotas_total : (s.visitas_semana || 1);
      linhas.push('<div>\u2702\ufe0f <b>' + restantes + '</b> de ' + _total + ' atendimento(s) no plano'
        + (restantes === 0 ? ' \u2014 pr\u00f3ximos cobram normal' : '') + '</div>');
      // ITEM 8: renovar tambem quando o plano esta EM DIA (pagamento antecipado).
      // O backend soma +1 mes a partir do vencimento atual, entao o cliente nao perde dias.
      var podeRenovar = comandaId && (s.plano && s.plano.id);
      var rotuloRenovar = emDia
        ? '\ud83d\udd04 Renovar antecipado \u2014 '
        : '\ud83d\udd04 Renovar plano agora \u2014 ';
      var btnRenovar = podeRenovar
        ? '<button id="cw-renovar-btn" style="margin-top:10px;width:100%;padding:9px;border-radius:8px;border:0;background:var(--gold,#074391);color:#1a1a1a;font-weight:700;cursor:pointer;font-family:inherit">' + rotuloRenovar + brl(parseFloat(s.plano.valor_mensal) || 0) + '</button>'
        + (emDia ? '<div style="margin-top:5px;font-size:11px;color:var(--muted,#8a8a96);text-align:center">Soma +1 m\u00eas ao vencimento atual \u2014 nenhum dia \u00e9 perdido</div>' : '')
        : '';
      el.plano.innerHTML = '<div class="cw-plano-card ' + (emDia ? 'cw-plano-ok' : 'cw-plano-warn') + '">' + linhas.join('') + btnRenovar + '</div>';
      var rb = document.getElementById('cw-renovar-btn');
      if (rb) rb.addEventListener('click', function () { renovarPlanoNaComanda(); });
      await aplicarPlanoNosItens();
      setTipoButtons();
    } catch (e) {}
  }
  // Renova o plano direto na comanda do atendimento (vencido OU em dia/antecipado):
  // lança a mensalidade, zera o serviço coberto e marca para RENOVAR a assinatura
  // ao finalizar. Em dia, o backend soma +1 mês ao vencimento atual (não perde dias).
  async function renovarPlanoNaComanda() {
    if (!planoSit || !comandaId || _planoNovo) return;
    var eraEmDia = planoSit.situacao === 'em_dia';   // ITEM 8: guarda ANTES de mexer
    var planoId = planoSit.plano && planoSit.plano.id;
    var valor = parseFloat(planoSit.plano && planoSit.plano.valor_mensal) || 0;
    var nome = (planoSit.plano && planoSit.plano.nome) || 'Plano';
    var barber = (itens.filter(function (it) { return it.colaborador_id; })[0] || {}).colaborador_id || null;
    try {
      // colaborador_id VAZIO: a MENSALIDADE não gera comissão para ninguém.
      // Quem gera é o atendimento do assinante, pela cota. Com barbeiro aqui, o
      // plano de R$200 viraria R$100 de comissão para quem só passou o cartão.
      var novo = await req('POST', '/comandas/' + comandaId + '/itens', { tipo: 'plano', descricao: 'Renova\u00e7\u00e3o \u2014 ' + nome, valor_unit: valor, colaborador_id: null });
      var itM = itemFromServer(novo);
      if (barber) itM.colaborador_id = barber;
      itens.push(itM);
    } catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui adicionar a renova\u00e7\u00e3o'); return; }
    // ITEM 8: o efeito depende de como o plano ESTAVA antes da renovação.
    if (!eraEmDia) {
      // Estava ATRASADO: a renovação passa a valer agora -> cobre o serviço
      // e libera as fichas do novo ciclo.
      planoSit.pode_zerar = true;
      planoSit.situacao = 'em_dia';
      planoSit.fichas_disponiveis = planoSit.fichas_bar_mes || 0;
    } else {
      // Já estava EM DIA (renovação antecipada): NÃO ganha visita extra na semana
      // (mantém o pode_zerar atual) e as fichas do novo ciclo SOMAM às que ainda tem,
      // porque no backend os lotes acumulam (validade 90 dias).
      planoSit.fichas_disponiveis = (planoSit.fichas_disponiveis || 0) + (planoSit.fichas_bar_mes || 0);
    }
    _planoNovo = { plano_id: planoId, vendedor_id: barber, assinatura_id: planoSit.assinatura_id, renovar: true, nome: nome, valor: valor };
    await aplicarPlanoNosItens();
    if (el.plano) {
      // ITEM 8: a linha do serviço só vale se o plano de fato cobre este atendimento.
      var linhaServico = planoSit.pode_zerar
        ? '<div>\u2702\ufe0f Servi\u00e7o coberto fica zerado</div>'
        : '<div>\u2702\ufe0f Visitas da semana j\u00e1 usadas \u2014 o servi\u00e7o deste atendimento continua sendo cobrado</div>';
      var linhaPrazo = eraEmDia
        ? '<div>\ud83d\udcc5 Antecipada: soma <b>+1 m\u00eas</b> ao vencimento atual</div>'
        : '';
      el.plano.innerHTML = '<div class="cw-plano-card cw-plano-ok">'
        + '<div class="cw-plano-head">\ud83d\udd04 Renova\u00e7\u00e3o \u2014 ' + esc(nome) + '</div>'
        + '<div>\ud83d\udcb3 Mensalidade <b>' + brl(valor) + '</b> lan\u00e7ada na comanda</div>'
        + linhaPrazo
        + linhaServico
        + '<div style="font-size:11px;color:var(--muted,#888);margin-top:4px">A renova\u00e7\u00e3o \u00e9 confirmada ao finalizar a comanda.</div>'
        + '</div>';
    }
    render(); setTipoButtons();
  }
  // Opção "Adicionar plano" para cliente NÃO assinante, durante o atendimento de um agendamento.
  function renderAddPlanoOption() {
    if (!el.plano) return;
    if (_planoNovo) return; // já escolheu um plano: o card do plano novo está visível
    if (!(agId && comandaId && clienteId)) { el.plano.innerHTML = ''; return; }
    var opts = (cache.planos || []).map(function (p) {
      return '<option value="' + p.id + '">' + esc(p.nome) + ' \u2014 ' + brl(parseFloat(p.valor_mensal) || 0) + '</option>';
    }).join('');
    el.plano.innerHTML =
      '<div class="cw-plano-card cw-plano-ok">'
      + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600;color:var(--white,#fff)"><input type="checkbox" id="cw-addplano-chk" style="accent-color:var(--gold,#074391)"> \u2795 Adicionar plano de assinatura</label>'
      + '<div id="cw-addplano-box" style="display:none;margin-top:8px">'
      + '<select id="cw-addplano-sel" style="width:100%;padding:8px;border-radius:8px;background:var(--bg3,#1c1c1c);color:var(--white,#fff);border:0.5px solid var(--border,#333)"><option value="">Escolha o plano\u2026</option>' + opts + '</select>'
      + '<div style="font-size:11px;color:var(--muted,#888);margin-top:4px">O servi\u00e7o coberto fica zerado e a mensalidade entra na comanda. O plano \u00e9 ativado ao finalizar.</div>'
      + '</div></div>';
    var chk = document.getElementById('cw-addplano-chk');
    var box = document.getElementById('cw-addplano-box');
    var sel = document.getElementById('cw-addplano-sel');
    if (chk) chk.addEventListener('change', function () { if (box) box.style.display = chk.checked ? 'block' : 'none'; });
    if (sel) sel.addEventListener('change', function () { if (sel.value) adicionarPlanoNovo(sel.value); });
  }
  // Escolheu um plano no atendimento: lança a mensalidade na comanda, zera o serviço
  // coberto e marca para ATIVAR a assinatura ao finalizar.
  async function adicionarPlanoNovo(planoId) {
    var pl = (cache.planos || []).find(function (p) { return p.id === planoId; });
    if (!pl) return;
    if (!comandaId || !clienteId) { hooks.toast('Abra a comanda do agendamento primeiro.'); return; }
    var barber = (itens.filter(function (it) { return it.colaborador_id; })[0] || {}).colaborador_id || null;
    var valor = parseFloat(pl.valor_mensal) || 0;
    // 1) mensalidade na comanda: entra no faturamento da barbearia, SEM comissão.
    //    Ninguém ganha por vender plano — quem gera comissão é o atendimento do
    //    assinante, pela cota. Por isso vai sem colaborador_id.
    try {
      var novo = await req('POST', '/comandas/' + comandaId + '/itens', { tipo: 'plano', descricao: 'Mensalidade \u2014 ' + pl.nome, valor_unit: valor, colaborador_id: null });
      var itM = itemFromServer(novo);
      itens.push(itM);
    } catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui adicionar a mensalidade'); return; }
    // 2) sintetiza a situação do plano p/ reaproveitar o zerar de serviço coberto
    var cobertos = (pl.plano_servicos || []).map(function (ps) { return ps.servico_id; });
    var nomes = (pl.plano_servicos || []).map(function (ps) { return ps.servicos ? ps.servicos.nome : ''; }).filter(Boolean);
    // Cotas do plano recém-vendido: a soma dos limites de cada serviço coberto.
    // O atendimento de agora já consome a primeira — é a regra do Lucas: ao
    // adicionar o plano, o serviço daquela comanda já entra pela cota.
    var _cotas = (pl.plano_servicos || []).reduce(function (soma, ps) {
      return soma + (parseInt(ps.limite_mes, 10) || 0);
    }, 0) || (pl.visitas_semana || 1);
    // Valor da cota: mensalidade ÷ atendimentos. É a base da comissão de cada
    // atendimento coberto — sem isso o barbeiro atenderia o assinante de graça.
    var _cota = _cotas ? Math.round((valor / _cotas) * 100) / 100 : 0;
    planoSit = {
      assinante: true, pode_zerar: true, situacao: 'em_dia',
      cotas_total: _cotas, cotas_usadas: 0, cotas_restantes: _cotas,
      valor_atendimento: _cota,
      visitas_semana: _cotas, visitas_usadas: 0,
      servicos_cobertos: cobertos, servicos_nomes: nomes,
      plano: { id: pl.id, nome: pl.nome, valor_mensal: pl.valor_mensal },
      fichas_bar_mes: pl.fichas_bar_mes || 0, fichas_disponiveis: pl.fichas_bar_mes || 0,
      barbeiro_titular: null, data_renovacao: null
    };
    _planoNovo = { plano_id: pl.id, vendedor_id: barber, nome: pl.nome, valor: valor };
    await aplicarPlanoNosItens(); // zera o serviço coberto (persiste)
    renderPlanoCardNovo(pl);
    render();
    setTipoButtons();
  }
  function renderPlanoCardNovo(pl) {
    if (!el.plano) return;
    el.plano.innerHTML = '<div class="cw-plano-card cw-plano-ok">'
      + '<div class="cw-plano-head">\ud83d\udc51 Novo plano \u2014 ' + esc(pl.nome) + '</div>'
      + '<div>\ud83d\udcb3 Mensalidade <b>' + brl(parseFloat(pl.valor_mensal) || 0) + '</b> lan\u00e7ada na comanda</div>'
      + '<div>\u2702\ufe0f Servi\u00e7o coberto fica zerado</div>'
      + '<div style="font-size:11px;color:var(--muted,#888);margin-top:4px">O plano ser\u00e1 ativado ao finalizar a comanda.</div>'
      + '</div>';
  }
  // Um serviço está coberto se o id está nos cobertos OU o nome bate com a lista do plano.
  function itemCobertoPlano(it) {
    if (!planoSit) return false;
    if (it.servico_id && (planoSit.servicos_cobertos || []).indexOf(it.servico_id) !== -1) return true;
    var nomes = (planoSit.servicos_nomes || []).map(function (n) { return (n || '').toLowerCase(); });
    return !!(it.nome && nomes.indexOf((it.nome || '').toLowerCase()) !== -1);
  }
  // Zera serviços cobertos pelo plano (marca como 'Plano' -> conta visita, comissão 0),
  // respeitando o limite de visitas da semana.
  async function aplicarPlanoNosItens() {
    if (!planoSit || !planoSit.assinante || !planoSit.pode_zerar) return;
    // Cotas do CICLO da assinatura (30 dias), não da semana. O backend já
    // devolve cotas_restantes pronto, descontando o que foi usado e somando as
    // cotas extras que o Lucas concede caso a caso.
    var restantes = planoSit.cotas_restantes != null
      ? planoSit.cotas_restantes
      : Math.max(0, (planoSit.visitas_semana || 1) - (planoSit.visitas_usadas || 0));
    var jaPlano = itens.filter(function (it) { return it.plano && (parseFloat(it.valor) || 0) === 0; }).length;
    var mudou = false;
    for (var i = 0; i < itens.length; i++) {
      var it = itens[i];
      if (jaPlano >= restantes) break;
      if (it.plano) continue;
      if (it.tipo === 'Servi\u00e7o' && itemCobertoPlano(it)) {
        it.plano = true; it.valor = 0; it.tipo = 'Plano';
        jaPlano++; mudou = true;
        if (comandaId && it.id) {
          // O cliente paga 0, mas o barbeiro ganha sobre a COTA — valor do
          // plano dividido pelos atendimentos contratados. Sem mandar
          // valor_comissao, o motor calcularia sobre 0 e o barbeiro atenderia
          // o assinante de graça.
          var cota = planoSit && planoSit.valor_atendimento != null
            ? planoSit.valor_atendimento : null;
          try {
            await req('PATCH', '/comandas/' + comandaId + '/itens/' + it.id,
              { valor_unit: 0, tipo: 'plano', valor_comissao: cota });
          } catch (e) {}
        }
      }
    }
    if (mudou) render();
  }
  // -------- Busca de cliente (modo avulsa) --------
  var _cliTimer = null;
  function buscarClienteCW(q) {
    var res = document.getElementById('cw-cli-res');
    if (_cliTimer) clearTimeout(_cliTimer);
    if (!q || q.trim().length < 2) { if (res) { res.style.display = 'none'; res.innerHTML = ''; } return; }
    _cliTimer = setTimeout(async function () {
      try {
        var data = await req('GET', '/clientes?q=' + encodeURIComponent(q.trim()) + '&limit=6') || [];
        if (!res) return;
        if (!data.length) { res.innerHTML = '<div class="cw-cli-opt" style="cursor:default;color:var(--muted,#888)">Nenhum cliente encontrado</div>'; res.style.display = ''; return; }
        res.innerHTML = data.map(function (c) {
          return '<div class="cw-cli-opt" data-cid="' + c.id + '" data-cnome="' + esc(c.nome) + '">' + esc(c.nome) + (c.whatsapp ? ' <small>' + esc(c.whatsapp) + '</small>' : '') + '</div>';
        }).join('');
        res.style.display = '';
      } catch (e) {}
    }, 250);
  }
  function selecionarClienteCW(id, nome) {
    clienteId = id;
    var inp = document.getElementById('cw-cli-input'); if (inp) inp.value = '';
    var res = document.getElementById('cw-cli-res'); if (res) { res.style.display = 'none'; res.innerHTML = ''; }
    var sel = document.getElementById('cw-cli-sel'); if (sel) sel.style.display = '';
    var nm = document.getElementById('cw-cli-sel-nome'); if (nm) nm.textContent = nome;
    el.sub.textContent = nome;
    el.plano.innerHTML = '';
    mostrarPlano(id);
    carregarSaldo(id);
  }
  function limparClienteCW() {
    clienteId = null;
    var sel = document.getElementById('cw-cli-sel'); if (sel) sel.style.display = 'none';
    var inp = document.getElementById('cw-cli-input'); if (inp) inp.value = '';
    el.plano.innerHTML = '';
    el.sub.textContent = 'Venda avulsa';
    carregarSaldo(null);
  }
  // Saldo de pontos do cliente (mostra no bloco de fidelidade)
  async function carregarSaldo(cid) {
    if (!cid) { saldoPts = 0; if (el.saldoLine) el.saldoLine.style.display = 'none'; atualizarResgate(); return; }
    try {
      var r = await req('GET', '/cashback/saldo/' + cid);
      var s = (r && r.saldo) ? r.saldo : 0;
      // O saldo do banco já está debitado do que foi resgatado nesta comanda (item 2:
      // pontos saem na hora). Somamos pontosUsados de volta para "disponível nesta comanda",
      // assim maxUsavel() deixa o operador ajustar o resgate pra cima/baixo. A carteira exibida
      // mostra o saldo real (s), mas o teto de uso considera o que já está reservado aqui.
      saldoPts = s + (pontosUsados || 0);
      if (el.saldo) el.saldo.textContent = s + ' ponto' + (s !== 1 ? 's' : '');
      if (el.saldoLine) el.saldoLine.style.display = '';
    } catch (e) { saldoPts = 0; if (el.saldoLine) el.saldoLine.style.display = 'none'; }
    atualizarResgate();
  }
  // ---- Resgate de pontos (desconto em produtos) ----
  // Máximo: por item de PRODUTO, min(150 pts, valor_do_item em pts), somado.
  // Teto por comanda: 600 pts.
  var RESGATE_MAX_POR_PRODUTO = 150;
  var RESGATE_MAX_POR_COMANDA = 600;
  function maxPontosResgate() {
    var max = 0;
    itens.forEach(function (it) {
      if (it.tipo === 'Produto') {
        var v = (parseFloat(it.valor) || 0) * (parseInt(it.quantidade) || 1);
        max += Math.min(RESGATE_MAX_POR_PRODUTO, Math.floor(v) * 30);
      }
    });
    return Math.min(max, RESGATE_MAX_POR_COMANDA);
  }
  // Limite real = menor entre saldo do cliente e o máximo da comanda, em múltiplos de 30.
  function maxUsavel() {
    var m = Math.min(saldoPts || 0, maxPontosResgate());
    return Math.floor(m / 30) * 30;
  }
  function temProduto() { return itens.some(function (it) { return it.tipo === 'Produto'; }); }
  function atualizarResgate() {
    if (!el.resgate) return;
    var mx = maxUsavel();
    var mostrar = !!clienteId && (saldoPts || 0) > 0 && temProduto() && mx > 0;
    el.resgate.style.display = mostrar ? '' : 'none';
    if (!mostrar) { pontosUsados = 0; }
    if (pontosUsados > mx) pontosUsados = mx;
    if (el.resgatePts) { el.resgatePts.max = mx; if (document.activeElement !== el.resgatePts) el.resgatePts.value = pontosUsados; }
    if (el.resgateRs) el.resgateRs.textContent = brl(pontosUsados / 30);
    if (el.resgateHint) el.resgateHint.textContent = mostrar ? ('Disponível: até ' + mx + ' pts (= ' + brl(mx / 30) + ') nesta comanda') : '';
  }
  function onResgateInput() {
    var v = parseInt(el.resgatePts && el.resgatePts.value) || 0;
    if (v < 0) v = 0;
    v = Math.floor(v / 30) * 30;          // múltiplos de 30
    var mx = maxUsavel();
    if (v > mx) v = mx;
    pontosUsados = v;
    render();
    definirResgateBackend();
  }
  function usarMaximoResgate() {
    pontosUsados = maxUsavel();
    render();
    definirResgateBackend();
  }
  // Persiste o resgate na comanda AGORA (debita/devolve pontos pela diferença).
  // Só faz sentido quando a comanda já existe no banco (tem comandaId) e há cliente.
  // O backend revalida limite/saldo e pode reduzir o valor; refletimos o retorno na tela.
  var _resgateTimer = null;
  function definirResgateBackend() {
    if (!comandaId || !clienteId) return;   // avulsa/sem comanda: resgate vai só no finalizar
    if (_resgateTimer) clearTimeout(_resgateTimer);
    // BUG CORRIGIDO: capturamos cliente e comanda AGORA, não daqui a 300ms.
    // Antes, se o caixa fechasse a comanda dentro do debounce (X, Cancelar, clique fora),
    // o close() zerava comandaId/clienteId e o timer disparava com os campos NULOS ->
    // o servidor respondia 200 e gravava ZERO. O resgate sumia sem avisar ninguém.
    var pedido = pontosUsados || 0;
    var cid    = clienteId;
    var comid  = comandaId;
    _resgateTimer = setTimeout(function () {
      _resgateTimer = null;
      enviarResgate(cid, comid, pedido);
    }, 300);
  }
  // Envio de fato. Separado do debounce para poder ser disparado na hora (flush)
  // quando a comanda é fechada antes do timer vencer.
  async function enviarResgate(cid, comid, pedido, silencioso) {
    if (!cid || !comid) return;
    try {
      var r = await req('POST', '/cashback/definir-resgate', { cliente_id: cid, comanda_id: comid, pontos: pedido });
      if (!r) return;
      // Se a comanda já foi fechada/trocada, não mexe mais na tela — só grava no servidor.
      if (silencioso || comid !== comandaId) return;
      var novoResg = (r.pontos_resgatados != null) ? (parseInt(r.pontos_resgatados) || 0) : pontosUsados;
      var restante = (r.saldo_restante != null) ? (parseInt(r.saldo_restante) || 0) : saldoPts;
      // O servidor recusou o resgate (ex.: produto sem valor suficiente na comanda).
      // Antes isso acontecia em SILÊNCIO: o desconto sumia da tela sem explicação.
      if (pedido > 0 && novoResg === 0) {
        hooks.toast('\u26a0\ufe0f Os produtos desta comanda n\u00e3o permitem resgate (limite: 30 pts por R$1 em produto).');
      } else if (novoResg < pedido) {
        hooks.toast('\u2139\ufe0f Resgate ajustado para ' + novoResg + ' pts (limite dos produtos desta comanda).');
      }
      pontosUsados = novoResg;
      // saldoPts = total disponível para ESTA comanda = saldo livre + o que já está resgatado aqui.
      saldoPts = restante + novoResg;
      render();
    } catch (e) {
      if (!silencioso) hooks.toast('\u26a0\ufe0f N\u00e3o consegui salvar o resgate de pontos: ' + ((e && e.message) || 'tente de novo'));
    }
  }
  // Se houver um resgate pendente no debounce, MANDA AGORA (antes de perder o contexto).
  // Só dispara se o timer estiver realmente pendente — ou seja, se o caixa mexeu no
  // resgate e fechou a tela antes dos 300ms. Nunca envia por conta própria.
  function flushResgate() {
    if (!_resgateTimer) return;
    clearTimeout(_resgateTimer);
    _resgateTimer = null;
    if (comandaId && clienteId) enviarResgate(clienteId, comandaId, pontosUsados || 0, true);
  }
  async function loadCatalog() {
    try { if (!cache.servicos.length) cache.servicos = await req('GET', '/servicos') || []; } catch (e) {}
    try { if (!cache.produtos.length) cache.produtos = await req('GET', '/produtos') || []; } catch (e) {}
    try { if (!cache.planos.length) cache.planos = await req('GET', '/planos') || []; } catch (e) {}
    popular();
  }
  async function loadBarbeiros() {
    var sel = el.itemBarbeiro || document.getElementById('cw-item-barbeiro');
    if (!sel) return;
    if (!barbeiros.length) { try { barbeiros = await req('GET', '/colaboradores') || []; } catch (e) { barbeiros = []; } }
    var atual = sel.value;
    var lista = barbeiros.filter(function (b) { return b.perfil !== 'caixa'; });
    sel.innerHTML = '<option value="">Barbeiro...</option>' + lista.map(function (b) {
      return '<option value="' + b.id + '">' + esc(nomeBarbW(b)) + '</option>';
    }).join('');
    if (atual) sel.value = atual;
  }
  // Nome de exibição do barbeiro (respeita o toggle mostrar_sobrenome).
  function nomeBarbW(c){ if(!c) return ''; if(c.nome_exibicao) return c.nome_exibicao; return c.mostrar_sobrenome ? String(c.nome||'') : String(c.nome||'').split(' ')[0]; }
  function temComissionado() { return itens.some(function (it) { return it.comissionado; }); }
  // O barbeiro é exigido para: produto de barbearia (sempre) e serviço na avulsa (sem agendamento).
  function barberNeeded() {
    if (tipo === 'barbearia') return true;
    if (tipo === 'servico' && canal === 'avulsa') return true;
    return false;
  }
  // Fichas de bar ainda disponíveis (do ciclo) menos as já usadas nesta comanda.
  function fichasRestantes() {
    if (!planoSit || !planoSit.assinante) return 0;
    var disp = planoSit.fichas_disponiveis || 0;
    var usadasAqui = itens.filter(function (it) { return it.ficha; }).length;
    return Math.max(0, disp - usadasAqui);
  }
  function popular() {
    if (!el.sel) return;
    var lista;
    if (tipo === 'servico') lista = cache.servicos || [];
    else if (tipo === 'barbearia') lista = (cache.produtos || []).filter(function (p) { return p.categorias_produto && p.categorias_produto.paga_comissao; });
    else lista = (cache.produtos || []).filter(function (p) { return !(p.categorias_produto && p.categorias_produto.paga_comissao); });
    var rotulo = tipo === 'servico' ? 'servi\u00e7o' : (tipo === 'barbearia' ? 'produto' : 'item do bar');
    el.sel.innerHTML = '<option value="">Selecionar ' + rotulo + '...</option>'
      + lista.map(function (i) {
        var v = parseFloat(i.valor_venda || i.valor || 0);
        return '<option value="' + i.id + '" data-nome="' + esc(i.nome) + '" data-val="' + v + '">' + esc(i.nome) + ' \u2014 ' + brl(v) + '</option>';
      }).join('');
  }
  function setTipoButtons() {
    if (el.tabServico) el.tabServico.classList.toggle('sel', tipo === 'servico');
    if (el.tabBarbearia) el.tabBarbearia.classList.toggle('sel', tipo === 'barbearia');
    if (el.tabBar) el.tabBar.classList.toggle('sel', tipo === 'bar');
    if (el.tlabel) el.tlabel.textContent = tipo === 'servico' ? 'servi\u00e7o' : (tipo === 'barbearia' ? 'produto' : 'item do bar');
    if (el.itemBarbeiroWrap) el.itemBarbeiroWrap.style.display = barberNeeded() ? '' : 'none';
    var fr = fichasRestantes();
    if (el.fichaWrap) el.fichaWrap.style.display = (tipo === 'bar' && fr > 0) ? 'flex' : 'none';
    if (el.fichaDisp) el.fichaDisp.textContent = fr > 0 ? ('\u00b7 ' + fr + ' dispon\u00edvel(is)') : '';
    if (el.fichaChk && tipo !== 'bar') el.fichaChk.checked = false;
  }
  function setTipo(t) { tipo = t; setTipoButtons(); popular(); }
  function selPgto(b) {
    Array.prototype.forEach.call(el.ov.querySelectorAll('.cw-pgto-btn'), function (x) { x.classList.remove('sel'); });
    b.classList.add('sel');
  }
  async function addItem() {
    if (!el.sel || !el.sel.value) { hooks.toast('Selecione um item'); return; }
    var opt = el.sel.options[el.sel.selectedIndex];
    var backendTipo = (tipo === 'servico') ? 'servico' : 'produto';
    var precisaBarb = barberNeeded();
    var bsel = el.itemBarbeiro || document.getElementById('cw-item-barbeiro');
    var barbId = (precisaBarb && bsel) ? bsel.value : '';
    var barbNome = (barbId && bsel) ? bsel.options[bsel.selectedIndex].text : '';
    if (precisaBarb && !barbId) { hooks.toast('Selecione o barbeiro deste item'); return; }
    var usarFicha = (tipo === 'bar') && el.fichaChk && el.fichaChk.checked && fichasRestantes() > 0;
    if (comandaId) {
      var body = { tipo: backendTipo, quantidade: 1 };
      if (backendTipo === 'servico') body.servico_id = el.sel.value; else body.produto_id = el.sel.value;
      if (barbId) body.colaborador_id = barbId;
      if (usarFicha) body.ficha = true;
      try {
        var novo = await req('POST', '/comandas/' + comandaId + '/itens', body);
        var itNovo = itemFromServer(novo);
        if (tipo === 'barbearia') itNovo.comissionado = true;
        if (barbId) { itNovo.colaborador_id = barbId; itNovo.barbeiroNome = barbNome; }
        itens.push(itNovo);
      } catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui salvar o item: ' + (e.message || 'tente de novo')); return; }
    } else {
      var precoOrig = parseFloat(opt.dataset.val) || 0;
      var item = { nome: opt.dataset.nome, tipo: backendTipo === 'servico' ? 'Servi\u00e7o' : 'Produto', valor: precoOrig };
      if (backendTipo === 'servico') item.servico_id = el.sel.value; else { item.produto_id = el.sel.value; item.comissionado = (tipo === 'barbearia'); }
      if (barbId) { item.colaborador_id = barbId; item.barbeiroNome = barbNome; }
      if (usarFicha) { item.ficha = true; item.valor = Math.max(0, precoOrig - 8); }
      itens.push(item);
    }
    el.sel.value = '';
    if (bsel) bsel.value = '';
    if (el.fichaChk) el.fichaChk.checked = false;
    await aplicarPlanoNosItens();
    render();
    setTipoButtons();
  }
  async function removeItem(idx) {
    var it = itens[idx];
    if (comandaId && it && it.id) {
      try { await req('DELETE', '/comandas/' + comandaId + '/itens/' + it.id); }
      catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui remover: ' + (e.message || 'tente de novo')); return; }
    }
    itens.splice(idx, 1);
    // Se removeu a mensalidade do plano novo, cancela a ativação e volta a opção de adicionar.
    if (it && it.plano && (parseFloat(it.valor) || 0) > 0 && _planoNovo) {
      _planoNovo = null; planoSit = null;
      render(); setTipoButtons();
      mostrarPlano(clienteId);
      return;
    }
    render(); setTipoButtons();
    // Item 2 / Opção 1: se havia resgate, o limite pode ter caído (menos produtos) -> reajusta
    // no backend, que reduz sozinho e devolve o excedente ao cliente.
    if ((pontosUsados || 0) > 0 && comandaId) definirResgateBackend();
  }
  async function editarValor(idx, val) {
    var it = itens[idx]; if (!it) return;
    var v = parseFloat(val); if (isNaN(v) || v < 0) v = 0;
    if (comandaId && it.id) {
      try { var r = await req('PATCH', '/comandas/' + comandaId + '/itens/' + it.id, { valor_unit: v }); if (r && r.valor_unit != null) v = Number(r.valor_unit); }
      catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui salvar o valor: ' + (e.message || 'tente de novo')); render(); return; }
    }
    it.valor = v; render();
    // Item 2 / Opção 1: valor do produto mudou -> limite de resgate pode mudar; reajusta no backend.
    if ((pontosUsados || 0) > 0 && comandaId) definirResgateBackend();
  }
  async function editarNome(idx, val) {
    var it = itens[idx]; if (!it) return;
    var nome = (val || '').trim() || 'Servi\u00e7o';
    if (comandaId && it.id) {
      try { await req('PATCH', '/comandas/' + comandaId + '/itens/' + it.id, { descricao: nome }); }
      catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui salvar o nome: ' + (e.message || 'tente de novo')); render(); return; }
    }
    it.nome = nome; render();
  }
  async function changeQty(idx, delta) {
    var it = itens[idx]; if (!it) return;
    var atual = parseInt(it.quantidade) || 1;
    var q = atual + delta;
    if (q < 1) q = 1;
    if (q === atual) return;
    if (comandaId && it.id) {
      try { var r = await req('PATCH', '/comandas/' + comandaId + '/itens/' + it.id, { quantidade: q }); if (r && r.quantidade != null) q = parseInt(r.quantidade) || q; }
      catch (e) { hooks.toast('\u26a0\ufe0f N\u00e3o consegui mudar a quantidade: ' + (e.message || 'tente de novo')); render(); return; }
    }
    it.quantidade = q; render();
    // Item 2 / Opção 1: quantidade mudou -> limite de resgate pode mudar; reajusta no backend.
    if ((pontosUsados || 0) > 0 && comandaId) definirResgateBackend();
  }
  function total() { return itens.reduce(function (s, it) { return s + (parseFloat(it.valor) || 0) * (parseInt(it.quantidade) || 1); }, 0); }
  function descontoPontos() { return (pontosUsados || 0) / 30; }            // 30 pts = R$1
  // ---------- ITEM 4: desconto de 15% para ASSINANTE EM DIA, só em SERVIÇOS ----------
  // Aplicado MANUALMENTE pelo caixa (checkbox no card do plano). Não incide sobre
  // produtos nem bar, e não incide sobre o serviço já coberto pelo plano (esse vira
  // tipo 'Plano' e sai da base automaticamente).
  var descAssinanteOn = false;
  var PCT_DESC_ASSINANTE = 0.15;
  function elegivelDescAssinante() {
    if (!planoSit || !planoSit.assinante) return false;
    if (planoSit.situacao !== 'em_dia') return false;   // atrasado não tem direito
    return baseDescAssinante() > 0;
  }
  function baseDescAssinante() {
    return itens.filter(function (it) { return it.tipo === 'Servi\u00e7o' && !it.plano; })
                .reduce(function (s, it) { return s + (parseFloat(it.valor) || 0) * (parseInt(it.quantidade) || 1); }, 0);
  }
  function descontoAssinante() {
    if (!descAssinanteOn || !elegivelDescAssinante()) return 0;
    return Math.round(baseDescAssinante() * PCT_DESC_ASSINANTE * 100) / 100;
  }
  function descontoTotal() { return descontoPontos() + descontoAssinante(); }
  // Desenha o checkbox do desconto de assinante. Fica FORA do card do plano de
  // propósito: assim ele aparece/some na hora em que o caixa adiciona ou remove
  // um serviço, porque o render() roda a cada mudança de item.
  function renderChkDescAssinante() {
    if (!el.descAssinBox) return;
    var elegivel = planoSit && planoSit.assinante && planoSit.situacao === 'em_dia' && baseDescAssinante() > 0;
    if (!elegivel) { el.descAssinBox.innerHTML = ''; return; }
    var vlr = Math.round(baseDescAssinante() * PCT_DESC_ASSINANTE * 100) / 100;
    el.descAssinBox.innerHTML =
      '<label style="margin-top:10px;display:flex;align-items:center;gap:9px;cursor:pointer;padding:10px 12px;background:rgba(76,175,125,.10);border:0.5px solid rgba(76,175,125,.35);border-radius:10px">'
      + '<input type="checkbox" id="cw-desc-assin-chk"' + (descAssinanteOn ? ' checked' : '') + ' style="accent-color:#4caf7d;width:15px;height:15px;flex-shrink:0">'
      + '<span style="font-size:12px;color:#4caf7d">\ud83d\udc51 Assinante: aplicar <b>15% de desconto</b> nos servi\u00e7os adicionais \u2014 \u2212' + brl(vlr) + '</span>'
      + '</label>';
    var cd = document.getElementById('cw-desc-assin-chk');
    if (cd) cd.addEventListener('change', function () { descAssinanteOn = !!this.checked; render(); });
  }
  function totalFinal() { return Math.max(0, total() - descontoTotal()); } // o que o cliente paga
  // Pontos de fidelidade contam SÓ sobre serviços (produtos de barbearia e bar não geram ponto).
  function servicosTotal() { return itens.filter(function (it) { return it.tipo === 'Servi\u00e7o'; }).reduce(function (s, it) { return s + (parseFloat(it.valor) || 0) * (parseInt(it.quantidade) || 1); }, 0); }
  function render() {
    if (!itens.length) {
      el.itens.innerHTML = '<div style="padding:14px 16px;color:var(--muted,#888);font-size:12px;text-align:center">Nenhum item ainda. Adicione servi\u00e7os ou produtos abaixo. \ud83d\udc47</div>';
    } else {
      el.itens.innerHTML = itens.map(function (it, i) {
        var qtd = parseInt(it.quantidade) || 1;
        var isProd = it.tipo === 'Produto';
        // ITEM 6: pode dividir SERVIÇO (com valor) e também a MENSALIDADE/RENOVAÇÃO do
        // plano (item 'Plano' com valor > 0). O serviço coberto pelo plano vira valor 0
        // -> não entra, porque não há comissão pra ratear.
        var vItem = parseFloat(it.valor) || 0;
        var ehServicoSplit = (it.tipo === 'Servi\u00e7o') && !it.plano;
        var ehMensalidadeSplit = !!it.plano && vItem > 0;
        var podeSplit = (ehServicoSplit || ehMensalidadeSplit) && vItem > 0 && qtd === 1;
        var splitHtml = podeSplit
          ? '<div class="cw-ib cw-split-barb" data-idx="' + i + '" title="Dividir entre 2 barbeiros" style="cursor:pointer;flex-shrink:0;font-size:13px;line-height:1">\ud83d\udc65</div>'
          : '';
        var qtyHtml = isProd
          ? '<div class="cw-qty"><button class="cw-qty-btn" type="button" data-idx="' + i + '" data-qact="dec">\u2212</button><span class="cw-qty-n">' + qtd + '</span><button class="cw-qty-btn" type="button" data-idx="' + i + '" data-qact="inc">+</button></div>'
          : '';
        return '<div class="cw-item-row">'
          + '<div style="flex:1;min-width:0">'
          + '<input value="' + esc(it.nome) + '" data-idx="' + i + '" data-field="nome" placeholder="Nome do item" style="width:100%;background:transparent;border:none;color:var(--white,#fff);font-size:13px;font-weight:500;font-family:inherit;padding:0;outline:none">'
          + '<div class="cw-item-type">' + (it.plano ? (vItem > 0 ? '\ud83d\udc51 Mensalidade do plano' : '\ud83c\udf9f\ufe0f Inclu\u00eddo no plano') : esc(it.tipo || '')) + (it.ficha ? ' \u00b7 \ud83c\udf7a Ficha do bar (\u2212R$8)' : '') + (it.barbeiroNome ? ' \u00b7 \ud83d\udc88 ' + esc(it.barbeiroNome) : '') + '</div>'
          + '</div>'
          + qtyHtml
          + '<div style="display:flex;align-items:center;gap:3px;flex-shrink:0"><span style="color:var(--muted,#888);font-size:12px">R$</span>'
          + '<input type="number" min="0" step="0.50" value="' + (Number(it.valor) || 0) + '" data-idx="' + i + '" data-field="valor" style="width:64px;background:var(--bg3,#1e1e1e);border:0.5px solid var(--border2,#333);border-radius:6px;color:var(--gold-light,#e0c878);font-size:13px;font-weight:500;padding:3px 6px;text-align:right;font-family:inherit"></div>'
          + splitHtml
          + '<div class="cw-ib del" data-idx="' + i + '" title="Remover" style="cursor:pointer">' + TRASH + '</div>'
          + '</div>';
      }).join('');
    }
    if (pontosUsados > maxUsavel()) pontosUsados = maxUsavel();   // clampa se itens mudaram
    if (descAssinanteOn && !elegivelDescAssinante()) descAssinanteOn = false; // itens/plano mudaram
    var t = total();
    var desc = descontoPontos();
    var descA = descontoAssinante();
    var tf = Math.max(0, t - desc - descA);
    if (el.subtotal) el.subtotal.textContent = brl(t);
    if (el.rowDescPts) el.rowDescPts.style.display = desc > 0 ? '' : 'none';
    if (el.descPts) el.descPts.textContent = '\u2212 ' + brl(desc);
    if (el.rowDescAssin) el.rowDescAssin.style.display = descA > 0 ? '' : 'none';
    if (el.descAssin) el.descAssin.textContent = '\u2212 ' + brl(descA);
    if (el.total) el.total.textContent = brl(tf);
    if (el.fin) el.fin.textContent = '\u2713 Finalizar \u2014 ' + brl(tf);
    renderChkDescAssinante();
    renderSplitBarbeiro();
    var pts = Math.floor(servicosTotal());
    if (el.cashbackPts) el.cashbackPts.textContent = pts + ' ponto' + (pts !== 1 ? 's' : '');
    atualizarResgate();
    if (splitOn) atualizarSplitStatus();
  }
  // ================= ITEM 6: dividir um SERVIÇO entre 2 barbeiros =================
  // Estratégia: o serviço vira DOIS itens na comanda, um por barbeiro, com o valor
  // rateado pelo percentual. Assim a comissão de cada um sai certa (o backend já
  // calcula por item/colaborador), o faturamento total não muda (as partes somam o
  // valor cheio) e o atendimento aparece para os dois no desempenho.
  var splitBarbIdx = null;     // índice do item sendo dividido (null = painel fechado)
  var splitBarbValA = 0;       // R$ do barbeiro 1 (o B recebe o resto pra fechar o total)
  var _splitEnviando = false;
  async function abrirSplitBarbeiro(idx) {
    var it = itens[idx]; if (!it) return;
    splitBarbIdx = idx;
    splitBarbValA = Math.round(((parseFloat(it.valor) || 0) / 2) * 100) / 100;   // começa no meio
    render();                                  // abre o painel na hora
    if (!barbeiros.length) {                   // e completa a lista de barbeiros se faltar
      try { barbeiros = await req('GET', '/colaboradores') || []; } catch (e) { barbeiros = []; }
      if (splitBarbIdx === idx) render();       // redesenha já com os barbeiros
    }
  }
  function fecharSplitBarbeiro() { splitBarbIdx = null; render(); }
  function optsBarb(sel) {
    var lista = (barbeiros || []).filter(function (b) { return b.perfil !== 'caixa'; });
    return '<option value="">Barbeiro...</option>' + lista.map(function (b) {
      return '<option value="' + b.id + '"' + (String(b.id) === String(sel || '') ? ' selected' : '') + '>' + esc(nomeBarbW(b)) + '</option>';
    }).join('');
  }
  function renderSplitBarbeiro() {
    if (!el.splitBarbBox) return;
    if (splitBarbIdx == null || !itens[splitBarbIdx]) { el.splitBarbBox.innerHTML = ''; return; }
    var it = itens[splitBarbIdx];
    var V = parseFloat(it.valor) || 0;
    var vA = Math.round((parseFloat(splitBarbValA) || 0) * 100) / 100;
    if (vA < 0) vA = 0; if (vA > V) vA = V;
    var vB = Math.round((V - vA) * 100) / 100;   // o resto vai pro B: as partes SEMPRE somam V
    el.splitBarbBox.innerHTML =
      '<div style="margin-top:10px;padding:12px 14px;background:var(--bg3,#1e1e1e);border:0.5px solid var(--gold-border,rgba(7,67,145,.35));border-radius:10px">'
      + '<div style="font-size:12px;font-weight:600;color:var(--gold-light,#e0c878);margin-bottom:2px">\ud83d\udc65 Dividir entre 2 barbeiros</div>'
      + '<div style="font-size:11px;color:var(--muted,#888);margin-bottom:10px">' + esc(it.nome) + ' \u2014 ' + brl(V) + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">'
      +   '<select id="cw-sb-a" style="flex:1;background:var(--bg2,#181817);border:0.5px solid var(--border2,#333);border-radius:8px;color:var(--white,#fff);font-size:12px;padding:8px;font-family:inherit">' + optsBarb(it.colaborador_id) + '</select>'
      +   '<span style="font-size:12px;color:var(--muted,#888)">R$</span>'
      +   '<input id="cw-sb-val" type="number" min="0" step="0.01" value="' + vA.toFixed(2) + '" style="width:82px;background:var(--bg2,#181817);border:0.5px solid var(--border2,#333);border-radius:8px;color:var(--gold-light,#e0c878);font-size:13px;font-weight:600;padding:8px;text-align:center;font-family:inherit">'
      + '</div>'
      + '<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">'
      +   '<select id="cw-sb-b" style="flex:1;background:var(--bg2,#181817);border:0.5px solid var(--border2,#333);border-radius:8px;color:var(--white,#fff);font-size:12px;padding:8px;font-family:inherit">' + optsBarb('') + '</select>'
      +   '<span style="font-size:12px;color:var(--muted,#888)">R$</span>'
      +   '<span id="cw-sb-bval" style="width:82px;text-align:center;font-size:13px;font-weight:600;color:var(--gold-light,#e0c878)">' + vB.toFixed(2).replace('.', ',') + '</span>'
      + '</div>'
      + '<div style="display:flex;gap:8px">'
      +   '<button id="cw-sb-cancel" style="flex:1;padding:8px;border-radius:8px;border:0.5px solid var(--border2,#333);background:transparent;color:var(--muted,#888);font-size:12px;cursor:pointer;font-family:inherit">Cancelar</button>'
      +   '<button id="cw-sb-ok" style="flex:2;padding:8px;border-radius:8px;border:0;background:var(--gold,#074391);color:#1a1a1a;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">Confirmar divis\u00e3o</button>'
      + '</div></div>';
    var pi = document.getElementById('cw-sb-val');
    var bSpan = document.getElementById('cw-sb-bval');
    if (pi) pi.addEventListener('input', function () {
      var v = parseFloat(String(this.value).replace(',', '.'));
      if (isNaN(v)) v = 0;
      if (v < 0) v = 0; if (v > V) v = V;
      splitBarbValA = Math.round(v * 100) / 100;
      var vb = Math.round((V - splitBarbValA) * 100) / 100;
      if (bSpan) bSpan.textContent = vb.toFixed(2).replace('.', ',');
    });
    var bc = document.getElementById('cw-sb-cancel');
    if (bc) bc.addEventListener('click', fecharSplitBarbeiro);
    var bo = document.getElementById('cw-sb-ok');
    if (bo) bo.addEventListener('click', confirmarSplitBarbeiro);
  }
  async function confirmarSplitBarbeiro() {
    if (_splitEnviando) return;
    var idx = splitBarbIdx;
    var it = itens[idx]; if (!it) { fecharSplitBarbeiro(); return; }
    var selA = document.getElementById('cw-sb-a'), selB = document.getElementById('cw-sb-b');
    var idA = selA ? selA.value : '', idB = selB ? selB.value : '';
    if (!idA || !idB) { hooks.toast('\u26a0\ufe0f Selecione os dois barbeiros.'); return; }
    if (idA === idB) { hooks.toast('\u26a0\ufe0f Escolha barbeiros diferentes.'); return; }
    var V = parseFloat(it.valor) || 0;
    var vA = Math.round((parseFloat(splitBarbValA) || 0) * 100) / 100;
    if (vA <= 0 || vA >= V) { hooks.toast('\u26a0\ufe0f O valor do 1\u00ba barbeiro precisa ser maior que R$ 0 e menor que ' + brl(V) + '.'); return; }
    var vB = Math.round((V - vA) * 100) / 100;   // o resto vai pro B: soma sempre bate com V
    var nomeBase = String(it.nome || 'Servi\u00e7o').replace(/\s*\((?:\d+%|R\$[^)]*)\)\s*$/i, '');
    var nomeA = nomeBase + ' (' + brl(vA) + ')';
    var nomeB = nomeBase + ' (' + brl(vB) + ')';
    var nomeBarbA = ((barbeiros || []).filter(function (b) { return String(b.id) === String(idA); })[0] || {}).nome || '';
    var nomeBarbB = ((barbeiros || []).filter(function (b) { return String(b.id) === String(idB); })[0] || {}).nome || '';
    _splitEnviando = true;
    var ehPlano = !!it.plano;   // mensalidade / renovação de plano
    var bo = document.getElementById('cw-sb-ok');
    if (bo) { bo.disabled = true; bo.textContent = 'Dividindo\u2026'; }
    try {
      if (comandaId) {
        // Cria os DOIS itens novos ANTES de apagar o original. Se algo falhar no meio,
        // desfaz o que foi criado e a comanda continua exatamente como estava.
        var criados = [];
        var novoA, novoB;
        try {
          if (ehPlano) {
            // Item de plano aceita descricao + valor_unit direto na criação.
            novoA = await req('POST', '/comandas/' + comandaId + '/itens', { tipo: 'plano', descricao: nomeA, valor_unit: vA, quantidade: 1, colaborador_id: idA });
            criados.push(novoA.id);
            novoB = await req('POST', '/comandas/' + comandaId + '/itens', { tipo: 'plano', descricao: nomeB, valor_unit: vB, quantidade: 1, colaborador_id: idB });
            criados.push(novoB.id);
          } else {
            // Serviço: o backend cria com o preço do catálogo -> ajusta valor e nome por PATCH.
            novoA = await req('POST', '/comandas/' + comandaId + '/itens', { tipo: 'servico', servico_id: it.servico_id || null, quantidade: 1, colaborador_id: idA });
            criados.push(novoA.id);
            await req('PATCH', '/comandas/' + comandaId + '/itens/' + novoA.id, { valor_unit: vA, descricao: nomeA });
            novoB = await req('POST', '/comandas/' + comandaId + '/itens', { tipo: 'servico', servico_id: it.servico_id || null, quantidade: 1, colaborador_id: idB });
            criados.push(novoB.id);
            await req('PATCH', '/comandas/' + comandaId + '/itens/' + novoB.id, { valor_unit: vB, descricao: nomeB });
          }
        } catch (eCria) {
          for (var c = 0; c < criados.length; c++) {
            try { await req('DELETE', '/comandas/' + comandaId + '/itens/' + criados[c]); } catch (e2) {}
          }
          throw eCria;
        }
        // Agora sim remove o item original (a comanda nunca fica sem o item).
        if (it.id) { try { await req('DELETE', '/comandas/' + comandaId + '/itens/' + it.id); } catch (e3) {} }
        itens.splice(idx, 1,
          { id: novoA.id, nome: nomeA, tipo: ehPlano ? 'Plano' : 'Servi\u00e7o', plano: ehPlano, valor: vA, quantidade: 1, servico_id: it.servico_id || null, colaborador_id: idA, barbeiroNome: nomeBarbA },
          { id: novoB.id, nome: nomeB, tipo: ehPlano ? 'Plano' : 'Servi\u00e7o', plano: ehPlano, valor: vB, quantidade: 1, servico_id: it.servico_id || null, colaborador_id: idB, barbeiroNome: nomeBarbB }
        );
      } else {
        // Comanda avulsa (ainda não existe no servidor): divide só na memória.
        itens.splice(idx, 1,
          { nome: nomeA, tipo: ehPlano ? 'Plano' : 'Servi\u00e7o', plano: ehPlano, valor: vA, quantidade: 1, servico_id: it.servico_id || null, colaborador_id: idA, barbeiroNome: nomeBarbA },
          { nome: nomeB, tipo: ehPlano ? 'Plano' : 'Servi\u00e7o', plano: ehPlano, valor: vB, quantidade: 1, servico_id: it.servico_id || null, colaborador_id: idB, barbeiroNome: nomeBarbB }
        );
      }
      // A ASSINATURA só aceita UM barbeiro titular (vendedor_id). A comissão da
      // mensalidade fica dividida entre os dois (são 2 itens), mas o titular do
      // plano passa a ser o barbeiro 1.
      if (ehPlano && _planoNovo) _planoNovo.vendedor_id = idA;
      splitBarbIdx = null;
      hooks.toast('\ud83d\udc65 Dividido: ' + nomeBarbA + ' ' + brl(vA) + ' \u00b7 ' + nomeBarbB + ' ' + brl(vB)
        + (ehPlano ? ' \u2014 titular do plano: ' + nomeBarbA : ''));
      render(); setTipoButtons();
    } catch (e) {
      hooks.toast('\u26a0\ufe0f N\u00e3o consegui dividir: ' + ((e && e.message) || 'tente de novo'));
      render();
    } finally {
      _splitEnviando = false;
    }
  }
  var FORMAS_OPCOES = [['debito', 'Cart\u00e3o D\u00e9bito'], ['credito', 'Cart\u00e3o Cr\u00e9dito'], ['pix', 'Pix'], ['dinheiro', 'Dinheiro']];
  function formaKey(f) {
    var s = String(f || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (s.indexOf('cred') >= 0) return 'credito';
    if (s.indexOf('deb') >= 0) return 'debito';
    if (s.indexOf('pix') >= 0) return 'pix';
    if (s.indexOf('din') >= 0) return 'dinheiro';
    return 'dinheiro';
  }
  function outraForma(f) { return f === 'dinheiro' ? 'pix' : 'dinheiro'; }
  function somaSplit() { return Math.round(splitRows.reduce(function (s, r) { return s + (parseFloat(r.valor) || 0); }, 0) * 100) / 100; }
  function splitValido() {
    if (!splitOn) return true;
    var linhas = splitRows.filter(function (r) { return (parseFloat(r.valor) || 0) > 0; });
    if (linhas.length < 2) return false;
    return Math.abs(somaSplit() - totalFinal()) <= 0.05;
  }
  function atualizarSplitStatus() {
    var st = document.getElementById('cw-split-status'); if (!st) return;
    var t = totalFinal(), dif = Math.round((t - somaSplit()) * 100) / 100;
    if (Math.abs(dif) <= 0.05) { st.className = 'cw-split-status ok'; st.textContent = 'Total ' + brl(t) + ' \u00b7 \u2713 bate certinho'; }
    else if (dif > 0) { st.className = 'cw-split-status bad'; st.textContent = 'Total ' + brl(t) + ' \u00b7 falta ' + brl(dif); }
    else { st.className = 'cw-split-status bad'; st.textContent = 'Total ' + brl(t) + ' \u00b7 passou ' + brl(-dif); }
  }
  function renderSplit() {
    var box = document.getElementById('cw-split'); if (!box) return;
    box.innerHTML = splitRows.map(function (r, i) {
      var opts = FORMAS_OPCOES.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === r.forma ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
      return '<div class="cw-split-row">'
        + '<select data-sidx="' + i + '" data-sfield="forma">' + opts + '</select>'
        + '<span style="color:var(--muted,#888);font-size:12px">R$</span>'
        + '<input type="number" min="0" step="0.50" value="' + (Number(r.valor) || 0) + '" data-sidx="' + i + '" data-sfield="valor">'
        + (splitRows.length > 2 ? '<span class="cw-split-rm" data-srm="' + i + '" title="Remover">\u00d7</span>' : '')
        + '</div>';
    }).join('')
      + (splitRows.length < 4 ? '<div class="cw-split-add" id="cw-split-add">+ adicionar forma</div>' : '')
      + '<div class="cw-split-status" id="cw-split-status"></div>';
    atualizarSplitStatus();
  }
  function splitEditarValor(i, val) {
    if (!splitRows[i]) return;
    splitRows[i].valor = Math.max(0, parseFloat(val) || 0);
    var last = splitRows.length - 1;
    var balIdx = (i === last) ? last - 1 : last;
    if (balIdx >= 0 && balIdx !== i) {
      var outros = splitRows.reduce(function (s, r, k) { return s + (k === balIdx ? 0 : (parseFloat(r.valor) || 0)); }, 0);
      var resto = Math.round((totalFinal() - outros) * 100) / 100;
      splitRows[balIdx].valor = Math.max(0, resto);
      var inp = el.ov.querySelector('input[data-sfield="valor"][data-sidx="' + balIdx + '"]');
      if (inp) inp.value = splitRows[balIdx].valor;
    }
    atualizarSplitStatus();
  }
  function splitAdd() { if (splitRows.length >= 4) return; splitRows.push({ forma: 'dinheiro', valor: 0 }); renderSplit(); }
  function splitRemove(i) { if (splitRows.length <= 2) return; splitRows.splice(i, 1); renderSplit(); }
  function resetSplit() {
    splitOn = false; splitRows = [];
    var box = document.getElementById('cw-split'); if (box) { box.style.display = 'none'; box.innerHTML = ''; }
    var grid = el.ov && el.ov.querySelector('.cw-pgto-grid'); if (grid) { grid.style.opacity = ''; grid.style.pointerEvents = ''; }
    var tog = document.getElementById('cw-split-toggle'); if (tog) { tog.classList.remove('on'); tog.textContent = '\u2797 Dividir pagamento'; }
  }
  function toggleSplit() {
    if (splitOn) { resetSplit(); return; }
    splitOn = true;
    var f1 = formaKey(formaSelecionada());
    splitRows = [{ forma: f1, valor: totalFinal() }, { forma: outraForma(f1), valor: 0 }];
    renderSplit();
    var box = document.getElementById('cw-split'); if (box) box.style.display = '';
    var grid = el.ov.querySelector('.cw-pgto-grid'); if (grid) { grid.style.opacity = '0.4'; grid.style.pointerEvents = 'none'; }
    var tog = document.getElementById('cw-split-toggle'); if (tog) { tog.classList.add('on'); tog.textContent = '\u2715 Cancelar divis\u00e3o'; }
  }
  function formaSelecionada() {
    var s = el.ov.querySelector('.cw-pgto-btn.sel');
    return s ? (s.getAttribute('data-forma') || '') : '';   // vazio se nada foi escolhido
  }
  async function finalizar() {
    if (_enviando) return;                 // já está finalizando: ignora cliques extras
    // Cancela qualquer resgate em debounce: o finalizar já reconcilia os pontos.
    // Sem isso, o timer poderia disparar DEPOIS da finalização e mexer numa comanda fechada.
    if (_resgateTimer) { clearTimeout(_resgateTimer); _resgateTimer = null; }
    var t = total();
    // ITEM 4: o campo `desconto` enviado ao backend soma fidelidade + desconto de
    // assinante (15% em serviços). O backend já subtrai `desconto` do total.
    var descPts = descontoPontos();
    var descAssin = descontoAssinante();
    var desc = descPts + descAssin;
    var tf = Math.max(0, t - desc);
    var comandaParaResgate = comandaId;
    if (splitOn && !splitValido()) {
      hooks.toast('\u26a0\ufe0f A divis\u00e3o precisa somar exatamente ' + brl(tf) + ' com 2 ou mais formas.');
      return;
    }
    if (canal === 'avulsa' && !itens.length) { hooks.toast('Adicione ao menos um item.'); return; }
    // barbeiro obrigatório: produto de barbearia (sempre) e serviço na avulsa (sem agendamento)
    var faltaBarb = itens.some(function (it) {
      var ehBarbearia = it.comissionado;
      var ehServicoAvulsa = (canal === 'avulsa' && it.tipo === 'Servi\u00e7o');
      return (ehBarbearia || ehServicoAvulsa) && !it.colaborador_id;
    });
    if (faltaBarb) { hooks.toast('\u26a0\ufe0f Informe o barbeiro dos itens de barbearia/servi\u00e7o.'); return; }
    // FORMA DE PAGAMENTO OBRIGATÓRIA: quando não é divisão, precisa escolher uma forma.
    if (!splitOn && !formaSelecionada()) {
      hooks.toast('\u26a0\ufe0f Selecione a forma de pagamento para finalizar.');
      return;
    }
    _enviando = true;
    var forma = formaSelecionada();
    var pagamentos = splitOn
      ? splitRows.filter(function (r) { return (parseFloat(r.valor) || 0) > 0; })
                 .map(function (r) { return { forma: r.forma, valor: Math.round((parseFloat(r.valor) || 0) * 100) / 100 }; })
      : null;
    var labelOrig = el.fin.textContent;
    el.fin.disabled = true;
    el.fin.textContent = 'Finalizando\u2026';
    try {
      var payload = itens.map(function (it) {
        return { nome: it.nome, tipo: it.tipo, valor: parseFloat(it.valor) || 0, quantidade: it.quantidade || 1, produto_id: it.produto_id || null, servico_id: it.servico_id || null, colaborador_id: it.colaborador_id || null };
      });
      if (canal === 'avulsa') {
        var itensAv = itens.map(function (it) {
          return { id: it.produto_id || it.servico_id, tipo: it.tipo === 'Produto' ? 'produto' : (it.tipo === 'Plano' ? 'plano' : 'servico'), quantidade: it.quantidade || 1, valor: parseFloat(it.valor) || 0, colaborador_id: it.colaborador_id || null, ficha: !!it.ficha };
        }).filter(function (x) { return x.id; });
        var comandaBarb = (itens.filter(function (it) { return it.colaborador_id; })[0] || {}).colaborador_id || null;
        var _av = await req('POST', '/comandas/avulsa', { cliente_id: clienteId, forma_pagamento: forma, desconto: desc, pagamentos: pagamentos, itens: itensAv, colaborador_id: comandaBarb });
        if (_av && (_av.id || _av.comanda_id)) comandaParaResgate = _av.id || _av.comanda_id;
      } else if (canal === 'appbarber' && agId) {
        try {
          await req('POST', '/appbarber/finalizar/' + agId, { onde: 'novo', forma_pgto: forma, valor: tf, itens: payload, pagamentos: pagamentos });
        } catch (eApp) {
          var msg = (eApp && eApp.message) || '';
          if (/n[\u00e3a]o encontrado/i.test(msg)) {
            await req('POST', '/agendamentos/' + agId + '/finalizar', { forma_pgto: forma, desconto: desc, itens: payload, pagamentos: pagamentos });
          } else if (/j[\u00e1a] foi finalizad/i.test(msg)) {
            // um clique anterior já finalizou esta comanda -> trata como sucesso (só fecha)
          } else { throw eApp; }
        }
      } else if (canal === 'comanda' && comandaId) {
        await req('PUT', '/comandas/' + comandaId + '/finalizar', { forma_pgto: forma, desconto: desc, pagamentos: pagamentos });
      } else if (agId) {
        await req('POST', '/agendamentos/' + agId + '/finalizar', { forma_pgto: forma, desconto: desc, itens: payload, pagamentos: pagamentos });
      }
      // Ativa o plano escolhido no atendimento (assinatura). A mensalidade já foi
      // cobrada como item da comanda, então aqui só criamos a assinatura.
      if (_planoNovo && clienteId) {
        try {
          var plPayload = { cliente_id: clienteId, plano_id: _planoNovo.plano_id, vendedor_id: _planoNovo.vendedor_id, forma_pgto: forma, sem_comanda: true };
          if (_planoNovo.assinatura_id) plPayload.assinatura_id = _planoNovo.assinatura_id; // renovação
          await req('POST', '/assinaturas/cobrar', plPayload);
        } catch (ePl) { hooks.toast('\u26a0\ufe0f Comanda fechada, mas n\u00e3o consegui ativar/renovar o plano. Ajuste em Planos.'); }
      }
      var pts = Math.floor(servicosTotal());
      if (clienteId && pts > 0) { try { await req('POST', '/cashback/creditar', { cliente_id: clienteId, valor_servicos: pts }); } catch (e) {} }
      // Resgate de pontos:
      //  - Comanda com id (agendamento/comanda/appbarber): os pontos JÁ foram debitados na hora
      //    (definir-resgate) e pontos_resgatados já está gravado na comanda. NÃO debita de novo.
      //  - Venda avulsa (sem comandaId prévio): o resgate não passou por definir-resgate durante a
      //    edição, então debitamos agora, uma única vez, na comanda recém-criada.
      if (clienteId && pontosUsados > 0 && !comandaId) {
        try { await req('POST', '/cashback/resgatar', { cliente_id: clienteId, comanda_id: comandaParaResgate || null, pontos: pontosUsados }); } catch (e) {}
      }
      hooks.toast('\u2705 Comanda finalizada \u2014 ' + brl(tf));
      close();
      try { hooks.onFinalizar(); } catch (e) {}
    } catch (e) {
      hooks.toast('\u26a0\ufe0f N\u00e3o consegui finalizar: ' + (e.message || 'tente de novo'));
    } finally {
      _enviando = false;
      el.fin.disabled = false;
      el.fin.textContent = labelOrig;
    }
  }
  async function reabrir() {
    if (!comandaId) { hooks.toast('Esta comanda ainda est\u00e1 aberta \u2014 n\u00e3o precisa reabrir.'); return; }
    var motivo = window.prompt('Motivo para reabrir a comanda:');
    if (motivo == null || !motivo.trim()) return;
    var senha = window.prompt('Senha de autoriza\u00e7\u00e3o do gerente:');
    if (senha == null || !senha) return;
    try {
      var r = await req('POST', '/comandas/' + comandaId + '/reabrir', { senha_gerente: senha, motivo: motivo.trim() });
      var quem = (r && r.autorizado_por) ? ' (autorizado por ' + r.autorizado_por + ')' : '';
      hooks.toast('\ud83d\udd13 Comanda reaberta' + quem + ' \u2014 pode editar os itens');
    } catch (e) { hooks.toast('\u26a0\ufe0f ' + ((e && e.message) || 'N\u00e3o consegui reabrir. Verifique a senha.')); }
  }
  // -------- API pública --------
  window.ComandaWidget = {
    init: function (opts) {
      if (opts && typeof opts.toast === 'function') hooks.toast = opts.toast;
      if (opts && typeof opts.onFinalizar === 'function') hooks.onFinalizar = opts.onFinalizar;
    },
    abrir: abrir,
    fechar: close
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
