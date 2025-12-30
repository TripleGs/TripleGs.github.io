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

const setupBlogIndex = () => {
    const container = document.getElementById('blog-index');
    if (!container) {
        return;
    }

    const searchInput = document.getElementById('blog-search');
    const tagContainer = document.getElementById('blog-tags');
    const count = document.getElementById('blog-count');
    const cards = Array.from(container.querySelectorAll('.blog-card'));

    if (!cards.length) {
        return;
    }

    const getTags = (card) => {
        const tagString = card.dataset.tags || '';
        return tagString.split(',').map(tag => tag.trim()).filter(Boolean);
    };

    const tags = new Set();
    cards.forEach(card => {
        getTags(card).forEach(tag => tags.add(tag));
    });

    let activeTag = 'All';

    const createTagButton = (tag) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = tag;
        button.classList.toggle('is-active', tag === activeTag);
        button.addEventListener('click', () => {
            activeTag = tag;
            Array.from(tagContainer.querySelectorAll('button')).forEach(btn => {
                btn.classList.toggle('is-active', btn.textContent === activeTag);
            });
            render();
        });
        return button;
    };

    if (tagContainer) {
        tagContainer.innerHTML = '';
        tagContainer.appendChild(createTagButton('All'));
        Array.from(tags).sort().forEach(tag => tagContainer.appendChild(createTagButton(tag)));
    }

    const render = () => {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let visibleCount = 0;

        cards.forEach(card => {
            const title = (card.dataset.title || '').toLowerCase();
            const summary = (card.dataset.summary || '').toLowerCase();
            const tagString = (card.dataset.tags || '').toLowerCase();
            const matchesTag = activeTag === 'All' || tagString.split(',').map(tag => tag.trim()).includes(activeTag.toLowerCase());
            const matchesQuery = !query || `${title} ${summary} ${tagString}`.includes(query);

            if (matchesTag && matchesQuery) {
                card.style.display = '';
                visibleCount += 1;
            } else {
                card.style.display = 'none';
            }
        });

        if (count) {
            count.textContent = `${visibleCount} post${visibleCount === 1 ? '' : 's'} found`;
        }
    };

    if (searchInput) {
        searchInput.addEventListener('input', render);
    }

    render();
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
setupBlogIndex();
setupPlaceholderLinks();
