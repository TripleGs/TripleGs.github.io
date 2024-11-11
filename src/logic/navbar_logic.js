function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    
    // Toggle the active class for both elements
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
}
