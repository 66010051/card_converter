document.addEventListener("DOMContentLoaded", function () {

    const preElement = document.getElementById("cardTrackingData");
    if (!preElement) {
        console.error("ไม่พบ cardTrackingData");
        return;
    }

    const inputText = preElement.textContent.trim();
    const groupedCards = {};

    /* ===========================
       PARSE INPUT
    =========================== */

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

    /* ===========================
       PREPARE BOARD
    =========================== */

    const boardElement = document.getElementById("cardFront");

    if (!boardElement) {
        console.error("ไม่พบ div id=cardFront");
        return;
    }

    // ป้องกัน render ซ้ำ
    boardElement.innerHTML = "";

    const suitMap = {
        "S": { symbol: "♠" },
        "H": { symbol: "♥" },
        "D": { symbol: "♦" },
        "C": { symbol: "♣" }
    };

    /* ===========================
       RENDER CARDS
    =========================== */

    const suitOrder = ["C", "D", "H", "S"];

    suitOrder.forEach(key => {

        const group = groupedCards[key];
        if (!group) return;

        group.forEach(card => {

            const suitData = suitMap[key];
            const isRed = (key === "H" || key === "D");
            const color = isRed ? "#d40000" : "#111";

            const groupTitle = `${key}-${card.value} #${boardElement.children.length + 1}`;

            const groupWrapper = document.createElement("div");
            groupWrapper.classList.add("group-wrapper");

            const titleElement = document.createElement("div");
            titleElement.classList.add("group-title");
            titleElement.textContent = groupTitle;

            const cardElement = document.createElement("div");
            cardElement.style.display = "inline-block";

            cardElement.innerHTML = `
                <div style="
                    width:63mm;
                    height:95mm;
                    box-sizing:border-box;
                    background:#fff;
                    border:2px solid #111;
                    border-radius:10px;
                    position:relative;
                    padding:12px;
                    font-family:Arial,sans-serif;
                ">

                    <div style="
                        position:absolute;
                        top:10px;
                        left:12px;
                        font-weight:bold;
                        font-size:22px;
                        text-align:center;
                        line-height:1.2;
                        color:${color};
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
                        font-weight:bold;
                        font-size:22px;
                        text-align:center;
                        line-height:1.2;
                        color:${color};
                    ">
                        <div>${card.value}</div>
                        <div>${suitData.symbol}</div>
                    </div>

                </div>
            `;

            groupWrapper.appendChild(titleElement);
            groupWrapper.appendChild(cardElement);
            document.getElementById("pdfHidden").appendChild(groupWrapper);
            // boardElement.append(groupWrapper);

        });

    });

    console.log("Total cards on screen:", boardElement.children.length);

    /* ===========================
       PDF EXPORT
    =========================== */

    const printBtn = document.getElementById("print-front-btn");

    if (!printBtn) return;

    printBtn.addEventListener("click", async () => {

        document.getElementById("status").style.display = "block";
        document.getElementById("status").textContent = "Processing...";
        printBtn.disabled = true;

        const board = document.getElementById("cardFront");
        const cards = Array.from(board.children);

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("portrait", "mm", "a4");

        const cardWidth = 63;
        const cardHeight = 95;

        const spacingX = 5;
        const spacingY = 2;

        const startX = 5;
        const startY = 5;

        const cardsPerPage = 9;

        const pages = [];

        for (let i = 0; i < cards.length; i += cardsPerPage) {
            pages.push(cards.slice(i, i + cardsPerPage));
        }

        for (let p = 0; p < pages.length; p++) {

            if (p > 0) pdf.addPage();

            let row = 0;
            let col = 0;

            const pageCards = pages[p];

            for (let j = 0; j < pageCards.length; j++) {

                const card = pageCards[j];

                const canvas = await html2canvas(card, { scale: 2 });

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

        }

        pdf.save("cards.pdf");

        document.getElementById("status").textContent = "Done";
        printBtn.disabled = false;

    });

});