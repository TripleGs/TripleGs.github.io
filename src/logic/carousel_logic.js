const slide = document.querySelector('.carousel-slide');
const images = document.querySelectorAll('.carousel-slide img');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

let counter = 0;
const intervalTime = 3000;
let slideInterval;

// Ensure the slide has the correct width on load
const updateSlidePosition = () => {
    slide.style.transform = `translateX(${-counter * 100}%)`;
};

// Debounce function to prevent rapid execution of slide changes
let isTransitioning = false;
const debounceSlideChange = (callback) => {
    if (isTransitioning) return; // Ignore if already transitioning
    isTransitioning = true;

    callback();

    setTimeout(() => {
        isTransitioning = false; // Allow new transitions after debounce time
    }, 500); // Adjust this timeout to match your transition duration
};

// Move to the next slide
const nextSlide = () => {
    debounceSlideChange(() => {
        if (counter >= images.length - 1) {
            counter = 0; // Reset to first slide
        } else {
            counter++;
        }
        updateSlidePosition();
        resetAutoPlay(); // Reset timer on interaction
    });
};

// Move to the previous slide
const prevSlide = () => {
    debounceSlideChange(() => {
        if (counter <= 0) {
            counter = images.length - 1; // Go to the last slide
        } else {
            counter--;
        }
        updateSlidePosition();
        resetAutoPlay(); // Reset timer on interaction
    });
};

// Auto-play functionality
const startAutoPlay = () => {
    slideInterval = setInterval(nextSlide, intervalTime);
};

const resetAutoPlay = () => {
    clearInterval(slideInterval);
    startAutoPlay();
};

// Button event listeners
nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

// Pause auto-play when hovering over the buttons
prevBtn.addEventListener('mouseenter', () => clearInterval(slideInterval));
nextBtn.addEventListener('mouseenter', () => clearInterval(slideInterval));
prevBtn.addEventListener('mouseleave', resetAutoPlay);
nextBtn.addEventListener('mouseleave', resetAutoPlay);

// Start auto-play initially
startAutoPlay();
