/**
 * LOOP Agency — AI Müşteri Asistanı Widget
 * GitHub Pages'de çalışan, loopagency.company sitesine gömülü versiyon
 * Kullanım: <script src="loop-widget.js" data-key="YOUR_KEY"></script>
 */

(function () {
  'use strict';

  // ─── CONFIG ─────────────────────────────────────────────
  const CFG = {
    // API anahtarını buraya girin VEYA script tag'ına data-key="sk-ant-..." ekleyin
    apiKey: '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',
    whatsapp: '+905301431564',          // Başında + ile gerçek numaranızı girin
    whatsappMsg: 'Merhaba! Web sitesindeki AI asistanından yönlendirildim, bilgi almak istiyorum.',
    contactUrl: 'https://loopagency.company/#contact',
    primaryColor: '#c8ff00',
    darkBg: '#0f0f0f',
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 800,
    storageKey: 'loop_chat_v1',
    openDelay: 3000,                    // ms — ilk açılış gecikmesi (0 = kapalı başlar)
    greeting: 'Merhaba! 👋 LOOP Asistan burada. Shopify, web sitesi, reklam veya AI çözümleri hakkında her sorunuzu sorabilirsiniz.',
  };

  // ─── SYSTEM PROMPT ──────────────────────────────────────
  const SYSTEM = `Sen LOOP Agency'nin samimi ve çözüm odaklı AI müşteri asistanısın.

## KİMLİĞİN
- Adın: LOOP Asistan
- Dil: Türkçe (İngilizce istenirse İngilizce konuş)
- Ton: Kibar, net, profesyonel — asla robot gibi değil
- Yanıtları kısa tut: 2–4 cümle yeterli, gerekmedikçe uzatma

## LOOP AGENCY HİZMETLERİ VE FİYATLAR
1. Kurumsal Web Sitesi Temel → $599 · 5 sayfa · 7 iş günü
2. Kurumsal Web Sitesi Pro → $1.299 · 10 sayfa · 14 iş günü (blog, CRM, 1 ay destek)
3. Shopify Pro Kurulum → $1.999 · Özel tema, Meta Pixel, Analytics · 18 iş günü ⭐ En popüler
4. Meta Reklam Yönetimi → $599/ay + %10 bütçe payı · Min. 3 ay
5. AI SaaS Çözümleri → $499+ kurulum · $149+/ay (chatbot, WhatsApp bot, ürün öneri, e-posta otomasyon)
6. Uluslararası Kurulum → $499 tek seferlik (ABD şirketi, Mercury, Stripe, Shopify global)
7. 1-1 Shopify Mentörlük → Fiyat görüşmeye göre · Ücretsiz ön görüşme

## İLETİŞİM KANALLARI
- Web formu: loopagency.company/#contact (hizmet başvurusu için en hızlı yol)
- WhatsApp: Hızlı sorular ve randevu için ideal
- Ücretsiz danışma slotları: Pzt–Cum arası 10:00, 14:00 veya 16:00

## YANIT KURALLARI
- Kullanıcının asıl ihtiyacını anla, sonra EN UYGUN hizmeti öner
- Fiyatları açıkça söyle, "lütfen iletişime geçin" diyerek kaçma
- Randevu veya başvuru istenirse hem formu hem WhatsApp'ı öner
- Sipariş/başvuru istenince: form veya WhatsApp'a yönlendir, adımları açıkla
- Konu dışı sorularda: "Bu konuda yardımcı olamam ama dijital büyüme hakkında sorularınızı yanıtlayabilirim."
- Cevap sonunda nazikçe bir aksiyon öner (form, WhatsApp, danışma)

## YASAK
- "Ben bir yapay zekayım" diye başlama
- Anthropic veya Claude adını asla kullanma
- Rakip ajanlara yorum yapma`;

  // ─── STATE ──────────────────────────────────────────────
  let history = [];
  let isOpen = false;
  let isTyping = false;
  let initialized = false;

  // ─── CSS ────────────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'loop-widget-styles';
    style.textContent = `
      #loop-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', -apple-system, sans-serif; }
      #loop-trigger {
        position: fixed; bottom: 28px; right: 28px; z-index: 99999;
        width: 60px; height: 60px; border-radius: 50%;
        background: ${CFG.primaryColor}; border: none; cursor: pointer;
        box-shadow: 0 6px 32px rgba(200,255,0,0.4);
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s, box-shadow .2s;
        animation: loop-pop .4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      #loop-trigger:hover { transform: scale(1.1); box-shadow: 0 10px 48px rgba(200,255,0,0.5); }
      #loop-trigger svg { width: 26px; height: 26px; stroke: #0a0a0a; fill: none; stroke-width: 2.2; transition: opacity .2s; }
      #loop-trigger .icon-close { display: none; }
      #loop-trigger.open .icon-chat { display: none; }
      #loop-trigger.open .icon-close { display: block; }
      #loop-badge {
        position: absolute; top: -3px; right: -3px;
        width: 18px; height: 18px; border-radius: 50%;
        background: #ef4444; border: 2px solid #fff;
        font-size: 10px; font-weight: 600; color: #fff;
        display: flex; align-items: center; justify-content: center;
        animation: loop-pulse-badge 2s ease infinite;
      }
      #loop-panel {
        position: fixed; bottom: 100px; right: 28px; z-index: 99998;
        width: 380px; max-width: calc(100vw - 40px);
        background: ${CFG.darkBg}; border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px; overflow: hidden;
        display: flex; flex-direction: column; height: 560px;
        box-shadow: 0 32px 80px rgba(0,0,0,0.7);
        transition: opacity .25s, transform .25s;
        transform-origin: bottom right;
      }
      #loop-panel.hidden { opacity: 0; pointer-events: none; transform: scale(.93) translateY(16px); }
      .loop-header {
        padding: 16px 18px; background: #161616;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        display: flex; align-items: center; gap: 12px; flex-shrink: 0;
      }
      .loop-avatar {
        width: 38px; height: 38px; border-radius: 50%;
        background: rgba(200,255,0,0.12); border: 1.5px solid rgba(200,255,0,0.25);
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        position: relative;
      }
      .loop-avatar svg { width: 18px; height: 18px; stroke: ${CFG.primaryColor}; fill: none; stroke-width: 1.8; }
      .loop-status-dot {
        position: absolute; bottom: 1px; right: 1px;
        width: 9px; height: 9px; border-radius: 50%;
        background: #22c55e; border: 2px solid #161616;
      }
      .loop-header-text { flex: 1; }
      .loop-name { font-size: 14px; font-weight: 500; color: #f0ece4; }
      .loop-online { font-size: 11px; color: #7a756a; display: flex; align-items: center; gap: 5px; margin-top: 1px; }
      .loop-online::before { content:''; width:5px; height:5px; border-radius:50%; background:#22c55e; display:inline-block; }
      .loop-close-btn {
        background: none; border: none; cursor: pointer;
        color: #7a756a; font-size: 22px; line-height: 1;
        padding: 4px; border-radius: 6px; transition: color .2s;
        font-family: monospace;
      }
      .loop-close-btn:hover { color: #f0ece4; }
      .loop-messages {
        flex: 1; overflow-y: auto; padding: 16px 14px;
        display: flex; flex-direction: column; gap: 12px;
        scroll-behavior: smooth;
      }
      .loop-messages::-webkit-scrollbar { width: 3px; }
      .loop-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
      .loop-msg { display: flex; gap: 8px; align-items: flex-end; animation: loop-msg-in .25s ease; }
      .loop-msg.user { flex-direction: row-reverse; }
      .loop-msg-av {
        width: 28px; height: 28px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 10px; flex-shrink: 0; font-weight: 600;
      }
      .loop-msg-av.bot { background: rgba(200,255,0,0.12); border: 1px solid rgba(200,255,0,0.2); }
      .loop-msg-av.bot svg { width: 13px; height: 13px; stroke: ${CFG.primaryColor}; fill: none; stroke-width: 2; }
      .loop-msg-av.user { background: #222; border: 1px solid rgba(255,255,255,0.08); color: #7a756a; font-size: 9px; }
      .loop-bubble {
        max-width: 78%; padding: 10px 14px; border-radius: 16px;
        font-size: 13.5px; line-height: 1.6; font-weight: 300;
      }
      .loop-msg.bot .loop-bubble {
        background: #1c1c1c; border: 1px solid rgba(255,255,255,0.06);
        border-bottom-left-radius: 4px; color: #e8e4dc;
      }
      .loop-msg.user .loop-bubble {
        background: ${CFG.primaryColor}; color: #0a0a0a;
        font-weight: 400; border-bottom-right-radius: 4px;
      }
      .loop-bubble strong { font-weight: 600; }
      .loop-bubble a { color: ${CFG.primaryColor}; text-decoration: underline; }
      .loop-msg.user .loop-bubble a { color: #0a0a0a; }

      /* CTA cards inside bubble */
      .loop-cta-card {
        margin-top: 10px; background: rgba(200,255,0,0.08);
        border: 1px solid rgba(200,255,0,0.2); border-radius: 10px;
        padding: 10px 12px;
      }
      .loop-cta-card-title { font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: ${CFG.primaryColor}; margin-bottom: 8px; font-weight: 500; }
      .loop-cta-btns { display: flex; flex-direction: column; gap: 6px; }
      .loop-cta-btn {
        display: flex; align-items: center; gap: 8px;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px; padding: 8px 12px;
        color: #f0ece4; font-size: 13px; font-weight: 400;
        cursor: pointer; text-decoration: none; transition: background .15s, border-color .15s;
      }
      .loop-cta-btn:hover { background: ${CFG.primaryColor}; color: #0a0a0a; border-color: transparent; }
      .loop-cta-btn.primary { background: ${CFG.primaryColor}; color: #0a0a0a; border-color: transparent; font-weight: 500; }
      .loop-cta-btn.primary:hover { background: #d4ff1a; }
      .loop-cta-btn svg { width: 15px; height: 15px; flex-shrink: 0; }

      /* Quick replies */
      .loop-qr {
        padding: 0 14px 12px; display: flex; flex-wrap: wrap; gap: 6px; flex-shrink: 0;
      }
      .loop-qr-btn {
        background: transparent; border: 1px solid rgba(200,255,0,0.22);
        color: ${CFG.primaryColor}; font-size: 12px; padding: 6px 12px;
        border-radius: 20px; cursor: pointer; transition: background .15s; white-space: nowrap;
        font-family: inherit;
      }
      .loop-qr-btn:hover { background: ${CFG.primaryColor}; color: #0a0a0a; }

      /* Input area */
      .loop-input-area {
        padding: 12px 14px; background: #161616;
        border-top: 1px solid rgba(255,255,255,0.07);
        display: flex; gap: 8px; align-items: flex-end; flex-shrink: 0;
      }
      .loop-input {
        flex: 1; background: #1c1c1c; border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px; padding: 10px 14px;
        color: #f0ece4; font-size: 14px; font-family: inherit;
        outline: none; resize: none; min-height: 42px; max-height: 100px;
        line-height: 1.5; transition: border-color .2s; overflow-y: auto;
      }
      .loop-input:focus { border-color: rgba(200,255,0,0.35); }
      .loop-input::placeholder { color: #3d3830; }
      .loop-send {
        width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
        background: ${CFG.primaryColor}; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: box-shadow .2s, transform .15s;
      }
      .loop-send:hover { box-shadow: 0 0 18px rgba(200,255,0,0.4); transform: translateY(-1px); }
      .loop-send:disabled { opacity: .35; cursor: not-allowed; transform: none; box-shadow: none; }
      .loop-send svg { width: 17px; height: 17px; stroke: #0a0a0a; fill: none; stroke-width: 2.5; }

      /* Typing */
      .loop-typing { display: flex; gap: 4px; align-items: center; padding: 3px 0; }
      .loop-typing span {
        width: 6px; height: 6px; border-radius: 50%; background: #3d3830;
        animation: loop-bounce 1.2s ease infinite;
      }
      .loop-typing span:nth-child(2) { animation-delay: .18s; }
      .loop-typing span:nth-child(3) { animation-delay: .36s; }

      @keyframes loop-pop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
      @keyframes loop-msg-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes loop-bounce { 0%,80%,100%{opacity:.3;transform:scale(.7)} 40%{opacity:1;transform:scale(1)} }
      @keyframes loop-pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

      @media(max-width: 480px) {
        #loop-panel { width: calc(100vw - 24px); right: 12px; bottom: 80px; height: 520px; }
        #loop-trigger { bottom: 16px; right: 16px; width: 54px; height: 54px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── HTML ────────────────────────────────────────────────
  function buildWidget() {
    const wrap = document.createElement('div');
    wrap.id = 'loop-widget';
    wrap.innerHTML = `
      <!-- FLOATING BUTTON -->
      <button id="loop-trigger" aria-label="LOOP Asistan" onclick="window.loopWidget.toggle()">
        <svg class="icon-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        <svg class="icon-close" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <div id="loop-badge">1</div>
      </button>

      <!-- CHAT PANEL -->
      <div id="loop-panel" class="hidden" role="dialog" aria-label="LOOP AI Asistan">
        <div class="loop-header">
          <div class="loop-avatar">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>
            <div class="loop-status-dot"></div>
          </div>
          <div class="loop-header-text">
            <div class="loop-name">LOOP Asistan</div>
            <div class="loop-online">Aktif · Genellikle anında yanıtlar</div>
          </div>
          <button class="loop-close-btn" onclick="window.loopWidget.toggle()" aria-label="Kapat">×</button>
        </div>

        <div class="loop-messages" id="loop-messages"></div>
        <div class="loop-qr" id="loop-qr"></div>

        <div class="loop-input-area">
          <textarea id="loop-input" class="loop-input" placeholder="Mesajınızı yazın…" rows="1" aria-label="Mesaj yaz"></textarea>
          <button id="loop-send" class="loop-send" aria-label="Gönder">
            <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  // ─── RENDER MESSAGE ──────────────────────────────────────
  function renderMsg(role, content, ctaData) {
    const container = document.getElementById('loop-messages');
    const wrap = document.createElement('div');
    wrap.className = `loop-msg ${role === 'user' ? 'user' : 'bot'}`;

    const av = document.createElement('div');
    av.className = `loop-msg-av ${role === 'user' ? 'user' : 'bot'}`;
    av.innerHTML = role === 'user'
      ? 'Siz'
      : `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg>`;

    const bubble = document.createElement('div');
    bubble.className = 'loop-bubble';
    bubble.innerHTML = formatText(content);

    // Append CTA card if provided
    if (ctaData) {
      bubble.appendChild(buildCTA(ctaData));
    }

    wrap.appendChild(av);
    wrap.appendChild(bubble);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
  }

  // ─── FORMAT TEXT ─────────────────────────────────────────
  function formatText(t) {
    return t
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\n\n/g, '</p><p style="margin-top:6px">')
      .replace(/\n/g, '<br>');
  }

  // ─── CTA CARD ────────────────────────────────────────────
  function buildCTA(data) {
    const card = document.createElement('div');
    card.className = 'loop-cta-card';
    card.innerHTML = `<div class="loop-cta-card-title">${data.title}</div><div class="loop-cta-btns"></div>`;
    const btns = card.querySelector('.loop-cta-btns');
    data.buttons.forEach(b => {
      const el = document.createElement('a');
      el.className = `loop-cta-btn ${b.primary ? 'primary' : ''}`;
      el.href = b.href;
      if (b.href.startsWith('http')) { el.target = '_blank'; el.rel = 'noopener'; }
      el.innerHTML = `${b.icon ? `<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round">${b.icon}</svg>` : ''}${b.label}`;
      btns.appendChild(el);
    });
    return card;
  }

  // ─── TYPING INDICATOR ───────────────────────────────────
  let typingEl = null;
  function showTyping() {
    if (typingEl) return;
    const container = document.getElementById('loop-messages');
    typingEl = document.createElement('div');
    typingEl.className = 'loop-msg bot';
    typingEl.innerHTML = `
      <div class="loop-msg-av bot"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/></svg></div>
      <div class="loop-bubble"><div class="loop-typing"><span></span><span></span><span></span></div></div>`;
    container.appendChild(typingEl);
    container.scrollTop = container.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  // ─── QUICK REPLIES ───────────────────────────────────────
  function setQR(items) {
    const el = document.getElementById('loop-qr');
    el.innerHTML = '';
    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'loop-qr-btn';
      btn.textContent = item;
      btn.onclick = () => {
        document.getElementById('loop-input').value = item.replace(/^[^\s]+\s/, '');
        send();
      };
      el.appendChild(btn);
    });
  }

  // ─── DETECT CONTACT INTENT ───────────────────────────────
  function detectContactCTA(userMsg, botReply) {
    const combined = (userMsg + ' ' + botReply).toLowerCase();
    const wantContact =
      combined.includes('randevu') || combined.includes('görüşme') ||
      combined.includes('başvur') || combined.includes('sipariş') ||
      combined.includes('form') || combined.includes('iletişim') ||
      combined.includes('nasıl başlarım') || combined.includes('almak istiyorum') ||
      combined.includes('ne yapmalıyım') || combined.includes('başlamak');

    if (!wantContact) return null;

    const waUrl = `https://wa.me/${CFG.whatsapp.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(CFG.whatsappMsg)}`;

    return {
      title: 'Hemen başlayalım',
      buttons: [
        {
          label: 'Formu doldur — Ücretsiz danışma',
          href: CFG.contactUrl,
          icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
          primary: true
        },
        {
          label: 'WhatsApp\'tan yaz',
          href: waUrl,
          icon: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>',
          primary: false
        }
      ]
    };
  }

  // ─── SMART FOLLOW-UPS ────────────────────────────────────
  function getFollowUps(userMsg, botReply) {
    const s = (userMsg + ' ' + botReply).toLowerCase();
    if (s.includes('shopify') || s.includes('mağaza') || s.includes('e-ticaret'))
      return ['💰 Shopify fiyatı?', '📅 Ücretsiz danışma', '⏱️ Kaç günde teslim?'];
    if (s.includes('reklam') || s.includes('meta') || s.includes('roas') || s.includes('kampanya'))
      return ['💸 Min. reklam bütçesi?', '📊 ROAS garantisi var mı?', '📅 Danışma al'];
    if (s.includes('web') || s.includes('site') || s.includes('kurumsal') || s.includes('sayfa'))
      return ['💻 Pro farkı nedir?', '📅 Danışma randevusu', '💡 Örnekler var mı?'];
    if (s.includes('ai') || s.includes('chatbot') || s.includes('yapay zeka') || s.includes('asistan'))
      return ['🔧 Entegrasyon süresi?', '💰 Aylık maliyet?', '📅 Demo göster'];
    if (s.includes('uluslararası') || s.includes('abd') || s.includes('global') || s.includes('mercury'))
      return ['🌍 Kaç günde tamamlanır?', '📋 Gerekli belgeler?', '📅 Danışma al'];
    if (s.includes('fiyat') || s.includes('ücret') || s.includes('maliyet') || s.includes('para'))
      return ['🛍️ Shopify paketleri', '💻 Web sitesi paketleri', '📞 Özel teklif'];
    return ['📅 Ücretsiz danışma', '💬 WhatsApp\'tan yaz', '❓ Başka sorum var'];
  }

  // ─── SEND MESSAGE ────────────────────────────────────────
  async function send() {
    if (isTyping || !CFG.apiKey) return;
    const inputEl = document.getElementById('loop-input');
    const sendBtn = document.getElementById('loop-send');
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    document.getElementById('loop-qr').innerHTML = '';

    renderMsg('user', text);
    history.push({ role: 'user', content: text });

    isTyping = true;
    sendBtn.disabled = true;
    showTyping();

    // Build messages for API (exclude first system greeting from history)
    const apiMessages = history.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: CFG.model,
          max_tokens: CFG.maxTokens,
          system: SYSTEM,
          messages: apiMessages
        })
      });

      const data = await res.json();
      hideTyping();

      if (data.error) {
        const errMap = {
          'authentication_error': 'API anahtarı hatalı. Lütfen bizimle iletişime geçin.',
          'overloaded_error': 'Şu an yoğunluk var. Lütfen birkaç saniye bekleyin.',
        };
        renderMsg('bot', errMap[data.error.type] || 'Bir hata oluştu, lütfen tekrar deneyin.');
        fallbackCTA();
        return;
      }

      const reply = data.content?.[0]?.text || 'Üzgünüm, bir sorun oluştu.';
      history.push({ role: 'assistant', content: reply });

      const cta = detectContactCTA(text, reply);
      renderMsg('bot', reply, cta);

      // Save to localStorage
      try { localStorage.setItem(CFG.storageKey, JSON.stringify(history.slice(-20))); } catch(e) {}

      setTimeout(() => setQR(getFollowUps(text, reply)), 350);

    } catch (err) {
      hideTyping();
      fallbackCTA();
    }

    isTyping = false;
    sendBtn.disabled = false;
    document.getElementById('loop-input').focus();
  }

  function fallbackCTA() {
    const waUrl = `https://wa.me/${CFG.whatsapp.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(CFG.whatsappMsg)}`;
    renderMsg('bot', 'Şu an yanıt veremiyorum. Hemen iletişime geçelim:', {
      title: 'Size ulaşalım',
      buttons: [
        { label: 'Formu doldur — Ücretsiz danışma', href: CFG.contactUrl, icon: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>', primary: true },
        { label: 'WhatsApp\'tan yaz', href: waUrl, icon: '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>', primary: false }
      ]
    });
  }

  // ─── INIT ────────────────────────────────────────────────
  function init() {
    if (initialized) return;
    initialized = true;

    injectStyles();
    buildWidget();

    const inputEl = document.getElementById('loop-input');
    const sendBtn = document.getElementById('loop-send');

    // Auto-resize textarea
    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + 'px';
    });

    // Enter to send
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });

    sendBtn.addEventListener('click', send);

    // Check API key
    if (!CFG.apiKey) {
      console.warn('[LOOP Widget] API anahtarı bulunamadı. loop-widget.js script etiketine data-key="sk-ant-..." ekleyin veya window.LOOP_API_KEY tanımlayın.');
    }

    // Restore history
    try {
      const saved = JSON.parse(localStorage.getItem(CFG.storageKey) || '[]');
      if (saved.length > 0) {
        history = saved;
        saved.forEach(m => renderMsg(m.role, m.content));
        setQR(['📅 Ücretsiz danışma', '💬 Başka sorum var', '🔄 Yeni sohbet']);
        return;
      }
    } catch(e) {}

    // Fresh start
    renderMsg('bot', CFG.greeting);
    history.push({ role: 'assistant', content: CFG.greeting });
    setQR(['🛍️ Shopify kurulumu', '💻 Web sitesi', '📣 Meta reklam', '🤖 AI çözüm', '📅 Danışma al']);
  }

  // ─── TOGGLE ──────────────────────────────────────────────
  function toggle() {
    isOpen = !isOpen;
    document.getElementById('loop-panel').classList.toggle('hidden', !isOpen);
    document.getElementById('loop-trigger').classList.toggle('open', isOpen);
    const badge = document.getElementById('loop-badge');
    if (badge) badge.style.display = 'none';
    if (isOpen) setTimeout(() => document.getElementById('loop-input').focus(), 200);
  }

  // ─── PUBLIC API ──────────────────────────────────────────
  window.loopWidget = { toggle, send, resetChat() {
    history = [];
    try { localStorage.removeItem(CFG.storageKey); } catch(e){}
    document.getElementById('loop-messages').innerHTML = '';
    document.getElementById('loop-qr').innerHTML = '';
    renderMsg('bot', CFG.greeting);
    history.push({ role: 'assistant', content: CFG.greeting });
    setQR(['🛍️ Shopify kurulumu', '💻 Web sitesi', '📣 Meta reklam', '🤖 AI çözüm', '📅 Danışma al']);
  }};

  // ─── BOOT ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Auto-open after delay if configured
  if (CFG.openDelay > 0) {
    setTimeout(() => { if (!isOpen) toggle(); }, CFG.openDelay);
  }

})();
