const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const nav=document.querySelector('[data-nav]');
const cinematic=document.querySelector('.cinematic');
const sketch=document.querySelector('.frame-sketch');
const real=document.querySelector('.frame-real');
const copy=document.querySelector('.hero-copy');
const meta=document.querySelector('.hero-meta');
const cue=document.querySelector('.scroll-cue');
const steps=[...document.querySelectorAll('[data-step]')];

let ticking=false;
function updateScroll(){
  const y=window.scrollY;
  nav?.classList.toggle('scrolled',y>50);
  if(cinematic){
    const rect=cinematic.getBoundingClientRect();
    const total=cinematic.offsetHeight-window.innerHeight;
    const p=clamp(-rect.top/Math.max(total,1));
    const reveal=clamp((p-.12)/.58);
    if(real){real.style.opacity=reveal;real.style.transform=`scale(${1.08-.07*p})`}
    if(sketch){sketch.style.opacity=1-clamp((p-.02)/.55);sketch.style.transform=`scale(${1.03+.025*p})`;sketch.style.filter=`sepia(${.1-.1*p}) contrast(${.95+.05*p}) blur(${Math.max(0,(p-.35)*2.2)}px)`}
    const fade=1-clamp((p-.62)/.22);
    if(copy){copy.style.opacity=fade;copy.style.transform=`translateY(calc(-49% + ${p*26}px))`}
    if(meta) meta.style.opacity=1-clamp((p-.72)/.17);
    if(cue) cue.style.opacity=1-clamp(p/.18);
    const active=p<.31?0:p<.66?1:2;
    steps.forEach((s,i)=>s.classList.toggle('active',i===active));
  }
  ticking=false;
}
addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(updateScroll);ticking=true}},{passive:true});
addEventListener('resize',updateScroll);updateScroll();

const menuBtn=document.querySelector('[data-menu-btn]');
const mobileMenu=document.querySelector('[data-mobile-menu]');
menuBtn?.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open))});
mobileMenu?.querySelectorAll('a,button').forEach(el=>el.addEventListener('click',()=>{mobileMenu.classList.remove('open');menuBtn?.setAttribute('aria-expanded','false')}));

const modal=document.querySelector('[data-lead-modal]');
const interest=document.querySelector('[data-interest]');
document.querySelectorAll('[data-open-lead]').forEach(btn=>btn.addEventListener('click',()=>{
  if(interest) interest.value=btn.dataset.openLead||'Genel teklif';
  if(typeof modal?.showModal==='function') modal.showModal();
}));
document.querySelector('[data-close-lead]')?.addEventListener('click',()=>modal?.close());
modal?.addEventListener('click',e=>{if(e.target===modal)modal.close()});
document.querySelector('[data-lead-form]')?.addEventListener('submit',e=>{
  e.preventDefault();const note=document.querySelector('[data-form-note]');
  if(note){note.textContent='Talebiniz demo akışında alındı. Gerçek projede bu form CRM / WhatsApp / e-posta sistemine bağlanır.';note.style.color='#45624d'}
});

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)entry.target.classList.add('in-view')}),{threshold:.12});
document.querySelectorAll('.residence-row,.payment-card,.amenities>div').forEach(el=>observer.observe(el));

// Lifestyle cards: subtle scroll-driven cinematic zoom
(() => {
  const cards = [...document.querySelectorAll('.life-panel')];
  if (!cards.length) return;
  const update = () => {
    const vh = window.innerHeight || 1;
    cards.forEach((card) => {
      const img = card.querySelector('.life-panel-image');
      const r = card.getBoundingClientRect();
      const center = r.top + r.height / 2;
      const distance = Math.min(1, Math.abs(center - vh / 2) / vh);
      const scale = 1.065 - distance * 0.035;
      const y = Math.max(-10, Math.min(10, (vh / 2 - center) * 0.012));
      img.style.transform = `translate3d(0,${y}px,0) scale(${scale})`;
    });
  };
  let raf = 0;
  const request = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; update(); }); };
  addEventListener('scroll', request, {passive:true});
  addEventListener('resize', request);
  update();
})();
