document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const workerContainer = document.getElementById('workerContainer');
    const dashboard = document.getElementById('dashboard');
    const searchInput = document.getElementById('searchWorker');
    const workerList = document.getElementById('workerList');
    const loginModal = document.getElementById('loginModal');
    const loginModalTitle = document.getElementById('loginModalTitle');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const sidebarProfileImage = document.getElementById('sidebarProfileImage');
    const sidebarWorkerName = document.getElementById('sidebarWorkerName');
    const sidebarWorkerDepartment = document.getElementById('sidebarWorkerDepartment');
    const editProfileImageBtn = document.getElementById('editProfileImageBtn');
    const imageUpload = document.getElementById('imageUpload');
    const taskForm = document.getElementById('taskForm');
    const dynamicInputs = document.getElementById('dynamicInputs');
    const topicList = document.getElementById('topicList');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const dashboardLink = document.getElementById('dashboardLink');
    const applyLeaveLink = document.getElementById('applyLeaveLink');
    const leaveRequestsLink = document.getElementById('leaveRequestsLink');
    const commentsLink = document.getElementById('commentsLink');
    const dashboardContent = document.getElementById('dashboardContent');
    const applyLeaveContent = document.getElementById('applyLeaveContent');
    const leaveRequestsContent = document.getElementById('leaveRequestsContent');
    const commentsContent = document.getElementById('commentsContent');
    const leaveApplicationForm = document.getElementById('leaveApplicationForm');
    const leaveRequestsList = document.getElementById('leaveRequestsList');
    const commentList = document.getElementById('commentList');
    const addCommentForm = document.getElementById('addCommentForm');
    const leaveRequestNotification = document.getElementById('leaveRequestNotification');
    commentsLink.addEventListener('click', () => {
        updateNotifications();
    });


    let currentWorker = null;

    // Load workers list
    function loadWorkers(searchTerm = '') {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const filteredWorkers = workers.filter(worker =>
            worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.department.toLowerCase().includes(searchTerm.toLowerCase())
        );

        workerList.innerHTML = '';
        filteredWorkers.forEach(worker => {
            const workerItem = document.createElement('div');
            workerItem.className = 'worker-item';
            workerItem.innerHTML = `
                <img src="${worker.photo || '/placeholder.svg?height=100&width=100&text=' + worker.name}" alt="${worker.name}'s photo" class="worker-photo">
                <div class="worker-info">
                    <div class="worker-name">${worker.name}</div>
                    <div class="worker-department">${worker.department}</div>
                </div>
            `;
            workerItem.addEventListener('click', () => openLoginModal(worker));
            workerList.appendChild(workerItem);
        });
    }

    // Handle worker login
    function openLoginModal(worker) {
        loginModalTitle.textContent = `Login: ${worker.name}`;
        loginModal.style.display = 'block';
        passwordInput.value = '';
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            if (passwordInput.value === worker.password) {
                currentWorker = worker;
                loginModal.style.display = 'none';
                workerContainer.classList.add('hidden');
                dashboard.classList.remove('hidden');
                loadWorkerDashboard();
            } else {
                alert('Incorrect password. Please try again.');
            }
        };
    }

    // Load worker dashboard
    function loadWorkerDashboard() {
        if (!currentWorker) return;

        sidebarProfileImage.src = currentWorker.photo || '/placeholder.svg?height=100&width=100&text=' + currentWorker.name;
        sidebarProfileImage.alt = `${currentWorker.name}'s profile picture`;
        sidebarWorkerName.textContent = currentWorker.name;
        sidebarWorkerDepartment.textContent = currentWorker.department;
        loadtaskForm();
        loadComments();
        updateLeaveRequestNotification();
        updateScoreboard();
        showDashboardContent();
    }

    // Load task form
    function loadtaskForm() {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        const topics = JSON.parse(localStorage.getItem('topics')) || [];

        // Load task inputs
        dynamicInputs.innerHTML = '';
        columns.forEach(column => {
            if (column.department === 'all' || column.department === currentWorker.department) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                inputGroup.innerHTML = `
                    <label for="${column.name}">${column.name}:</label>
                    <input type="number" id="${column.name}" name="${column.name}" min="0">
                `;
                dynamicInputs.appendChild(inputGroup);
            }
        });

        // Load topics
        topicList.innerHTML = '<h4>Available Topics</h4>';
        topics.forEach(topic => {
            if (topic.department === 'all' || topic.department === currentWorker.department) {
                const topicTag = document.createElement('label');
                topicTag.className = 'topic-tag';
                topicTag.innerHTML = `
                    <input type="checkbox" name="topic" value="${topic.name}">
                    <span>${topic.name} (${topic.points} points)</span>
                `;
                topicList.appendChild(topicTag);
            }
        });
    }

    // Handle task submission
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const taskData = {};
        const formData = new FormData(taskForm);
        let hasData = false;

        // Get task values
        for (const [name, value] of formData.entries()) {
            if (!name.includes('topic') && value !== '') {
                taskData[name] = parseInt(value) || 0;
                if (parseInt(value) > 0) hasData = true;
            }
        }

        // Get selected topics
        const selectedTopics = Array.from(document.querySelectorAll('input[name="topic"]:checked'))
            .map(checkbox => checkbox.value);
        
        if (selectedTopics.length > 0) hasData = true;

        if (!hasData) {
            alert('Please enter at least one task value or select a topic.');
            return;
        }

        // Update worker data
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (!workerData[currentWorker.name]) {
            workerData[currentWorker.name] = {
                activities: [],
                topicPoints: 0
            };
        }

        // Calculate topic points
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        const topicPoints = selectedTopics.reduce((total, topicName) => {
            const topic = topics.find(t => t.name === topicName);
            return total + (topic ? topic.points : 0);
        }, 0);

        // Update total points
        workerData[currentWorker.name].topicPoints = 
            (workerData[currentWorker.name].topicPoints || 0) + topicPoints;

        // Add activity record
        workerData[currentWorker.name].activities.push({
            timestamp: new Date().toISOString(),
            task: taskData,
            topics: selectedTopics,
            points: topicPoints + Object.values(taskData).reduce((a, b) => a + b, 0)
        });

        localStorage.setItem('workerData', JSON.stringify(workerData));
        alert('task submitted successfully!');
        taskForm.reset();
        updateScoreboard();
    });

    function updateScoreboard() {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
    
        const departmentWorkers = workers
            .filter(worker => worker.department === currentWorker.department)
            .map(worker => {
                const data = workerData[worker.name] || {};
                const totalPoints = calculateTotalPoints(data, columns);
                const todayPoints = calculateTodayPoints(data, columns);
                return {
                    name: worker.name,
                    totalPoints,
                    todayPoints
                };
            })
            .sort((a, b) => b.totalPoints - a.totalPoints);
    
        scoreTableBody.innerHTML = '';
        departmentWorkers.forEach((worker, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${worker.name}</td>
                <td>${worker.todayPoints}</td>
                <td>${worker.totalPoints}</td>
            `;
            scoreTableBody.appendChild(row);
        });
    }

    function calculateTodayPoints(data, columns) {
        const today = new Date().toDateString();
        let todayPoints = 0;
    
        if (data.activities) {
            data.activities.forEach(activity => {
                if (new Date(activity.timestamp).toDateString() === today && activity.points) {
                    todayPoints += parseInt(activity.points) || 0;
                }
            });
        }
    
        return todayPoints;
    }

    function calculateTotalPoints(data, columns) {
        let totalPoints = 0;
    
        // Calculate points from activities (includes both task and topic points)
        if (data.activities) {
            data.activities.forEach(activity => {
                if (activity.points) {
                    totalPoints += parseInt(activity.points) || 0;
                }
            });
        }
    
        return totalPoints;
    }
  // Handle search
    searchInput.addEventListener('input', (e) => {
        loadWorkers(e.target.value);
    });

    // Toggle sidebar
sidebarToggle.addEventListener('click', () => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-active');
    } else {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }
    
    // Store sidebar state in localStorage
    localStorage.setItem('sidebarState', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
});
// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
   
    const isMobile = window.innerWidth <= 768;
    const clickedOutsideSidebar = !sidebar.contains(e.target) && !sidebarToggle.contains(e.target);
    
    if (isMobile && clickedOutsideSidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        mainContent.classList.remove('sidebar-active');
    }
});
// Handle window resize
window.addEventListener('resize', () => {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.remove('collapsed');
        sidebar.classList.remove('active');
        mainContent.classList.remove('expanded');
        mainContent.classList.remove('sidebar-active');
    } else {
        const storedState = localStorage.getItem('sidebarState');
        if (storedState === 'collapsed') {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    }
});
    // Handle sidebar navigation
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboardContent();
    });

    applyLeaveLink.addEventListener('click', (e) => {
        e.preventDefault();
        showApplyLeaveContent();
    });

    leaveRequestsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLeaveRequestsContent();
    });

    commentsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showCommentsContent();
    });

    // Show dashboard content
    function showDashboardContent() {
        hideAllContent();
        dashboardContent.classList.remove('hidden');
        setActiveLink(dashboardLink);
    }

    // Show apply leave content
    function showApplyLeaveContent() {
        hideAllContent();
        applyLeaveContent.classList.remove('hidden');
        setActiveLink(applyLeaveLink);
    }

    // Show leave requests content
    function showLeaveRequestsContent() {
        hideAllContent();
        leaveRequestsContent.classList.remove('hidden');
        setActiveLink(leaveRequestsLink);
        loadLeaveRequests();
    }

    // Show comments content
    function showCommentsContent() {
        hideAllContent();
        commentsContent.classList.remove('hidden');
        setActiveLink(commentsLink);
        loadComments();
    }

    // Hide all content sections
    function hideAllContent() {
        dashboardContent.classList.add('hidden');
        applyLeaveContent.classList.add('hidden');
        leaveRequestsContent.classList.add('hidden');
        commentsContent.classList.add('hidden');
    }

    // Set active link in sidebar
    function setActiveLink(activeLink) {
        const links = [dashboardLink, applyLeaveLink, leaveRequestsLink, commentsLink];
        links.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }
    function updateNotifications() {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const currentWorkerData = workerData[currentWorker.name] || { comments: [] };
        const comments = currentWorkerData.comments;
    
        // Count new comments or replies
        const newNotifications = comments.filter(comment => 
            comment.isNew || 
            (comment.replies && comment.replies.some(reply => reply.isNew))
        );
    
        // Select notification element
        const commentNotification = document.getElementById('leaveRequestNotification');
        
        if (newNotifications.length > 0) {
            // Show notification with count
            commentNotification.classList.remove('hidden');
            commentNotification.textContent = newNotifications.length;
        } else {
            // Hide notification if no new items
            commentNotification.classList.add('hidden');
        }
    }
    // Load comments
    function loadComments() {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const comments = workerData[currentWorker.name]?.comments || [];
        
        const sortedComments = comments.sort((a, b) => {
            // Determine the latest timestamp for each comment (including replies)
            const aLatest = a.replies && a.replies.length ? 
                Math.max(new Date(a.timestamp), ...a.replies.map(r => new Date(r.timestamp))) :
                new Date(a.timestamp);
            const bLatest = b.replies && b.replies.length ? 
                Math.max(new Date(b.timestamp), ...b.replies.map(r => new Date(r.timestamp))) :
                new Date(b.timestamp);
            return bLatest - aLatest;
        });
    
        commentList.innerHTML = '';
        sortedComments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = `comment ${comment.isNew ? 'new-comment' : ''}`;
            
            // Attachment handling
            let attachmentContent = '';
            if (comment.attachment) {
                attachmentContent = `
                    <div class="comment-attachment">
                        <div class="attachment-icon">
                            <i class="fas fa-file"></i>
                        </div>
                        <div class="attachment-details">
                            <span class="attachment-name">${comment.attachment.name}</span>
                            <div class="attachment-actions">
                                <button class="btn-view-attachment" 
                                        data-name="${comment.attachment.name}"
                                        data-type="${comment.attachment.type}"
                                        data-data="${comment.attachment.data}">
                                    View
                                </button>
                                <a href="${comment.attachment.data}" 
                                   download="${comment.attachment.name}" 
                                   class="btn-download-attachment">
                                    Download
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }
    
            // Render replies
            let repliesContent = '';
            if (comment.replies && comment.replies.length > 0) {
                repliesContent = comment.replies.map(reply => `
                    <div class="comment-reply ${reply.isNew ? 'new-reply' : ''}">
                        <strong>${reply.isAdminReply ? 'Admin ' : ''}Reply:</strong>
                        <p>${reply.text}</p>
                        <small class="reply-timestamp">
                            ${new Date(reply.timestamp).toLocaleString()}
                        </small>
                    </div>
                `).join('');
            }
    
            commentElement.innerHTML = `
                <div class="comment-text">${comment.text}</div>
                ${attachmentContent}
                <div class="comment-replies">
                    ${repliesContent}
                </div>
                <small class="comment-timestamp">
                    ${new Date(comment.timestamp).toLocaleString()}
                </small>
            `;
            
            commentList.appendChild(commentElement);
            
            comment.isNew = false;
            if (comment.replies) {
                comment.replies.forEach(reply => reply.isNew = false);
            }
        });
        document.querySelectorAll('.btn-view-attachment').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                const type = e.target.getAttribute('data-type');
                const data = e.target.getAttribute('data-data');
                
                openAttachmentModal(name, type, data);
            });
        });
    
function openAttachmentModal(name, type, data) {
    const modal = document.createElement('div');
    modal.className = 'attachment-modal';
    modal.innerHTML = `
        <div class="attachment-modal-content">
            <span class="close-attachment-modal">&times;</span>
            <h3>Attachment: ${name}</h3>
            ${type.startsWith('image/') 
                ? `<img src="${data}" alt="${name}" class="attachment-image">` 
                : `<p>File type: ${type}</p>`}
            <div class="attachment-modal-actions">
                <a href="${data}" download="${name}" class="btn-download">Download</a>
                <button class="btn-close">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal when clicking close button or outside the modal
    modal.querySelector('.close-attachment-modal').addEventListener('click', closeAttachmentModal);
    modal.querySelector('.btn-close').addEventListener('click', closeAttachmentModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAttachmentModal();
        }
    });
}

function closeAttachmentModal() {
    const modal = document.querySelector('.attachment-modal');
    if (modal) {
        modal.remove();
    }
}
    
    // Mark all comments and replies as read
    sortedComments.forEach(comment => {
        comment.isNew = false;
        if (comment.replies) {
            comment.replies.forEach(reply => reply.isNew = false);
        }
    });

    // Update worker data in localStorage
    const updatedWorkerData = JSON.parse(localStorage.getItem('workerData')) || {};
    updatedWorkerData[currentWorker.name].comments = sortedComments;
    localStorage.setItem('workerData', JSON.stringify(updatedWorkerData));

    // Update notifications
    updateNotifications();
}
function updateCommentNotification() {
    const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
    const comments = workerData[currentWorker.name]?.comments || [];

    // Check for new comments or admin replies
    const newComments = comments.filter(comment => 
        comment.isNew || 
        (comment.replies && comment.replies.some(reply => reply.isNew))
    );

    const commentNotificationBadge = document.querySelector('#commentsLink .notification-dot');
    if (newComments.length > 0) {
        commentNotificationBadge.classList.remove('hidden');
        commentNotificationBadge.textContent = newComments.length;
    } else {
        commentNotificationBadge.classList.add('hidden');
    }
}

// Modify the admin.js reply function to add isNew flag
function openAdminReplyModal(workerName, commentTimestamp) {
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h3>Reply to ${workerName}'s Comment</h3>
        <form id="adminReplyForm">
            <textarea id="adminReplyText" rows="4" required placeholder="Type your reply..."></textarea>
            <button type="submit">Send Reply</button>
        </form>
    `;
    
    const modal = document.getElementById('modal');
    modal.style.display = 'block';

    const adminReplyForm = document.getElementById('adminReplyForm');
    adminReplyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const replyText = document.getElementById('adminReplyText').value.trim();
        
        if (replyText) {
            const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            
            if (workerData[workerName]) {
                const commentIndex = workerData[workerName].comments.findIndex(
                    comment => comment.timestamp === commentTimestamp
                );
                
                if (commentIndex !== -1) {
                    const newReply = {
                        text: replyText,
                        timestamp: new Date().toISOString(),
                        isAdminReply: true,
                        isNew: true  // Explicitly mark as new
                    };
                    
                    // Ensure replies array exists
                    workerData[workerName].comments[commentIndex].replies = 
                        workerData[workerName].comments[commentIndex].replies || [];
                    
                    // Add reply
                    workerData[workerName].comments[commentIndex].replies.push(newReply);
                    
                    // Mark the original comment as having a new reply
                    workerData[workerName].comments[commentIndex].isNew = true;
                    
                    // Save updated worker data
                    localStorage.setItem('workerData', JSON.stringify(workerData));
                    
                    // Close modal
                    modal.style.display = 'none';
                    
                    alert('Reply sent successfully!');
                }
            }
        }
    });
}
    // Handle leave application
    leaveApplicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const leaveType = document.getElementById('leaveType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const totalDays = document.getElementById('totalDays').value;
        const reason = document.getElementById('reason').value;

        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const newApplication = {
            id: Date.now().toString(),
            workerName: currentWorker.name,
            department: currentWorker.department,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason,
            status: 'Pending',
            submittedAt: new Date().toISOString()
        };
        leaveApplications.push(newApplication);
        localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));

        alert('Leave application submitted successfully!');
        leaveApplicationForm.reset();
    });

    // Load leave requests
    function loadLeaveRequests() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const workerApplications = leaveApplications
        .filter(app => app.workerName === currentWorker.name)
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)); // Sort in descending order
    
        leaveRequestsList.innerHTML = '';
        workerApplications.forEach(app => {
            const requestElement = document.createElement('div');
            requestElement.className = 'leave-request';
            requestElement.innerHTML = `
                <h4>${app.leaveType}</h4>
                <p><strong>Dates:</strong> ${app.startDate} to ${app.endDate}</p>
                <p><strong>Total Days:</strong> ${app.totalDays}</p>
                <p><strong>Status:</strong> <span class="status-${app.status.toLowerCase()}">${app.status}</span></p>
                <p><strong>Reason:</strong> ${app.reason}</p>
                <small>Submitted on: ${new Date(app.submittedAt).toLocaleString()}</small>
            `;
            leaveRequestsList.appendChild(requestElement);
        });

        // Mark notifications as viewed
        const updatedApplications = leaveApplications.map(app => {
            if (app.workerName === currentWorker.name) {
                return { ...app, workerViewed: true };
            }
            return app;
        });
        localStorage.setItem('leaveApplications', JSON.stringify(updatedApplications));
        updateLeaveRequestNotification();
    }

    // Update leave request notification
    function updateLeaveRequestNotification() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const newApplications = leaveApplications.filter(app => 
            app.workerName === currentWorker.name && 
            (app.status === 'Approved' || app.status === 'Rejected') && 
            !app.workerViewed
        );
        
        if (newApplications.length > 0) {
            leaveRequestNotification.classList.remove('hidden');
            leaveRequestNotification.textContent = newApplications.length;
        } else {
            leaveRequestNotification.classList.add('hidden');
        }
    }

    // Handle adding a new comment
    addCommentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const commentText = document.getElementById('commentText').value;
        const attachmentInput = document.getElementById('commentAttachment');
        
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (!workerData[currentWorker.name]) {
            workerData[currentWorker.name] = { comments: [] };
        }
        
        // Handle file attachment
        let attachmentData = null;
        if (attachmentInput.files.length > 0) {
            const file = attachmentInput.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                attachmentData = {
                    name: file.name,
                    type: file.type,
                    data: event.target.result
                };
                
                saveComment(commentText, attachmentData);
            };
            reader.readAsDataURL(file);
        } else {
            saveComment(commentText, null);
        }
    });
    
    function saveComment(commentText, attachmentData) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const newComment = {
            text: commentText,
            timestamp: new Date().toISOString(),
            attachment: attachmentData
        };
        
        workerData[currentWorker.name].comments = workerData[currentWorker.name].comments || [];
        workerData[currentWorker.name].comments.push(newComment);
        
        localStorage.setItem('workerData', JSON.stringify(workerData));
        
        addCommentForm.reset();
        loadComments();
    }
    // Handle profile image edit
    editProfileImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newPhotoUrl = e.target.result;
                sidebarProfileImage.src = newPhotoUrl;
                
                // Update worker's photo in localStorage
                const workers = JSON.parse(localStorage.getItem('workers')) || [];
                const updatedWorkers = workers.map(worker => {
                    if (worker.name === currentWorker.name) {
                        return { ...worker, photo: newPhotoUrl };
                    }
                    return worker;
                });
                localStorage.setItem('workers', JSON.stringify(updatedWorkers));
                
                // Update current worker's photo
                currentWorker.photo = newPhotoUrl;
            };
            reader.readAsDataURL(file);
        }
    });

    // Calculate total days for leave application
    document.getElementById('startDate').addEventListener('change', updateTotalDays);
    document.getElementById('endDate').addEventListener('change', updateTotalDays);

    function updateTotalDays() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (startDate && endDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('totalDays').value = diffDays;
        }
    }

    // Close modals when clicking on the close button or outside the modal
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Initial load
    loadWorkers();
});
