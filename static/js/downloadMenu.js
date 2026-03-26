document.addEventListener("DOMContentLoaded", () => {

    const btn = document.getElementById("download-btn");
    const box = document.getElementById("download-options");

    btn.addEventListener("click", () => {

        btn.style.display = "none";
        box.style.display = "block";

    });

    document.getElementById("board-download").onclick = () => {
        document.getElementById("print-btn").click();
    };

    document.getElementById("front-download").onclick = () => {
        document.getElementById("print-front-btn").click();
    };

    document.getElementById("duplex-download").onclick = () => {
        document.getElementById("print-2side-btn").click();
    };

});