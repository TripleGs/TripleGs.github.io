document.addEventListener("DOMContentLoaded", () => {
    fetch("src/elements/footer.html")
        .then(response => response.text())
        .then(data => {
            document.querySelector(".footer").innerHTML = data;
        })
        .catch(error => console.error("Error loading navbar:", error));
});