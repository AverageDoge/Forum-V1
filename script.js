document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('post-form');
    const forumFeed = document.getElementById('forum-feed');
    const pendingFeed = document.getElementById('pending-feed');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const successMsg = document.getElementById('success-message');

    // Your Cloudflare Worker URL
    const API_URL = 'https://white-band-1ffd.michael-le.workers.dev';
    
    let isAdmin = false;

    // Load posts from the database on startup
    fetchPosts();

    // 1. Submit a post to the database
    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const newPost = {
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            content: document.getElementById('post-content').value,
            date: new Date().toLocaleDateString(),
            status: 'pending' // Always pending first
        };

        // Send to Cloudflare Worker
        await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPost)
        });

        postForm.reset();
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 3000);
        
        fetchPosts();
    });

    // 2. Admin Login
    adminLoginBtn.addEventListener('click', () => {
        if (!isAdmin) {
            const password = prompt("Enter Admin Password:");
            if (password === 'admin') { // You can change this later
                isAdmin = true;
                adminDashboard.classList.remove('hidden');
                adminLoginBtn.innerText = "Logout Admin";
                fetchPosts();
            } else {
                alert("Incorrect password");
            }
        } else {
            isAdmin = false;
            adminDashboard.classList.add('hidden');
            adminLoginBtn.innerText = "Admin Login";
            fetchPosts();
        }
    });

    // 3. Fetch Posts from Database
    async function fetchPosts() {
        try {
            const response = await fetch(`${API_URL}/posts`);
            const posts = await response.json();
            renderPosts(posts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    }

    // 4. Render Posts to the screen
    function renderPosts(posts) {
        forumFeed.innerHTML = '';
        pendingFeed.innerHTML = '';

        const approvedPosts = posts.filter(p => p.status === 'approved');
        const pendingPosts = posts.filter(p => p.status === 'pending');

        if (approvedPosts.length === 0) {
            forumFeed.innerHTML = '<p>No approved posts yet.</p>';
        } else {
            approvedPosts.forEach(post => forumFeed.appendChild(createPostHTML(post, false)));
        }

        if (isAdmin) {
            if (pendingPosts.length === 0) {
                pendingFeed.innerHTML = '<p>No posts pending approval.</p>';
            } else {
                pendingPosts.forEach(post => pendingFeed.appendChild(createPostHTML(post, true)));
            }
        }
    }

    // Helper to generate HTML
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
                <button class="approve-btn" onclick="moderatePost(${post.id}, 'approved')">Approve Post</button>
                <button class="reject-btn" onclick="moderatePost(${post.id}, 'rejected')">Reject / Delete</button>
            `;
        }

        div.innerHTML = html;
        return div;
    }

    // 5. Admin Actions (Approve or Reject)
    window.moderatePost = async function(id, action) {
        if (action === 'approved') {
            await fetch(`${API_URL}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
        } else if (action === 'rejected') {
            await fetch(`${API_URL}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
        }
        fetchPosts(); // Refresh the feed
    };
});
