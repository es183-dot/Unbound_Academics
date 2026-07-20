document.querySelector('.menu-btn')?.addEventListener('click',()=>{
  document.querySelector('.nav-links').classList.toggle('open');
});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));
