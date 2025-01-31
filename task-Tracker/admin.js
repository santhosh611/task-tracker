document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginContainer = document.getElementById('adminLoginContainer');
    const adminDashboard = document.getElementById('adminDashboard');
    const workerActivitiesBody = document.getElementById('workerActivitiesBody');
    const workerActivitiesHead = document.getElementById('workerActivitiesHead');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.querySelector('.close');
    const searchInput = document.getElementById('searchWorker');
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    const addWorkerForm = document.getElementById('addWorkerForm');
    const addTopicForm = document.getElementById('addTopicForm');
    const resetAllActivitiesBtn = document.getElementById('resetAllActivitiesBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const leaveApplicationsBody = document.getElementById('leaveApplicationsBody');
    const addColumnForm = document.getElementById('addColumnForm');
    const addNewDepartmentBtn = document.getElementById('addNewDepartmentBtn');

    const adminCredentials = {
        username: 'admin',
        password: '0'
    };

    // Admin login
    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (username === adminCredentials.username && password === adminCredentials.password) {
            adminLoginContainer.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            loadWorkerActivities();
            loadDepartments();
            loadTopics();
            loadColumns();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });

    // Sidebar functionality
    let sidebarOpen = false; // Track sidebar state
    let allComments = [];


    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        mainContent.style.marginLeft = '250px'; // Adjust main content margin
        sidebarOpen = true;
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('active');
        mainContent.style.marginLeft = '0'; // Reset main content margin
        sidebarOpen = false;
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showSection(section);
            if (section === 'leaveInsights') {
                calculateLeaveInsights();
            }
            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                mainContent.style.marginLeft = '0'; // Reset main content margin
                sidebarOpen = false;
            }
        });
    });

    function showSection(sectionId) {
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => section.classList.add('hidden'));
        document.getElementById(`${sectionId}Section`).classList.remove('hidden');

        sidebarLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    }

    // Load worker activities
    function loadWorkerActivities(searchTerm = '') {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        workerActivitiesBody.innerHTML = '';
        
        let tableContainer = document.querySelector('.table-container');
        if (!tableContainer) {
            tableContainer = document.createElement('div');
            tableContainer.className = 'table-container';
            document.getElementById('dashboardSection').appendChild(tableContainer);
        }
        
    // Set the container's overflow to auto for horizontal scrolling
    tableContainer.style.overflowX = 'auto';

    // Set the table's width to 'max-content' to allow it to grow
    workerActivitiesTable.style.width = 'max-content';
    
        // Update header to include all columns
        const headerRow = workerActivitiesHead.querySelector('tr');
        headerRow.innerHTML = `
            <th>Rank</th>
           <th>Settings</th>
            <th>Photo</th>
            <th>Name</th>
            <th>Department</th>
            ${columns.map(column => `<th>${column.name}</th>`).join('')}
            <th>Topic Points</th>
            <th>Total Points</th>
            <th>Today's Activities</th>
            <th>Last Submission</th>
            
        `;
    
        const sortedWorkers = workers.map(worker => {
            const data = workerData[worker.name] || {};
            const totalPoints = calculateTotalPoints(data, columns);
            return {
                ...worker,
                ...data,
                totalPoints,
                lastSubmission: data.lastSubmission || {}
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);
        
    const filteredWorkers = sortedWorkers.filter(worker => 
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
        filteredWorkers.forEach((worker, index) => {
            const rank = worker.totalPoints > 0 ? index + 1 : '-';
            const row = document.createElement('tr');
            
            // Get points for each column
            const columnPoints = columns.map(column => {
                const columnName = column.name.toLowerCase().replace(/\s+/g, '');
                let points = 0;
                if (worker.activities) {
                    worker.activities.forEach(activity => {
                        if (activity.task && activity.task[columnName]) {
                            points += parseInt(activity.task[columnName]) || 0;
                        }
                    });
                }
                return points;
            });
    
            row.innerHTML = `
                <td>${rank}</td>
                                    <button class="settings-btn" aria-label="Settings for ${worker.name}">
                        <i class="fas fa-cog"></i>
                    </button>
                    <div class="settings-menu hidden">
                        <button class="edit-worker-btn">Edit</button>
                        <button class="delete-worker-btn">Delete</button>
                        <button class="add-comment-btn">Add Comment</button>
                        <button class="view-report-btn">View Report</button>
                        <button class="reset-worker-btn">Reset Activities</button>
                        <button class="view-comments-btn">View Comments</button>
                    </div>
                </td>
                <td><img src="${worker.photo || '/placeholder.svg?height=50&width=50&text=' + worker.name}" alt="${worker.name}'s photo" class="worker-photo-small"></td>
                <td>${worker.name}</td>
                <td>${worker.department}</td>
                ${columnPoints.map(points => `<td>${points}</td>`).join('')}
                <td>${worker.topicPoints || 0}</td>
                <td>${worker.totalPoints}</td>
                <td>${formatTodayActivities(worker.activities)}</td>
                <td>${worker.lastSubmission.timestamp ? new Date(worker.lastSubmission.timestamp).toLocaleString() : 'N/A'}</td>

            `;
            workerActivitiesBody.appendChild(row);

            const settingsBtn = row.querySelector('.settings-btn');
            const settingsMenu = row.querySelector('.settings-menu');
            
            settingsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.settings-menu').forEach(menu => {
                    if (menu !== settingsMenu) {
                        menu.classList.add('hidden');
                    }
                });
                settingsMenu.classList.toggle('hidden');
            });

            row.querySelector('.edit-worker-btn').addEventListener('click', () => openEditWorkerModal(worker.name));
            row.querySelector('.delete-worker-btn').addEventListener('click', () =>   openDeleteWorkerModal(worker.name));
            row.querySelector('.add-comment-btn').addEventListener('click', () => openAddCommentModal(worker.name));
            row.querySelector('.view-report-btn').addEventListener('click', () => openWorkerReportModal(worker));
            row.querySelector('.reset-worker-btn').addEventListener('click', () => openResetWorkerActivitiesModal(worker.name));
            row.querySelector('.view-comments-btn').addEventListener('click', () => openViewCommentsModal(worker.name));
        });
    }

    function calculateTotalPoints(data, columns) {
        let totalPoints = 0;
    
        
        if (data.activities) {
            data.activities.forEach(activity => {
                if (activity.points) {
                    totalPoints += parseInt(activity.points) || 0;
                }
            });
        }
    
        return totalPoints;
    }
    searchInput.addEventListener('input', (e) => {
        loadWorkerActivities(e.target.value);
    });

    function formatTodayActivities(activities) {
        if (!Array.isArray(activities)) return 'N/A';
        const today = new Date().toDateString();
        const todayActivities = activities.filter(activity => {
            const activityDate = new Date(activity.timestamp).toDateString();
            return activityDate === today;
        });
        const uniqueActivities = [...new Set(todayActivities.map(activity => activity.type))];
        return uniqueActivities.join(', ') || 'No activities today';
    }

    function openResetWorkerActivitiesModal(workerName) {
        modalContent.innerHTML = `
            <h3>Reset Activities for ${workerName}</h3>
            <p>Are you sure you want to reset all activities for this worker? This action cannot be undone.</p>
            <button id="confirmResetWorker">Confirm</button>
            <button id="cancelResetWorker">Cancel</button>
        `;
        modal.style.display = 'block';

        document.getElementById('confirmResetWorker').addEventListener('click', () => {
            resetWorkerActivities(workerName);
            modal.style.display = 'none';
        });

        document.getElementById('cancelResetWorker').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    function resetWorkerActivities(workerName) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        if (workerData[workerName]) {
            columns.forEach(column => {
                workerData[workerName][column.name.toLowerCase().replace(/\s+/g, '')] = 0;
            });
            workerData[workerName].topicPoints = 0;
            workerData[workerName].lastSubmission = {};
            workerData[workerName].activities = [];
            localStorage.setItem('workerData', JSON.stringify(workerData));
            alert(`${workerName}'s activities have been reset.`);
            loadWorkerActivities();
        } else {
            alert('Worker not found.');
        }
    }
    function loadAllReplies() {
        const repliesList = document.getElementById('repliesList');
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        
        let allComments = [];
        workers.forEach(worker => {
            const workerComments = workerData[worker.name]?.comments || [];
            const processedComments = workerComments.map(comment => ({
                workerName: worker.name,
                department: worker.department,
                ...comment
            }));
            allComments = allComments.concat(processedComments);
        });
 
        // Sort comments by most recent
        allComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
        repliesList.innerHTML = '';
        const commentsContainer = document.createElement('div');
        commentsContainer.className = 'all-comments-container';
    
        if (allComments.length === 0) {
            commentsContainer.innerHTML = '<p>No comments found.</p>';
        } else {
            allComments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'admin-comment-item';
                
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
                                    <a href="${comment.attachment.data}" download="${comment.attachment.name}"
                                       class="btn-download-attachment">
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }
                const repliesContent = comment.replies ? comment.replies.map(reply => `
                    <div class="admin-reply">
                        <strong>Admin Reply:</strong>
                        <p>${reply.text}</p>
                        <small>${new Date(reply.timestamp).toLocaleString()}</small>
                    </div>
                `).join('') : '';
                commentElement.innerHTML = `
                <div class="comment-header">
                    <strong>${comment.workerName}</strong>
                    <span class="comment-department">(${comment.department})</span>
                    <small class="comment-date">
                        ${new Date(comment.timestamp).toLocaleString()}
                    </small>
                </div>
                <p class="comment-text">${comment.text}</p>
                ${attachmentContent}
                <div class="comment-replies">
                    ${repliesContent}
                </div>
                <button class="btn-reply-comment" 
                        data-worker="${comment.workerName}" 
                        data-timestamp="${comment.timestamp}">
                    Reply
                </button>
            `;
            
            commentsContainer.appendChild(commentElement);
        });
    
        commentsContainer.querySelectorAll('.btn-view-attachment').forEach(button => {
            button.addEventListener('click', (e) => {
                const name = e.target.getAttribute('data-name');
                const type = e.target.getAttribute('data-type');
                const data = e.target.getAttribute('data-data');
                openAttachmentModal(name, type, data);
            });
        });
    }
    
        repliesList.appendChild(commentsContainer);
    
    
        // Add event listeners for reply buttons
        repliesList.addEventListener('click', (e) => {
            if (e.target.classList.contains('reply-to-comment-btn')) {
                const workerName = e.target.getAttribute('data-worker');
                const commentTimestamp = e.target.getAttribute('data-timestamp');
                openAdminReplyModal(workerName, commentTimestamp);
            }
        });
    }
    
    function openAdminReplyModal(workerName, commentTimestamp) {
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h3>Reply to ${workerName}'s Comment</h3>
            <form id="adminReplyForm">
                <textarea id="adminReplyText" rows="4" required placeholder="Type your reply..."></textarea>
                <div class="modal-actions">
                    <button type="submit" class="btn-primary">Send Reply</button>
                    <button type="button" class="btn-secondary" id="cancelReply">Cancel</button>
                </div>
            </form>
        `;
        
        const modal = document.getElementById('modal');
        modal.style.display = 'block';
    
        const adminReplyForm = document.getElementById('adminReplyForm');
        const cancelBtn = document.getElementById('cancelReply');
    
        adminReplyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const replyText = document.getElementById('adminReplyText').value.trim();
            
            if (replyText) {
                // Get worker data
                const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
                
                // Find and update the specific comment
                if (workerData[workerName]) {
                    const commentIndex = workerData[workerName].comments.findIndex(
                        comment => comment.timestamp === commentTimestamp
                    );
                    
                    if (commentIndex !== -1) {
                        const newReply = {
                            text: replyText,
                            timestamp: new Date().toISOString(),
                            isAdminReply: true,
                            isNew: true
                        };
                        
                        // Initialize replies array if not exists
                        if (!workerData[workerName].comments[commentIndex].replies) {
                            workerData[workerName].comments[commentIndex].replies = [];
                        }
                        
                        // Add reply
                        workerData[workerName].comments[commentIndex].replies.push(newReply);
                        
                        // Save updated worker data
                        localStorage.setItem('workerData', JSON.stringify(workerData));
                        
                        // Reload replies
                        loadAllReplies();
                        
                        // Close modal
                        modal.style.display = 'none';
                        
                        alert('Reply sent successfully!');
                    }
                }
            }
        });
    }
    
    function openEditWorkerModal(workerName) {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const worker = workers.find(w => w.name === workerName);
        const workerActivityData = workerData[workerName] || {};
        const departments = JSON.parse(localStorage.getItem('departments')) || [];

        if (worker) {
            modalContent.innerHTML = `
                <h3>Edit Worker: ${worker.name}</h3>
                <form id="editWorkerForm">
                    <label for="editWorkerName">Name:</label>
                    <input type="text" id="editWorkerName" value="${worker.name}" required>
                    <label for="editWorkerUsername">Username:</label>
                    <input type="text" id="editWorkerUsername" value="${worker.username}" required>
                    <label for="editWorkerDepartment">Department:</label>
                    <select id="editWorkerDepartment" required>
                        ${departments.map(dept => `<option value="${dept}" ${dept === worker.department ? 'selected' : ''}>${dept}</option>`).join('')}
                    </select>
                    <label for="editWorkerPassword">New Password (leave blank to keep current):</label>
                    <input type="password" id="editWorkerPassword">
                    <label for="editWorkerPhoto">Update Photo:</label>
                    <input type="file" id="editWorkerPhoto" accept="image/*">
                    <img id="previewPhoto" src="${worker.photo || '/placeholder.svg?height=100&width=100&text=' + worker.name}" alt="Worker's photo" style="width: 100px; height: 100px; object-fit: cover; margin-top: 10px;">
                    <button type="submit">Save Changes</button>
                    <button type="button" class="cancel-btn">Cancel</button>
                </form>
            `;
            modal.style.display = 'block';

            const editWorkerForm = document.getElementById('editWorkerForm');
            const editWorkerPhoto = document.getElementById('editWorkerPhoto');
            const previewPhoto = document.getElementById('previewPhoto');
            const cancelBtn = editWorkerForm.querySelector('.cancel-btn');

            editWorkerPhoto.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        previewPhoto.src = event.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });

            editWorkerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const newName = document.getElementById('editWorkerName').value;
                const newUsername = document.getElementById('editWorkerUsername').value;
                const newDepartment = document.getElementById('editWorkerDepartment').value;
                const newPassword = document.getElementById('editWorkerPassword').value;
                const newPhoto = previewPhoto.src;

                const oldName = worker.name;
                worker.name = newName;
                worker.username = newUsername;
                worker.department = newDepartment;
                if (newPassword) {
                    worker.password = newPassword;
                }
                worker.photo = newPhoto;

                localStorage.setItem('workers', JSON.stringify(workers));

                if (oldName !== newName) {
                    workerData[newName] = { 
                        ...workerActivityData, 
                        name: newName, 
                        department: newDepartment,
                        photo: newPhoto
                    };
                    delete workerData[oldName];
                } else {
                    workerData[newName] = { 
                        ...workerActivityData, 
                        department: newDepartment,
                        photo: newPhoto
                    };
                }
                localStorage.setItem('workerData', JSON.stringify(workerData));

                alert('Worker information updated successfully!');
                modal.style.display = 'none';
                loadWorkerActivities();
            });

            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        } else {
            alert('Worker not found.');
        }
    }

    function openDeleteWorkerModal(workerName) {
        modalContent.innerHTML = `
            <h3>Delete Worker: ${workerName}</h3>
            <p>Are you sure you want to delete this worker? This action cannot be undone.</p>
            <button id="confirmDeleteWorker">Delete</button>
            <button id="cancelDeleteWorker">Cancel</button>
        `;
        modal.style.display = 'block';

        document.getElementById('confirmDeleteWorker').addEventListener('click', () => {
            deleteWorker(workerName);
            modal.style.display = 'none';
        });

        document.getElementById('cancelDeleteWorker').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    function deleteWorker(workerName) {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const updatedWorkers = workers.filter(w => w.name !== workerName);
        
        localStorage.setItem('workers', JSON.stringify(updatedWorkers));

        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        delete workerData[workerName];
        localStorage.setItem('workerData', JSON.stringify(workerData));

        alert('Worker deleted successfully!');
        
        loadWorkerActivities();
    }

    function openAddCommentModal(workerName) {
        modalContent.innerHTML = `
            <h3>Add Comment for ${workerName}</h3>
            <form id="addCommentForm">
                <textarea id="adminCommentText" rows="4" required></textarea>
                <button type="submit">Send Comment</button>
                <button type="button" class="cancel-btn">Cancel</button>
            </form>
        `;
        modal.style.display = 'block';

        const addCommentForm = document.getElementById('addCommentForm');
        const cancelBtn = addCommentForm.querySelector('.cancel-btn');

        addCommentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const comment = document.getElementById('adminCommentText').value.trim();
            if (comment) {
                const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
                if (!workerData[workerName]) {
                    workerData[workerName] = { comments: [] };
                }
                if (!workerData[workerName].comments) {
                    workerData[workerName].comments = [];
                }
                workerData[workerName].comments.push({
                    text: comment,
                    timestamp: new Date().toISOString(),
                    isNew: true
                });
                localStorage.setItem('workerData', JSON.stringify(workerData));
                alert('Comment sent successfully!');
                modal.style.display = 'none';
            } else {
                alert('Please enter a comment before sending.');
            }
        });

        cancelBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    function openWorkerReportModal(worker) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const workerActivities = workerData[worker.name]?.activities || [];

        const groupedActivities = groupActivitiesByDate(workerActivities);

        modalContent.innerHTML = `
            <h3>Worker Report: ${worker.name}</h3>
            <div id="reportContent"></div>
            <button id="closeReportBtn">Close</button>
        `;

        const reportContent = document.getElementById('reportContent');

        for (const [date, activities] of Object.entries(groupedActivities)) {
            const dateSection = document.createElement('div');
            dateSection.innerHTML = `
                <h4>${date}</h4>
                <ul>
                    ${activities.map(activity => `<li>${activity.time} - ${activity.type}: ${activity.amount}</li>`).join('')}
                </ul>
            `;
            reportContent.appendChild(dateSection);
        }

        modal.style.display = 'block';

        document.getElementById('closeReportBtn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    function groupActivitiesByDate(activities) {
        const grouped = {};
        activities.forEach(activity => {
            const date = new Date(activity.timestamp);
            const dateString = date.toDateString();
            if (!grouped[dateString]) {
                grouped[dateString] = [];
            }
            grouped[dateString].push({
                time: date.toLocaleTimeString(),
                type: activity.type,
                amount: activity.amount
            });
        });
        return grouped;
    }

    addWorkerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newWorkerName').value;
        const username = document.getElementById('newWorkerUsername').value;
        const password = document.getElementById('newWorkerPassword').value;
        const department = document.getElementById('newWorkerDepartment').value;
        const photoInput = document.getElementById('newWorkerPhoto');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const photo = event.target.result;
            
            const workers = JSON.parse(localStorage.getItem('workers')) || [];
            const newWorker = { name, username, password, department, photo };
            workers.push(newWorker);
            localStorage.setItem('workers', JSON.stringify(workers));

            const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            workerData[name] = {
                topicPoints: 0,
                lastSubmission: {},
                activities: [],
                comments: [],
                department
            };
            localStorage.setItem('workerData', JSON.stringify(workerData));

            alert('New worker added successfully!');
            addWorkerForm.reset();
            loadWorkerActivities();
        };
        
        if (photoInput.files[0]) {
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            reader.onload({ target: { result: null } });
        }
    });
    
    function loadDepartments() {
        const departments = JSON.parse(localStorage.getItem('departments')) || [];
        const workerDepartmentSelect = document.getElementById('newWorkerDepartment');
        const topicDepartmentSelect = document.getElementById('newTopicDepartment');

        // Populate worker department select
        if (workerDepartmentSelect) {
            workerDepartmentSelect.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                workerDepartmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }

        // Populate topic department select
        if (topicDepartmentSelect) {
            topicDepartmentSelect.innerHTML = '<option value="">Select Department</option>';
            topicDepartmentSelect.innerHTML += '<option value="all">All Departments</option>';
            departments.forEach(dept => {
                topicDepartmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }
    }

    addNewDepartmentBtn.addEventListener('click', () => {
        const newDepartment = prompt('Enter new department name:');
        if (newDepartment) {
            const departments = JSON.parse(localStorage.getItem('departments')) || [];
            if (!departments.includes(newDepartment)) {
                departments.push(newDepartment);
                localStorage.setItem('departments', JSON.stringify(departments));
                loadDepartments();
                alert('New department added successfully!');
            } else {
                alert('This department already exists.');
            }
        }
    });

    function loadTopics() {
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        const departments = JSON.parse(localStorage.getItem('departments')) || [];
        const topicsList = document.getElementById('topicsList');
        if (!topicsList) return;
        
        topicsList.innerHTML = '';
    
        // Create topic counts container and toggle button
        const topicCountsContainer = document.createElement('div');
        topicCountsContainer.id = 'topicCountsContainer';
    
        const toggleButton = document.createElement('button');
        toggleButton.id = 'toggleButton';
        toggleButton.textContent = 'Show Department-wise Counts';
        toggleButton.addEventListener('click', () => {
            topicCountsContainer.classList.toggle('show-department-wise');
            toggleButton.textContent = topicCountsContainer.classList.contains('show-department-wise') 
                ? 'Show Total Count' 
                : 'Show Department-wise Counts';
        });
    
        // Calculate and display topic counts
        const totalTopics = topics.length;
        const totalTopicsElement = document.createElement('h3');
        totalTopicsElement.textContent = `Total Topics: ${totalTopics}`;
        totalTopicsElement.classList.add('topic-count', 'total-count');
    
        const departmentCountsElement = document.createElement('div');
        departmentCountsElement.classList.add('topic-count', 'department-counts');
    
        // Calculate department-wise topic counts
        departments.forEach(department => {
            const count = topics.filter(topic => topic.department === department).length;
            const departmentElement = document.createElement('p');
            departmentElement.textContent = `${department}: ${count}`;
            departmentCountsElement.appendChild(departmentElement);
        });
    
        // Handle topics without department or with "All Departments"
        const generalTopics = topics.filter(topic => !topic.department || topic.department === 'all');
        if (generalTopics.length > 0) {
            const departmentElement = document.createElement('p');
            departmentElement.textContent = `General Topics: ${generalTopics.length}`;
            departmentCountsElement.appendChild(departmentElement);
        }
    
        topicCountsContainer.appendChild(totalTopicsElement);
        topicCountsContainer.appendChild(departmentCountsElement);
    
        topicsList.insertBefore(toggleButton, topicsList.firstChild);
        topicsList.insertBefore(topicCountsContainer, toggleButton.nextSibling);
    
        // Department filter
        const departmentFilter = document.createElement('div');
        departmentFilter.className = 'department-filter';
        departmentFilter.innerHTML = `
            <label for="filterDepartment">Filter by Department:</label>
            <select id="filterDepartment">
                <option value="">All Departments</option>
                ${departments.map(dept => `<option value="${dept}">${dept}</option>`).join('')}
            </select>
        `;
        topicsList.appendChild(departmentFilter);
    
        // Create General Topics section
        const generalTopicsSection = createDepartmentSection('General Topics');
        generalTopicsSection.id = 'department-general-topics';
    
        // Add general topics to General Topics section
        generalTopics.forEach(topic => {
            const topicElement = createTopicElement(topic);
            generalTopicsSection.querySelector('.topics-container').appendChild(topicElement);
        });
    
        // Create and populate department sections
        const departmentSections = departments.map(department => {
            const departmentSection = createDepartmentSection(department);
            
            // Add department-specific topics
            const departmentTopics = topics.filter(topic => 
                topic.department === department && topic.department !== 'all'
            );
            
            departmentTopics.forEach(topic => {
                const topicElement = createTopicElement(topic);
                departmentSection.querySelector('.topics-container').appendChild(topicElement);
            });
            
            return departmentSection;
        });
    
        // Append sections - General Topics first, then department sections
        topicsList.appendChild(generalTopicsSection);
        departmentSections.forEach(section => {
            topicsList.appendChild(section);
        });
    
        // Add event listeners to department headers for toggling
        document.querySelectorAll('.department-header').forEach(header => {
            header.addEventListener('click', () => {
                const departmentSection = header.closest('.department-section');
                departmentSection.classList.toggle('collapsed');
            });
        });
    
        // Department filter event listener
        document.getElementById('filterDepartment').addEventListener('change', (e) => {
            const selectedDepartment = e.target.value;
            const departmentSections = document.querySelectorAll('.department-section');
            const generalTopicsSection = document.getElementById('department-general-topics');
    
            if (selectedDepartment === '') {
                departmentSections.forEach(section => {
                    section.style.display = 'block';
                });
                generalTopicsSection.style.display = 'block';
            } else {
                departmentSections.forEach(section => {
                    section.style.display = 'none';
                });
                const selectedSection = document.getElementById(`department-${selectedDepartment}`);
                if (selectedSection) {
                    selectedSection.style.display = 'block';
                }
                generalTopicsSection.style.display = 'none';
            }
        });
    }
    
    function createDepartmentSection(department) {
        const section = document.createElement('div');
        section.className = 'department-section collapsed'; // Add 'collapsed' class by default
        section.id = `department-${department.toLowerCase().replace(/\s+/g, '-')}`;
        section.innerHTML = `
            <div class="department-header">
                <h3>${department}</h3>
                <span class="toggle-icon">▼</span>
            </div>
            <div class="topics-container"></div> 
        `;
        return section;
    }
    function createTopicElement(topic) {
        const topicElement = document.createElement('div');
        topicElement.className = 'topic-item';
        topicElement.innerHTML = `
            <div class="topic-info">
                <span class="topic-name">${topic.name}</span>
                <span class="topic-points">(${parseInt(topic.points)} points)</span>
            </div>
            <div class="topic-actions">
                <button class="edit-topic-btn" data-topic="${topic.name}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="delete-topic-btn" data-topic="${topic.name}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    
        topicElement.querySelector('.edit-topic-btn').addEventListener('click', () => openEditTopicModal(topic.name));
        topicElement.querySelector('.delete-topic-btn').addEventListener('click', () => deleteTopic(topic.name));
    
        return topicElement;
    }
// Update the addTopicForm event listener
addTopicForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('newTopicName').value.trim();
    const points = parseInt(document.getElementById('newTopicPoints').value);
    const department = document.getElementById('newTopicDepartment').value;

    if (!name || isNaN(points)) {
        alert('Please enter valid topic name and points');
        return;
    }

    const topics = JSON.parse(localStorage.getItem('topics')) || [];

    // Check if topic already exists
    if (topics.some(topic => topic && topic.name === name)) {
        alert('A topic with this name already exists');
        return;
    }

    // Add new topic
    topics.push({ name, points, department });
    localStorage.setItem('topics', JSON.stringify(topics));

    // Reset form and reload topics
    addTopicForm.reset();
    loadTopics();
    alert('Topic added successfully!');
});
// Update the openEditTopicModal function
function openEditTopicModal(topicName) {
    const topics = JSON.parse(localStorage.getItem('topics')) || [];
    const topic = topics.find(t => t && t.name === topicName);

    if (!topic) {
        alert('Topic not found');
        return;
    }

    const departments = JSON.parse(localStorage.getItem('departments')) || [];

    modalContent.innerHTML = `
        <h3>Edit Topic</h3>
        <form id="editTopicForm">
            <div class="form-group">
                <label for="editTopicName">Topic Name:</label>
                <input type="text" id="editTopicName" value="${topic.name}" required>
            </div>
            <div class="form-group">
                <label for="editTopicPoints">Points:</label>
                <input type="number" id="editTopicPoints" value="${topic.points}" required min="0">
            </div>
            <div class="form-group">
                <label for="editTopicDepartment">Department:</label>
                <select id="editTopicDepartment">
                    <option value="">All Departments</option>
                    ${departments.map(dept => `<option value="${dept}" ${dept === topic.department ? 'selected' : ''}>${dept}</option>`).join('')}
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn-primary">Save Changes</button>
                <button type="button" class="btn-secondary" id="cancelEditTopic">Cancel</button>
            </div>
        </form>
    `;

    modal.style.display = 'block';

    const editTopicForm = document.getElementById('editTopicForm');
    const cancelBtn = document.getElementById('cancelEditTopic');

    editTopicForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const newName = document.getElementById('editTopicName').value.trim();
        const newPoints = parseInt(document.getElementById('editTopicPoints').value);
        const newDepartment = document.getElementById('editTopicDepartment').value;
        
        if (!newName || isNaN(newPoints)) {
            alert('Please enter valid topic name and points');
            return;
        }
        
        // Update topic
        const index = topics.findIndex(t => t && t.name === topicName);
        if (index !== -1) {
            topics[index] = { name: newName, points: newPoints, department: newDepartment };
            localStorage.setItem('topics', JSON.stringify(topics));
            loadTopics();
            modal.style.display = 'none';
            alert('Topic updated successfully!');
        }
    });

    cancelBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}
// Add this function to delete a topic
function deleteTopic(topicName) {
    if (confirm(`Are you sure you want to delete the topic "${topicName}"?`)) {
        let topics = JSON.parse(localStorage.getItem('topics')) || [];
        topics = topics.filter(topic => topic && topic.name !== topicName);
        localStorage.setItem('topics', JSON.stringify(topics));
        loadTopics();
        alert('Topic deleted successfully!');
    }
}
// Call these functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDepartments();
    loadTopics();
});
const viewAllRepliesLink = document.querySelector('a[data-section="viewAllReplies"]');
if (viewAllRepliesLink) {
    viewAllRepliesLink.addEventListener('click', () => {
        loadAllReplies();
    });
}

    resetAllActivitiesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all worker activities? This action cannot be undone.')) {
            const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            const columns = JSON.parse(localStorage.getItem('columns')) || [];
            
            Object.keys(workerData).forEach(workerName => {
                columns.forEach(column => {
                    workerData[workerName][column.name.toLowerCase().replace(/\s+/g, '')] = 0;
                });
                workerData[workerName].topicPoints = 0;
                workerData[workerName].lastSubmission = {};
                workerData[workerName].activities = [];
            });
            
            localStorage.setItem('workerData', JSON.stringify(workerData));
            alert('All worker activities have been reset.');
            loadWorkerActivities();
        }
    });
    function loadLeaveApplications() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        
        // Sort applications by most recent first
        const sortedApplications = leaveApplications.sort((a, b) => {
            return new Date(b.submittedAt) - new Date(a.submittedAt);
        });
    
        // Display all applications without filtering initially
        displayFilteredLeaveApplications(sortedApplications);
    }
    
    // Modify the existing displayFilteredLeaveApplications function to automatically show all applications
    function displayFilteredLeaveApplications(applications) {
        leaveApplicationsBody.innerHTML = '';
        
        // If no applications, show a message
        if (applications.length === 0) {
            leaveApplicationsBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No leave applications found.</td>
                </tr>
            `;
            return;
        }
    
        applications.forEach(application => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${application.workerName}</td>
                <td>${application.department}</td>
                <td>${application.startDate}</td>
                <td>${application.endDate}</td>
                <td>${application.status}</td>
                <td>
                    ${application.status === 'Pending' ? `
                        <button class="approve-leave-btn" data-id="${application.id}">Approve</button>
                        <button class="reject-leave-btn" data-id="${application.id}">Reject</button>
                    ` : ''}
                    <button class="view-leave-details-btn" data-id="${application.id}">View Details</button>
                </td>
            `;
            leaveApplicationsBody.appendChild(row);
        });
    
    function addLeaveApplicationEventListeners() {
        document.querySelectorAll('.approve-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => approveLeave(e.target.getAttribute('data-id')));
        });
    
        document.querySelectorAll('.reject-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => rejectLeave(e.target.getAttribute('data-id')));
        });
    
        document.querySelectorAll('.view-leave-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => viewLeaveDetails(e.target.getAttribute('data-id')));
        });
    }
        // Add event listeners for approve, reject, and view details buttons
        document.querySelectorAll('.approve-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => approveLeave(e.target.getAttribute('data-id')));
        });

        document.querySelectorAll('.reject-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => rejectLeave(e.target.getAttribute('data-id')));
        });

        document.querySelectorAll('.view-leave-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => viewLeaveDetails(e.target.getAttribute('data-id')));
        });
    }

    function approveLeave(applicationId) {
        updateLeaveStatus(applicationId, 'Approved');
    }

    function rejectLeave(applicationId) {
        updateLeaveStatus(applicationId, 'Rejected');
    }

    function updateLeaveStatus(applicationId, newStatus) {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const applicationIndex = leaveApplications.findIndex(app => app.id === applicationId);

        if (applicationIndex !== -1) {
            leaveApplications[applicationIndex].status = newStatus;
            localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));
            loadLeaveApplications();
            alert(`Leave application ${newStatus.toLowerCase()}.`);
        }
    }

    function viewLeaveDetails(applicationId) {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const application = leaveApplications.find(app => app.id === applicationId);

        if (application) {
            modalContent.innerHTML = `
                <h3>Leave Application Details</h3>
                <p><strong>Worker Name:</strong> ${application.workerName}</p>
                <p><strong>Department:</strong> ${application.department}</p>
                <p><strong>Start Date:</strong> ${application.startDate}</p>
                <p><strong>End Date:</strong> ${application.endDate}</p>
                <p><strong>Status:</strong> ${application.status}</p>
                <p><strong>Reason:</strong> ${application.reason}</p>
                ${application.document ? `<p><strong>Document:</strong> <a href="${application.document}" target="_blank">View Document</a></p>` : ''}
                <button id="closeLeaveDetailsBtn">Close</button>
            `;
            modal.style.display = 'block';

            document.getElementById('closeLeaveDetailsBtn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }

    applyFiltersBtn.addEventListener('click', () => {
        const dateFilter = document.getElementById('dateFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const departmentFilter = document.getElementById('departmentFilter').value.toLowerCase();
    
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        
        // If no filters are applied, show all applications
        if (!dateFilter && !statusFilter && !departmentFilter) {
            displayFilteredLeaveApplications(leaveApplications);
            return;
        }
    
        const filteredApplications = leaveApplications.filter(app => {
            const dateMatch = !dateFilter || app.startDate <= dateFilter && app.endDate >= dateFilter;
            const statusMatch = !statusFilter || app.status === statusFilter;
            const departmentMatch = !departmentFilter || app.department.toLowerCase().includes(departmentFilter);
            return dateMatch && statusMatch && departmentMatch;
        });
    
        displayFilteredLeaveApplications(filteredApplications);
    });
    function calculateLeaveInsights() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
    
        // Group leave applications by worker for current month
        const workerLeaves = {};
        leaveApplications.forEach(app => {
            const startDate = new Date(app.startDate);
            if (startDate.getMonth() === currentMonth && 
                startDate.getFullYear() === currentYear && 
                app.status === 'Approved') {
                
                const workerName = app.workerName;
                const leaveDays = calculateLeaveDays(app.startDate, app.endDate);
                
                if (!workerLeaves[workerName]) {
                    workerLeaves[workerName] = {
                        department: app.department,
                        days: 0
                    };
                }
                workerLeaves[workerName].days += leaveDays;
            }
        });
        const sortedWorkerLeaves = Object.entries(workerLeaves)
        .sort((a, b) => b[1].days - a[1].days);

    const leaveInsightsBody = document.getElementById('leaveInsightsBody');
    const leaveInsightsSummary = document.getElementById('leaveInsightsSummary');

    leaveInsightsBody.innerHTML = '';
    sortedWorkerLeaves.forEach(([workerName, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${workerName}</td>
            <td>${data.department}</td>
            <td>${data.days}</td>
        `;
        leaveInsightsBody.appendChild(row);
    });
     if (sortedWorkerLeaves.length > 0) {
        const mostLeaves = sortedWorkerLeaves[0];
        const leastLeaves = sortedWorkerLeaves[sortedWorkerLeaves.length - 1];
        
        leaveInsightsSummary.innerHTML = `
            <h3>Monthly Leave Summary</h3>
            <p>Most Leaves: ${mostLeaves[0]} (${mostLeaves[1].days} days)</p>
            <p>Least Leaves: ${leastLeaves[0]} (${leastLeaves[1].days} days)</p>
        `;
    } else {
        leaveInsightsSummary.innerHTML = '<p>No leave applications this month.</p>';
    }
}

function calculateLeaveDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}
    
    function displayFilteredLeaveApplications(applications) {
        leaveApplicationsBody.innerHTML = '';
        applications.forEach(application => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${application.workerName}</td>
                <td>${application.department}</td>
                <td>${application.startDate}</td>
                <td>${application.endDate}</td>
                <td>${application.status}</td>
                <td>
                    ${application.status === 'Pending' ? `
                        <button class="approve-leave-btn" data-id="${application.id}">Approve</button>
                        <button class="reject-leave-btn" data-id="${application.id}">Reject</button>
                    ` : ''}
                    <button class="view-leave-details-btn" data-id="${application.id}">View Details</button>
                </td>
            `;
            leaveApplicationsBody.appendChild(row);
        });

        // Re-add event listeners for the new buttons
        document.querySelectorAll('.approve-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => approveLeave(e.target.getAttribute('data-id')));
        });

        document.querySelectorAll('.reject-leave-btn').forEach(btn => {
            btn.addEventListener('click', (e) => rejectLeave(e.target.getAttribute('data-id')));
        });

        document.querySelectorAll('.view-leave-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => viewLeaveDetails(e.target.getAttribute('data-id')));
        });
    }

    function calculateLeaveInsights() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
    
        // Group leave applications by worker for current month
        const workerLeaves = {};
        leaveApplications.forEach(app => {
            const startDate = new Date(app.startDate);
            if (startDate.getMonth() === currentMonth && 
                startDate.getFullYear() === currentYear && 
                app.status === 'Approved') {
                
                const workerName = app.workerName;
                const leaveDays = calculateLeaveDays(app.startDate, app.endDate);
                
                if (!workerLeaves[workerName]) {
                    workerLeaves[workerName] = {
                        department: app.department,
                        days: 0
                    };
                }
                workerLeaves[workerName].days += leaveDays;
            }
        });
        const sortedWorkerLeaves = Object.entries(workerLeaves)
        .sort((a, b) => b[1].days - a[1].days);

    const leaveInsightsBody = document.getElementById('leaveInsightsBody');
    const leaveInsightsSummary = document.getElementById('leaveInsightsSummary');

    leaveInsightsBody.innerHTML = '';
    sortedWorkerLeaves.forEach(([workerName, data]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${workerName}</td>
            <td>${data.department}</td>
            <td>${data.days}</td>
        `;
        leaveInsightsBody.appendChild(row);
    });
     if (sortedWorkerLeaves.length > 0) {
        const mostLeaves = sortedWorkerLeaves[0];
        const leastLeaves = sortedWorkerLeaves[sortedWorkerLeaves.length - 1];
        
        leaveInsightsSummary.innerHTML = `
            <h3>Monthly Leave Summary</h3>
            <p>Most Leaves: ${mostLeaves[0]} (${mostLeaves[1].days} days)</p>
            <p>Least Leaves: ${leastLeaves[0]} (${leastLeaves[1].days} days)</p>
        `;
    } else {
        leaveInsightsSummary.innerHTML = '<p>No leave applications this month.</p>';
    }
}
    function loadColumns() {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        const columnsList = document.getElementById('columnsList');
        columnsList.innerHTML = '';

        columns.forEach(column => {
            const columnElement = document.createElement('div');
            columnElement.className = 'column-item';
            columnElement.innerHTML = `
                <span>${column.name} (${column.department})</span>
                <button class="delete-column-btn" data-column="${column.name}">Delete</button>
            `;
            columnsList.appendChild(columnElement);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-column-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const columnName = e.target.getAttribute('data-column');
                deleteColumn(columnName);
            });
        });

        // Update department select options
        const departments = JSON.parse(localStorage.getItem('departments')) || [];
        const departmentSelect = document.getElementById('newColumnDepartment');
        departmentSelect.innerHTML = '<option value="all">All Departments</option>';
        departments.forEach(dept => {
            departmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
        });
    }

    function deleteColumn(columnName) {
        if (confirm(`Are you sure you want to delete the column "${columnName}"?`)) {
            let columns = JSON.parse(localStorage.getItem('columns')) || [];
            columns = columns.filter(column => column.name !== columnName);
            localStorage.setItem('columns', JSON.stringify(columns));

            // Update worker data
            const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            Object.keys(workerData).forEach(workerName => {
                delete workerData[workerName][columnName.toLowerCase().replace(/\s+/g, '')];
            });
            localStorage.setItem('workerData', JSON.stringify(workerData));

            loadColumns();
            loadWorkerActivities();
        }
    }

    addColumnForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const columnName = document.getElementById('newColumnName').value.trim();
        const department = document.getElementById('newColumnDepartment').value;

        if (!columnName) {
            alert('Please enter a valid column name');
            return;
        }

        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        if (columns.some(col => col.name.toLowerCase() === columnName.toLowerCase())) {
            alert('A column with this name already exists');
            return;
        }

        columns.push({ name: columnName, department });
        localStorage.setItem('columns', JSON.stringify(columns));

        // Initialize the new column for all workers
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        Object.keys(workerData).forEach(workerName => {
            if (department === 'all' || workerData[workerName].department === department) {
                workerData[workerName][columnName.toLowerCase().replace(/\s+/g, '')] = 0;
            }
        });
        localStorage.setItem('workerData', JSON.stringify(workerData));

        addColumnForm.reset();
        loadColumns();
        loadWorkerActivities();
        alert('New column added successfully!');
    });

    function openViewCommentsModal(workerName) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const comments = workerData[workerName]?.comments || [];
    
        modalContent.innerHTML = `
            <h3>Comments for ${workerName}</h3>
            <div id="commentsContainer" class="all-comments-container"></div>
            <button id="closeCommentsBtn">Close</button>
        `;
    
        const commentsContainer = document.getElementById('commentsContainer');
    
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<p>No comments found.</p>';
        } else {
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = `admin-comment-item ${comment.isNew ? 'unread' : ''}`;
    
    
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <small class="comment-timestamp">
                            ${new Date(comment.timestamp).toLocaleString()}
                        </small>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                    ${attachmentContent}
                `;
    
                commentsContainer.appendChild(commentElement);
            });
    
            // Add event listeners for view buttons
            commentsContainer.querySelectorAll('.btn-view-attachment').forEach(button => {
                button.addEventListener('click', (e) => {
                    const name = e.target.getAttribute('data-name');
                    const type = e.target.getAttribute('data-type');
                    const data = e.target.getAttribute('data-data');
    
                    openAttachmentModal(name, type, data);
                });
            });
        }
    
        modal.style.display = 'block';
    
        document.getElementById('closeCommentsBtn').addEventListener('click', () => {
            // Mark all comments as read
            workerData[workerName].comments.forEach(comment => {
                comment.isNew = false;
            });
            localStorage.setItem('workerData', JSON.stringify(workerData));
            modal.style.display = 'none';
        });
    }
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

    // Close modal when clicking on the close button or outside the modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Initial load
    loadWorkerActivities();
    loadDepartments();
    loadTopics();
    loadColumns();
    loadLeaveApplications();
});
