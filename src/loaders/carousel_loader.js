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
    const items = document.querySelectorAll('.carousel-item');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const indicatorsContainer = document.querySelector('.carousel-indicators');

    let counter = 0;
    let slideInterval = null;
    const intervalTime = 3000; // Change slides every 3 seconds
    let isTransitioning = false; // Track if the carousel is transitioning

    // Create indicator dots dynamically
    items.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        if (index === 0) indicator.classList.add('active');
        indicatorsContainer.appendChild(indicator);
    });

    const indicators = document.querySelectorAll('.indicator');

    const updateSlidePosition = () => {
        slide.style.transition = "transform 0.5s ease-in-out";
        slide.style.transform = `translateX(${-counter * 100}%)`;
        updateIndicators();
    };

    const updateIndicators = () => {
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === counter);
        });
    };

    const nextSlide = () => {
        if (isTransitioning) return;
        isTransitioning = true;
        if (counter >= items.length - 1) {
            counter = 0; // Reset to first slide
        } else {
            counter++;
        }
        updateSlidePosition();
    };

    const prevSlide = () => {
        if (isTransitioning) return;
        isTransitioning = true;
        if (counter <= 0) {
            counter = items.length - 1; // Go to the last slide
        } else {
            counter--;
        }
        updateSlidePosition();
    };

    // Reset the autoplay timer without stacking intervals
    const resetAutoplay = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            nextSlide();
        }, intervalTime);
    };

    // Remove transition lock when animation ends
    slide.addEventListener('transitionend', () => {
        isTransitioning = false;
    });

    // Add event listeners for navigation
    nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoplay();
    });

    prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoplay();
    });

    // Add click event to indicators
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            if (isTransitioning) return;
            counter = index;
            updateSlidePosition();
            resetAutoplay();
        });
    });

    // Auto-play slides
    const startAutoplay = () => {
        slideInterval = setInterval(nextSlide, intervalTime);
    };

    startAutoplay();

    // Pause and resume autoplay on button hover
    const pauseAutoPlay = () => clearInterval(slideInterval);
    const resumeAutoPlay = () => resetAutoplay();

    prevBtn.addEventListener('mouseenter', pauseAutoPlay);
    nextBtn.addEventListener('mouseenter', pauseAutoPlay);
    prevBtn.addEventListener('mouseleave', resumeAutoPlay);
    nextBtn.addEventListener('mouseleave', resumeAutoPlay);
}
