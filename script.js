// script.js - JSONP สำหรับ GAS (แก้ CORS)

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytRRQh5awFzA90wvfTnL3pI0Z9JvQ3lYQ9ftLAyF2cd_0djmFScZADZaaGWRd0mNHW3g/exec'; // วาง URL Web app จริงของคุณ
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy'; // ต้องตรงกับ GAS เป๊ะ (case-sensitive)

const paymentGroups = [
  { name: "A884", key: "A884" },
  { name: "A883, WC22", keys: ["A883", "WC22"] },
  { name: "A88, 0, 1, 2, AF, AFF", keys: ["A88", "0", "1", "2", "AF", "AFF"] },
  { name: "THNA", key: "THNA" },
  { name: "THNB", key: "THNB" },
  { name: "THCA", key: "THCA" },
  { name: "THVA", key: "THVA" },
  { name: "AO", key: "AO" }
];

function loadDataFromGAS() {
  return new Promise((resolve, reject) => {
    const callbackName = 'gasCallback_' + Date.now();
    console.log('Attempting JSONP load with callback:', callbackName);
    console.log('Full URL:', APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(SECRET_KEY) + '&callback=' + callbackName);

    const scriptTag = document.createElement('script');
    scriptTag.src = APPS_SCRIPT_URL + '?secret=' + encodeURIComponent(SECRET_KEY) + '&callback=' + callbackName;
    scriptTag.async = true;

    window[callbackName] = function(response) {
      console.log('JSONP callback received:', response);
      document.body.removeChild(scriptTag);
      delete window[callbackName];

      if (!response || response.length === 0) {
        reject(new Error('No accounts data received from GAS'));
        return;
      }

      const processed = response.map(acc => ({
        ...acc,
        short: acc.short.trim() || `${acc.bank}-${acc.no.slice(-5)}`
      }));

      resolve(processed);
    };

    scriptTag.onload = function() {
      console.log('Script tag loaded successfully (but callback may not fire if invalid JS)');
    };

    scriptTag.onerror = function(err) {
      console.error('Script tag onerror details:', err);
      document.body.removeChild(scriptTag);
      delete window[callbackName];
      reject(new Error('Failed to load GAS script - check Network tab for status code / response'));
    };

    document.body.appendChild(scriptTag);
  });
}

function renderGroups(accounts) {
  const container = document.getElementById('groups-container');
  container.innerHTML = '';

  paymentGroups.forEach(group => {
    const matches = accounts.filter(acc => {
      if (group.key) return acc.groups.includes(group.key);
      return group.keys && group.keys.some(k => acc.groups.includes(k));
    });

    const section = document.createElement('section');
    section.className = 'group-section';

    const h2 = document.createElement('h2');
    h2.className = 'group-header';
    h2.textContent = `กลุ่ม ${group.name}`;
    section.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'accounts-grid';

    if (matches.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'ไม่มีบัญชีในกลุ่มนี้';
      p.style.textAlign = 'center';
      p.style.color = '#888';
      grid.appendChild(p);
    } else {
      matches.forEach(acc => {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = acc.short;
        btn.title = `${acc.name} - ${acc.no} (${acc.bank})`;

        btn.onclick = () => {
          const info = `${acc.name} - ${acc.no} (${acc.bank})`;
          const warning = `
──────────────────────────────
⚠ หมายเหตุการฝาก-ถอน
──────────────────────────────
⚠ ไม่อนุญาตให้ทำการฝากเงินจากบัญชีบุคคลอื่น
💸 ฝากเงินขั้นต่ำ 50 บาท - ถอนขั้นต่ำ 250 บาท
🎰 กรุณาสอบถามเลขที่บัญชีก่อนการโอนเงินทุกครั้งค่ะ`.trim();

          navigator.clipboard.writeText(`${info}\n${warning}`)
            .then(() => alert(`คัดลอกแล้ว!\n\n${info}\n${warning}`))
            .catch(err => alert('คัดลอกไม่ได้: ' + err));
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
  container.innerHTML = '<p style="text-align:center; color:#666;">กำลังโหลดข้อมูล...</p>';

  loadDataFromGAS()
    .then(accounts => renderGroups(accounts))
    .catch(err => {
      console.error('GAS load error:', err);
      container.innerHTML = `<p style="text-align:center; color:red;">โหลดข้อมูลไม่ได้: ${err.message}<br>ตรวจ Console (F12) แล้วแจ้งเพิ่ม</p>`;
    });
});
