// script.js - เวอร์ชัน minimal + toast แทน alert

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0WHm0EXZDhE0qh9UGlqcmKgrs6FV4qtBFTduG9BlL-sSxRQGHCsfg9jWaOLJDGE_J1g/exec';
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy';

// กลุ่มทั้งหมด (ชื่อตรงกับที่ Sheet ส่งมา)
const paymentGroups = [
  { name: "A884",                 key: "A884" },
  { name: "A883,WC22",            key: "A883,WC22" },
  { name: "A88,0,1,2,AF,AFF",    key: "A88,0,1,2,AF,AFF" },
  { name: "THNA",                 key: "THNA" },
  { name: "THNB",                 key: "THNB" },
  { name: "THCA",                 key: "THCA" },
  { name: "THVA",                 key: "THVA" },
  { name: "AO",                   key: "AO"   }
];

function loadDataFromGAS() {
  return new Promise((resolve, reject) => {
    const callbackName = 'gasCallback_' + Date.now();
    const scriptTag = document.createElement('script');
    scriptTag.src = APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(SECRET_KEY) + '&callback=' + callbackName;
    scriptTag.async = true;

    window[callbackName] = function(response) {
      document.body.removeChild(scriptTag);
      delete window[callbackName];

      if (!response || response.length === 0) {
        reject(new Error('ไม่มีข้อมูล'));
        return;
      }

      const processed = response.map(acc => ({
        ...acc,
        short: acc.short.trim() || `${acc.bank}-${acc.no.toString().slice(-5)}`
      }));

      resolve(processed);
    };

    scriptTag.onerror = () => {
      document.body.removeChild(scriptTag);
      delete window[callbackName];
      reject(new Error('โหลดข้อมูลล้มเหลว'));
    };

    document.body.appendChild(scriptTag);
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = 'rgba(0,0,0,0.8)';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '1000';
  toast.style.fontSize = '14px';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.4s';

  document.body.appendChild(toast);

  setTimeout(() => { toast.style.opacity = '1'; }, 100);
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  setTimeout(() => { document.body.removeChild(toast); }, 3000);
}

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
      p.textContent = 'ว่าง';
      p.className = 'empty';
      grid.appendChild(p);
    } else {
      matches.forEach(acc => {
        const btn = document.createElement('button');
        btn.textContent = acc.short;
        btn.title = `${acc.name} - ${acc.no} (${acc.bank})`;

        btn.onclick = () => {
          const text = `${acc.name} - ${acc.no} (${acc.bank})\n` +
                       `──────────────────────────────\n` +
                       `⚠ หมายเหตุการฝาก-ถอน\n` +
                       `──────────────────────────────\n` +
                       `⚠ ไม่อนุญาตให้ทำการฝากเงินจากบัญชีบุคคลอื่น\n` +
                       `💸 ฝากเงินขั้นต่ำ 50 บาท - ถอนขั้นต่ำ 250 บาท\n` +
                       `🎰 กรุณาสอบถามเลขที่บัญชีก่อนการโอนเงินทุกครั้งค่ะ`;

          navigator.clipboard.writeText(text)
            .then(() => showToast('คัดลอกแล้ว ✓'))
            .catch(() => showToast('คัดลอกไม่ได้'));
        };

        grid.appendChild(btn);
      });
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('groups-container');
  container.innerHTML = '<div class="loading">กำลังโหลด...</div>';

  loadDataFromGAS()
    .then(accounts => renderGroups(accounts))
    .catch(err => {
      container.innerHTML = `<div class="error">เกิดข้อผิดพลาด: ${err.message}</div>`;
    });
});
