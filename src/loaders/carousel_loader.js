document.addEventListener("DOMContentLoaded", () => {
    fetch("src/elements/carousel.html")
        .then(response => response.text())
        .then(data => {
            document.querySelector(".carousel").innerHTML = data;

            // Initialize the carousel logic after the content is loaded
            initializeCarousel();
        })
        .catch(error => console.error("Error loading carousel:", error));
});

// Function to initialize the carousel logic
function initializeCarousel() {
    const slide = document.querySelector('.carousel-slide');
    const images = document.querySelectorAll('.carousel-slide img');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let counter = 0;

    const updateSlidePosition = () => {
        slide.style.transform = `translateX(${-counter * 100}%)`;
    };

    const nextSlide = () => {
        if (counter >= images.length - 1) {
            counter = 0; // Reset to first slide
        } else {
            counter++;
        }
        updateSlidePosition();
    };

    const prevSlide = () => {
        if (counter <= 0) {
            counter = images.length - 1; // Go to the last slide
        } else {
            counter--;
        }
        updateSlidePosition();
    };

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    const intervalTime = 3000; // Change slides every 3 seconds
    let slideInterval = setInterval(nextSlide, intervalTime);

    const pauseAutoPlay = () => clearInterval(slideInterval);
    const resumeAutoPlay = () => slideInterval = setInterval(nextSlide, intervalTime);

    prevBtn.addEventListener('mouseenter', pauseAutoPlay);
    nextBtn.addEventListener('mouseenter', pauseAutoPlay);
    prevBtn.addEventListener('mouseleave', resumeAutoPlay);
    nextBtn.addEventListener('mouseleave', resumeAutoPlay);

    console.log('Carousel Initialized');
    console.log('Number of images:', images.length);
}
