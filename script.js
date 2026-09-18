document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('post-form');
    const forumFeed = document.getElementById('forum-feed');
    const pendingFeed = document.getElementById('pending-feed');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLoginBtn = document.getElementById('admin-login-btn');
    const successMsg = document.getElementById('success-message');

    let posts = JSON.parse(localStorage.getItem('helpForumPosts')) || [];
    let isAdmin = false;

    renderPosts();

    // 1. Submit a post (Defaults to Pending)
    postForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const newPost = {
            id: Date.now(),
            title: document.getElementById('post-title').value,
            category: document.getElementById('post-category').value,
            content: document.getElementById('post-content').value,
            date: new Date().toLocaleDateString(),
            status: 'pending' // Requires admin green light
        };

        posts.unshift(newPost);
        localStorage.setItem('helpForumPosts', JSON.stringify(posts));

        postForm.reset();
        successMsg.classList.remove('hidden');
        setTimeout(() => successMsg.classList.add('hidden'), 3000);
        
        if(isAdmin) renderPosts();
    });

    // 2. Admin Login (Basic implementation for prototype)
    adminLoginBtn.addEventListener('click', () => {
        if (!isAdmin) {
            const password = prompt("Enter Admin Password:");
            // In the future, your Worker/TiDB will handle real auth. 
            // For the prototype, just type 'admin'
            if (password === 'admin') {
                isAdmin = true;
                adminDashboard.classList.remove('hidden');
                adminLoginBtn.innerText = "Logout Admin";
                renderPosts();
            } else {
                alert("Incorrect password");
            }
        } else {
            isAdmin = false;
            adminDashboard.classList.add('hidden');
            adminLoginBtn.innerText = "Admin Login";
            renderPosts();
        }
    });

    // 3. Render Posts to the correct feeds
    function renderPosts() {
        forumFeed.innerHTML = '';
        pendingFeed.innerHTML = '';

        const approvedPosts = posts.filter(p => p.status === 'approved');
        const pendingPosts = posts.filter(p => p.status === 'pending');

        // Render Public Approved Posts
        if (approvedPosts.length === 0) {
            forumFeed.innerHTML = '<p>No approved posts yet.</p>';
        } else {
            approvedPosts.forEach(post => {
                forumFeed.appendChild(createPostHTML(post, false));
            });
        }

        // Render Admin Pending Posts
        if (isAdmin) {
            if (pendingPosts.length === 0) {
                pendingFeed.innerHTML = '<p>No posts pending approval.</p>';
            } else {
                pendingPosts.forEach(post => {
                    pendingFeed.appendChild(createPostHTML(post, true));
                });
            }
        }
    }

    // Helper to generate the HTML blocks
    function createPostHTML(post, isPendingAdminView) {
        const div = document.createElement('div');
        div.className = 'forum-post';
        
        let html = `
            <span class="category-tag">${post.category}</span>
            <h3>${post.title}</h3>
            <div class="post-meta">Submitted on ${post.date}</div>
            <p>${post.content}</p>
        `;

        // Add Approve/Reject buttons if viewing in admin dashboard
        if (isPendingAdminView) {
            html += `
                <button class="approve-btn" onclick="moderatePost(${post.id}, 'approved')">Approve Post</button>
                <button class="reject-btn" onclick="moderatePost(${post.id}, 'rejected')">Reject / Delete</button>
            `;
        }

        div.innerHTML = html;
        return div;
    }

    // 4. Admin Action Logic (Attached to window so inline onclick works)
    window.moderatePost = function(id, action) {
        if (action === 'approved') {
            const postIndex = posts.findIndex(p => p.id === id);
            if (postIndex > -1) {
                posts[postIndex].status = 'approved';
            }
        } else if (action === 'rejected') {
            posts = posts.filter(p => p.id !== id);
        }
        
        localStorage.setItem('helpForumPosts', JSON.stringify(posts));
        renderPosts();
    };
});
