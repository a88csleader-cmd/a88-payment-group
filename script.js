const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby91DoR9UKw9V2US5jRld3LqRVQZvShK9Cln9snn5DLu4ojOIPmlR55d1Q8zZfXG2QhGg/exec';
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy';

let lastUpdate = null;
let lastAccountsJSON = null;

const bankColors = {
  SCB:"#4c1d95",
  KBANK:"#16a34a",
  BBL:"#2563eb",
  KTB:"#1d4ed8",
  TMB:"#7c3aed",
  default:"#1e40af"
};

const paymentGroups = [
  { name:"A884", key:"A884"},
  { name:"A883,WC22", key:"A883,WC22"},
  { name:"A88,0,1,2,AF,AFF", key:"A88,0,1,2,AF,AFF"},
  { name:"THNA", key:"THNA"},
  { name:"THNB", key:"THNB"},
  { name:"THCA", key:"THCA"},
  { name:"THVA", key:"THVA"},
  { name:"AO", key:"AO"}
];

// --------------------
function formatAccountNumber(no){

  const s = (no || '').toString();

  if(s.length === 10)
    return `${s.slice(0,3)}-${s.slice(3,4)}-${s.slice(4)}`;

  return s;

}

// --------------------
function showToast(msg){

  const toast = document.createElement("div");
  toast.className="toast";
  toast.textContent=msg;

  document.body.appendChild(toast);

  setTimeout(()=>{
    toast.style.opacity=1;
    toast.style.transform='translateY(0)';
  },50);

  setTimeout(()=>{
    toast.style.opacity=0;
  },2000);

  setTimeout(()=>{
    toast.remove();
  },2400);

}

// --------------------
function loadData(){

  return new Promise((resolve,reject)=>{

    const cb='gas_'+Date.now();

    const s=document.createElement("script");

    s.src=`${APPS_SCRIPT_URL}?secret=${SECRET_KEY}&callback=${cb}`;

    window[cb]=(res)=>{

      delete window[cb];
      document.body.removeChild(s);

      if(!res || !res.data){
        reject();
        return;
      }

      const accounts=res.data.map(a=>({

        ...a,
        short:(a.short||'').toString().trim() ||
        `${a.bank}-${a.no.toString().slice(-5)}`

      }));

      resolve(accounts);

    };

    s.onerror=()=>reject();

    document.body.appendChild(s);

  });

}

// --------------------
function checkUpdate(){

  fetch(`${APPS_SCRIPT_URL}?secret=${SECRET_KEY}&mode=check`)
  .then(r=>r.json())
  .then(data=>{

    if(data.updated!==lastUpdate){

      lastUpdate=data.updated;

      loadData().then(accounts=>{

        const json=JSON.stringify(accounts);

        if(json!==lastAccountsJSON){

          renderGroups(accounts);
          lastAccountsJSON=json;

          showToast("🔄 ข้อมูลอัพเดทแล้ว");

        }

      });

    }

  });

}

// --------------------
function renderGroups(accounts){

  const container=document.getElementById("groups-container");

  container.innerHTML="";

  paymentGroups.forEach(g=>{

    const matches=accounts.filter(a=>a.groups.includes(g.key));

    const section=document.createElement("div");
    section.className="group";

    const h3=document.createElement("h3");
    h3.textContent=g.name;

    section.appendChild(h3);

    const grid=document.createElement("div");
    grid.className="grid";

    if(matches.length===0){

      const p=document.createElement("p");
      p.className="empty";
      p.textContent="ว่าง";

      grid.appendChild(p);

    } else {

      matches.forEach(acc=>{

        const btn=document.createElement("button");
        btn.className="copy-btn";

        const bankInitials=(acc.bank||'').slice(0,2).toUpperCase();
        const color=bankColors[acc.bank]||bankColors.default;

        btn.innerHTML=`
        <div class="btn-left">
        <span class="bank-circle" style="background:${color}">
        ${bankInitials}
        </span>
        <span>${acc.short}</span>
        </div>
        <span class="copy-arrow">📋</span>
        `;

        btn.onclick=()=>{

          const text=
`📌 ช่องทางโอนเงิน

ธนาคาร : ${acc.bank}
ชื่อบัญชี : ${acc.name}
เลขบัญชี : ${formatAccountNumber(acc.no)}

━━━━━━━━━━━━━━━━

⚠ สำคัญ
• กรุณาตรวจสอบชื่อบัญชีก่อนโอน
• โอนจากบัญชีชื่อเดียวกับที่สมัครเท่านั้น
• ฝากขั้นต่ำ 50 บาท
• ถอนขั้นต่ำ 250 บาท

หากโอนแล้ว กรุณาส่งสลิปเพื่อทำรายการค่ะ 🙏`;

          navigator.clipboard.writeText(text);

          btn.style.transform='scale(0.97)';

          setTimeout(()=>{
            btn.style.transform='';
          },150);

          showToast("คัดลอกแล้ว ✓");

        };

        grid.appendChild(btn);

      });

    }

    section.appendChild(grid);
    container.appendChild(section);

  });

}

// --------------------
document.addEventListener("DOMContentLoaded",()=>{

  const container=document.getElementById("groups-container");

  container.innerHTML=
  `<div class="loading">กำลังโหลด...</div>`;

  checkUpdate();

  setInterval(checkUpdate,10000);

});
