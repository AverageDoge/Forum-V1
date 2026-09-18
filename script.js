const WORKER_URL = 'https://white-band-1ffd.michael-le.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('post-form');
    const forumFeed = document.getElementById('forum-feed');
    const pendingFeed = document.getElementById('pending-feed');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const successMsg = document.getElementById('success-message');

    let isAdmin = false;
    let adminPassword = '';

    // Initial load
    fetchApprovedPosts();

    // 1. Submit a post to the Worker
    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const newPost = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            content: document.getElementById('post-content').value,
            date: new Date().toLocaleDateString()
        };

        try {
            await fetch(`${WORKER_URL}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost)
            });

            postForm.reset();
            successMsg.classList.remove('hidden');
            setTimeout(() => successMsg.classList.add('hidden'), 3000);
            
            if (isAdmin) fetchPendingPosts();
        } catch (error) {
            console.error('Error submitting post:', error);
            alert("Failed to submit post.");
        }
    });

    // 2. Admin Login
    adminLoginBtn.addEventListener('click', () => {
        if (!isAdmin) {
            const password = prompt("Enter Admin Password:");
            if (password) {
                adminPassword = password; // Store password to send with moderate requests
                isAdmin = true;
                adminDashboard.classList.remove('hidden');
                adminLoginBtn.innerText = "Logout Admin";
                fetchPendingPosts();
            }
        } else {
            isAdmin = false;
            adminPassword = '';
            adminDashboard.classList.add('hidden');
            adminLoginBtn.innerText = "Admin Login";
            pendingFeed.innerHTML = '';
        }
    });

    // 3. Fetch public posts from Worker
    async function fetchApprovedPosts() {
        try {
            const res = await fetch(`${WORKER_URL}/posts`);
            const posts = await res.json();
            
            forumFeed.innerHTML = '';
            if (posts.length === 0) {
                forumFeed.innerHTML = '<p>No approved posts yet.</p>';
            } else {
                posts.forEach(post => {
                    forumFeed.appendChild(createPostHTML(post, false));
                });
            }
        } catch (error) {
            forumFeed.innerHTML = '<p>Error loading posts.</p>';
        }
    }

    // 4. Fetch pending posts from Worker
    async function fetchPendingPosts() {
        try {
            const res = await fetch(`${WORKER_URL}/pending`);
            const posts = await res.json();
            
            pendingFeed.innerHTML = '';
            if (posts.length === 0) {
                pendingFeed.innerHTML = '<p>No posts pending approval.</p>';
            } else {
                posts.forEach(post => {
                    pendingFeed.appendChild(createPostHTML(post, true));
                });
            }
        } catch (error) {
            pendingFeed.innerHTML = '<p>Error loading pending posts.</p>';
        }
    }

    function createPostHTML(post, isPendingAdminView) {
        const div = document.createElement('div');
        div.className = 'forum-post';
        
        let html = `
            <span class="category-tag">${post.category}</span>
            <h3>${post.title}</h3>
            <div class="post-meta">Submitted on ${post.date}</div>
            <p>${post.content}</p>
        `;

        if (isPendingAdminView) {
            html += `
                <button class="approve-btn" onclick="moderatePost('${post.id}', 'approved')">Approve Post</button>
                <button class="reject-btn" onclick="moderatePost('${post.id}', 'rejected')">Reject / Delete</button>
            `;
        }

        div.innerHTML = html;
        return div;
    }

    // 5. Admin Action Logic (Talks to Worker)
    window.moderatePost = async function(id, action) {
        try {
            const res = await fetch(`${WORKER_URL}/moderate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, password: adminPassword })
            });

            if (res.ok) {
                fetchPendingPosts(); // Refresh admin feed
                fetchApprovedPosts(); // Refresh public feed
            } else {
                alert("Action failed. Check password.");
            }
        } catch (error) {
            console.error('Error moderating:', error);
        }
    };
});
