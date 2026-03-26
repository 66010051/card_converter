document.addEventListener("DOMContentLoaded", function () {

    const preElement = document.getElementById("cardTrackingData");
    if (!preElement) {
        console.error("ไม่พบ cardTrackingData");
        return;
    }

    const inputText = preElement.textContent.trim();
    const groupedCards = {};

    inputText.split("\n").forEach(line => {

        const [card, direction] = line.trim().split("=");
        if (!card || !direction) return;

        const card_type = card[0];
        const value = card.slice(1);

        if (!groupedCards[card_type]) {
            groupedCards[card_type] = [];
        }

        groupedCards[card_type].push({ value, direction });

    });

    const boardBack = document.getElementById("board");
    const boardFront = document.getElementById("cardFront");

    const suitMap = {
        S: { symbol: "♠" },
        H: { symbol: "♥" },
        D: { symbol: "♦" },
        C: { symbol: "♣" }
    };

    /* ===========================
       🎴 สร้างไพ่
    =========================== */

    Object.keys(groupedCards).forEach(key => {

        const group = groupedCards[key];

        group.forEach(card => {

            const groupTitle = `${key}-${card.value}`;

            /* -------- BACK CARD -------- */

            const backWrapper = document.createElement("div");
            backWrapper.classList.add("group-wrapper");

            const titleElement = document.createElement("div");
            titleElement.classList.add("group-title");
            titleElement.textContent = groupTitle;

            const table = document.createElement("table");
            table.classList.add("direction-table");

            const directions = card.direction.split("");

            let row;
            directions.forEach((dir, index) => {

                if (index % 2 === 0) {
                    row = document.createElement("tr");
                    table.appendChild(row);
                }

                const cell = document.createElement("td");
                cell.classList.add("direction-cell");
                cell.textContent = dir;

                row.appendChild(cell);

            });

            backWrapper.appendChild(titleElement);
            backWrapper.appendChild(table);

            // boardBack.appendChild(backWrapper);
            document.getElementById("pdfHidden").appendChild(backWrapper);

            /* -------- FRONT CARD -------- */

            const suitData = suitMap[key];
            const isRed = (key === "H" || key === "D");
            const color = isRed ? "#d40000" : "#111";

            const frontWrapper = document.createElement("div");
            frontWrapper.classList.add("group-wrapper");

            const titleFront = document.createElement("div");
            titleFront.classList.add("group-title");
            titleFront.textContent = groupTitle;

            const cardElement = document.createElement("div");
            cardElement.style.display = "inline-block";

            cardElement.innerHTML = `
                <div style="
                    width:63mm;
                    height:95mm;
                    background:#fff;
                    border:2px solid #111;
                    border-radius:10px;
                    position:relative;
                    padding:12px;
                    box-sizing:border-box;
                    font-family:Arial;
                ">

                    <div style="
                        position:absolute;
                        top:10px;
                        left:12px;
                        font-size:22px;
                        font-weight:bold;
                        line-height:1.2;
                        color:${color};
                        text-align:center;
                    ">
                        <div>${card.value}</div>
                        <div>${suitData.symbol}</div>
                    </div>

                    <div style="
                        position:absolute;
                        top:50%;
                        left:50%;
                        transform:translate(-50%,-50%);
                        font-size:70px;
                        color:${color};
                    ">
                        ${suitData.symbol}
                    </div>

                    <div style="
                        position:absolute;
                        bottom:10px;
                        right:12px;
                        transform:rotate(180deg);
                        font-size:22px;
                        font-weight:bold;
                        line-height:1.2;
                        color:${color};
                        text-align:center;
                    ">
                        <div>${card.value}</div>
                        <div>${suitData.symbol}</div>
                    </div>

                </div>
            `;

            frontWrapper.appendChild(titleFront);
            frontWrapper.appendChild(cardElement);
            // boardFront.appendChild(frontWrapper);
            document.getElementById("pdfHidden").appendChild(frontWrapper);

        });

    });

    /* ===========================
       📄 PDF SYSTEM (Duplex)
    =========================== */

    const printBtn = document.getElementById("print-2side-btn");

    if (!printBtn) return;

    printBtn.addEventListener("click", async () => {

        document.getElementById("status").style.display = "block";
        document.getElementById("status").textContent = "Processing...";

        printBtn.disabled = true;

        const frontCards = Array.from(boardFront.children);
        const backCards = Array.from(boardBack.children);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("portrait", "mm", "a4");

        const cardWidth = 63;
        const cardHeight = 95;

        const spacingX = 5;
        const spacingY = 2;

        const startX = 5;
        const startY = 5;

        const cardsPerPage = 9;

        const frontPages = [];
        const backPages = [];

        for (let i = 0; i < frontCards.length; i += cardsPerPage) {
            frontPages.push(frontCards.slice(i, i + cardsPerPage));
        }

        for (let i = 0; i < backCards.length; i += cardsPerPage) {
            backPages.push(backCards.slice(i, i + cardsPerPage));
        }

        const totalPages = Math.max(frontPages.length, backPages.length);

        for (let p = 0; p < totalPages; p++) {

            /* FRONT PAGE */

            if (p > 0) pdf.addPage();

            let row = 0;
            let col = 0;

            const front = frontPages[p] || [];

            for (let j = 0; j < front.length; j++) {

                const canvas = await html2canvas(front[j], { scale: 2 });
                const imgData = canvas.toDataURL("image/png");

                let x = startX + col * (cardWidth + spacingX);
                let y = startY + row * (cardHeight + spacingY);

                pdf.addImage(imgData, "PNG", x, y, cardWidth, cardHeight);

                col++;

                if (col >= 3) {
                    col = 0;
                    row++;
                }

            }

            /* BACK PAGE */

            pdf.addPage();

            row = 0;
            col = 0;

            const back = backPages[p] || [];

            for (let j = 0; j < back.length; j++) {

                const canvas = await html2canvas(back[j], { scale: 2 });
                const imgData = canvas.toDataURL("image/png");

                // mirror สำหรับพิมพ์หลัง
                let x = startX + (2 - col) * (cardWidth + spacingX);
                let y = startY + row * (cardHeight + spacingY);

                pdf.addImage(imgData, "PNG", x, y, cardWidth, cardHeight);

                col++;

                if (col >= 3) {
                    col = 0;
                    row++;
                }

            }

        }

        pdf.save("cards_duplex.pdf");

        document.getElementById("status").textContent = "Done";

        printBtn.disabled = false;

    });

});