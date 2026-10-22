(function(){
  var root=document.documentElement, key="site-lang", lang="";
  try{lang=localStorage.getItem(key)||""}catch(e){}
  if(lang!=="tr"&&lang!=="en"){lang=(navigator.language||"tr").toLowerCase().indexOf("tr")===0?"tr":"en"}
  function apply(l){
    root.setAttribute("data-lang",l); root.setAttribute("lang",l);
    var b=document.querySelectorAll(".lang button");
    for(var i=0;i<b.length;i++){b[i].setAttribute("aria-pressed", b[i].getAttribute("data-set")===l?"true":"false")}
    try{localStorage.setItem(key,l)}catch(e){}
  }
  apply(lang);
  document.addEventListener("click",function(e){
    var el=e.target.closest&&e.target.closest(".lang button");
    if(el){apply(el.getAttribute("data-set"))}
  });
})();
