// script.js - เชื่อม Google Sheets ผ่าน Apps Script (private)

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJj97YN4silaFXe5I0FwuKPSOZGwu41erD_86u5P3PgosuyvTxr2aY9lTr5X-5Ek05-g/exec';  // วาง Web app URL ที่ได้จากขั้นตอน 1 ที่นี่
const SECRET_KEY = 'sAuTaaxokJAPUbbqe7UtKy';  // ต้องตรงกับใน Apps Script เป๊ะ ๆ

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

async function fetchAccounts() {
  try {
    const url = `${APPS_SCRIPT_URL}?secret=${encodeURIComponent(SECRET_KEY)}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const accounts = await response.json();

    // ถ้า Apps Script ส่ง error กลับมา
    if (accounts.error) {
      throw new Error(accounts.error);
    }

    // fallback short ถ้าว่าง
    return accounts.map(acc => ({
      ...acc,
      short: acc.short || `${acc.bank}-${acc.no.slice(-5)}`
    }));

  } catch (error) {
    console.error('Error fetching data:', error);
    alert('ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบ:\n- Web app URL\n- Secret key\n- Sheet ชื่อ Sheet1 และ header');
    return [];
  }
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

  const accounts = await fetchAccounts();
  renderGroups(accounts);
});
