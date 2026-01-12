// Mobile Navigation Toggle
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav-links');
const navLinks = document.querySelectorAll('.nav-link');

burger.addEventListener('click', () => {
    nav.classList.toggle('active');
    burger.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        burger.classList.remove('active');
    });
});

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('.section');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.scroll-reveal');

const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;

    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < triggerBottom) {
            element.classList.add('active');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll(); // Initial check

// Animated Counter for People Helped
// UPDATE THIS NUMBER TO CHANGE THE PEOPLE HELPED COUNT
const TARGET_COUNT = 10; // <-- CHANGE THIS NUMBER

const counter = document.getElementById('peopleHelped');
const duration = 2000; // Animation duration in milliseconds
const frameDuration = 1000 / 60; // 60 FPS
const totalFrames = Math.round(duration / frameDuration);
const easeOutQuad = t => t * (2 - t);

let frame = 0;
const countTo = TARGET_COUNT;

const animateCounter = () => {
    frame++;
    const progress = easeOutQuad(frame / totalFrames);
    const currentCount = Math.round(countTo * progress);
    
    counter.textContent = currentCount.toLocaleString();
    
    if (frame < totalFrames) {
        requestAnimationFrame(animateCounter);
    }
};

// Start counter animation when hero section is in view
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && frame === 0) {
            animateCounter();
        }
    });
}, { threshold: 0.5 });

const hero = document.querySelector('.hero');
if (hero) {
    heroObserver.observe(hero);
}

// Update Application Date
// UPDATE THIS DATE FOR NEXT APPLICATION PERIOD
const applicationDateElement = document.getElementById('applicationDate');
const nextApplicationDate = '1st Feb 2026'; // <-- CHANGE THIS DATE

if (applicationDateElement) {
    applicationDateElement.textContent = nextApplicationDate;
}

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});