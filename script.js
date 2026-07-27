document.querySelector('.menu-btn')?.addEventListener('click',()=>{
  document.querySelector('.nav-links').classList.toggle('open');
});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

document.querySelectorAll('form[action*="formspree.io"]').forEach(form=>{
  form.addEventListener('submit',()=>{
    const subjectField=form.querySelector('input[name="_subject"]');
    const nameField=form.querySelector('input[name="parent_name"], input[name="applicant_name"]');
    if(subjectField && nameField && nameField.value){
      subjectField.value=subjectField.value+' — '+nameField.value;
    }
  });
});
