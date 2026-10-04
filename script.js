document.documentElement.classList.add('js');

const setupReveal = () => {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    revealElements.forEach(element => observer.observe(element));
};

const setupTimeline = () => {
    const timeline = document.querySelector('.timeline');
    if (!timeline) {
        return;
    }

    const items = Array.from(timeline.querySelectorAll('.timeline-item'));

    const updateProgress = () => {
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const total = rect.height;
        const visible = Math.min(Math.max(windowHeight - rect.top, 0), total);
        const progress = total ? (visible / total) * 100 : 0;
        timeline.style.setProperty('--progress', `${progress}%`);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    items.forEach(item => {
        observer.observe(item);
    });

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
};

const setupContactForm = () => {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) {
        return;
    }

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('name').value.trim();
        const message = document.getElementById('message').value.trim();

        if (name && message) {
            const subject = `Message from ${name} via Portfolio`;
            const body = `${message}\n\n${name}`;
            window.location.href = `mailto:josephgoss123@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            contactForm.reset();
        }
    });
};

const setupPlaceholderLinks = () => {
    const placeholders = document.querySelectorAll('a[data-link-placeholder="true"]');
    placeholders.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
        });
    });
};

setupReveal();
setupTimeline();
setupContactForm();
setupPlaceholderLinks();
