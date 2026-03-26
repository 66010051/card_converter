document.addEventListener("DOMContentLoaded", function () {

    const preElement = document.getElementById("cardTrackingData");
    if (!preElement) {
        console.error("ไม่พบ cardTrackingData");
        return;
    }

    const inputText = preElement.textContent.trim();
    const groupedCards = {};

    /* ===========================
       1. PARSE INPUT (ดึงข้อมูล)
    =========================== */
    inputText.split("\n").forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const [card, direction] = trimmedLine.split("=");
        if (!card || !direction) return;

        const card_type = card[0];
        const value = card.slice(1);

        if (!groupedCards[card_type]) {
            groupedCards[card_type] = [];
        }
        groupedCards[card_type].push({ value, direction });
    });

    const boardFront = document.getElementById("cardFront");
    const boardBack = document.getElementById("board");

    if (!boardFront || !boardBack) {
        console.error("ไม่พบ div id=cardFront หรือ id=board");
        return;
    }

    // ป้องกัน render ซ้ำ
    boardFront.innerHTML = "";
    boardBack.innerHTML = "";

    const suitMap = {
        "S": { symbol: "♠" },
        "H": { symbol: "♥" },
        "D": { symbol: "♦" },
        "C": { symbol: "♣" }
    };

    /* ===========================
       2. RENDER CARDS (สร้างไพ่ลงหน้าเว็บ)
    =========================== */
    const suitOrder = ["C", "D", "H", "S"]; // ลำดับดอกไพ่
    let cardCounter = 1;

    suitOrder.forEach(key => {
        const group = groupedCards[key];
        if (!group) return;

        group.forEach(card => {
            const suitData = suitMap[key];
            const isRed = (key === "H" || key === "D");
            const color = isRed ? "#d40000" : "#111";

            const groupTitle = `${key}-${card.value}`;

            /* -------- FRONT CARD -------- */
            const frontWrapper = document.createElement("div");
            frontWrapper.classList.add("group-wrapper");

            const frontTitle = document.createElement("div");
            frontTitle.classList.add("group-title");
            frontTitle.textContent = groupTitle;

            const frontCardElement = document.createElement("div");
            frontCardElement.classList.add("render-target-front"); // เป้าหมายสำหรับแคปรูป
            frontCardElement.style.display = "inline-block";

            // ดีไซน์หน้าไพ่ที่คุณต้องการ
            frontCardElement.innerHTML = `
                <div style="
                    width:63mm; height:95mm; background:#fff; border:2px solid #111;
                    border-radius:10px; position:relative; padding:12px;
                    box-sizing:border-box; font-family:Arial;
                ">
                    <div style="
                        position:absolute; top:10px; left:12px; font-size:22px;
                        font-weight:bold; line-height:1.2; color:${color}; text-align:center;
                    ">
                        <div>${card.value}</div>
                        <div>${suitData.symbol}</div>
                    </div>
                    <div style="
                        position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
                        font-size:70px; color:${color};
                    ">
                        ${suitData.symbol}
                    </div>
                    <div style="
                        position:absolute; bottom:10px; right:12px; transform:rotate(180deg);
                        font-size:22px; font-weight:bold; line-height:1.2;
                        color:${color}; text-align:center;
                    ">
                        <div>${card.value}</div>
                        <div>${suitData.symbol}</div>
                    </div>
                </div>
            `;

            frontWrapper.appendChild(frontTitle);
            frontWrapper.appendChild(frontCardElement);
            boardFront.appendChild(frontWrapper);

            /* -------- BACK CARD -------- */
            const backWrapper = document.createElement("div");
            backWrapper.classList.add("group-wrapper");

            const backTitle = document.createElement("div");
            backTitle.classList.add("group-title");
            backTitle.textContent = groupTitle;

            const backTable = document.createElement("table");
            backTable.classList.add("direction-table", "render-target-back"); // เป้าหมายสำหรับแคปรูป

            const directions = card.direction.split("");
            let row;
            directions.forEach((dir, index) => {
                if (index % 2 === 0) {
                    row = document.createElement("tr");
                    backTable.appendChild(row);
                }
                const cell = document.createElement("td");
                cell.classList.add("direction-cell");
                cell.textContent = dir;
                row.appendChild(cell);
            });

            backWrapper.appendChild(backTitle);
            backWrapper.appendChild(backTable);
            boardBack.appendChild(backWrapper);

            cardCounter++;
        });
    });

    console.log("Total cards mapped:", boardFront.children.length);

    /* ===========================
       3. PDF EXPORT ENGINE (รวม Progress Bar)
    =========================== */
    const progressBar = document.querySelector(".progress-bar");
    const progressCard = document.querySelector(".progress-card");
    const statusText = document.getElementById("status");

    // ฟังก์ชันหลักสำหรับเจน PDF รับค่า mode ว่าจะปริ้นอะไร
    async function generatePDF(mode, btnElement) {
        if (!btnElement) return;

        // จัดการ UI
        const originalText = btnElement.textContent;
        btnElement.textContent = "Downloading...";
        btnElement.classList.add("loading");
        btnElement.disabled = true;

        if (statusText) {
            statusText.style.display = "block";
            statusText.textContent = "Processing...";
        }

        const frontCards = Array.from(boardFront.children);
        const backCards = Array.from(boardBack.children);
        
        let totalCardsToProcess = 0;
        if (mode === "front") totalCardsToProcess = frontCards.length;
        if (mode === "back") totalCardsToProcess = backCards.length;
        if (mode === "duplex") totalCardsToProcess = frontCards.length + backCards.length;

        let processedCards = 0;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("portrait", "mm", "a4");

        const cardWidth = 63;
        const cardHeight = 95;
        const spacingX = 5;
        const spacingY = 2;
        const startX = 5;
        const startY = 5;

        // Helper function สำหรับวาดไพ่ลง 1 หน้า (สูงสุด 9 ใบ)
        async function drawPage(cardsToDraw, isBack) {
            let row = 0, col = 0;
            const targetSelector = isBack ? ".render-target-back" : ".render-target-front";

            for (let j = 0; j < cardsToDraw.length; j++) {
                const targetEl = cardsToDraw[j].querySelector(targetSelector);
                if (!targetEl) continue;

                const canvas = await html2canvas(targetEl, { scale: 2 });
                const imgData = canvas.toDataURL("image/png");

                // ถ้าเป็นหน้าหลัง ต้อง Mirror ตะแคงสลับด้านเพื่อให้ตรงกับหน้า (Duplex alignment)
                let x = isBack ? startX + (2 - col) * (cardWidth + spacingX) : startX + col * (cardWidth + spacingX);
                let y = startY + row * (cardHeight + spacingY);

                pdf.addImage(imgData, "PNG", x, y, cardWidth, cardHeight);

                // อัปเดต Progress Bar
                processedCards++;
                if (progressBar && progressCard) {
                    const progress = (processedCards / totalCardsToProcess) * 100;
                    progressBar.style.width = `${progress}%`;
                    progressCard.style.left = `${progress}%`;
                }

                col++;
                if (col >= 3) {
                    col = 0;
                    row++;
                }
            }
        }

        try {
            const cardsPerPage = 9;

            if (mode === "front" || mode === "back") {
                const targetDeck = mode === "front" ? frontCards : backCards;
                for (let i = 0; i < targetDeck.length; i += cardsPerPage) {
                    if (i > 0) pdf.addPage();
                    await drawPage(targetDeck.slice(i, i + cardsPerPage), mode === "back");
                }
                pdf.save(`Cards_${mode}.pdf`);
            } 
            else if (mode === "duplex") {
                const totalPages = Math.ceil(Math.max(frontCards.length, backCards.length) / cardsPerPage);
                for (let p = 0; p < totalPages; p++) {
                    if (p > 0) pdf.addPage(); // หน้าแรกไม่แอดเพจ
                    // วาดหน้า (Front)
                    await drawPage(frontCards.slice(p * cardsPerPage, (p + 1) * cardsPerPage), false);
                    
                    pdf.addPage();
                    // วาดหลัง (Back)
                    await drawPage(backCards.slice(p * cardsPerPage, (p + 1) * cardsPerPage), true);
                }
                pdf.save("Cards_Duplex.pdf");
            }

            if (statusText) statusText.textContent = "Done!";

        } catch (error) {
            console.error("Error generating PDF:", error);
            if (statusText) statusText.textContent = "Error occurred!";
        }

        // รีเซ็ต UI
        setTimeout(() => {
            if (progressBar) progressBar.style.width = "0";
            if (progressCard) progressCard.style.left = "0";
            if (statusText) statusText.style.display = "none";
        }, 1500);

        btnElement.textContent = originalText;
        btnElement.classList.remove("loading");
        btnElement.disabled = false;
    }

    /* ===========================
       4. BIND BUTTONS
    =========================== */
    const btnFront = document.getElementById("print-front-btn");
    const btnBack = document.getElementById("print-back-btn");
    const btnDuplex = document.getElementById("print-duplex-btn");

    if (btnFront) btnFront.addEventListener("click", () => generatePDF("front", btnFront));
    if (btnBack) btnBack.addEventListener("click", () => generatePDF("back", btnBack));
    if (btnDuplex) btnDuplex.addEventListener("click", () => generatePDF("duplex", btnDuplex));

});