// -------------------------------
// script.js - Smart Update + Telegram-style Full-width (No Icon)
// -------------------------------

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8y3qZx5KJY4bLLaU-oFXtkxWDpC-qcR8l7ch5Q2_6N_U8MmgpGgcATfkZT4C3bNaM1Q/exec';
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy';
let lastUpdated = null;

// กลุ่มบัญชี
const paymentGroups = [
  { name: "A884", key: "A884" },
  { name: "A883,WC22", key: "A883,WC22" },
  { name: "A88,0,1,2,AF,AFF", key: "A88,0,1,2,AF,AFF" },
  { name: "THNA", key: "THNA" },
  { name: "THNB", key: "THNB" },
  { name: "THCA", key: "THCA" },
  { name: "THVA", key: "THVA" },
  { name: "AO", key: "AO" }
];

// -------------------------------
// Format เลขบัญชีแบบ 10 หลัก
// -------------------------------
function formatAccountNumber(no) {
  const s = no.toString();
  if (s.length === 10) return `${s.slice(0,3)}-${s.slice(3,4)}-${s.slice(4)}`;
  return s;
}

// -------------------------------
// Toast แจ้งเตือน
// -------------------------------
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.opacity = 1; toast.style.transform = 'translateY(0)'; }, 50);
  setTimeout(() => { toast.style.opacity = 0; toast.style.transform = 'translateY(20px)'; }, 2200);
  setTimeout(() => toast.remove(), 2600);
}

// -------------------------------
// โหลดข้อมูลจาก GAS
// -------------------------------
function loadDataFromGAS() {
  return new Promise((resolve, reject) => {
    const callbackName = 'gasCallback_' + Date.now();
    const scriptTag = document.createElement('script');
    scriptTag.src = APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(SECRET_KEY) + '&callback=' + callbackName;
    scriptTag.async = true;

    window[callbackName] = function(response) {
      delete window[callbackName];
      document.body.removeChild(scriptTag);

      if (!response || !response.data || !Array.isArray(response.data)) {
        reject(new Error('ไม่มีข้อมูล'));
        return;
      }

      const accounts = response.data.map(acc => ({
        ...acc,
        short: acc.short.trim() || `${acc.bank}-${acc.no.toString().slice(-5)}`
      }));

      lastUpdated = Date.now();
      resolve(accounts);
    };

    scriptTag.onerror = () => {
      document.body.removeChild(scriptTag);
      delete window[callbackName];
      reject(new Error('โหลดข้อมูลล้มเหลว'));
    };

    document.body.appendChild(scriptTag);
  });
}

// -------------------------------
// Smart Update ทุก 15 วินาที
// -------------------------------
function checkUpdate() {
  const callbackName = 'gasCallback_' + Date.now();
  const scriptTag = document.createElement('script');
  scriptTag.src = APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(SECRET_KEY) + '&callback=' + callbackName;
  scriptTag.async = true;

  window[callbackName] = function(response) {
    delete window[callbackName];
    document.body.removeChild(scriptTag);

    if (!response || !response.data || !Array.isArray(response.data)) return;

    const accounts = response.data.map(acc => ({
      ...acc,
      short: acc.short.trim() || `${acc.bank}-${acc.no.toString().slice(-5)}`
    }));

    const currentTimestamp = Date.now();
    if (!lastUpdated || currentTimestamp - lastUpdated >= 15000) { // 15 วิ
      renderGroups(accounts);
      lastUpdated = currentTimestamp;
      showToast('🔄 ข้อมูลอัพเดทแล้ว');
    }
  };

  scriptTag.onerror = () => {
    document.body.removeChild(scriptTag);
    delete window[callbackName];
  };

  document.body.appendChild(scriptTag);
}

// -------------------------------
// Render Groups + Buttons (No Icon)
// -------------------------------
function renderGroups(accounts) {
  const container = document.getElementById('groups-container');
  container.innerHTML = '';

  paymentGroups.forEach(group => {
    const matches = accounts.filter(acc => acc.groups.includes(group.key));

    const section = document.createElement('div');
    section.className = 'group';

    const h3 = document.createElement('h3');
    h3.textContent = group.name;
    section.appendChild(h3);

    const grid = document.createElement('div');
    grid.className = 'grid';

    if (matches.length === 0) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.textContent = 'ว่าง';
      grid.appendChild(p);
    } else {
      matches.forEach(acc => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.innerHTML = `
          <div class="btn-left">
            <span>${acc.short}</span>
          </div>
          <span class="copy-arrow">📋</span>
        `;

        btn.onclick = () => {
          const accNo = formatAccountNumber(acc.no);
          const text =
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
            .then(() => {
              btn.style.background = '#dcfce7';
              btn.style.borderColor = '#86efac';
              setTimeout(() => { btn.style.background = ''; btn.style.borderColor = ''; }, 600);
              showToast('คัดลอกแล้ว ✓');
            })
            .catch(() => showToast('คัดลอกไม่ได้'));
        };

        grid.appendChild(btn);
      });
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// -------------------------------
// DOMContentLoaded
// -------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('groups-container');
  container.innerHTML = '<div class="loading">กำลังโหลด...</div>';

  loadDataFromGAS()
    .then(accounts => renderGroups(accounts))
    .catch(err => {
      container.innerHTML = `<div class="error">เกิดข้อผิดพลาด: ${err.message}</div>`;
    });

  // Smart Update ทุก 15 วินาที
  setInterval(checkUpdate, 15000);
});
