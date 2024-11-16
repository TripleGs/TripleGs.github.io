    const slide = document.querySelector('.carousel-slide');
    const images = document.querySelectorAll('.carousel-slide img');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let counter = 0;

    // Ensure the slide has the correct width on load
    const updateSlidePosition = () => {
        slide.style.transform = `translateX(${-counter * 100}%)`;
    };

    // Move to the next slide
    const nextSlide = () => {
        if (counter >= images.length - 1) {
            counter = 0; // Reset to first slide
        } else {
            counter++;
        }
        updateSlidePosition();
    };

    // Move to the previous slide
    const prevSlide = () => {
        if (counter <= 0) {
            counter = images.length - 1; // Go to the last slide
        } else {
            counter--;
        }
        updateSlidePosition();
    };

    // Button event listeners
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Auto-play functionality
    const intervalTime = 3000; // Change slides every 3 seconds
    let slideInterval = setInterval(nextSlide, intervalTime);

    // Pause auto-play when hovering over the buttons
    const pauseAutoPlay = () => clearInterval(slideInterval);
    const resumeAutoPlay = () => slideInterval = setInterval(nextSlide, intervalTime);

    prevBtn.addEventListener('mouseenter', pauseAutoPlay);
    nextBtn.addEventListener('mouseenter', pauseAutoPlay);
    prevBtn.addEventListener('mouseleave', resumeAutoPlay);
    nextBtn.addEventListener('mouseleave', resumeAutoPlay);

    // Debugging Logs
    console.log('Carousel Initialized');
    console.log('Number of images:', images.length);
