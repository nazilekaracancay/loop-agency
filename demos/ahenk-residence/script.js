const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const cinematic=document.querySelector('.cinematic');
const sketch=document.querySelector('.frame-sketch');
const real=document.querySelector('.frame-real');
const heroCopy=document.querySelector('.hero-copy');
const steps=[...document.querySelectorAll('.scroll-story span')];
const nav=document.querySelector('[data-nav]');
let ticking=false;
function renderScroll(){
  const rect=cinematic.getBoundingClientRect();
  const scrollable=cinematic.offsetHeight-window.innerHeight;
  const p=clamp(-rect.top/Math.max(scrollable,1));
  const reveal=clamp((p-.18)/.58);
  sketch.style.opacity=1-reveal;
  real.style.opacity=reveal;
  sketch.style.transform=`scale(${1.03+p*.08}) translate3d(0,${p*16}px,0)`;
  real.style.transform=`scale(${1.08-p*.045}) translate3d(0,${(1-p)*10}px,0)`;
  real.style.filter=`saturate(${.78+reveal*.22}) brightness(${.88+reveal*.12})`;
  heroCopy.style.opacity=String(clamp(1-p*1.35));
  heroCopy.style.transform=`translateY(calc(-49% + ${p*32}px))`;
  const active=p<.33?0:p<.68?1:2;
  steps.forEach((s,i)=>s.classList.toggle('active',i===active));
  nav.classList.toggle('scrolled',window.scrollY>window.innerHeight*.88);
  ticking=false;
}
window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(renderScroll);ticking=true;}},{passive:true});
renderScroll();

const io=new IntersectionObserver(entries=>entries.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('reveal-in');io.unobserve(e.target)}
}),{threshold:.12});
document.querySelectorAll('.manifesto-grid,.architecture-showcase,.residence-row,.life-panel,.amenities>div,.payment-card,.location-content').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(28px)';el.style.transition='opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)';io.observe(el)});
document.head.insertAdjacentHTML('beforeend','<style>.reveal-in{opacity:1!important;transform:none!important}</style>');

const modal=document.querySelector('[data-lead-modal]');
const interest=document.querySelector('[data-interest]');
document.querySelectorAll('[data-open-lead]').forEach(btn=>btn.addEventListener('click',()=>{
  interest.value=btn.dataset.openLead||'Genel teklif';
  if(typeof modal.showModal==='function') modal.showModal(); else modal.setAttribute('open','');
}));
document.querySelector('[data-close-lead]').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal)modal.close()});

document.querySelector('[data-lead-form]').addEventListener('submit',e=>{
  e.preventDefault();
  const btn=e.currentTarget.querySelector('button[type=submit]');
  btn.textContent='Talebiniz Alındı ✓';
  btn.disabled=true;
  document.querySelector('[data-form-note]').textContent='Teşekkürler. Bu konsept demoda form gönderimi simüle edilmiştir.';
});

const menuBtn=document.querySelector('[data-menu-btn]');
const mobileMenu=document.querySelector('[data-mobile-menu]');
menuBtn.addEventListener('click',()=>{const open=mobileMenu.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open))});
mobileMenu.querySelectorAll('a,button').forEach(el=>el.addEventListener('click',()=>mobileMenu.classList.remove('open')));