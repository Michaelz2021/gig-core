// Get API base URL - use relative path for same origin, or absolute URL if needed
const API_BASE_URL = window.location.origin + '/api/v1';

// Check authentication
function checkAuth() {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    
    if (!adminToken || !adminUser) {
        window.location.href = '/admin/index.html';
        return null;
    }
    
    try {
        return JSON.parse(adminUser);
    } catch (e) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/index.html';
        return null;
    }
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
}

// Fetch dashboard data
async function fetchDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized, redirect to login
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/admin/index.html';
                return;
            }
            throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        throw error;
    }
}

// Fetch projects by status
async function fetchProjects(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/projects/${endpoint}`, {
            headers: getAuthHeaders(),
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = '/admin/index.html';
                return;
            }
            throw new Error('프로젝트 데이터를 불러오는데 실패했습니다.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Projects fetch error:', error);
        throw error;
    }
}

// Render overview stats
function renderOverview(data) {
    if (!data) return;
    
    document.getElementById('totalUsers').textContent = data.users?.total || 0;
    document.getElementById('totalProviders').textContent = data.users?.providers || 0;
    document.getElementById('totalConsumers').textContent = data.users?.consumers || 0;
    document.getElementById('awaitingBids').textContent = data.auctions?.awaitingBids || 0;
    document.getElementById('contractedProjects').textContent = data.bookings?.confirmed || 0;
    document.getElementById('inProgressProjects').textContent = data.bookings?.inProgress || 0;
    document.getElementById('completedProjects').textContent = data.bookings?.completed || 0;
}

// Render project list
function renderProjectList(containerId, projects, emptyMessage = '데이터가 없습니다.') {
    const container = document.getElementById(containerId);
    
    if (!projects || projects.length === 0) {
        container.innerHTML = `<p class="loading">${emptyMessage}</p>`;
        return;
    }
    
    container.innerHTML = projects.map(project => {
        const title = project.serviceTitle || project.title || project.auctionNumber || '제목 없음';
        const description = project.serviceDescription || project.description || '';
        const createdAt = project.createdAt ? new Date(project.createdAt).toLocaleDateString('ko-KR') : '';
        const budget = project.budgetMin && project.budgetMax 
            ? `₱${project.budgetMin.toLocaleString()} - ₱${project.budgetMax.toLocaleString()}`
            : project.totalAmount 
            ? `₱${project.totalAmount.toLocaleString()}`
            : '';
        
        return `
        <div class="project-item">
            <div style="flex: 1;">
                <h3>${title}</h3>
                ${description ? `<p style="margin-top: 4px; color: #6b7280;">${description}</p>` : ''}
                <div style="margin-top: 8px; font-size: 12px; color: #9ca3af; display: flex; gap: 16px; flex-wrap: wrap;">
                    ${createdAt ? `<span>생성일: ${createdAt}</span>` : ''}
                    ${budget ? `<span>예산: ${budget}</span>` : ''}
                    ${project.totalBids !== undefined ? `<span>입찰 수: ${project.totalBids}</span>` : ''}
                    ${project.consumer ? `<span>고객: ${project.consumer.name || project.consumer.email || ''}</span>` : ''}
                </div>
            </div>
            <div>
                <span class="project-status status-${(project.status || 'pending').toLowerCase().replace('_', '-')}">
                    ${getStatusText(project.status)}
                </span>
            </div>
        </div>
    `;
    }).join('');
}

function getStatusText(status) {
    if (!status) return '알 수 없음';
    
    const statusMap = {
        'published': '입찰 대기',
        'bidding': '입찰 중',
        'selected': '선택됨',
        'confirmed': '계약 완료',
        'in_progress': '진행 중',
        'in-progress': '진행 중',
        'completed': '완료',
        'cancelled': '취소됨',
        'pending': '대기 중',
    };
    
    const normalizedStatus = status.toLowerCase().replace('_', '-');
    return statusMap[normalizedStatus] || statusMap[status.toLowerCase()] || status;
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        // Show corresponding section
        const section = this.getAttribute('data-section');
        document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(section).classList.add('active');
        
        // Update page title
        const titles = {
            'overview': '대시보드 개요',
            'pending-bids': '입찰 대기 프로젝트',
            'contracted': '계약 완료 프로젝트',
            'in-progress': '진행 중인 프로젝트',
            'completed': '완료된 프로젝트',
        };
        document.getElementById('pageTitle').textContent = titles[section] || '대시보드';
        
        // Load section data
        loadSectionData(section);
    });
});

// Load section data
async function loadSectionData(section) {
    try {
        switch (section) {
            case 'overview':
                const dashboardData = await fetchDashboardData();
                renderOverview(dashboardData);
                // Load recent activity
                // This can be enhanced later
                break;
            case 'pending-bids':
                const pendingData = await fetchProjects('pending-bids');
                renderProjectList('pendingBidsList', pendingData?.items || [], '입찰 대기 중인 프로젝트가 없습니다.');
                break;
            case 'contracted':
                const contractedData = await fetchProjects('contracted');
                renderProjectList('contractedList', contractedData?.items || [], '계약 완료된 프로젝트가 없습니다.');
                break;
            case 'in-progress':
                const inProgressData = await fetchProjects('in-progress');
                renderProjectList('inProgressList', inProgressData?.items || [], '진행 중인 프로젝트가 없습니다.');
                break;
            case 'completed':
                const completedData = await fetchProjects('completed');
                renderProjectList('completedList', completedData?.items || [], '완료된 프로젝트가 없습니다.');
                break;
        }
    } catch (error) {
        console.error('Error loading section data:', error);
        const containers = {
            'overview': 'recentActivity',
            'pending-bids': 'pendingBidsList',
            'contracted': 'contractedList',
            'in-progress': 'inProgressList',
            'completed': 'completedList',
        };
        const containerId = containers[section];
        if (containerId) {
            document.getElementById(containerId).innerHTML = 
                `<p class="loading" style="color: #ef4444;">오류: ${error.message}</p>`;
        }
    }
}

// Logout
document.getElementById('logoutButton').addEventListener('click', function() {
    if (confirm('로그아웃하시겠습니까?')) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.location.href = '/admin/index.html';
    }
});

// Initialize
window.addEventListener('DOMContentLoaded', async function() {
    const user = checkAuth();
    if (!user) return;
    
    // Set user email
    document.getElementById('userEmail').textContent = user.email;
    
    // Load initial data
    try {
        const dashboardData = await fetchDashboardData();
        renderOverview(dashboardData);
    } catch (error) {
        console.error('Initial load error:', error);
    }
});

