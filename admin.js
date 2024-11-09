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
    const recentLeaveRequests = document.getElementById('recentLeaveRequests');

    const adminCredentials = {
        username: 'admin',
        password: 'password123'
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
            loadLeaveApplications();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });

    // Sidebar functionality
    openSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            showSection(section);
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });

    function showSection(sectionId) {
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(section => section.classList.add('hidden'));
        document.getElementById(`${sectionId}Section`).classList.remove('hidden');

        sidebarLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        if (sectionId === 'leaveManagement') {
            loadLeaveApplications();
        } else if (sectionId === 'viewAllReplies') {
            loadAllReplies();
        }
    }

    // Load worker activities
    function loadWorkerActivities(searchTerm = '') {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        workerActivitiesBody.innerHTML = '';

        const sortedWorkers = workers.map(worker => {
            const data = workerData[worker.name] || {};
            const totalPoints = calculateTotalPoints(data);
            return {
                ...worker,
                ...data,
                totalPoints,
                lastSubmission: data.lastSubmission || {}
            };
        }).sort((a, b) => b.totalPoints - a.totalPoints);

        const filteredWorkers = sortedWorkers.filter(worker => 
            worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.department.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Update table header
        const headerRow = workerActivitiesHead.querySelector('tr');
        headerRow.innerHTML = `
            <th>Rank</th>
            <th>Photo</th>
            <th>Name</th>
            <th>Department</th>
            ${columns.map(column => `<th>${column.name}</th>`).join('')}
            <th>Topic Points</th>
            <th>Total Points</th>
            <th>Today's Activities</th>
            <th>Last Submission</th>
            <th>Actions</th>
        `;

        filteredWorkers.forEach((worker, index) => {
            const rank = worker.totalPoints > 0 ? index + 1 : '-';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${rank}</td>
                <td><img src="${worker.photo || '/placeholder.svg?height=50&width=50&text=' + worker.name}" alt="${worker.name}'s photo" class="worker-photo-small"></td>
                <td>${worker.name}</td>
                <td>${worker.department}</td>
                ${columns.map(column => `<td>${worker[column.name.toLowerCase().replace(/\s+/g, '')] || 0}</td>`).join('')}
                <td>${worker.topicPoints || 0}</td>
                <td>${worker.totalPoints}</td>
                <td>${formatTodayActivities(worker.activities)}</td>
                <td>${worker.lastSubmission.timestamp ? new Date(worker.lastSubmission.timestamp).toLocaleString() : 'N/A'}</td>
                <td>
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
            row.querySelector('.delete-worker-btn').addEventListener('click', () => openDeleteWorkerModal(worker.name));
            row.querySelector('.add-comment-btn').addEventListener('click', () => openAddCommentModal(worker.name));
            row.querySelector('.view-report-btn').addEventListener('click', () => openWorkerReportModal(worker));
            row.querySelector('.reset-worker-btn').addEventListener('click', () => openResetWorkerActivitiesModal(worker.name));
            row.querySelector('.view-comments-btn').addEventListener('click', () => openViewCommentsModal(worker.name));
        });
    }

    function calculateTotalPoints(data) {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        return columns.reduce((total, column) => {
            return total + (parseInt(data[column.name.toLowerCase().replace(/\s+/g, '')]) || 0);
        }, 0) + (parseInt(data.topicPoints) || 0);
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

            editWorkerPhoto.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewPhoto.src = e.target.result;
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

                // Update worker data
                worker.name = newName;
                worker.username = newUsername;
                worker.department = newDepartment;
                if (newPassword) {
                    worker.password = newPassword;
                }

                // Update photo if a new one was selected
                if (editWorkerPhoto.files.length > 0) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        worker.photo = e.target.result;
                        updateWorkerData();
                    };
                    reader.readAsDataURL(editWorkerPhoto.files[0]);
                } else {
                    updateWorkerData();
                }
            });

            function updateWorkerData() {
                // Update localStorage
                localStorage.setItem('workers', JSON.stringify(workers));

                // Update workerData if the name has changed
                if (worker.name !== workerName) {
                    workerData[worker.name] = workerActivityData;
                    delete workerData[workerName];
                    localStorage.setItem('workerData', JSON.stringify(workerData));
                }

                loadWorkerActivities();
                modal.style.display = 'none';
            }

            document.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }
    }

    function openDeleteWorkerModal(workerName) {
        modalContent.innerHTML = `
            <h3>Delete Worker: ${workerName}</h3>
            <p>Are you sure you want to delete this worker? This action cannot be undone.</p>
            <button id="confirmDeleteWorker">Confirm</button>
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
        let workers = JSON.parse(localStorage.getItem('workers')) || [];
        workers = workers.filter(worker => worker.name !== workerName);
        localStorage.setItem('workers', JSON.stringify(workers));

        let workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        delete workerData[workerName];
        localStorage.setItem('workerData', JSON.stringify(workerData));

        loadWorkerActivities();
    }

    function openAddCommentModal(workerName) {
        modalContent.innerHTML = `
            <h3>Add Comment for ${workerName}</h3>
            <form id="addCommentForm">
                <textarea id="commentText" rows="4" required></textarea>
                <button type="submit">Add Comment</button>
                <button type="button" class="cancel-btn">Cancel</button>
            </form>
        `;
        modal.style.display = 'block';

        document.getElementById('addCommentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const commentText = document.getElementById('commentText').value;
            addComment(workerName, commentText);
            modal.style.display = 'none';
        });

        document.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    function addComment(workerName, commentText) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (!workerData[workerName]) {
            workerData[workerName] = {};
        }
        if (!workerData[workerName].comments) {
            workerData[workerName].comments = [];
        }
        workerData[workerName].comments.push({
            text: commentText,
            timestamp: new Date().toISOString(),
            adminViewed: true
        });
        localStorage.setItem('workerData', JSON.stringify(workerData));
        alert('Comment added successfully.');
    }

    function openWorkerReportModal(worker) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const workerActivities = workerData[worker.name]?.activities || [];
        const columns = JSON.parse(localStorage.getItem('columns')) || [];

        modalContent.innerHTML = `
            <h3>Worker Report: ${worker.name}</h3>
            <p>Department: ${worker.department}</p>
            <p>Total Points: ${worker.totalPoints}</p>
            <h4>Column Points:</h4>
            <ul>
                ${columns.map(column => `<li>${column.name}: ${worker[column.name.toLowerCase().replace(/\s+/g, '')] || 0}</li>`).join('')}
                <li>Topic Points: ${worker.topicPoints || 0}</li>
            </ul>
            <h4>Recent Activities:</h4>
            <ul>
                ${workerActivities.slice(-5).reverse().map(activity => `
                    <li>${new Date(activity.timestamp).toLocaleString()} - ${activity.type}: ${activity.points} points</li>
                `).join('')}
            </ul>
            <button id="closeReportModal">Close</button>
        `;
        modal.style.display = 'block';

        document.getElementById('closeReportModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    function openViewCommentsModal(workerName) {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const comments = workerData[workerName]?.comments || [];

        modalContent.innerHTML = `
            <h3>Comments for ${workerName}</h3>
            ${comments.length > 0 ? `
                <ul>
                    ${comments.map(comment => `
                        <li>
                            <p>${comment.text}</p>
                            <small>${new Date(comment.timestamp).toLocaleString()}</small>
                        </li>
                    `).join('')}
                </ul>
            ` : '<p>No comments yet.</p>'}
            <button id="closeCommentsModal">Close</button>
        `;
        modal.style.display = 'block';

        document.getElementById('closeCommentsModal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // Add new worker
    addWorkerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newWorkerName').value;
        const username = document.getElementById('newWorkerUsername').value;
        const password = document.getElementById('newWorkerPassword').value;
        const department = document.getElementById('newWorkerDepartment').value;
        const photoInput = document.getElementById('newWorkerPhoto');

        const worker = { name, username, password, department };

        if (photoInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(event) {
                worker.photo = event.target.result;
                addWorker(worker);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            addWorker(worker);
        }
    });

    function addWorker(worker) {
        let workers = JSON.parse(localStorage.getItem('workers')) || [];
        workers.push(worker);
        localStorage.setItem('workers', JSON.stringify(workers));
        loadWorkerActivities();
        addWorkerForm.reset();
        alert('Worker added successfully.');
    }

    // Load departments
    function loadDepartments() {
        const departments = JSON.parse(localStorage.getItem('departments')) || ['IT', 'HR', 'Finance'];
        const departmentSelects = document.querySelectorAll('select[id$="Department"]');
        departmentSelects.forEach(select => {
            select.innerHTML = departments.map(dept => `<option value="${dept}">${dept}</option>`).join('');
        });
    }

    // Add new department
    addNewDepartmentBtn.addEventListener('click', () => {
        const newDepartment = prompt('Enter new department name:');
        if (newDepartment) {
            let departments = JSON.parse(localStorage.getItem('departments')) || ['IT', 'HR', 'Finance'];
            if (!departments.includes(newDepartment)) {
                departments.push(newDepartment);
                localStorage.setItem('departments', JSON.stringify(departments));
                loadDepartments();
                alert('New department added successfully.');
            } else {
                alert('Department already exists.');
            }
        }
    });

   // DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const topicsList = document.getElementById('topicsList');
    const addTopicForm = document.getElementById('addTopicForm');

    // Load and display topics
    function loadTopics() {
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        topicsList.innerHTML = '';

        if (topics.length === 0) {
            topicsList.innerHTML = '<p>No topics available. Add your first topic below.</p>';
            return;
        }

        topics.forEach(topic => {
            const topicElement = document.createElement('div');
            topicElement.className = 'topic-item';
            topicElement.innerHTML = `
                <div class="topic-info">
                    <span class="topic-name">${topic.name || 'Unnamed Topic'}</span>
                    <span class="topic-points">${topic.points || 0} points</span>
                    <span class="topic-department">${topic.department || 'All Departments'}</span>
                </div>
                <button class="delete-topic-btn" data-topic-id="${topic.id}" aria-label="Delete ${topic.name}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            topicsList.appendChild(topicElement);

            // Add click event listener for delete button
            const deleteBtn = topicElement.querySelector('.delete-topic-btn');
            deleteBtn.addEventListener('click', () => deleteTopic(topic.id));
        });
    }

    // Add new topic
    function addTopic(topicData) {
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        const newTopic = {
            id: Date.now().toString(),
            name: topicData.name,
            points: parseInt(topicData.points),
            department: topicData.department
        };

        topics.push(newTopic);
        localStorage.setItem('topics', JSON.stringify(topics));
        loadTopics();
        showNotification('Topic added successfully', 'success');
    }

    // Delete topic
    function deleteTopic(topicId) {
        if (!confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
            return;
        }

        try {
            // Get current topics
            let topics = JSON.parse(localStorage.getItem('topics')) || [];
            
            // Find topic to be deleted
            const topicToDelete = topics.find(t => t.id === topicId);
            if (!topicToDelete) {
                throw new Error('Topic not found');
            }

            // Remove topic from array
            topics = topics.filter(t => t.id !== topicId);
            
            // Update localStorage
            localStorage.setItem('topics', JSON.stringify(topics));

            // Update worker data to remove topic references
            let workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            
            // Remove topic points from all workers
            Object.keys(workerData).forEach(workerName => {
                const worker = workerData[workerName];
                if (worker.activities) {
                    // Remove topic from activities
                    worker.activities = worker.activities.filter(activity => 
                        !activity.topics.includes(topicToDelete.name)
                    );

                    // Recalculate total points
                    worker.topicPoints = worker.activities.reduce((total, activity) => {
                        const activityTopicPoints = activity.topics.reduce((points, topicName) => {
                            const topic = topics.find(t => t.name === topicName);
                            return points + (topic ? topic.points : 0);
                        }, 0);
                        return total + activityTopicPoints;
                    }, 0);
                }
            });

            localStorage.setItem('workerData', JSON.stringify(workerData));
            
            // Refresh the topics list
            loadTopics();
            showNotification('Topic deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting topic:', error);
            showNotification('Failed to delete topic. Please try again.', 'error');
        }
    }

    // Initialize default topics if none exist
    function initializeDefaultTopics() {
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        if (topics.length === 0) {
            const defaultTopics = [
                {
                    id: 'default-1',
                    name: 'Quality Check',
                    points: 5,
                    department: 'all'
                },
                {
                    id: 'default-2',
                    name: 'Time Management',
                    points: 3,
                    department: 'all'
                }
            ];
            localStorage.setItem('topics', JSON.stringify(defaultTopics));
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Event Listeners
    addTopicForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const topicData = {
            name: document.getElementById('newTopicName').value,
            points: document.getElementById('newTopicPoints').value,
            department: document.getElementById('topicDepartment').value
        };
        addTopic(topicData);
        e.target.reset();
    });

    // Initialize
    initializeDefaultTopics();
    loadTopics();
});
    // Reset all worker activities
    resetAllActivitiesBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all worker activities? This action cannot be undone.')) {
            const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            const columns = JSON.parse(localStorage.getItem('columns')) || [];
            
            for (let workerName in workerData) {
                columns.forEach(column => {
                    workerData[workerName][column.name.toLowerCase().replace(/\s+/g, '')] = 0;
                });
                workerData[workerName].topicPoints = 0;
                workerData[workerName].lastSubmission = {};
                workerData[workerName].activities = [];
            }
            
            localStorage.setItem('workerData', JSON.stringify(workerData));
            loadWorkerActivities();
            alert('All worker activities have been reset.');
        }
    });

    // Load leave applications
    function loadLeaveApplications() {
        const leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        leaveApplicationsBody.innerHTML = '';
        recentLeaveRequests.innerHTML = '<h3>Recent Leave Requests</h3>';

        const sortedRequests = leaveRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));

        sortedRequests.forEach((request, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.workerName}</td>
                <td>${request.department}</td>
                <td>${request.startDate}</td>
                <td>${request.endDate}</td>
                <td>${request.status}</td>
                <td>
                    ${request.status === 'Pending' ? `
                        <button class="approve-btn" data-id="${request.id}">Approve</button>
                        <button class="reject-btn" data-id="${request.id}">Reject</button>
                    ` : ''}
                </td>
            `;
            leaveApplicationsBody.appendChild(row);

            // Add to recent leave requests
            if (index < 5) {
                const recentRequestElement = document.createElement('div');
                recentRequestElement.innerHTML = `
                    <p><strong>${request.workerName}</strong> - ${request.leaveType}</p>
                    <p>From: ${request.startDate} To: ${request.endDate}</p>
                    <p>Status: ${request.status}</p>
                `;
                recentLeaveRequests.appendChild(recentRequestElement);
            }
        });
    }

    // Handle leave application actions
    leaveApplicationsBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('approve-btn') || e.target.classList.contains('reject-btn')) {
            const requestId = e.target.getAttribute('data-id');
            const action = e.target.classList.contains('approve-btn') ? 'Approved' : 'Rejected';
            updateLeaveRequest(requestId, action);
        }
    });

    function updateLeaveRequest(requestId, status) {
        let leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        leaveRequests = leaveRequests.map(request => {
            if (request.id === requestId) {
                return { ...request, status: status };
            }
            return request;
        });
        localStorage.setItem('leaveRequests', JSON.stringify(leaveRequests));
        loadLeaveApplications();
        alert(`Leave request ${status.toLowerCase()}.`);
    }

    // Apply filters to leave applications
    applyFiltersBtn.addEventListener('click', () => {
        const dateFilter = document.getElementById('dateFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const departmentFilter = document.getElementById('departmentFilter').value.toLowerCase();

        let leaveRequests = JSON.parse(localStorage.getItem('leaveRequests')) || [];
        const filteredRequests = leaveRequests.filter(request => {
            const dateMatch = !dateFilter || (request.startDate <= dateFilter && request.endDate >= dateFilter);
            const statusMatch = !statusFilter || request.status === statusFilter;
            const departmentMatch = !departmentFilter || request.department.toLowerCase().includes(departmentFilter);
            return dateMatch && statusMatch && departmentMatch;
        });

        displayFilteredLeaveRequests(filteredRequests);
    });

    function displayFilteredLeaveRequests(requests) {
        leaveApplicationsBody.innerHTML = '';
        requests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.workerName}</td>
                <td>${request.department}</td>
                <td>${request.startDate}</td>
                <td>${request.endDate}</td>
                <td>${request.status}</td>
                <td>
                    ${request.status === 'Pending' ? `
                        <button class="approve-btn" data-id="${request.id}">Approve</button>
                        <button class="reject-btn" data-id="${request.id}">Reject</button>
                    ` : ''}
                </td>
            `;
            leaveApplicationsBody.appendChild(row);
        });
    }

    // Load columns
    function loadColumns() {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        const columnsList = document.getElementById('columnsList');
        columnsList.innerHTML = '';
        columns.forEach(column => {
            const columnElement = document.createElement('div');
            columnElement.innerHTML = `
                <span>${column.name} - ${column.department}</span>
                <button class="delete-column" data-name="${column.name}">Delete</button>
            `;
            columnsList.appendChild(columnElement);
        });
    }

    // Add new column
    addColumnForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newColumnName').value;
        const department = document.getElementById('newColumnDepartment').value;
        let columns = JSON.parse(localStorage.getItem('columns')) || [];
        columns.push({ name, department });
        localStorage.setItem('columns', JSON.stringify(columns));
        loadColumns();
        addColumnForm.reset();
        alert('Column added successfully.');
    });

    // Delete column
    document.getElementById('columnsList').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-column')) {
            const columnName = e.target.getAttribute('data-name');
            if (confirm(`Are you sure you want to delete the column "${columnName}"?`)) {
                let columns = JSON.parse(localStorage.getItem('columns')) || [];
                columns = columns.filter(c => c.name !== columnName);
                localStorage.setItem('columns', JSON.stringify(columns));
                loadColumns();
                alert('Column deleted successfully.');
            }
        }
    });

    // Load all replies
    function loadAllReplies() {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const repliesList = document.getElementById('repliesList');
        repliesList.innerHTML = '';

        for (const [workerName, data] of Object.entries(workerData)) {
            if (data.comments && data.comments.length > 0) {
                const workerReplies = document.createElement('div');
                workerReplies.innerHTML = `<h3>${workerName}'s Comments</h3>`;
                data.comments.forEach(comment => {
                    const commentElement = document.createElement('div');
                    commentElement.innerHTML = `
                        <p>${comment.text}</p>
                        <small>${new Date(comment.timestamp).toLocaleString()}</small>
                    `;
                    workerReplies.appendChild(commentElement);
                });
                repliesList.appendChild(workerReplies);
            }
        }
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Close modal when clicking the close button
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Initial load
    loadWorkerActivities();
    loadDepartments();
    loadTopics();
    loadColumns();
    loadLeaveApplications();
});
