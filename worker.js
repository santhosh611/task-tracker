document.addEventListener('DOMContentLoaded', () => {
    const workerContainer = document.getElementById('workerContainer');
    const dashboard = document.getElementById('dashboard');
    const loginModal = document.getElementById('loginModal');
    const loginModalTitle = document.getElementById('loginModalTitle');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const searchWorker = document.getElementById('searchWorker');
    const workerList = document.getElementById('workerList');
    const profileImage = document.getElementById('profileImage');
    const editProfileIcon = document.getElementById('editProfileIcon');
    const workerName = document.getElementById('workerName');
    const workerDepartment = document.getElementById('workerDepartment');
    const harvestForm = document.getElementById('harvestForm');
    const dynamicInputs = document.getElementById('dynamicInputs');
    const topicList = document.getElementById('topicList');
    const submitHarvest = document.getElementById('submitHarvest');
    const commentBox = document.getElementById('commentBox');
    const commentModal = document.getElementById('commentModal');
    const commentList = document.getElementById('commentList');
    const applyLeaveBtn = document.getElementById('applyLeaveBtn');
    const leaveModal = document.getElementById('leaveModal');
    const leaveApplicationForm = document.getElementById('leaveApplicationForm');
    const leaveRequestsBtn = document.getElementById('leaveRequestsBtn');
    const leaveRequestsModal = document.getElementById('leaveRequestsModal');
    const leaveRequestsList = document.getElementById('leaveRequestsList');
    const leaveRequestNotification = document.getElementById('leaveRequestNotification');
    const imageUpload = document.getElementById('imageUpload');
    const scoreboardTitle = document.getElementById('scoreboardTitle');
    const scoreTableBody = document.getElementById('scoreTableBody');

    let currentWorker = null;

    function loadWorkers() {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        workerList.innerHTML = '';
        workers.forEach(worker => {
            const workerItem = document.createElement('div');
            workerItem.className = 'worker-item';
            workerItem.innerHTML = `
                <img src="${worker.photo || '/placeholder.svg?height=40&width=40&text=' + worker.name}" alt="${worker.name}'s photo">
                <div class="worker-info">
                    <span class="worker-name">${worker.name}</span>
                    <span class="worker-department">${worker.department}</span>
                </div>
            `;
            workerItem.addEventListener('click', () => openLoginModal(worker));
            workerList.appendChild(workerItem);
        });
    }

    function openLoginModal(worker) {
        loginModalTitle.textContent = `Login: ${worker.name}`;
        loginModal.style.display = 'block';
        passwordInput.value = '';
        loginBtn.onclick = () => attemptLogin(worker);
    }

    function attemptLogin(worker) {
        if (passwordInput.value === worker.password) {
            currentWorker = worker;
            loginModal.style.display = 'none';
            workerContainer.hidden = true;
            dashboard.hidden = false;
            loadWorkerDashboard();
        } else {
            alert('Incorrect password. Please try again.');
        }
    }

    function loadWorkerDashboard() {
        profileImage.src = currentWorker.photo || '/placeholder.svg?height=100&width=100&text=' + currentWorker.name;
        workerName.textContent = currentWorker.name;
        workerDepartment.textContent = currentWorker.department;
        loadHarvestForm();
        loadComments();
        updateLeaveRequestNotification();
        updateScoreboard();
    }

    function loadHarvestForm() {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
    
        dynamicInputs.innerHTML = '';
        columns.forEach(column => {
            if (column.department === 'all' || column.department === currentWorker.department) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                inputGroup.innerHTML = `
                    <label for="${column.name}">${column.name}:</label>
                    <input type="number" id="${column.name}" name="${column.name}" min="0" required>
                `;
                dynamicInputs.appendChild(inputGroup);
            }
        });
    
        topicList.innerHTML = '';
        topics.forEach(topic => {
            if (topic && topic.name && topic.points !== undefined) {
                const topicItem = document.createElement('span');
                topicItem.className = 'topic-tag';
                topicItem.innerHTML = `
                    <input type="checkbox" id="${topic.name}" name="${topic.name}">
                    <label for="${topic.name}">${topic.name} (${topic.points} points)</label>
                `;
                topicList.appendChild(topicItem);
            }
        });
    }
    
    submitHarvest.addEventListener('click', () => {
        const harvestData = {};
        const inputs = dynamicInputs.querySelectorAll('input');
        inputs.forEach(input => {
            harvestData[input.name] = parseInt(input.value) || 0;
        });
    
        const selectedTopics = [];
        const topicCheckboxes = topicList.querySelectorAll('input[type="checkbox"]:checked');
        topicCheckboxes.forEach(checkbox => {
            selectedTopics.push(checkbox.name);
        });
    
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (!workerData[currentWorker.name]) {
            workerData[currentWorker.name] = {
                activities: [],
                topicPoints: 0
            };
        }
    
        // Update harvest data
        Object.keys(harvestData).forEach(key => {
            workerData[currentWorker.name][key] = (workerData[currentWorker.name][key] || 0) + harvestData[key];
        });
    
        // Update topic points
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        let topicPointsEarned = 0;
        selectedTopics.forEach(topicName => {
            const topic = topics.find(t => t.name === topicName);
            if (topic) {
                topicPointsEarned += topic.points;
            }
        });
        workerData[currentWorker.name].topicPoints = (workerData[currentWorker.name].topicPoints || 0) + topicPointsEarned;
    
        // Add activity
        workerData[currentWorker.name].activities.push({
            timestamp: new Date().toISOString(),
            harvest: harvestData,
            topics: selectedTopics
        });
    
        // Update last submission
        workerData[currentWorker.name].lastSubmission = {
            timestamp: new Date().toISOString(),
            harvest: harvestData,
            topics: selectedTopics
        };
    
        localStorage.setItem('workerData', JSON.stringify(workerData));
        alert('Harvest data submitted successfully!');
        loadHarvestForm(); // Reset the form
        updateScoreboard();
    });
    
    function loadComments() {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const comments = workerData[currentWorker.name]?.comments || [];
        
        // Sort comments by timestamp, most recent first
        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
        if (comments.some(comment => comment.isNew)) {
            commentBox.classList.add('new-comment');
        } else {
            commentBox.classList.remove('new-comment');
        }
    
        commentList.innerHTML = '';
        comments.forEach((comment, index) => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <p>${comment.text}</p>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
                ${comment.reply ? `
                    <p><strong>Your reply:</strong> ${comment.reply.text}</p>
                    <small>${new Date(comment.reply.timestamp).toLocaleString()}</small>
                ` : `
                    <textarea class="reply-text" placeholder="Type your reply here"></textarea>
                    <button class="send-reply" data-index="${index}">Send Reply</button>
                `}
            `;
            commentList.appendChild(commentElement);
        });
    
        const replyButtons = commentList.querySelectorAll('.send-reply');
        replyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const index = button.getAttribute('data-index');
                const replyText = button.previousElementSibling.value;
                if (replyText.trim()) {
                    comments[index].reply = {
                        text: replyText,
                        timestamp: new Date().toISOString()
                    };
                    comments[index].isNew = false;
                    localStorage.setItem('workerData', JSON.stringify(workerData));
                    loadComments();
                }
            });
        });
    }

    commentBox.addEventListener('click', () => {
        commentModal.style.display = 'block';
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (workerData[currentWorker.name]?.comments) {
            workerData[currentWorker.name].comments.forEach(comment => {
                comment.isNew = false;
            });
            localStorage.setItem('workerData', JSON.stringify(workerData));
        }
        commentBox.classList.remove('new-comment');
    });

    applyLeaveBtn.addEventListener('click', () => {
        leaveModal.style.display = 'block';
    });

    leaveApplicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const leaveType = document.getElementById('leaveType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const totalDays = document.getElementById('totalDays').value;
        const reason = document.getElementById('reason').value;
        const attachment = document.getElementById('attachment').files[0];

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
            attachmentName: attachment ? attachment.name : null,
            status: 'Pending',
            submittedAt: new Date().toISOString()
        };
        leaveApplications.push(newApplication);
        localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));

        alert('Leave application submitted successfully!');
        leaveModal.style.display = 'none';
        leaveApplicationForm.reset();
    });

    // Calculate total days when start or end date changes
    document.getElementById('startDate').addEventListener('change', updateTotalDays);
    document.getElementById('endDate').addEventListener('change', updateTotalDays);

    function updateTotalDays() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        if (startDate && endDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Add 1 to include both start and end dates
            document.getElementById('totalDays').value = diffDays;
        }
    }

    leaveRequestsBtn.addEventListener('click', () => {
        leaveRequestsModal.style.display = 'block';
        loadLeaveRequests();
    });

    function loadLeaveRequests() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const workerApplications = leaveApplications.filter(app => app.workerName === currentWorker.name);
        
        // Sort applications by submission date, most recent first
        workerApplications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
        leaveRequestsList.innerHTML = '';
        workerApplications.forEach(app => {
            const requestElement = document.createElement('div');
            requestElement.className = 'leave-request';
            requestElement.innerHTML = `
                <p><strong>Leave Type:</strong> ${app.leaveType}</p>
                <p><strong>Dates:</strong> ${app.startDate} to ${app.endDate}</p>
                <p><strong>Status:</strong> ${app.status}</p>
            `;
            // Add click event to the entire leave request element
            requestElement.addEventListener('click', () => viewLeaveDetails(app.id));
            leaveRequestsList.appendChild(requestElement);
        });
    
        updateLeaveRequestNotification();
    }

    function viewLeaveDetails(leaveId) {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const application = leaveApplications.find(app => app.id === leaveId);
    
        if (application) {
            // Only mark as viewed if the status is Approved or Rejected
            if (application.status === 'Approved' || application.status === 'Rejected') {
                application.workerViewed = true;
                localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));
                updateLeaveRequestNotification();
            }
    
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h3>Leave Request Details</h3>
                    <p><strong>Leave Type:</strong> ${application.leaveType}</p>
                    <p><strong>Start Date:</strong> ${application.startDate}</p>
                    <p><strong>End Date:</strong> ${application.endDate}</p>
                    <p><strong>Total Days:</strong> ${application.totalDays}</p>
                    <p><strong>Reason:</strong> ${application.reason}</p>
                    <p><strong>Status:</strong> ${application.status}</p>
                    ${application.adminComments ? `<p><strong>Admin Comments:</strong> ${application.adminComments}</p>` : ''}
                    <button id="closeLeaveDetailsBtn">Close</button>
                </div>
            `;
            document.body.appendChild(modal);
    
            const closeBtn = modal.querySelector('.close');
            const closeLeaveDetailsBtn = document.getElementById('closeLeaveDetailsBtn');
    
            closeBtn.onclick = () => {
                document.body.removeChild(modal);
            };
    
            closeLeaveDetailsBtn.onclick = () => {
                document.body.removeChild(modal);
            };
    
            window.onclick = (event) => {
                if (event.target === modal) {
                    document.body.removeChild(modal);
                }
            };
        }
    }
    
    function updateLeaveRequestNotification() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const newApplications = leaveApplications.filter(app => 
            app.workerName === currentWorker.name && 
            (app.status === 'Approved' || app.status === 'Rejected') && 
            !app.workerViewed
        );
        
        if (newApplications.length > 0) {
            leaveRequestNotification.style.display = 'inline-block';
            leaveRequestNotification.textContent = newApplications.length;
        } else {
            leaveRequestNotification.style.display = 'none';
        }
    }


    function updateWorkerPhoto(photoData) {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerIndex = workers.findIndex(w => w.name === currentWorker.name);
        if (workerIndex !== -1) {
            workers[workerIndex].photo = photoData;
            localStorage.setItem('workers', JSON.stringify(workers));
            
            const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
            if (workerData[currentWorker.name]) {
                workerData[currentWorker.name].photo = photoData;
                localStorage.setItem('workerData', JSON.stringify(workerData));
            }
            
            currentWorker.photo = photoData;
        }
    }

    function updateScoreboard() {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        
        const departmentWorkers = workers.filter(worker => worker.department === currentWorker.department);
        const sortedWorkers = departmentWorkers.map(worker => {
            const data = workerData[worker.name] || {};
            const totalPoints = calculateTotalPoints(data);
            return { ...worker, totalPoints };
        }).sort((a, b) => b.totalPoints - a.totalPoints);

        scoreboardTitle.textContent = `${currentWorker.department} Scoreboard`;
        scoreTableBody.innerHTML = '';
        sortedWorkers.forEach((worker, index) => {
            const row = scoreTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${worker.name}</td>
                <td>${worker.totalPoints}</td>
            `;
        });
    }

    function calculateTotalPoints(data) {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        return columns.reduce((total, column) => {
            return total + (parseInt(data[column.name.toLowerCase().replace(/\s+/g, '')]) || 0);
        }, 0) + (parseInt(data.topicPoints) || 0);
    }

    searchWorker.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const filteredWorkers = workers.filter(worker => 
            worker.name.toLowerCase().includes(searchTerm) ||
            worker.department.toLowerCase().includes(searchTerm)
        );
        
        workerList.innerHTML = '';
        filteredWorkers.forEach(worker => {
            const workerItem = document.createElement('div');
            workerItem.className = 'worker-item';
            workerItem.innerHTML = `
                <img src="${worker.photo || '/placeholder.svg?height=40&width=40&text=' + worker.name}" alt="${worker.name}'s photo">
                <div class="worker-info">
                    <span class="worker-name">${worker.name}</span>
                    <span class="worker-department">${worker.department}</span>
                </div>
            `;
            workerItem.addEventListener('click', () => openLoginModal(worker));
            workerList.appendChild(workerItem);
        });
    });

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