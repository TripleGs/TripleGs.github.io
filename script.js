// Create misty background effect
const createMistyBackground = () => {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 15; // Fewer particles since they're larger

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'mist-particle';

        // Random initial position
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';

        // Random size (larger for mist effect)
        const size = Math.random() * 200 + 100;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        // Random animation delay
        particle.style.animationDelay = Math.random() * 8 + 's';

        // Random animation duration
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's';

        particlesContainer.appendChild(particle);
    }
};

// Click effect
const createClickEffect = (e) => {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'click-effect';
    clickEffect.style.left = e.clientX + 'px';
    clickEffect.style.top = e.clientY + 'px';

    document.body.appendChild(clickEffect);

    // Remove the element after animation
    clickEffect.addEventListener('animationend', () => {
        clickEffect.remove();
    });
};

// Create circuit board effect
const createCircuitBackground = () => {
    const hero = document.querySelector('.hero');
    const nodeCount = 12;
    const nodes = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        node.className = 'circuit-node';

        // Random initial position
        node.style.left = Math.random() * 100 + '%';
        node.style.top = Math.random() * 100 + '%';

        // Random size
        const size = Math.random() * 6 + 4;
        node.style.width = size + 'px';
        node.style.height = size + 'px';

        // Random animation delay
        node.style.animationDelay = Math.random() * 4 + 's';

        hero.appendChild(node);
        nodes.push(node);
    }

    // Create connecting lines between nodes
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (Math.random() < 0.3) { // 30% chance to create a line
                const line = document.createElement('div');
                line.className = 'circuit-line';

                const node1 = nodes[i];
                const node2 = nodes[j];

                const x1 = parseFloat(node1.style.left);
                const y1 = parseFloat(node1.style.top);
                const x2 = parseFloat(node2.style.left);
                const y2 = parseFloat(node2.style.top);

                // Calculate line position and rotation
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

                line.style.width = length + '%';
                line.style.left = x1 + '%';
                line.style.top = y1 + '%';
                line.style.transform = `rotate(${angle}deg)`;
                line.style.transformOrigin = '0 0';

                // Random animation delay
                line.style.animationDelay = Math.random() * 4 + 's';

                hero.appendChild(line);
            }
        }
    }
};

// Initialize misty background and click effect
window.addEventListener('load', () => {
    createCircuitBackground();
    createMistyBackground();
    document.addEventListener('click', createClickEffect);
});

// Custom cursor
const cursor = document.querySelector('.cursor');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
});

document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar background change on scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.8)';
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Add hover effect to project cards
const createProjectCard = (title, description, image, link) => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
        <div class="project-image">
            <img src="${image}" alt="${title}">
        </div>
        <div class="project-info">
            <h3>${title}</h3>
            <p>${description}</p>
            <a href="${link}" class="project-link">View Project</a>
        </div>
    `;
    return card;
};

// Add parallax effect to hero section
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    hero.style.backgroundPositionY = scrolled * 0.5 + 'px';
});

// Add typing effect to subtitle
const subtitle = document.querySelector('.subtitle');
const ctaButtons = document.querySelector('.cta-buttons');
const titles = [
    "Software Developer & Creative Technologist",
    "AI Engineer & Data Scientist",
    "Full Stack Developer & Problem Solver",
    "Prompt Engineer & AI Trainer"
];
let currentTitleIndex = 0;
let isDeleting = false;
let currentText = '';
let typingSpeed = 100;
let deletingSpeed = 50;
let pauseTime = 2000;

const typeWriter = () => {
    const currentTitle = titles[currentTitleIndex];

    if (isDeleting) {
        // Deleting text
        currentText = currentTitle.substring(0, currentText.length - 1);
        typingSpeed = deletingSpeed;

        // Move buttons up when text is being deleted
        if (currentText.length < 5) {
            ctaButtons.classList.add('move-up');
        }
    } else {
        // Typing text
        currentText = currentTitle.substring(0, currentText.length + 1);
        typingSpeed = 100;

        // Move buttons back down when typing starts
        if (currentText.length < 5) {
            ctaButtons.classList.remove('move-up');
        }
    }

    subtitle.textContent = currentText;

    if (!isDeleting && currentText === currentTitle) {
        // Finished typing, pause before deleting
        isDeleting = true;
        typingSpeed = pauseTime;
    } else if (isDeleting && currentText === '') {
        // Finished deleting, move to next title
        isDeleting = false;
        currentTitleIndex = (currentTitleIndex + 1) % titles.length;
        typingSpeed = 500; // Pause before starting next title
    }

    setTimeout(typeWriter, typingSpeed);
};

// Start typing effect when page loads
window.addEventListener('load', typeWriter);

// Handle contact form submissions
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            if (name && email && message) {
                // Format the email with the user's message
                const subject = `Message from ${name} via Portfolio`;
                const body = `${message}%0D%0A%0D%0A${name}`;

                // Open the user's email client with pre-populated fields
                window.location.href = `mailto:josephgoss123@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&from=${encodeURIComponent(email)}`;

                // Reset the form
                contactForm.reset();
            }
        });
    }
});