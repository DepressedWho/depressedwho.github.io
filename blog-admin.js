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

let editingPostId = null;
let currentUser = null;

// Check authentication status
function initAuth() {
    const { onAuthStateChanged } = window.firebaseModules;
    
    onAuthStateChanged(window.auth, (user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            showDashboard(user);
        } else {
            // User is signed out
            currentUser = null;
            showLogin();
        }
    });
}

// Show login screen
function showLogin() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

// Show dashboard
function showDashboard(user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('userEmail').textContent = user.email;
    init();
}

// Handle login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    try {
        const { signInWithEmailAndPassword } = window.firebaseModules;
        await signInWithEmailAndPassword(window.auth, email, password);
        // onAuthStateChanged will handle the redirect
    } catch (error) {
        console.error('Login error:', error);
        errorEl.style.display = 'block';
        
        if (error.code === 'auth/invalid-credential') {
            errorEl.textContent = 'Invalid email or password';
        } else if (error.code === 'auth/user-not-found') {
            errorEl.textContent = 'No account found with this email';
        } else if (error.code === 'auth/wrong-password') {
            errorEl.textContent = 'Incorrect password';
        } else if (error.code === 'auth/invalid-email') {
            errorEl.textContent = 'Invalid email address';
        } else {
            errorEl.textContent = 'Login failed. Please try again.';
        }
    }
});

// Handle logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const { signOut } = window.firebaseModules;
        await signOut(window.auth);
        // onAuthStateChanged will handle the redirect
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    }
});

// Initialize - Load posts from Firebase
async function init() {
    await renderPosts();
}

// Render all posts
async function renderPosts() {
    const postsGrid = document.getElementById('postsGrid');
    const emptyState = document.getElementById('emptyState');
    
    try {
        const { collection, getDocs } = window.firebaseModules;
        const querySnapshot = await getDocs(collection(window.db, 'posts'));
        
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({ id: doc.id, ...doc.data() });
        });
        
        if (posts.length === 0) {
            postsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        // Sort by date (newest first)
        posts.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
        
        postsGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        postsGrid.innerHTML = posts.map(post => `
            <div class="admin-post-card">
                <div class="post-card-header">
                    <div class="post-card-emoji">${post.emoji || '📝'}</div>
                    <div class="post-card-title">
                        <h3>${post.title}</h3>
                        <div class="post-card-meta">
                            <span>📅 ${post.date}</span> · 
                            <span>✍️ ${post.author}</span>
                        </div>
                    </div>
                </div>
                <div class="post-card-body">
                    <p class="post-card-description">${post.description}</p>
                    <div class="post-card-tags">
                        ${post.tags ? post.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
                    </div>
                    <div class="post-card-actions">
                        <button class="btn btn-secondary" onclick="viewPost('${post.id}')">View</button>
                        <button class="btn" onclick="editPost('${post.id}')">Edit</button>
                        <button class="btn btn-danger" onclick="deletePost('${post.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading posts:', error);
        postsGrid.innerHTML = `
            <div style="text-align: center; padding: 4rem; grid-column: 1/-1;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <p style="opacity: 0.7;">Error loading posts. Please check your Firebase configuration.</p>
            </div>
        `;
    }
}

// Show post form
document.getElementById('createNewBtn').addEventListener('click', () => {
    document.getElementById('postFormContainer').style.display = 'block';
    document.getElementById('statsFormContainer').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Create New Post';
    document.getElementById('postForm').reset();
    editingPostId = null;
    document.getElementById('postsList').style.display = 'none';
});

// Show stats form
document.getElementById('updateStatsBtn').addEventListener('click', async () => {
    document.getElementById('statsFormContainer').style.display = 'block';
    document.getElementById('postFormContainer').style.display = 'none';
    document.getElementById('postsList').style.display = 'none';
    
    // Load current values
    try {
        const { doc, getDoc } = window.firebaseModules;
        const docRef = doc(window.db, 'settings', 'stats');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('peopleHelpedInput').value = data.peopleHelped || 0;
            document.getElementById('applicationDateInput').value = data.nextApplicationDate || '';
            document.getElementById('discordLinkInput').value = data.discordLink || '';
            document.getElementById('googleFormsLinkInput').value = data.googleFormsLink || '';
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
});

// Close forms
document.getElementById('closeFormBtn').addEventListener('click', closeForm);
document.getElementById('cancelBtn').addEventListener('click', closeForm);
document.getElementById('closeStatsBtn').addEventListener('click', closeForm);
document.getElementById('cancelStatsBtn').addEventListener('click', closeForm);

function closeForm() {
    document.getElementById('postFormContainer').style.display = 'none';
    document.getElementById('statsFormContainer').style.display = 'none';
    document.getElementById('postsList').style.display = 'block';
    editingPostId = null;
}

// Submit stats form
document.getElementById('statsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const count = parseInt(document.getElementById('peopleHelpedInput').value);
    const appDate = document.getElementById('applicationDateInput').value;
    const discordLink = document.getElementById('discordLinkInput').value;
    const googleFormsLink = document.getElementById('googleFormsLinkInput').value;
    
    try {
        const { doc, setDoc } = window.firebaseModules;
        await setDoc(doc(window.db, 'settings', 'stats'), {
            peopleHelped: count,
            nextApplicationDate: appDate,
            discordLink: discordLink,
            googleFormsLink: googleFormsLink,
            lastUpdated: new Date().toISOString()
        });
        
        alert('Settings updated successfully! 💚');
        closeForm();
    } catch (error) {
        console.error('Error updating stats:', error);
        alert('Error updating settings. Please try again.');
    }
});

// Submit post form (create or edit)
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const postData = {
        title: document.getElementById('postTitle').value,
        author: document.getElementById('postAuthor').value,
        emoji: document.getElementById('postEmoji').value,
        description: document.getElementById('postDescription').value,
        content: document.getElementById('postContent').value,
        tags: document.getElementById('postTags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        date: editingPostId ? undefined : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        updatedAt: new Date().toISOString()
    };
    
    // Remove undefined values
    Object.keys(postData).forEach(key => postData[key] === undefined && delete postData[key]);
    
    try {
        const { doc, setDoc, updateDoc } = window.firebaseModules;
        
        if (editingPostId) {
            // Update existing post
            await updateDoc(doc(window.db, 'posts', editingPostId), postData);
            alert('Post updated successfully! 💚');
        } else {
            // Create new post with auto ID
            const newPostId = 'post_' + Date.now();
            postData.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            await setDoc(doc(window.db, 'posts', newPostId), postData);
            alert('Post created successfully! 💚');
        }
        
        await renderPosts();
        closeForm();
        
    } catch (error) {
        console.error('Error saving post:', error);
        alert('Error saving post. Please try again.');
    }
});

// Edit post
async function editPost(id) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const docRef = doc(window.db, 'posts', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Post not found');
            return;
        }
        
        const post = docSnap.data();
        editingPostId = id;
        
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postAuthor').value = post.author;
        document.getElementById('postEmoji').value = post.emoji || '';
        document.getElementById('postDescription').value = post.description;
        document.getElementById('postContent').value = post.content;
        document.getElementById('postTags').value = post.tags ? post.tags.join(', ') : '';
        
        document.getElementById('formTitle').textContent = 'Edit Post';
        document.getElementById('postFormContainer').style.display = 'block';
        document.getElementById('statsFormContainer').style.display = 'none';
        document.getElementById('postsList').style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Error loading post');
    }
}

// Delete post
async function deletePost(id) {
    if (!confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    
    try {
        const { doc, deleteDoc } = window.firebaseModules;
        await deleteDoc(doc(window.db, 'posts', id));
        
        alert('Post deleted successfully.');
        await renderPosts();
        
    } catch (error) {
        console.error('Error deleting post:', error);
        alert('Error deleting post. Please try again.');
    }
}

// View post in modal
async function viewPost(id) {
    try {
        const { doc, getDoc } = window.firebaseModules;
        const docRef = doc(window.db, 'posts', id);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            alert('Post not found');
            return;
        }
        
        const post = docSnap.data();
        const modal = document.getElementById('viewModal');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <h1>${post.emoji || '📝'} ${post.title}</h1>
            <div class="meta" style="margin-bottom: 2rem;">
                <span>📅 ${post.date}</span> · 
                <span>✍️ ${post.author}</span>
            </div>
            <div class="post-card-tags" style="margin-bottom: 2rem;">
                ${post.tags ? post.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
            </div>
            <div class="content">${post.content.replace(/\n/g, '<br>')}</div>
        `;
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Error loading post');
    }
}

// Close view modal
function closeViewModal() {
    document.getElementById('viewModal').style.display = 'none';
}

// Make functions globally available
window.editPost = editPost;
window.deletePost = deletePost;
window.viewPost = viewPost;
window.closeViewModal = closeViewModal;

// Close modal when clicking outside
document.getElementById('viewModal').addEventListener('click', (e) => {
    if (e.target.id === 'viewModal') {
        closeViewModal();
    }
});

// Initialize authentication when Firebase is ready
if (window.firebaseReady) {
    initAuth();
} else {
    document.addEventListener('firebaseReady', initAuth);
}