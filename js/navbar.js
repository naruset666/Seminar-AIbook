document.addEventListener("DOMContentLoaded", async () => {

    const navbar = document.getElementById("navbar");

    if (!navbar) {
        console.error("ไม่พบ #navbar");
        return;
    }

    try {

        const response = await fetch("components/navbar.html");

        if (!response.ok) {
            throw new Error("โหลด navbar.html ไม่สำเร็จ");
        }

        navbar.innerHTML = await response.text();

        console.log("NAVBAR LOADED");


        // =========================
        // ตรวจหน้าปัจจุบัน
        // =========================

        let currentPage = window.location.pathname.split("/").pop();

        // ถ้าไม่มีชื่อไฟล์ → ถือว่าเป็น index.html
        if (currentPage === "") {
            currentPage = "index.html";
        }


        // =========================
        // ใส่ active ให้หน้าปัจจุบัน
        // =========================

        const navLinks = navbar.querySelectorAll(".nav-links a");

        navLinks.forEach(link => {

            const linkPage = link.getAttribute("href");

            if (linkPage === currentPage) {
                link.classList.add("active");
            }

        });

    } catch (error) {

        console.error("Navbar Error:", error);

    }

    // =========================
    // MENU DROPDOWN
    // =========================

    const menuButton = navbar.querySelector("#menuButton");
    const menuDropdown = navbar.querySelector("#menuDropdown");

    menuButton.addEventListener("click", (event) => {

        event.stopPropagation();

        menuDropdown.classList.toggle("show");

    });


    // กดข้างนอก Dropdown → ปิด

    document.addEventListener("click", (event) => {

        if (!navbar.contains(event.target)) {

            menuDropdown.classList.remove("show");

        }

    });


});