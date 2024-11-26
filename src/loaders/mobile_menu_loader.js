document.addEventListener("DOMContentLoaded", () => {
    fetch("/src/elements/mobile_menu.html")
        .then(response => response.text())
        .then(data => {
            document.querySelector(".mobile-menu").innerHTML = data;
        })
        .catch(error => console.error("Error loading navbar:", error));
});
