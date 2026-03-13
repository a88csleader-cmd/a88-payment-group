// script.js - เวอร์ชันสมบูรณ์สำหรับหน้าเว็บ Payment Groups (เชื่อม Google Sheets ผ่าน Apps Script ด้วย JSONP)

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx0WHm0EXZDhE0qh9UGlqcmKgrs6FV4qtBFTduG9BlL-sSxRQGHCsfg9jWaOLJDGE_J1g/exec'; // URL ของคุณ
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy'; // เปลี่ยนถ้าคุณเปลี่ยน secret

// กำหนด 8 กลุ่ม ให้ตรงกับชื่อที่ Sheet ส่งมาเป๊ะ ๆ
const paymentGroups = [
  { name: "A884",                  key: "A884" },
  { name: "A883,WC22",             key: "A883,WC22" },
  { name: "A88,0,1,2,AF,AFF",     key: "A88,0,1,2,AF,AFF" },
  { name: "THNA",                  key: "THNA" },
  { name: "THNB",                  key: "THNB" },
  { name: "THCA",                  key: "THCA" },
  { name: "THVA",                  key: "THVA" },
  { name: "AO",                    key: "AO"   }
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
        reject(new Error('ไม่มีข้อมูลบัญชีจาก Google Sheets'));
        return;
      }

      const processed = response.map(acc => ({
        ...acc,
        short: acc.short.trim() || `${acc.bank}-${acc.no.toString().slice(-5)}`
      }));

      resolve(processed);
    };

    scriptTag.onerror = function() {
      document.body.removeChild(scriptTag);
      delete window[callbackName];
      reject(new Error('ไม่สามารถโหลดข้อมูลจาก Google Sheets ได้ (ตรวจ URL หรือ secret)'));
    };

    document.body.appendChild(scriptTag);
  });
}

function renderGroups(accounts) {
  const container = document.getElementById('groups-container');
  if (!container) return;

  container.innerHTML = '';

  paymentGroups.forEach(group => {
    // ใช้ key เดียว match กับชื่อกลุ่มที่ Sheet ส่งมา
    const matchingAccounts = accounts.filter(acc => acc.groups.includes(group.key));

    const section = document.createElement('section');
    section.className = 'group-section';

    const header = document.createElement('h2');
    header.className = 'group-header';
    header.textContent = `กลุ่ม ${group.name}`;
    section.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'accounts-grid';

    if (matchingAccounts.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'ไม่มีบัญชีในกลุ่มนี้';
      p.style.textAlign = 'center';
      p.style.color = '#888';
      grid.appendChild(p);
    } else {
      matchingAccounts.forEach(acc => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = acc.short;
        btn.title = `${acc.name} - ${acc.no} (${acc.bank})`;

        btn.addEventListener('click', () => {
          const accountInfo = `${acc.name} - ${acc.no} (${acc.bank})`;

          const warningText = `
──────────────────────────────
⚠ หมายเหตุการฝาก-ถอน
──────────────────────────────
⚠ ไม่อนุญาตให้ทำการฝากเงินจากบัญชีบุคคลอื่น
💸 ฝากเงินขั้นต่ำ 50 บาท - ถอนขั้นต่ำ 250 บาท
🎰 กรุณาสอบถามเลขที่บัญชีก่อนการโอนเงินทุกครั้งค่ะ
          `.trim();

          const fullText = `${accountInfo}\n${warningText}`;

          navigator.clipboard.writeText(fullText)
            .then(() => alert(`คัดลอกเรียบร้อย!\n\n${fullText}`))
            .catch(err => alert('คัดลอกไม่สำเร็จ: ' + err));
        });

        grid.appendChild(btn);
      });
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// โหลดข้อมูลเมื่อหน้าเปิด
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('groups-container');
  container.innerHTML = '<p style="text-align:center; color:#666;">กำลังโหลดข้อมูลจาก Google Sheets...</p>';

  loadDataFromGAS()
    .then(accounts => {
      renderGroups(accounts);
    })
    .catch(err => {
      console.error('Error:', err);
      container.innerHTML = `<p style="text-align:center; color:red;">เกิดข้อผิดพลาด: ${err.message}<br>กรุณาตรวจสอบ Console (F12)</p>`;
    });
});
