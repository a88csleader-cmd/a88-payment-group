// script.js - เชื่อม Google Sheets ผ่าน Apps Script ด้วย JSONP (แก้ CORS)

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8km6WQeFI2Y6mmv5R0O8gYHeO_3nNmU9y2bMwOJwXU-mrjodi1Ydf2wSjvH9zx252-g/exec'; // วาง URL จริงของคุณที่นี่
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy'; // ต้องตรงกับใน Apps Script เป๊ะ ๆ

// กำหนด 8 กลุ่ม
const paymentGroups = [
  { name: "A884",                  key: "A884" },
  { name: "A883, WC22",            keys: ["A883", "WC22"] },
  { name: "A88, 0, 1, 2, AF, AFF", keys: ["A88", "0", "1", "2", "AF", "AFF"] },
  { name: "THNA",                  key: "THNA" },
  { name: "THNB",                  key: "THNB" },
  { name: "THCA",                  key: "THCA" },
  { name: "THVA",                  key: "THVA" },
  { name: "AO",                    key: "AO"   },
];

function fetchAccounts() {
  return new Promise((resolve, reject) => {
    const callbackName = 'handleSheetData_' + Math.random().toString(36).substr(2, 9); // ชื่อ callback แบบ random ป้องกัน collision

    const script = document.createElement('script');
    script.src = `${APPS_SCRIPT_URL}?secret=${encodeURIComponent(SECRET_KEY)}&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP script load failed'));
    };

    window[callbackName] = function(data) {
      cleanup();
      if (!data || data.error) {
        reject(new Error(data ? data.error : 'No data received'));
        return;
      }

      // Process data
      const processed = data.map(acc => ({
        ...acc,
        short: acc.short || `${acc.bank}-${acc.no.slice(-5)}`
      }));

      resolve(processed);
    };

    function cleanup() {
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    document.body.appendChild(script);
  });
}

function renderGroups(accounts) {
  const container = document.getElementById("groups-container");
  if (!container) return;

  container.innerHTML = "";

  paymentGroups.forEach(group => {
    const matchingAccounts = accounts.filter(acc => {
      if (group.key) return acc.groups.includes(group.key);
      if (group.keys) return group.keys.some(k => acc.groups.includes(k));
      return false;
    });

    const section = document.createElement("section");
    section.className = "group-section";

    const header = document.createElement("h2");
    header.className = "group-header";
    header.textContent = `กลุ่ม ${group.name}`;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "accounts-grid";

    if (matchingAccounts.length === 0) {
      const p = document.createElement("p");
      p.textContent = "ไม่มีบัญชีในกลุ่มนี้";
      p.style.textAlign = "center";
      p.style.color = "#888";
      grid.appendChild(p);
    } else {
      matchingAccounts.forEach(acc => {
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.textContent = acc.short;
        btn.title = `${acc.name} - ${acc.no} (${acc.bank})`;

        btn.addEventListener("click", () => {
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
            .catch(err => alert("คัดลอกไม่สำเร็จ: " + err));
        });

        grid.appendChild(btn);
      });
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// โหลดข้อมูลเมื่อหน้าเปิด
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("groups-container");
  container.innerHTML = '<p style="text-align:center; color:#666;">กำลังโหลดข้อมูลจาก Google Sheets...</p>';

  try {
    const accounts = await fetchAccounts();
    renderGroups(accounts);
  } catch (err) {
    console.error('Error:', err);
    container.innerHTML = '<p style="text-align:center; color:red;">ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบ Console (F12) แล้วแจ้ง error: ' + err.message + '</p>';
  }
});
