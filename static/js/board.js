document.addEventListener("DOMContentLoaded", function () {
    const preElement = document.getElementById("cardTrackingData");
    if (!preElement) {
        console.error("ไม่พบข้อมูลใน <pre> ที่กำหนด");
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

    const boardElement = document.getElementById("board");

    Object.keys(groupedCards).forEach(key => {
        const group = groupedCards[key];

        group.forEach(card => {
            const groupTitle = `${key}-${card.value}`;

            const groupWrapper = document.createElement("div");
            groupWrapper.classList.add("group-wrapper");

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

            groupWrapper.appendChild(titleElement);
            groupWrapper.appendChild(table);
            // boardElement.append(groupWrapper);
        });
    });

    console.log("Document Loaded!");

    const printBtn = document.getElementById("print-btn");
    const progressBar = document.querySelector(".progress-bar");
    const progressCard = document.querySelector(".progress-card");

    printBtn.addEventListener("click", async () => {
        document.getElementById("status").style.display = "block";
        document.getElementById("status").textContent = "Processing...";
        printBtn.textContent = "Downloading...";
        printBtn.classList.add("loading");
        printBtn.disabled = true;
    
        const board = document.getElementById("board");
        const cards = Array.from(board.children);
        const cardsPerPage = 9;
        const totalCards = cards.length;
        const totalPages = Math.ceil(totalCards / cardsPerPage);
        let processedCards = 0;
    
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF("portrait", "mm", "a4");
    
        const cardWidth = 63;
        const cardHeight = 95;
        const spacingX = 5;
        const spacingY = 2;
        const startX = 5;
        const startY = 5;
    
        let pageIndex = 0;
    
        for (let i = 0; i < cards.length; i += cardsPerPage) {
            if (pageIndex > 0) pdf.addPage();
    
            let row = 0, col = 0;
    
            for (let j = 0; j < cardsPerPage && i + j < cards.length; j++) {
                const card = cards[i + j];
    
                await html2canvas(card, { scale: 2 }).then((canvas) => {
                    const imgData = canvas.toDataURL("image/png");
    
                    let x = startX + col * (cardWidth + spacingX);
                    let y = startY + row * (cardHeight + spacingY);
    
                    pdf.addImage(imgData, "PNG", x, y, cardWidth, cardHeight);
    
                    processedCards++;
                    const progress = (processedCards / totalCards) * 100;
                    progressBar.style.width = `${progress}%`;
                    progressCard.style.left = `${progress}%`;
                });
    
                col++;
                if (col >= 3) {
                    col = 0;
                    row++;
                }
            }
            pageIndex++;
        }
    
        try {
            pdf.save("cards.pdf");
            document.getElementById("status").textContent = "Done";
            console.log("PDF ถูกสร้างและดาวน์โหลดแล้ว");
        } catch (error) {
            console.error("Error generating PDF:", error);
            document.getElementById("status").textContent = "There's something wrong";
        }
    
        progressBar.style.width = "100%";
        progressCard.style.left = "100%";
        setTimeout(() => {
            progressBar.style.width = "0";
            progressCard.style.left = "0";
            document.getElementById("status").style.display = "none";
        }, 500);
    
        printBtn.textContent = "DOWNLOAD";
        printBtn.classList.remove("loading");
        printBtn.disabled = false;
    });
});






    // const printBtn = document.getElementById("print-btn");

    // printBtn.addEventListener("click", () => {
    //     printBtn.textContent = "Downloading..."; // เปลี่ยนข้อความปุ่ม
    //     printBtn.disabled = true; // ปิดปุ่มชั่วคราว

    //     try {
    //         const element = document.getElementById("board");  // กำหนดเป็นส่วนของเนื้อหาที่จะพิมพ์
    //         const options = {
    //             margin:       10,  // ขอบกระดาษ
    //             filename:     'cards.pdf',  // ชื่อไฟล์ PDF
    //             image:        { type: 'jpeg', quality: 0.98 },  // กำหนดคุณภาพของรูปภาพ
    //             html2canvas:  { scale: 1 },  // กำหนดการแสดงผลของ html2canvas
    //             jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }  // กำหนดขนาดกระดาษ A4
    //         };

    //         html2pdf()
    //             .from(element)  // แปลงเนื้อหาจาก element นี้
    //             .set(options)    // ตั้งค่า PDF
    //             .save();         // บันทึก PDF
    //     }catch (error) {
    //         console.error("Error generating PDF:", error);
    //     }
    //     printBtn.textContent = "Print to PDF"; // เปลี่ยนกลับเป็นปกติ
    //     printBtn.disabled = false; // เปิดใช้งานปุ่มอีกครั้ง


    // });
