document.addEventListener("DOMContentLoaded", function() {
    const navContainer = document.getElementById("side-nav-container");
    if (!navContainer) return;

    fetch("nav.html")
        .then(response => response.text())
        .then(data => {
            navContainer.innerHTML = data;
            // تحديد الصفحة الحالية
            const currentPage = window.location.pathname.split("/").pop() || "index.html";
            const allLinks = navContainer.querySelectorAll(".side-nav a");
            allLinks.forEach(link => {
                const href = link.getAttribute("href");
                if (href === currentPage) {
                    link.classList.add("active");
                }
            });

            // ======== إضافة تأثير الإضاءة الذهبية لرابط "منصة الطلبات" ========
            const ordersLink = Array.from(allLinks).find(link => 
                link.textContent.includes("منصة الطلبات") || 
                link.getAttribute("href") === "requests.html" ||
                link.getAttribute("href") === "requests-backend.onrender.com"
            );
            if (ordersLink) {
                ordersLink.classList.add("golden-blink");
            }
        })
        .catch(err => console.error("خطأ في تحميل القائمة:", err));
});
