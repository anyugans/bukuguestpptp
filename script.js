/* ==========================================================
   script.js — Buku Tamu PMTP
   Bagian 1: gate()   -> jalan langsung (tanpa menunggu halaman)
             supaya tidak ada kedipan login/buku tamu.
   Bagian 2: login    -> form login admin
   Bagian 3: buku tamu-> form, tabel, statistik, CSV
   Bagian 2 & 3 jalan setelah DOM siap.
   ========================================================== */

/* ---------- 1. Gate (login / buku tamu) ---------- */
// Satu file: tampilan login atau buku tamu, tergantung status login.
(function(){
  var SK='bt_admin_login';
  function ok(){try{if(sessionStorage.getItem(SK)==='1')return true}catch(e){}return window.name===SK}
  window.gate=function(on){
    document.documentElement.classList.toggle('in',on);
    window.scrollTo(0,0);
    if(!on){var u=document.getElementById('user');if(u)u.focus()}
  };
  window.gate(ok());
})();

document.addEventListener('DOMContentLoaded', function(){

  /* ---------- 2. Login admin ---------- */
  (function(){
    // GANTI username dan password di bawah ini sebelum dipakai.
    const ADMIN_USER = 'brmpadmin';
    const ADMIN_PASS = 'manunggal147';
    const SK = 'bt_admin_login';
    let gagal = 0, kunciSampai = 0;

    function masuk(){
      try{ sessionStorage.setItem(SK,'1'); }catch(e){}
      window.name = SK;
      window.gate(true);
    }
    // Jika sudah login, langsung ke buku tamu

    const $ = s => document.querySelector(s);
    $('#lihat').addEventListener('change',e=>{ $('#pass').type = e.target.checked ? 'text' : 'password'; });
    $('#formLogin').addEventListener('submit',e=>{
      e.preventDefault();
      const err = $('#loginErr');
      const sisa = Math.ceil((kunciSampai - Date.now())/1000);
      if(sisa > 0){ err.textContent = 'Terlalu banyak percobaan. Coba lagi dalam ' + sisa + ' detik.'; return; }
      if($('#user').value.trim() === ADMIN_USER && $('#pass').value === ADMIN_PASS){
        gagal = 0; err.textContent = ''; masuk();
      } else {
        gagal++;
        if(gagal >= 5){ kunciSampai = Date.now() + 30000; gagal = 0; err.textContent = 'Terlalu banyak percobaan. Coba lagi dalam 30 detik.'; }
        else { err.textContent = 'Username atau password salah.'; }
        $('#pass').value = ''; $('#pass').focus();
      }
    });
  })();

  /* ---------- 3. Buku tamu ---------- */
  (function(){
    const KEY="bukutamu_pmtp", SK="bt_admin_login";
    const $=id=>document.getElementById(id);
    const iso=d=>{const z=new Date(d.getTime()-d.getTimezoneOffset()*6e4);return z.toISOString().slice(0,10)};
    const fmt=s=>{const [y,m,d]=s.split("-");return `${d}/${m}/${y}`};
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
    let data=[],showAll=false;
    try{data=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){}
    const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){}};
    const toast=m=>{const t=$("toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),2400)};

    function render(){
      const sorted=[...data].sort((a,b)=>b.tgl.localeCompare(a.tgl)||b.id-a.id);
      const list=showAll?sorted:sorted.slice(0,5);
      $("rows").innerHTML=list.length?list.map((r,i)=>`<tr><td>${i+1}</td><td>${fmt(r.tgl)}</td><td>${esc(r.nama)}</td><td>${esc(r.perlu)}</td><td><button class="del" data-id="${r.id}">Hapus</button></td></tr>`).join(""):`<tr><td class="e" colspan="5">Belum ada kunjungan. Jadilah tamu pertama.</td></tr>`;
      $("all").textContent=showAll?"Tampilkan 5 Terbaru":"Lihat Semua";
      const t=iso(new Date());
      $("sHari").textContent=data.filter(r=>r.tgl===t).length;
      $("sBulan").textContent=data.filter(r=>r.tgl.slice(0,7)===t.slice(0,7)).length;
      const c={};data.forEach(r=>c[r.perlu]=(c[r.perlu]||0)+1);
      const max=Math.max(1,...Object.values(c));
      $("chart").innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar"><span>${esc(k)}</span><div><i style="width:${v/max*100}%"></i></div><b>${v}</b></div>`).join("")||"Belum ada data.";
    }

    $("tgl").value=iso(new Date());
    $("btnReset").addEventListener("click",()=>setTimeout(()=>{$("tgl").value=iso(new Date());document.querySelectorAll(".err").forEach(e=>e.textContent="")}));

    $("form").addEventListener("submit",e=>{
      e.preventDefault();
      const v={nama:$("nama").value.trim(),perlu:$("perlu").value};
      $("e-nama").textContent=v.nama?"":"Nama lengkap wajib diisi.";
      $("e-perlu").textContent=v.perlu?"":"Pilih salah satu tujuan kedatangan.";
      if(!v.nama||!v.perlu)return;
      data.push({id:Date.now(),tgl:$("tgl").value||iso(new Date()),...v,cat:$("cat").value.trim()});
      save();render();$("form").reset();$("tgl").value=iso(new Date());
      toast("Data terkirim. Terima kasih atas kunjungan Anda.");
    });

    $("all").addEventListener("click",()=>{showAll=!showAll;render()});

    $("logout").addEventListener("click",()=>{
      try{sessionStorage.removeItem(SK)}catch(e){}
      window.name="";
      document.getElementById("formLogin").reset();document.getElementById("loginErr").textContent="";window.gate(false);
    });
    $("rows").addEventListener("click",e=>{
      const b=e.target.closest(".del");if(!b||!confirm("Hapus data kunjungan ini?"))return;
      data=data.filter(r=>r.id!=b.dataset.id);save();render();toast("Data dihapus.");
    });
    $("csv").addEventListener("click",()=>{
      const q=s=>`"${String(s).replace(/"/g,'""')}"`;
      const rows=[["Tanggal","Nama","Tujuan Kedatangan","Catatan"],...data.map(r=>[r.tgl,r.nama,r.perlu,r.cat])];
      const a=document.createElement("a");
      a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"}));
      a.download="buku-tamu.csv";a.click();
    });
    render();
  })();

});
