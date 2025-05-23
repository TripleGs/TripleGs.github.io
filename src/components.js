/**
 * Components Manager
 * Handles loading and functionality of all website components
 */
document.addEventListener("DOMContentLoaded", () => {
    // Load all site components
    loadComponent("navbar", ".navbar");
    loadComponent("footer", ".footer");
    loadComponent("mobile_menu", "#mobileMenu");

    // Initialize carousel if it exists on the page
    if (document.querySelector(".carousel")) {
        initCarousel();
    }
});

/**
 * Loads an HTML component into the target element
 * @param {string} componentName - The name of the component file (without .html)
 * @param {string} targetSelector - CSS selector for the target element
 */
function loadComponent(componentName, targetSelector) {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) return;

    fetch(`/src/components/${componentName}.html`)
        .then(response => response.text())
        .then(data => {
            targetElement.innerHTML = data;

            // Call component-specific initialization if needed
            if (componentName === "navbar") {
                initNavbar();
            }
        })
        .catch(error => console.error(`Error loading ${componentName}:`, error));
}

/**
 * Navbar functionality
 */
function initNavbar() {
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMenu);
    }
}

function toggleMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    // Toggle the active class for both elements
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
}

/**
 * Carousel functionality
 */
function initCarousel() {
    // Carousel logic from carousel_logic.js would go here
} 