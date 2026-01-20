// Custom Cursor
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    setTimeout(() => {
        follower.style.left = e.clientX + 'px';
        follower.style.top = e.clientY + 'px';
    }, 100);
});

// Page Navigation
const navDots = document.querySelectorAll('.nav-dot');
const pages = document.querySelectorAll('.page');
const morphCards = document.querySelectorAll('.morph-card');

function navigateToPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navDots.forEach(dot => dot.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    const targetDot = document.querySelector(`.nav-dot[data-page="${pageId}"]`);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetDot) targetDot.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

navDots.forEach(dot => {
    dot.addEventListener('click', () => {
        const pageId = dot.dataset.page;
        navigateToPage(pageId);
    });
});

morphCards.forEach(card => {
    card.addEventListener('click', () => {
        const pageId = card.dataset.page;
        navigateToPage(pageId);
    });
});

// Parallax Scroll Effect
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.parallax-section').forEach(section => {
    observer.observe(section);
});

// People Helped Counter Animation
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 20);
}

// Load People Helped Count from Firebase
async function loadPeopleHelped() {
    const peopleHelpedElement = document.getElementById('peopleHelped');
    
    try {
        const { doc, getDoc } = window.firebaseModules;
        const docRef = doc(window.db, 'settings', 'stats');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const count = docSnap.data().peopleHelped || 0;
            animateCounter(peopleHelpedElement, count);
        } else {
            // Default value if not set yet
            animateCounter(peopleHelpedElement, 247);
        }
    } catch (error) {
        console.error('Error loading people helped:', error);
        // Fallback to default
        animateCounter(peopleHelpedElement, 247);
    }
}

// Load and render blog posts from Firebase
async function loadBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    
    try {
        const { collection, getDocs } = window.firebaseModules;
        const querySnapshot = await getDocs(collection(window.db, 'posts'));
        
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date (newest first)
        posts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        
        if (posts.length === 0) {
            blogGrid.innerHTML = `
                <div style="text-align: center; padding: 4rem; grid-column: 1/-1;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                    <p style="opacity: 0.7; font-size: 1.2rem;">No blog posts yet. Check back soon!</p>
                </div>
            `;
            return;
        }
        
        blogGrid.innerHTML = posts.map(post => `
            <div class="blog-card" onclick="openBlogPost('${post.id}')">
                <div class="blog-image">${post.emoji || '📝'}</div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span>📅 ${post.date}</span>
                        <span>✍️ ${post.author}</span>
                    </div>
                    <h3>${post.title}</h3>
                    <p>${post.description}</p>
                    ${post.tags ? post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('') : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading blog posts:', error);
        blogGrid.innerHTML = `
            <div style="text-align: center; padding: 4rem; grid-column: 1/-1;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p style="opacity: 0.7;">Error loading blog posts. Please try again later.</p>
            </div>
        `;
    }
}

// Open blog post modal
async function openBlogPost(postId) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const docRef = doc(window.db, 'posts', postId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Blog post not found');
            return;
        }
        
        const post = docSnap.data();
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'blog-modal';
        modal.innerHTML = `
            <div class="blog-modal-content">
                <button class="blog-close-btn" onclick="this.parentElement.parentElement.remove()">✕</button>
                <h1>${post.emoji || '📝'} ${post.title}</h1>
                <div class="blog-modal-meta">
                    <span>📅 ${post.date}</span> · <span>✍️ ${post.author}</span>
                </div>
                <div class="blog-modal-tags">
                    ${post.tags ? post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('') : ''}
                </div>
                <div class="blog-modal-content-text">${post.content.replace(/\n/g, '<br>')}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
    } catch (error) {
        console.error('Error loading blog post:', error);
        alert('Error loading blog post');
    }
}

// Make openBlogPost available globally
window.openBlogPost = openBlogPost;

// Load application settings (date, Discord link, Google Forms link)
async function loadApplicationSettings() {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const docRef = doc(window.db, 'settings', 'stats');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Update application date
            if (data.nextApplicationDate) {
                const dateElement = document.querySelector('.countdown-date');
                if (dateElement) {
                    dateElement.textContent = data.nextApplicationDate;
                }
            }
            
            // Update Discord link
            if (data.discordLink) {
                const discordBtn = document.querySelector('a[href*="discord"]');
                if (discordBtn) {
                    discordBtn.href = data.discordLink;
                }
            }
            
            // Update Google Forms link
            if (data.googleFormsLink) {
                const formsBtn = document.querySelector('a[href*="forms.google"]');
                if (formsBtn) {
                    formsBtn.href = data.googleFormsLink;
                }
            }
        }
    } catch (error) {
        console.error('Error loading application settings:', error);
    }
}

// Add modal styles dynamically
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .blog-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        animation: fadeIn 0.3s ease;
        cursor: auto;
    }
    
    .blog-modal * {
        cursor: auto;
    }
    
    .blog-modal-content {
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(255, 0, 136, 0.1));
        backdrop-filter: blur(20px);
        border: 1px solid rgba(0, 255, 136, 0.2);
        border-radius: 30px;
        padding: 3rem;
        max-width: 800px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }
    
    .blog-close-btn {
        position: absolute;
        top: 2rem;
        right: 2rem;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        background: transparent;
        color: #fff;
        font-size: 1.5rem;
        cursor: pointer;
        transition: all 0.3s;
    }
    
    .blog-close-btn:hover {
        border-color: #ff0088;
        color: #ff0088;
        transform: rotate(90deg);
    }
    
    .blog-modal-content h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        line-height: 1.2;
    }
    
    .blog-modal-meta {
        opacity: 0.7;
        margin-bottom: 1.5rem;
    }
    
    .blog-modal-tags {
        margin-bottom: 2rem;
    }
    
    .blog-modal-content-text {
        line-height: 1.8;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(modalStyles);

// Form Submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Message sent! We\'ll get back to you soon. 💚');
        e.target.reset();
    });
}

// Wait for Firebase to be ready, then load data
if (window.firebaseReady) {
    loadPeopleHelped();
    loadBlogPosts();
    loadApplicationSettings();
} else {
    document.addEventListener('firebaseReady', () => {
        loadPeopleHelped();
        loadBlogPosts();
        loadApplicationSettings();
    });
}
