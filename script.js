const APPS_SCRIPT_URL='https://script.google.com/macros/s/AKfycbx0WHm0EXZDhE0qh9UGlqcmKgrs6FV4qtBFTduG9BlL-sSxRQGHCsfg9jWaOLJDGE_J1g/exec';
const SECRET_KEY='sAuTaaxokJAPUbbqe7UtKy';

const paymentGroups=[
{name:"A884",key:"A884"},
{name:"A883,WC22",key:"A883,WC22"},
{name:"A88,0,1,2,AF,AFF",key:"A88,0,1,2,AF,AFF"},
{name:"THNA",key:"THNA"},
{name:"THNB",key:"THNB"},
{name:"THCA",key:"THCA"},
{name:"THVA",key:"THVA"},
{name:"AO",key:"AO"}
];

function formatAccountNumber(no){

const s=no.toString();

if(s.length===10){
return `${s.slice(0,3)}-${s.slice(3,4)}-${s.slice(4)}`;
}

return s;
}

function showToast(message){

const toast=document.createElement("div");

toast.className="toast";

toast.textContent=message;

document.body.appendChild(toast);

setTimeout(()=>{

toast.style.opacity=1;
toast.style.transform="translateY(0)";

},50);

setTimeout(()=>{

toast.style.opacity=0;
toast.style.transform="translateY(20px)";

},2200);

setTimeout(()=>toast.remove(),2600);

}

function loadDataFromGAS(){

return new Promise((resolve,reject)=>{

const callback='gasCallback_'+Date.now();

const script=document.createElement('script');

script.src=APPS_SCRIPT_URL+'?secret='+encodeURIComponent(SECRET_KEY)+'&callback='+callback;

window[callback]=function(response){

delete window[callback];

script.remove();

if(!response||response.length===0){

reject(new Error('ไม่มีข้อมูล'));

return;
}

const processed=response.map(acc=>({

...acc,

short:acc.short.trim()||`${acc.bank}-${acc.no.toString().slice(-5)}`

}));

resolve(processed);
};

script.onerror=()=>reject(new Error('โหลดข้อมูลล้มเหลว'));

document.body.appendChild(script);

});
}

function renderGroups(accounts){

const container=document.getElementById('groups-container');

container.innerHTML='';

paymentGroups.forEach(group=>{

const matches=accounts.filter(acc=>acc.groups.includes(group.key));

const section=document.createElement('div');

section.className='group';

const h3=document.createElement('h3');

h3.textContent=group.name;

section.appendChild(h3);

const grid=document.createElement('div');

grid.className='grid';

if(matches.length===0){

const p=document.createElement('p');

p.className='empty';

p.textContent='ว่าง';

grid.appendChild(p);

}

matches.forEach(acc=>{

const btn=document.createElement('button');

btn.className='copy-btn';

const bankClass={
SCB:'bank-scb',
KTB:'bank-ktb',
BBL:'bank-bbl',
KBANK:'bank-kbank',
BAY:'bank-bay',
TTB:'bank-ttb',
GSB:'bank-gsb'
}[acc.bank]||'bank-scb';

btn.innerHTML=`
<div class="btn-left">
<div class="bank-icon ${bankClass}">
${acc.bank.substring(0,2)}
</div>
<span>${acc.short}</span>
</div>
<span class="copy-arrow">📋</span>
`;

btn.onclick=()=>{

const accNo=formatAccountNumber(acc.no);

const text=
`📌 ช่องทางโอนเงิน

ธนาคาร : ${acc.bank}
ชื่อบัญชี : ${acc.name}
เลขบัญชี : ${accNo}

━━━━━━━━━━━━━━━━

⚠ สำคัญ
• กรุณาตรวจสอบชื่อบัญชีก่อนโอน
• โอนจากบัญชีชื่อเดียวกับที่สมัครเท่านั้น
• ฝากขั้นต่ำ 50 บาท
• ถอนขั้นต่ำ 250 บาท

หากโอนแล้ว กรุณาส่งสลิปเพื่อทำรายการค่ะ 🙏`;

navigator.clipboard.writeText(text)

.then(()=>{

btn.style.background="#dcfce7";
btn.style.borderColor="#86efac";

setTimeout(()=>{

btn.style.background="";
btn.style.borderColor="";

},600);

showToast("คัดลอกแล้ว ✓");

})

.catch(()=>showToast("คัดลอกไม่ได้"));

};

grid.appendChild(btn);

});

section.appendChild(grid);

container.appendChild(section);

});
}

document.addEventListener("DOMContentLoaded",()=>{

const container=document.getElementById('groups-container');

container.innerHTML='<div class="loading">กำลังโหลด...</div>';

loadDataFromGAS()

.then(accounts=>renderGroups(accounts))

.catch(err=>{

container.innerHTML=`<div class="error">เกิดข้อผิดพลาด: ${err.message}</div>`;

});

});
