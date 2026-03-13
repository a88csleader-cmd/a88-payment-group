// ข้อมูลตัวอย่าง (copy จากเอกสาร Excel ของคุณ)
// ต่อไปสามารถเปลี่ยนเป็น fetch จาก Google Sheet ได้
const accounts = [
  { name: "Kanchana Mancharoen", no: "2685324093", bank: "BBL", short: "BBL-324093", groups: ["A884"] },
  { name: "ratree chaujit", no: "8540983699", bank: "KTB", short: "KTB-983699", groups: ["A883", "WC22"] },
  { name: "Sa-nah Chehlae", no: "9073326753", bank: "KTB", short: "KTB-326753", groups: ["A88", "0", "1", "2", "AF", "AFF"] },
  { name: "Sareena Salaeh", no: "9253023007", bank: "KTB", short: "KTB-023007", groups: ["THNA"] },
  { name: "Nuriyah Jehlor", no: "9073431409", bank: "KTB", short: "KTB-31409", groups: ["THNB"] },
  { name: "Wannaphat Thammarugsa", no: "9212440197", bank: "SCB", short: "SCB-440197", groups: ["THCA"] },
  { name: "Sa-Nah Chehlae", no: "6094408567", bank: "SCB", short: "SCB-408567", groups: ["THVA"] },
  { name: "Ruseeta A Wae", no: "6094349674", bank: "SCB", short: "SCB-349674", groups: ["AO"] },
  // เพิ่มบัญชีอื่น ๆ ได้ที่นี่
];

// กำหนด 8 กลุ่ม (ตามที่คุณบอก)
const paymentGroups = [
  { name: "A884",          key: "A884" },
  { name: "A883, WC22",    keys: ["A883", "WC22"] },
  { name: "A88, 0, 1, 2, AF, AFF", keys: ["A88", "0", "1", "2", "AF", "AFF"] },
  { name: "THNA",          key: "THNA" },
  { name: "THNB",          key: "THNB" },
  { name: "THCA",          key: "THCA" },
  { name: "THVA",          key: "THVA" },
  { name: "AO",            key: "AO"   },
];

function renderGroups() {
  const container = document.getElementById("groups-container");
  container.innerHTML = "";

  paymentGroups.forEach(group => {
    // หาบัญชีที่อยู่ในกลุ่มนี้
    let matchingAccounts = accounts.filter(acc => {
      if (group.key) {
        return acc.groups.includes(group.key);
      } else if (group.keys) {
        return group.keys.some(k => acc.groups.includes(k));
      }
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
            .then(() => {
              alert(`คัดลอกเรียบร้อยแล้ว!\n\n${fullText}`);
            })
            .catch(err => {
              console.error("Clipboard error:", err);
              alert("คัดลอกไม่สำเร็จ กรุณาลองใหม่หรือคัดลอกด้วยมือ");
            });
        });

        grid.appendChild(btn);
      });
    }

    section.appendChild(grid);
    container.appendChild(section);
  });
}

// รันเมื่อหน้าโหลดเสร็จ
document.addEventListener("DOMContentLoaded", renderGroups);
