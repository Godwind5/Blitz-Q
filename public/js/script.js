document.addEventListener('DOMContentLoaded', function () {
  // DOM 요소 참조
  const addGroupBtn = document.querySelector('.add-group-btn');
  const inviteBtn = document.querySelector('.invite-btn');
  const addReportBtn = document.querySelector('.add-report-btn');
  const codeInputBtn = document.querySelector('.code-input-btn');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const analyzeBtn = document.querySelector('.analyze-btn');

  const authArea = document.getElementById('authArea');
  const profileArea = document.getElementById('profileArea');
  const profileName = document.getElementById('profileName');

  const groupList = document.querySelector('.group-list');
  const groupModal = document.getElementById('groupModal');
  const reportModal = document.getElementById('reportModal');
  const inviteModal = document.getElementById('inviteModal');
  const commentModal = document.getElementById('commentModal');
  const codeInputModal = document.getElementById('codeInputModal');
  const errorModal = document.getElementById('errorModal');
  const errorMessage = document.getElementById('errorMessage');
  const errorOkBtn = document.getElementById('errorOkBtn');

  const modalTitle = document.getElementById('modalTitle');
  const groupNameInput = document.getElementById('groupNameInput');
  const cancelGroupModal = document.getElementById('cancelGroupModal');
  const confirmGroupModal = document.getElementById('confirmGroupModal');

  const reportForm = document.getElementById('reportForm');
  const reportCancelBtn = document.getElementById('reportCancelBtn');

  const currentGroupNameDisplay = document.getElementById('currentGroupName');
  const memberGrid = document.querySelector('.member-grid');
  const individualTodosContainer = document.querySelector('.individual-todos-list');
  const reportIssuesContainer = document.querySelector('.report-issues-list');
  const aiSuggestionsDisplay = document.getElementById('aiSuggestionsDisplay');

  const addYesterdayBtn = document.getElementById('addYesterdayBtn');
  const removeYesterdayBtn = document.getElementById('removeYesterdayBtn');
  const addTodayBtn = document.getElementById('addTodayBtn');
  const removeTodayBtn = document.getElementById('removeTodayBtn');
  const yesterdayContainer = document.getElementById('yesterdayContainer');
  const todayContainer = document.getElementById('todayContainer');

  const inviteLinkInput = document.getElementById('inviteLink');
  const copyInviteBtn = document.getElementById('copyInviteBtn');

  const codeInputField = document.getElementById('codeInputField');
  const codeInputCloseBtn = document.getElementById('codeInputCloseBtn');
  const cancelCodeInputModal = document.getElementById('cancelCodeInputModal');
  const confirmCodeInputModal = document.getElementById('confirmCodeInputModal');

  const commentListContainer = document.getElementById('commentList');
  const newCommentInput = document.getElementById('newCommentInput');
  const commentCloseBtn = document.getElementById('commentCloseBtn');
  const commentCancelBtn = document.getElementById('commentCancelBtn');
  const submitCommentBtn = document.getElementById('submitCommentBtn');

  const reportCloseBtn = document.getElementById('reportCloseBtn');
  const groupModalCloseBtn = document.getElementById('groupModalCloseBtn');
  const inviteCloseBtn = document.getElementById('inviteCloseBtn');

  // 새로운 DOM 요소 참조 추가
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmOkBtn = document.getElementById('confirmOkBtn');
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  const confirmCloseBtn = document.getElementById('confirmCloseBtn');

  // 알림 관련 DOM 요소 참조
  const notificationBtn = document.querySelector('.notification-btn');
  const notificationBadge = document.getElementById('notificationBadge');
  const notificationDropdown = document.getElementById('notificationDropdown');
  const notificationList = document.getElementById('notificationList');
  const clearAllBtn = document.querySelector('.clear-all-btn');

  // 전역 변수로 콜백 함수 저장
  let confirmCallback = null;

  // 상태 변수
  let currentEditingGroup = null;
  let currentUser = null; // 로그인 사용자 정보
  let currentActiveTeamId = null; // 현재 선택된 팀 ID
  let selectedIssueIndex = null;
  let selectedReportMemberId = null;

  // 인증 토큰 가져오기 - 쿠키 또는 localStorage에서
  let token = null;

  // 전역 변수 추가
  let selectedReportDate = null; // 현재 선택된 보고서 날짜를 저장할 변수 추가
  
  // 알림 관련 전역 변수
  let notifications = []; // 알림 내역을 저장할 배열
  let checkNotificationsInterval = null; // 주기적으로 알림을 확인하기 위한 인터벌 ID

  // 커스텀 경고 함수
  function showAlert(message, title = "알림") {
    if (errorModal && errorMessage) {
      // 에러 모달의 제목과 내용 설정
      const modalTitle = errorModal.querySelector('.modal-header h3');
      if (modalTitle) modalTitle.textContent = title;

      errorMessage.textContent = message;
      errorModal.style.display = 'flex';
    } else {
      // 폴백: 모달이 없는 경우에는 console.log로 표시
      console.log(`${title}: ${message}`);
    }
  }

  // 에러 모달 닫기 이벤트 리스너
  if (errorOkBtn) {
    errorOkBtn.addEventListener('click', function () {
      closeModal(errorModal);
    });
  }

  // 쿠키에서 토큰 가져오기 함수
  function getTokenFromCookie() {
    const cookieValue = document.cookie.split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    return cookieValue || null;
  }

  // localStorage 또는 쿠키에서 토큰 가져오기
  token = localStorage.getItem('authToken') || getTokenFromCookie();

  if (token) {
    console.log('인증 토큰 발견:', token ? '있음' : '없음');
  }

  // 이니셜 프로필 생성 함수
  function createInitialsProfile(name, size = 80) {
    const initial = (name || '사용자').charAt(0).toUpperCase();
    const colors = [
      '#1abc9c', '#2ecc71', '#3498db', '#9b59b6', '#34495e',
      '#16a085', '#27ae60', '#2980b9', '#8e44ad', '#2c3e50',
      '#f1c40f', '#e67e22', '#e74c3c', '#95a5a6', '#f39c12',
      '#d35400', '#c0392b', '#7f8c8d'
    ];

    // 이름에 기반한 일관된 색상 선택
    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const backgroundColor = colors[colorIndex];

    // 배경색에 따라 텍스트 색상 결정 (어두운 배경 = 흰색 텍스트, 밝은 배경 = 검은색 텍스트)
    const getContrastColor = (hexColor) => {
      // 16진수 색상을 RGB로 변환
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      // 색상 밝기 계산 (0~255)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      // 밝기가 128 이상이면 어두운 텍스트, 미만이면 밝은 텍스트
      return brightness >= 128 ? '#000000' : '#ffffff';
    };

    const textColor = getContrastColor(backgroundColor);

    // 이니셜 프로필 요소 생성
    const profileDiv = document.createElement('div');
    profileDiv.className = 'initial-profile';
    profileDiv.style.width = `${size}px`;
    profileDiv.style.height = `${size}px`;
    profileDiv.style.borderRadius = '50%';
    profileDiv.style.backgroundColor = backgroundColor;
    profileDiv.style.color = textColor;
    profileDiv.style.display = 'flex';
    profileDiv.style.alignItems = 'center';
    profileDiv.style.justifyContent = 'center';
    profileDiv.style.fontSize = `${size / 2}px`;
    profileDiv.style.fontWeight = 'bold';
    profileDiv.textContent = initial;

    return profileDiv;
  }

  // 아바타 URL 처리 함수 추가
  function getAvatarUrl(avatarPath) {
    if (!avatarPath) return null;

    // 이미 전체 URL인 경우 (http:// 또는 https://로 시작)
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }

    // 상대 경로인 경우 uploads 폴더 경로 추가
    return `/uploads/${avatarPath}`;
  }

  // API 호출 헬퍼 함수
  async function apiRequest(endpoint, method = 'GET', data = null) {
    const headers = {
      'Content-Type': 'application/json'
    };

    // 인증 토큰이 있으면 헤더에 추가
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      credentials: 'include' // 쿠키 포함
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`API 요청: ${method} ${endpoint}`);
      const response = await fetch(`/api${endpoint}`, options);

      // 응답 확인 및 디버깅
      console.log(`API 응답 상태: ${response.status}`);

      const responseData = await response.json();
      console.log('API 응답 데이터:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || '요청 처리 중 오류가 발생했습니다');
      }

      return responseData;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 프로필 드롭다운 토글
  const profileInfo = document.querySelector('.profile-info');
  const profileMenu = document.querySelector('.profile-menu');

  if (profileInfo && profileMenu) {
    profileInfo.addEventListener('click', function (e) {
      e.stopPropagation();
      profileMenu.classList.toggle('active');
    });

    // 외부 클릭 시 닫기
    document.addEventListener('click', function (e) {
      if (!profileMenu.contains(e.target) && !profileInfo.contains(e.target)) {
        profileMenu.classList.remove('active');
      }
    });
  }

  // 알림 드롭다운 토글 함수
  function toggleNotificationDropdown() {
    if (notificationDropdown) {
      if (notificationDropdown.style.display === 'block') {
        notificationDropdown.style.display = 'none';
      } else {
        notificationDropdown.style.display = 'block';
        
        // 드롭다운이 열렸을 때 모든 알림을 읽음으로 표시
        markAllNotificationsAsRead();
      }
    }
  }

  // 새 알림 추가 함수
  function addNotification(notification) {
    // 알림 배열에 추가
    notifications.unshift(notification);
    
    // 로컬 스토리지에 저장
    saveNotificationsToStorage();
    
    // UI 업데이트
    updateNotificationBadge();
    updateNotificationList();
  }

  // 알림 배지 업데이트 함수
  function updateNotificationBadge() {
    if (!notificationBadge) return;
    
    // 읽지 않은 알림 개수 계산
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      notificationBadge.classList.add('show');
    } else {
      notificationBadge.textContent = '0';
      notificationBadge.classList.remove('show');
    }
  }

  // 알림 목록 UI 업데이트 함수
  function updateNotificationList() {
    if (!notificationList) return;
    
    if (notifications.length === 0) {
      notificationList.innerHTML = '<div class="empty-notification">새 알림이 없습니다</div>';
      return;
    }
    
    notificationList.innerHTML = '';
    
    // 최대 10개 알림만 표시
    const displayNotifications = notifications.slice(0, 10);
    
    displayNotifications.forEach((notification, index) => {
      const notificationItem = document.createElement('div');
      notificationItem.classList.add('notification-item');
      if (!notification.read) {
        notificationItem.classList.add('unread');
      }
      
      // 시간 포맷팅
      const notificationTime = new Date(notification.timestamp);
      const timeString = formatNotificationTime(notificationTime);
      
      notificationItem.innerHTML = `
        <div class="notification-title">${notification.title}</div>
        <div class="notification-content">${notification.content}</div>
        <div class="notification-time">${timeString}</div>
      `;
      
      // 알림 클릭 시 해당 보고서로 이동
      notificationItem.addEventListener('click', function() {
        // 알림을 읽음으로 표시
        notification.read = true;
        saveNotificationsToStorage();
        updateNotificationBadge();
        updateNotificationList();
        
        // 알림에 teamId, reportId가 있으면 해당 보고서로 이동
        if (notification.teamId) {
          // 팀 선택
          const teamItem = document.querySelector(`.group-item[data-team-id="${notification.teamId}"]`);
          if (teamItem) {
            // 기존에 선택된 팀 제거
            const activeTeam = document.querySelector('.group-item.active');
            if (activeTeam) {
              activeTeam.classList.remove('active');
            }
            
            // 새 팀 선택
            teamItem.classList.add('active');
            const teamName = teamItem.dataset.groupName;
            
            // 팀 정보 로드
            loadTeamDetails(notification.teamId, teamName);
            
            // 알림 드롭다운 닫기
            notificationDropdown.style.display = 'none';
            
            // 특정 보고서가 있으면 해당 보고서로 스크롤
            if (notification.reportId) {
              // 로드 완료 후 스크롤하기 위해 약간의 지연 추가
              setTimeout(() => {
                const reportElement = document.querySelector(`.report-card[data-report-id="${notification.reportId}"]`);
                if (reportElement) {
                  reportElement.scrollIntoView({ behavior: 'smooth' });
                  reportElement.classList.add('highlight-report');
                  
                  // 하이라이트 효과 제거
                  setTimeout(() => {
                    reportElement.classList.remove('highlight-report');
                  }, 3000);
                }
              }, 500);
            }
          }
        }
      });
      
      notificationList.appendChild(notificationItem);
    });
  }

  // 모든 알림을 읽음으로 표시하는 함수
  function markAllNotificationsAsRead() {
    notifications.forEach(notification => {
      notification.read = true;
    });
    
    saveNotificationsToStorage();
    updateNotificationBadge();
    updateNotificationList();
  }

  // 알림 시간 포맷팅 함수
  function formatNotificationTime(timestamp) {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) {
      return '방금 전';
    } else if (diffMins < 60) {
      return `${diffMins}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return `${timestamp.getFullYear()}-${(timestamp.getMonth()+1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')}`;
    }
  }

  // 알림 데이터를 로컬 스토리지에 저장하는 함수
  function saveNotificationsToStorage() {
    if (currentUser) {
      localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(notifications));
    }
  }

  // 로컬 스토리지에서 알림 데이터를 불러오는 함수
  function loadNotificationsFromStorage() {
    if (currentUser) {
      const savedNotifications = localStorage.getItem(`notifications_${currentUser.id}`);
      if (savedNotifications) {
        notifications = JSON.parse(savedNotifications);
        updateNotificationBadge();
        updateNotificationList();
      }
    }
  }

  // 새 보고서를 확인하는 함수
  async function checkNewReports() {
    if (!token || !currentUser) return;
    
    try {
      const response = await apiRequest('/reports/notifications');
      
      if (response.success && response.notifications) {
        response.notifications.forEach(notification => {
          // 이미 존재하는 알림인지 확인
          const exists = notifications.some(n => 
            n.id === notification.id || 
            (n.teamId === notification.teamId && 
             n.reportId === notification.reportId && 
             n.timestamp === notification.timestamp)
          );
          
          if (!exists) {
            addNotification({
              id: notification.id,
              title: notification.title,
              content: notification.content,
              timestamp: new Date(notification.timestamp),
              read: false,
              teamId: notification.teamId,
              reportId: notification.reportId
            });
          }
        });
      }
    } catch (error) {
      console.error('알림 확인 중 오류:', error);
    }
  }

  // 알림 관련 이벤트 리스너 등록
  if (notificationBtn) {
    notificationBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleNotificationDropdown();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      markAllNotificationsAsRead();
    });
  }

  // 드롭다운 외부 클릭 시 닫기
  document.addEventListener('click', function(e) {
    if (notificationDropdown && notificationDropdown.style.display === 'block' &&
        !notificationBtn.contains(e.target) && !notificationDropdown.contains(e.target)) {
      notificationDropdown.style.display = 'none';
    }
  });

  // 로그인 상태 확인 및 UI 업데이트
  async function checkAuthStatus() {
    console.log('인증 상태 확인 시작');
    // 토큰 재확인 (페이지 새로고침 등의 경우를 위해)
    token = localStorage.getItem('authToken') || getTokenFromCookie();

    if (!token) {
      console.log('토큰 없음, 로그아웃 상태로 설정');
      updateAuthUI(false);
      
      // 알림 인터벌 제거
      if (checkNotificationsInterval) {
        clearInterval(checkNotificationsInterval);
        checkNotificationsInterval = null;
      }
      
      return false;
    }

    try {
      console.log('사용자 정보 요청 중...');
      const response = await apiRequest('/auth/me');

      if (response.success && response.user) {
        console.log('사용자 정보 받음:', response.user);
        currentUser = response.user;
        updateAuthUI(true);
        
        // 알림 불러오기
        loadNotificationsFromStorage();
        
        // 알림 확인 인터벌 설정 (30초마다)
        if (!checkNotificationsInterval) {
          checkNewReports(); // 즉시 한 번 실행
          checkNotificationsInterval = setInterval(checkNewReports, 30000);
        }
        
        return true;
      } else {
        console.log('유효한 사용자 정보 없음');
        // 토큰이 유효하지 않음
        localStorage.removeItem('authToken');
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        token = null;
        updateAuthUI(false);
        
        // 알림 인터벌 제거
        if (checkNotificationsInterval) {
          clearInterval(checkNotificationsInterval);
          checkNotificationsInterval = null;
        }
        
        return false;
      }
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      localStorage.removeItem('authToken');
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      token = null;
      updateAuthUI(false);
      
      // 알림 인터벌 제거
      if (checkNotificationsInterval) {
        clearInterval(checkNotificationsInterval);
        checkNotificationsInterval = null;
      }
      
      return false;
    }
  }

  // 로그인 상태 UI 업데이트
  function updateAuthUI(isLoggedIn) {
    console.log(`UI 업데이트: 로그인 상태 = ${isLoggedIn}`);

    if (isLoggedIn && currentUser) {
      console.log('로그인 상태 UI 표시');
      // 로그인 상태
      if (authArea) authArea.style.display = 'none';
      if (profileArea) {
        profileArea.style.display = 'block';

        // 프로필 이미지 업데이트
        const profileImg = profileArea.querySelector('.profile-img');
        if (profileImg) {
          if (currentUser.avatar) {
            // 사용자 아바타가 있으면 이미지로 표시
            profileImg.innerHTML = '';
            const img = document.createElement('img');
            img.src = getAvatarUrl(currentUser.avatar); // 수정된 부분
            img.alt = `${currentUser.nickname || currentUser.name} 프로필`;
            img.style.width = '36px';
            img.style.height = '36px';
            img.style.borderRadius = '50%';

            // 이미지 로드 실패 시 이니셜로 대체
            img.onerror = function () {
              const initials = createInitialsProfile(currentUser.nickname || currentUser.name, 36);
              profileImg.innerHTML = '';
              profileImg.appendChild(initials);
            };

            profileImg.appendChild(img);
          } else {
            // 아바타가 없으면 이니셜 프로필 사용
            const initials = createInitialsProfile(currentUser.nickname || currentUser.name, 36);
            profileImg.innerHTML = '';
            profileImg.appendChild(initials);
          }
        }

        if (profileName) {
          profileName.textContent = currentUser.nickname || currentUser.name;
          console.log('프로필 이름 설정:', profileName.textContent);
        }
      }

      // 보고서 작성 버튼 활성화
      if (addReportBtn) addReportBtn.disabled = false;

      // 팀 목록 로드
      loadTeams();
    } else {
      console.log('로그아웃 상태 UI 표시');
      // 로그아웃 상태
      if (authArea) authArea.style.display = 'block';
      if (profileArea) profileArea.style.display = 'none';

      // 보고서 작성 버튼 비활성화
      if (addReportBtn) {
        addReportBtn.disabled = true;
        addReportBtn.title = "로그인이 필요합니다";
      }

      // 팀 목록 및 팀 뷰 초기화
      if (groupList) groupList.innerHTML = '';
      updateTeamView(null);
    }
  }

  // 로그아웃 처리
  async function handleLogout() {
    try {
      console.log('로그아웃 요청 중...');

      // POST가 아닌 GET 메서드로 변경
      await apiRequest('/auth/logout', 'GET');

      // 토큰 삭제
      localStorage.removeItem('authToken');
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      token = null;
      currentUser = null;

      // 알림 인터벌 제거
      if (checkNotificationsInterval) {
        clearInterval(checkNotificationsInterval);
        checkNotificationsInterval = null;
      }

      // 팀 캐시도 함께 삭제 (선택적)
      localStorage.removeItem('teamCache');

      // 로컬 UI 업데이트 (리다이렉트 전 깜빡임 방지)
      updateAuthUI(false);

      console.log('로그아웃 완료');

      // 페이지 새로고침 대신 로그인 페이지로 리다이렉트
      window.location.href = '/login.html';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      showAlert('로그아웃 중 오류가 발생했습니다. 로그인 페이지로 이동합니다.', '오류');

      // 심각한 오류 시에도 로컬 인증 상태는 정리
      localStorage.removeItem('authToken');
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      localStorage.removeItem('teamCache');

      // 알림 인터벌 제거
      if (checkNotificationsInterval) {
        clearInterval(checkNotificationsInterval);
        checkNotificationsInterval = null;
      }

      // 오류가 발생해도 로그인 페이지로 이동
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500); // 사용자가 오류 메시지를 읽을 시간을 주기 위해 약간 지연
    }
  }

  // ------------------- 모달 닫기 관련 -------------------
  // 모달 외부 클릭 시 닫기
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) {
        closeModal(this);
      }
    });
  });

  // 모달 닫기 함수
  function closeModal(targetModal) {
    if (targetModal) {
      targetModal.style.display = 'none';
    }
  }

  // 모달 열기 함수
  function openModal(targetModal) {
    if (targetModal) {
      targetModal.style.display = 'flex';
    }
  }

  // 모달 닫기 버튼 연결
  if (reportCloseBtn) {
    reportCloseBtn.addEventListener('click', () => closeModal(reportModal));
  }
  if (groupModalCloseBtn) {
    groupModalCloseBtn.addEventListener('click', () => closeModal(groupModal));
  }
  if (inviteCloseBtn) {
    inviteCloseBtn.addEventListener('click', () => closeModal(inviteModal));
  }
  if (commentCloseBtn) {
    commentCloseBtn.addEventListener('click', () => closeModal(commentModal));
  }
  if (commentCancelBtn) {
    commentCancelBtn.addEventListener('click', () => closeModal(commentModal));
  }
  if (reportCancelBtn) {
    reportCancelBtn.addEventListener('click', () => closeModal(reportModal));
  }
  if (cancelGroupModal) {
    cancelGroupModal.addEventListener('click', () => closeModal(groupModal));
  }
  if (codeInputCloseBtn) {
    codeInputCloseBtn.addEventListener('click', () => closeModal(codeInputModal));
  }
  if (cancelCodeInputModal) {
    cancelCodeInputModal.addEventListener('click', () => closeModal(codeInputModal));
  }

  // ------------------- 팀 관련 기능 -------------------
  // 사용자의 팀 목록 로드
  async function loadTeams() {
    try {
      console.log('팀 목록 로드 중...');

      // 로딩 표시
      if (groupList) {
        groupList.innerHTML = `
          <div class="loading-indicator">
            <div class="loader"></div>
            <p class="loading-text">팀 목록을 불러오는 중...</p>
          </div>
        `;
      }

      const response = await apiRequest('/teams');

      if (response.success && response.teams) {
        console.log('팀 목록 받음:', response.teams);

        if (groupList) {
          groupList.innerHTML = '';

          // 팀이 없는 경우 권유 메시지 표시
          if (response.teams.length === 0) {
            console.log('팀이 없음');

            // 사용자에게 팀 생성 권유 메시지 표시
            groupList.innerHTML = `
              <div class="no-teams">
                <p>참여 중인 팀이 없습니다</p>
                <p class="suggestion">새 팀을 만들거나 초대 코드를 입력해보세요!</p>
                <div class="no-teams-actions">
                  <button class="create-team-btn primary-btn">+ 새 팀 만들기</button>
                  <button class="enter-code-btn">초대 코드 입력</button>
                </div>
              </div>
            `;

            // 새 팀 만들기 버튼 이벤트 연결
            const createTeamBtn = groupList.querySelector('.create-team-btn');
            if (createTeamBtn) {
              createTeamBtn.addEventListener('click', function () {
                // 로그인 체크
                if (!token || !currentUser) {
                  showAlert('팀을 생성하려면 로그인이 필요합니다.', '로그인 필요');
                  return;
                }

                // 팀 생성 모달 열기
                modalTitle.textContent = '팀 추가';
                groupNameInput.value = '';
                currentEditingGroup = null;
                groupModal.style.display = 'flex';
              });
            }

            // 코드 입력 버튼 이벤트 연결
            const enterCodeBtn = groupList.querySelector('.enter-code-btn');
            if (enterCodeBtn) {
              enterCodeBtn.addEventListener('click', function () {
                // 로그인 체크
                if (!token || !currentUser) {
                  showAlert('팀에 참가하려면 로그인이 필요합니다.', '로그인 필요');
                  return;
                }

                // 코드 입력 모달 열기
                openModal(codeInputModal);
                if (codeInputField) {
                  codeInputField.value = '';
                  codeInputField.focus();
                }
              });
            }

            // 메인 콘텐츠 영역에도 팀 생성 유도 메시지 추가
            updateTeamView(null, null, [], [], true);
            return;
          }

          // 팀 목록 표시
          response.teams.forEach(team => {
            const groupItem = document.createElement('div');
            groupItem.classList.add('group-item');
            groupItem.dataset.teamId = team.id;
            groupItem.dataset.groupName = team.name;

            // 팀 이름에 따른 아이콘 선택 (이모지)
            let icon = '🔧'; // 기본 아이콘

            if (team.name.includes('디자인')) {
              icon = '🎨'; // 디자인 팀
            } else if (team.name.includes('개발')) {
              icon = '👥'; // 개발팀
            } else if (team.name.includes('마케팅')) {
              icon = '📊'; // 마케팅팀
            } else if (team.name.includes('기획')) {
              icon = '📝'; // 기획팀
            } else if (team.name.includes('연구')) {
              icon = '🔬'; // 연구팀
            } else if (team.name.includes('영업')) {
              icon = '🤝'; // 영업팀
            } else if (team.name.includes('인사')) {
              icon = '👔'; // 인사팀
            } else if (team.name.includes('관리')) {
              icon = '📋'; // 관리팀
            } else if (team.name.includes('지원')) {
              icon = '🔧'; // 지원팀
            }

            groupItem.innerHTML = `
              <span class="group-icon">${icon}</span>
              <span class="group-name">${team.name}</span>
              <div class="action-container">
                <span class="member-count">${team.memberCount || 0}명</span>
                <div class="group-item-actions">
                  <button class="edit-group" title="그룹 수정">✏️</button>
                  <button class="delete-group" title="그룹 삭제">🗑️</button>
                </div>
              </div>
            `;

            groupList.appendChild(groupItem);
          });

          // 첫 번째 팀 선택
          if (response.teams.length > 0) {
            const firstTeam = document.querySelector('.group-item');
            if (firstTeam) {
              firstTeam.classList.add('active');
              const teamId = firstTeam.dataset.teamId;
              const teamName = firstTeam.dataset.groupName;
              currentActiveTeamId = teamId;

              // 로딩 표시
              memberGrid.innerHTML = `
                <div class="loading-indicator">
                  <div class="loader"></div>
                  <p class="loading-text">팀 정보를 불러오는 중...</p>
                </div>
              `;
              individualTodosContainer.innerHTML = '';
              reportIssuesContainer.innerHTML = '';

              // 팀 상세 정보 로드
              loadTeamDetails(teamId, teamName);
            }
          }
        }
      } else {
        console.log('팀 목록을 불러오지 못함');

        if (groupList) {
          groupList.innerHTML = `
            <div class="error-message">
              <p>팀 목록을 불러오는 중 오류가 발생했습니다.</p>
              <button class="retry-btn">다시 시도</button>
            </div>
          `;

          // 다시 시도 버튼 이벤트 연결
          const retryBtn = groupList.querySelector('.retry-btn');
          if (retryBtn) {
            retryBtn.addEventListener('click', loadTeams);
          }
        }
      }
    } catch (error) {
      console.error('팀 목록 로드 오류:', error);

      // 서버 연결 실패 시
      if (groupList) {
        groupList.innerHTML = `
          <div class="error-message">
            <p>서버 연결에 실패했습니다.</p>
            <button class="retry-btn">다시 시도</button>
            <button class="show-dummy-btn">임시 데이터 표시</button>
          </div>
        `;

        // 다시 시도 버튼 이벤트 연결
        const retryBtn = groupList.querySelector('.retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', loadTeams);
        }

        // 임시 데이터 버튼 이벤트 연결
        const showDummyBtn = groupList.querySelector('.show-dummy-btn');
        if (showDummyBtn) {
          showDummyBtn.addEventListener('click', showDummyTeams);
        }
      }
    }
  }

  // 로딩, 오류 스타일 추가
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      text-align: center;
    }
    
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary-color);
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error-message {
      padding: 15px;
      text-align: center;
      color: #e74c3c;
      background-color: #fee;
      border-radius: 8px;
      margin: 10px 0;
    }
    
    .error-message button {
      margin-top: 10px;
      padding: 5px 10px;
      border: none;
      border-radius: 4px;
      background-color: #f5f5f5;
      cursor: pointer;
    }
    
    .error-message .retry-btn {
      background-color: var(--primary-color);
      color: white;
      margin-right: 5px;
    }
    
    .no-teams {
      padding: 20px;
      text-align: center;
      color: var(--gray-color);
      background-color: var(--light-background);
      border-radius: 8px;
      margin: 10px 0;
    }
    
    .no-teams .suggestion {
      margin-top: 10px;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .no-teams-actions {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .no-teams-actions button {
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      border: none;
      font-weight: bold;
    }
    
    .create-team-btn {
      background-color: var(--primary-color);
      color: white;
    }
    
    .enter-code-btn {
      background-color: white;
      border: 1px solid var(--border-color) !important;
    }
    
    /* 알림 관련 스타일 */
    .notification-container {
      position: relative;
      display: inline-block;
      margin-right: 10px;
    }

    .notification-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 5px 8px;
      position: relative;
      color: var(--primary-color);
      border-radius: 4px;
      background-color: white;
      border: 1px solid var(--border-color);
    }

    .notification-btn:hover {
      background-color: var(--light-background);
    }

    .notification-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background-color: #e74c3c;
      color: white;
      border-radius: 50%;
      font-size: 10px;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      visibility: hidden;
    }

    .notification-badge.show {
      visibility: visible;
    }

    .notification-dropdown {
      position: absolute;
      right: 0;
      top: 100%;
      width: 300px;
      max-height: 400px;
      overflow-y: auto;
      background-color: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      z-index: 1000;
      display: none;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid var(--border-color);
    }

    .notification-header h4 {
      margin: 0;
      color: var(--text-color);
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 12px;
      cursor: pointer;
    }

    .notification-list {
      padding: 0;
    }

    .notification-item {
      padding: 10px 15px;
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .notification-item:hover {
      background-color: var(--light-background);
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item.unread {
      background-color: rgba(52, 152, 219, 0.1);
    }

    .notification-item .notification-title {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 14px;
    }

    .notification-item .notification-content {
      color: var(--gray-color);
      font-size: 13px;
      margin-bottom: 5px;
    }

    .notification-item .notification-time {
      color: var(--gray-color);
      font-size: 11px;
      text-align: right;
    }

    .empty-notification {
      padding: 20px;
      text-align: center;
      color: var(--gray-color);
      font-size: 14px;
    }
    
    @keyframes highlight-pulse {
      0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); }
      70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); }
      100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); }
    }
    
    .highlight-report {
      animation: highlight-pulse 2s infinite;
      border: 2px solid var(--primary-color) !important;
    }
  `;
  document.head.appendChild(styleElement);

  // 팀 상세 정보 로드
  async function loadTeamDetails(teamId, teamName) {
    try {
      console.log(`팀 상세 정보 로드 중: ${teamName} (${teamId})`);

      // 1. 팀 멤버 목록 가져오기
      const membersResponse = await apiRequest(`/teams/${teamId}/members`);

      // 2. 팀 보고서 가져오기
      const reportsResponse = await apiRequest(`/teams/${teamId}/reports`);

      // UI 업데이트
      updateTeamView(teamId, teamName, membersResponse.members, reportsResponse.reports);
    } catch (error) {
      console.error('팀 상세 정보 로드 오류:', error);
    }
  }

  // 팀 뷰 업데이트
  function updateTeamView(teamId, teamName, members = [], reports = []) {
    // 팀이 없는 경우 UI 초기화
    if (!teamId) {
      currentGroupNameDisplay.textContent = '팀 선택';
      memberGrid.innerHTML = '';
      individualTodosContainer.innerHTML = '';
      reportIssuesContainer.innerHTML = '';
      aiSuggestionsDisplay.innerHTML = '';
      
      // 기존에 있던 종합 보고서 버튼 제거
      const existingSummaryBtn = document.getElementById('teamSummaryBtn');
      if (existingSummaryBtn) {
        existingSummaryBtn.remove();
      }
      
      return;
    }

    console.log(`팀 뷰 업데이트: ${teamName}`);
    currentActiveTeamId = teamId;
    currentGroupNameDisplay.textContent = `${teamName}의 Blitz-Q`;

    // UI 요소가 존재하는지 확인
    if (!memberGrid || !individualTodosContainer || !reportIssuesContainer) {
      console.error('필요한 UI 요소를 찾을 수 없습니다.');
      return;
    }

    // 내용 초기화
    memberGrid.innerHTML = '';
    individualTodosContainer.innerHTML = '';
    reportIssuesContainer.innerHTML = '';

    // 팀원 목록 업데이트
    members.forEach(member => {
      const memberCard = document.createElement('div');
      memberCard.classList.add('member-card');

      // 현재 상태 (활성/비활성) 추정 - 최근 로그인 기반
      // 24시간 이내 로그인 = 활성
      const isActive = member.last_login && new Date(member.last_login) > new Date(Date.now() - 24 * 60 * 60 * 1000);

      // 멤버 정보 컨테이너
      const memberInfo = document.createElement('div');
      memberInfo.className = 'member-info';

      // 프로필 이미지 또는 이니셜 생성
      const displayName = member.nickname || member.name || '팀원';

      if (member.avatar) {
        // 프로필 이미지가 있는 경우
        const imgContainer = document.createElement('div');
        imgContainer.className = 'profile-img-container';
        imgContainer.style.width = '80px';
        imgContainer.style.height = '80px';
        imgContainer.style.position = 'relative';

        const img = document.createElement('img');
        img.src = getAvatarUrl(member.avatar);
        img.alt = `${displayName} 프로필`;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';

        // 이미지 로드 실패 시 이니셜로 대체
        img.onerror = function () {
          const initials = createInitialsProfile(displayName, 80);
          imgContainer.innerHTML = '';
          imgContainer.appendChild(initials);
        };

        imgContainer.appendChild(img);
        memberInfo.appendChild(imgContainer);
      } else {
        // 이미지가 없는 경우 이니셜 표시
        const initials = createInitialsProfile(displayName, 80);
        memberInfo.appendChild(initials);
      }

      // 멤버 상세 정보
      const memberDetails = document.createElement('div');
      memberDetails.className = 'member-details';
      memberDetails.innerHTML = `
        <strong>${displayName}</strong>
        <span>${member.role || '팀원'}</span>
      `;
      memberInfo.appendChild(memberDetails);
      memberCard.appendChild(memberInfo);

      // 멤버 상태 표시
      const memberStatus = document.createElement('div');
      memberStatus.className = 'member-status';
      memberStatus.innerHTML = `
        <span class="status-dot ${isActive ? 'active' : ''}"></span>
        ${isActive ? '활성' : '비활성'}
      `;
      memberCard.appendChild(memberStatus);

      memberGrid.appendChild(memberCard);
    });

    // 보고서 정보 정리
    const memberReports = {};
    reports.forEach(report => {
      if (!memberReports[report.user_id]) {
        memberReports[report.user_id] = [];
      }
      memberReports[report.user_id].push(report);
    });

    // 팀원 To-Do List: 버튼식 드롭다운 생성
    members.forEach(member => {
      const teamButton = document.createElement('button');
      teamButton.classList.add('team-todo-button');

      // 진행률 계산
      let progress = 0;
      let latestReport = null;

      if (memberReports[member.id] && memberReports[member.id].length > 0) {
        // 가장 최근 보고서 찾기
        memberReports[member.id].sort((a, b) =>
          new Date(b.report_date) - new Date(a.report_date)
        );
        latestReport = memberReports[member.id][0];
        progress = latestReport.progress || 0;
      }

      teamButton.innerHTML = `
        <span class="member-name">${member.nickname || member.name}</span>
        <div style="display: flex; align-items: center">
          <span class="progress-label-small">${progress}%</span>
          <div class="progress-bar-container-small">
            <div class="progress-bar-small" style="width: ${progress}%;"></div>
          </div>
          <span class="arrow-btn" style="margin-left: 8px">&#9660;</span>
        </div>
      `;

      const detailsDiv = document.createElement('div');
      detailsDiv.classList.add('team-todo-details');

      if (latestReport) {
        // 보고서 데이터 파싱
        const todayWork = latestReport.today_work ?
          (typeof latestReport.today_work === 'string' ? [latestReport.today_work] : latestReport.today_work) :
          [];

        const yesterdayWork = latestReport.yesterday_work ?
          (typeof latestReport.yesterday_work === 'string' ? [latestReport.yesterday_work] : latestReport.yesterday_work) :
          [];

        detailsDiv.innerHTML = `
          <p><strong>오늘 요약:</strong> ${latestReport.summary || '요약 없음'}</p>
          <p><strong>어제 진행한 일:</strong> ${yesterdayWork.join(', ') || '없음'}</p>
          <p><strong>오늘 할 일:</strong> ${todayWork.join(', ') || '없음'}</p>
        `;

        // 개인 할 일 목록이 있는 경우
        if (latestReport.individualTodo && Array.isArray(latestReport.individualTodo) && latestReport.individualTodo.length > 0) {
          const todoList = document.createElement('div');
          todoList.classList.add('individual-todo-list');

          const todoHeader = document.createElement('p');
          todoHeader.innerHTML = '<strong>개인 할 일 목록:</strong>';
          todoList.appendChild(todoHeader);

          const todoItems = document.createElement('ul');

          // 날짜별로 정렬 (최신순)
          latestReport.individualTodo.sort((a, b) => {
            // created_at이 있으면 이것을 기준으로, 없으면 현재 순서 유지
            if (a.created_at && b.created_at) {
              return new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
          });

          latestReport.individualTodo.forEach((todo, index) => {
            const todoItem = document.createElement('li');
            todoItem.classList.add('todo-item');

            // 할 일 완료/미완료 체크박스
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = todo.completed;
            checkbox.dataset.todoId = todo.id || index; // ID가 없으면 인덱스 사용

            // 체크박스 이벤트 핸들러
            checkbox.addEventListener('change', async function () {
              const todoId = this.dataset.todoId;
              const completed = this.checked;

              try {
                await apiRequest(`/reports/todo/${teamId}`, 'PUT', {
                  todoId,  // 인덱스 대신 ID 사용
                  completed
                });
                // UI 업데이트는 필요 없음 (이미 체크박스 상태 변경됨)
              } catch (error) {
                console.error('할 일 업데이트 오류:', error);
                // 오류 발생 시 체크박스 원래 상태로 복구
                this.checked = !completed;
                showAlert('할 일 상태 업데이트 중 오류가 발생했습니다', '오류');
              }
            });

            todoItem.appendChild(checkbox);

            const todoText = document.createElement('span');
            todoText.textContent = todo.text;
            if (todo.completed) {
              todoText.style.textDecoration = 'line-through';
              todoText.style.color = 'var(--gray-color)';
            }

            // 생성 날짜 표시 (있는 경우)
            if (todo.created_at) {
              const dateText = document.createElement('small');
              dateText.style.marginLeft = '8px';
              dateText.style.color = 'var(--gray-color)';

              // 날짜 포맷팅
              const todoDate = new Date(todo.created_at);
              dateText.textContent = `(${todoDate.getMonth() + 1}/${todoDate.getDate()})`;

              todoText.appendChild(dateText);
            }

            todoItem.appendChild(todoText);
            todoItems.appendChild(todoItem);
          });

          todoList.appendChild(todoItems);
          detailsDiv.appendChild(todoList);
        }
      } else {
        detailsDiv.innerHTML = `<p style="color: var(--gray-color); text-align: center; padding: 10px;">보고서가 없습니다.</p>`;
      }

      teamButton.addEventListener('click', function () {
        const isCurrentlyOpen = detailsDiv.style.display === 'block';

        // 모든 상세 정보 닫기
        document.querySelectorAll('.team-todo-details').forEach(el => {
          el.style.display = 'none';
        });

        // 모든 화살표 버튼 초기화
        document.querySelectorAll('.team-todo-button .arrow-btn').forEach(el => {
          el.innerHTML = '&#9660;';
        });

        // 현재 요소가 닫혀있었으면 열기
        if (!isCurrentlyOpen) {
          detailsDiv.style.display = 'block';
          this.querySelector('.arrow-btn').innerHTML = '&#9650;';
        }
      });

      individualTodosContainer.appendChild(teamButton);
      individualTodosContainer.appendChild(detailsDiv);
    });

    // 팀원별 이슈 및 문제점 업데이트
    members.forEach(member => {
      const reportCard = document.createElement('div');
      reportCard.classList.add('report-card');

      let latestReport = null;

      if (memberReports[member.id] && memberReports[member.id].length > 0) {
        // 가장 최근 보고서 찾기
        memberReports[member.id].sort((a, b) =>
          new Date(b.report_date) - new Date(a.report_date)
        );
        latestReport = memberReports[member.id][0];

        // report-id 속성 추가
        if (latestReport.id) {
          reportCard.dataset.reportId = latestReport.id;
        }

        // 이슈 정보 추출
        const issues = latestReport.issues || [];
        const issueText = typeof issues === 'string' ? issues :
          (Array.isArray(issues) && issues.length > 0 ?
            (issues[0].text || '이슈 없음') : '이슈 없음');

        // 댓글 수 계산
        const issueObj = typeof issues === 'string' ? null :
          (Array.isArray(issues) && issues.length > 0 ? issues[0] : null);
        const commentCount = issueObj && issueObj.comments ? issueObj.comments.length : 0;

        // 보고서 날짜 변수 저장
        const reportDate = latestReport.report_date;

        reportCard.innerHTML = `
        <div class="report-header">
          <strong>${member.nickname || member.name}</strong>
          <span class="report-date">${reportDate}</span>
        </div>
        <div class="report-content">
          <h4>이슈/장애</h4>
          <p>${issueText || '이슈 없음'}</p>
          <button class="view-comments-btn" 
                  data-member-id="${member.id}" 
                  data-issue-index="0"
                  data-report-date="${reportDate}">
            댓글 보기 ${commentCount > 0 ? `(${commentCount})` : ''}
          </button>
        </div>
      `;

        // 댓글 보기 버튼 이벤트 연결 - 날짜 데이터 추가
        reportCard.querySelector('.view-comments-btn').addEventListener('click', function () {
          const memberId = this.dataset.memberId;
          const issueIndex = parseInt(this.dataset.issueIndex);
          const reportDate = this.dataset.reportDate;

          selectedIssueIndex = issueIndex;
          selectedReportMemberId = memberId;
          selectedReportDate = reportDate; // 전역 변수에 날짜 저장

          openCommentModal(memberId, issueIndex, reportDate);
        });
      } else {
        reportCard.innerHTML = `
        <div class="report-header">
          <strong>${member.nickname || member.name}</strong>
          <span class="report-date"></span>
        </div>
        <div class="report-content">
          <p style="text-align: center; color: var(--gray-color); padding: 15px;">아직 보고서가 없습니다.</p>
        </div>
      `;
      }

      reportIssuesContainer.appendChild(reportCard);
    });

    // AI 섹션 초기화
    updateAiSuggestions();
    
    // 페이지 처음 로드 시 자동으로 분석 실행 (하루에 한 번만)
    if (teamId && reports.length > 0 && !autoAnalysisPerformed) {
      // 분석 버튼이 존재하고 보고서가 있는 경우에만 실행
      if (analyzeBtn) {
        console.log('자동으로 AI 분석 실행 중...');
        setTimeout(() => {
          analyzeBtn.click();
          autoAnalysisPerformed = true; // 분석 완료 표시
          saveAnalysisStatus(); // 분석 상태 저장
        }, 1000); // 페이지 완전히 로드된 후 실행하도록 약간 지연
      }
    }
  }

  // AI 섹션 업데이트
  function updateAiSuggestions() {
    if (!aiSuggestionsDisplay) return;

    // 기본 메시지
    aiSuggestionsDisplay.innerHTML = `
      <p style="color: var(--gray-color); text-align: center;">
        '분석' 버튼을 클릭하여 AI의 해결방안과 조언을 얻으세요.
      </p>
    `;
  }

  // AI 분석 기능
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async function () {
      if (!aiSuggestionsDisplay || !currentActiveTeamId) return;

      // 로딩 표시
      aiSuggestionsDisplay.innerHTML = `
        <div class="loading-indicator">
          <div class="loader"></div>
          <p>AI가 팀 종합 보고서를 분석하고 있습니다...</p>
        </div>
      `;

      try {
        // 팀 종합 분석 API 호출
        const response = await apiRequest(`/reports/team-summary/${currentActiveTeamId}`);
        
        if (response.success && response.summary) {
          const summary = response.summary;
          
          // 종합 분석 결과 표시
          let html = `
            <div class="summary-header">
              <h3>${summary.team} 팀 종합 분석</h3>
              <p>팀원: ${summary.memberCount}명 중 ${summary.reportCount}명 보고서 제출</p>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${summary.progressAverage}%;"></div>
                <span class="progress-label">평균 진행률: ${summary.progressAverage}%</span>
              </div>
            </div>
          `;
          
          // AI 분석 결과가 있는 경우
          if (summary.aiAnalysis && !summary.aiAnalysis.error) {
            const analysis = summary.aiAnalysis;
            
            html += `
              <div class="summary-section ai-analysis">
                <h4>팀 개요</h4>
                <p class="analysis-overview">${analysis.team_overview || '분석 정보 없음'}</p>
                
                <h4>주요 공통 이슈</h4>
                <ul class="analysis-list">
            `;
            
            // 공통 이슈
            if (analysis.common_issues && analysis.common_issues.length > 0) {
              analysis.common_issues.forEach(issue => {
                html += `<li>${issue}</li>`;
              });
            } else {
              html += `<li class="empty-item">공통 이슈가 발견되지 않았습니다.</li>`;
            }
            
            html += `
                </ul>
                
                <h4>우선 순위 작업</h4>
                <ul class="analysis-list">
            `;
            
            // 우선 순위 작업
            if (analysis.priority_tasks && analysis.priority_tasks.length > 0) {
              analysis.priority_tasks.forEach(task => {
                html += `<li>${task}</li>`;
              });
            } else {
              html += `<li class="empty-item">우선 순위 작업이 식별되지 않았습니다.</li>`;
            }
            
            html += `
                </ul>
                
                <h4>협업 제안</h4>
                <ul class="analysis-list">
            `;
            
            // 협업 제안
            if (analysis.collaboration_suggestions && analysis.collaboration_suggestions.length > 0) {
              analysis.collaboration_suggestions.forEach(suggestion => {
                html += `<li>${suggestion}</li>`;
              });
            } else {
              html += `<li class="empty-item">협업 제안 사항이 없습니다.</li>`;
            }
            
            html += `
                </ul>
                
                <div class="evaluation-section">
                  <h4>진행 상황 평가</h4>
                  <p>${analysis.progress_evaluation || '평가 정보 없음'}</p>
                </div>
                
                <div class="recommendations-section">
                  <h4>종합 제안사항</h4>
                  <p>${analysis.overall_recommendations || '제안사항 정보 없음'}</p>
                </div>
              </div>
            `;
            
            // 개인 보고서 분석 결과 (접어둠 상태)
            html += `
              <div class="individual-reports-container">
                <button class="toggle-individual-reports" id="toggleIndividualBtn">개인별 보고서 분석 보기</button>
                <div class="individual-reports" id="individualReportsSection" style="display: none;">
                  <h3>개인별 보고서 분석</h3>
                  <div id="individualAnalysisContainer"></div>
                </div>
              </div>
            `;
            
          } else {
            // AI 분석 결과가 없는 경우
            html += `
              <div class="summary-section ai-analysis-error">
                <p class="error-message">${summary.aiAnalysis?.error || '팀 분석 결과가 없습니다.'}</p>
                <button id="retryTeamAnalysisBtn" class="retry-btn">분석 다시 시도</button>
              </div>
            `;
          }
          
          // 내용 업데이트
          aiSuggestionsDisplay.innerHTML = html;
          
          // 개인 보고서 토글 버튼 이벤트 연결
          const toggleBtn = document.getElementById('toggleIndividualBtn');
          if (toggleBtn) {
            toggleBtn.addEventListener('click', function() {
              const individualSection = document.getElementById('individualReportsSection');
              if (individualSection) {
                const isHidden = individualSection.style.display === 'none';
                individualSection.style.display = isHidden ? 'block' : 'none';
                this.textContent = isHidden ? '개인별 보고서 분석 숨기기' : '개인별 보고서 분석 보기';
                
                // 처음 펼쳤을 때만 개인 보고서 분석 실행
                if (isHidden && document.getElementById('individualAnalysisContainer').children.length === 0) {
                  loadIndividualReportAnalysis();
                }
              }
            });
          }
          
          // 다시 시도 버튼 이벤트 연결
          const retryBtn = document.getElementById('retryTeamAnalysisBtn');
          if (retryBtn) {
            retryBtn.addEventListener('click', function() {
              analyzeBtn.click();
            });
          }
          
        } else {
          // 오류 또는 응답이 없는 경우 대체 UI
          aiSuggestionsDisplay.innerHTML = `
            <div class="error-message">
              <p>팀 분석 결과를 가져오는 데 실패했습니다.</p>
              <button id="retry-analysis-btn" class="btn btn-primary">다시 시도</button>
            </div>
          `;
          
          // 다시 시도 버튼 이벤트 연결
          const retryBtn = document.getElementById('retry-analysis-btn');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => {
              analyzeBtn.click();
            });
          }
        }
      } catch (error) {
        console.error('AI 분석 오류:', error);

        // 오류 시 대체 UI
        aiSuggestionsDisplay.innerHTML = `
          <div class="error-message">
            <p>분석 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}</p>
            <button id="retry-analysis-btn" class="btn btn-primary">다시 시도</button>
          </div>
        `;
        
        // 다시 시도 버튼 이벤트 연결
        const retryBtn = document.getElementById('retry-analysis-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            analyzeBtn.click();
          });
        }
      }
    });
  }

  // 개인 보고서 분석 함수
  async function loadIndividualReportAnalysis() {
    const individualContainer = document.getElementById('individualAnalysisContainer');
    if (!individualContainer || !currentActiveTeamId) return;
    
    individualContainer.innerHTML = `
      <div class="loading-indicator">
        <div class="loader"></div>
        <p>개인 보고서를 분석하는 중...</p>
      </div>
    `;
    
    try {
      // 보고서 카드에서 ID 가져오기
      const reportCards = document.querySelectorAll('.report-card');
      let analysisHtml = '';
      let analysisCount = 0;
      
      // 각 보고서 분석
      for (const reportCard of reportCards) {
        const reportId = reportCard.dataset.reportId;
        if (!reportId) continue;
        
        const memberName = reportCard.querySelector('.report-header strong')?.textContent || '팀원';
        
        try {
          // 분석 결과 가져오기
          const response = await apiRequest(`/reports/${reportId}/analysis`, 'GET');
          
          if (response.success && response.analysis) {
            const analysis = response.analysis;
            
            analysisHtml += `
              <div class="individual-analysis-section">
                <h4>${memberName}님의 보고서</h4>
                <div class="analysis-content">
                  <p><strong>요약:</strong> ${analysis.summary || '요약 정보 없음'}</p>
                  
                  <div class="action-items">
                    <p><strong>실행 항목:</strong></p>
                    <ul>
                      ${(analysis.action_items || []).map(item => `<li>${item}</li>`).join('') || '<li>실행 항목 없음</li>'}
                    </ul>
                  </div>
                  
                  <div class="quality-rating">
                    <p><strong>보고서 품질 점수:</strong> <span class="score">${analysis.quality_score || 'N/A'}</span>/10</p>
                  </div>
                </div>
              </div>
            `;
            
            analysisCount++;
          }
        } catch (error) {
          // 개별 보고서 분석 실패 시 계속 진행
          console.error(`${memberName} 보고서 분석 오류:`, error);
          
          analysisHtml += `
            <div class="individual-analysis-section error">
              <h4>${memberName}님의 보고서</h4>
              <p class="error-message">분석 결과를 가져오지 못했습니다</p>
              <button class="analyze-individual-btn" data-report-id="${reportId}">분석 시작</button>
            </div>
          `;
        }
      }
      
      if (analysisCount === 0 && reportCards.length > 0) {
        // 분석 결과가 없으면 일괄 분석 버튼 표시
        individualContainer.innerHTML = `
          <div class="no-analysis">
            <p>개인 보고서 분석 결과가 없습니다.</p>
            <button id="start-individual-analysis" class="btn btn-primary">모든 보고서 분석 시작</button>
          </div>
        `;
        
        // 일괄 분석 버튼 이벤트 연결
        const startBtn = document.getElementById('start-individual-analysis');
        if (startBtn) {
          startBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.textContent = '분석 중...';
            
            individualContainer.innerHTML = `
              <div class="loading-indicator">
                <div class="loader"></div>
                <p>모든 보고서를 분석하는 중...</p>
              </div>
            `;
            
            // 각 보고서 순차적으로 분석 요청
            for (const reportCard of reportCards) {
              const reportId = reportCard.dataset.reportId;
              if (reportId) {
                try {
                  await apiRequest(`/reports/${reportId}/analyze`, 'POST');
                  // 진행 상황 업데이트
                  individualContainer.innerHTML = `
                    <div class="loading-indicator">
                      <div class="loader"></div>
                      <p>보고서 분석 중... (${reportCard.querySelector('.report-header strong').textContent})</p>
                    </div>
                  `;
                  // 처리 시간 주기
                  await new Promise(resolve => setTimeout(resolve, 3000));
                } catch (error) {
                  console.error('보고서 분석 요청 오류:', error);
                }
              }
            }
            
            // 분석 완료 후 결과 다시 불러오기
            loadIndividualReportAnalysis();
          });
        }
      } else {
        // 분석 결과 표시
        individualContainer.innerHTML = analysisHtml;
        
        // 개별 분석 버튼 이벤트 연결
        document.querySelectorAll('.analyze-individual-btn').forEach(btn => {
          btn.addEventListener('click', async function() {
            const reportId = this.dataset.reportId;
            if (!reportId) return;
            
            this.disabled = true;
            this.textContent = '분석 중...';
            
            try {
              await apiRequest(`/reports/${reportId}/analyze`, 'POST');
              // 3초 후 결과 새로고침
              setTimeout(() => {
                loadIndividualReportAnalysis();
              }, 3000);
            } catch (error) {
              console.error('개별 분석 요청 오류:', error);
              this.textContent = '실패';
              this.disabled = false;
            }
          });
        });
      }
    } catch (error) {
      console.error('개인 보고서 분석 로드 오류:', error);
      individualContainer.innerHTML = `
        <div class="error-message">
          <p>개인 보고서 분석을 불러오는 중 오류가 발생했습니다.</p>
          <button id="retry-individual-btn" class="btn btn-primary">다시 시도</button>
        </div>
      `;
      
      // 다시 시도 버튼 이벤트 연결
      const retryBtn = document.getElementById('retry-individual-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          loadIndividualReportAnalysis();
        });
      }
    }
  }

  // ------------------- 보고서 작성 모달 -------------------
  // 어제 한 일 항목 추가/삭제
  if (addYesterdayBtn) {
    addYesterdayBtn.addEventListener('click', function () {
      if (!yesterdayContainer) return;

      const newTextarea = document.createElement('textarea');
      newTextarea.classList.add('yesterdayInput', 'report-input');
      newTextarea.required = true;
      newTextarea.placeholder = "어제 진행한 작업을 입력하세요";
      yesterdayContainer.appendChild(newTextarea);
    });
  }

  if (removeYesterdayBtn) {
    removeYesterdayBtn.addEventListener('click', function () {
      if (!yesterdayContainer) return;

      const textareas = yesterdayContainer.querySelectorAll('textarea.yesterdayInput');
      if (textareas.length > 1) {
        yesterdayContainer.removeChild(textareas[textareas.length - 1]);
      }
    });
  }

  // 오늘 할 일 항목 추가/삭제
  if (addTodayBtn) {
    addTodayBtn.addEventListener('click', function () {
      if (!todayContainer) return;

      const newTextarea = document.createElement('textarea');
      newTextarea.classList.add('todayInput', 'report-input');
      newTextarea.required = true;
      newTextarea.placeholder = "오늘 진행할 작업을 입력하세요";
      todayContainer.appendChild(newTextarea);
    });
  }

  if (removeTodayBtn) {
    removeTodayBtn.addEventListener('click', function () {
      if (!todayContainer) return;

      const textareas = todayContainer.querySelectorAll('textarea.todayInput');
      if (textareas.length > 1) {
        todayContainer.removeChild(textareas[textareas.length - 1]);
      }
    });
  }

  // 보고서 모달 열기
  if (addReportBtn) {
    addReportBtn.addEventListener('click', function () {
      // 로그인 상태 확인
      if (!token || !currentUser) {
        showAlert('보고서를 작성하려면 로그인이 필요합니다.', '로그인 필요');
        return;
      }

      // 팀 선택 확인
      if (!currentActiveTeamId) {
        showAlert('팀을 먼저 선택하세요.', '알림');
        return;
      }

      if (!reportModal) return;

      // 모달 초기화
      if (reportForm) {
        reportForm.reset();

        // 초기 입력 필드 설정
        if (yesterdayContainer) {
          yesterdayContainer.innerHTML = '';
          const initialYesterdayInput = document.createElement('textarea');
          initialYesterdayInput.classList.add('yesterdayInput', 'report-input');
          initialYesterdayInput.required = true;
          initialYesterdayInput.placeholder = "어제 진행한 작업을 입력하세요";
          yesterdayContainer.appendChild(initialYesterdayInput);
        }

        if (todayContainer) {
          todayContainer.innerHTML = '';
          const initialTodayInput = document.createElement('textarea');
          initialTodayInput.classList.add('todayInput', 'report-input');
          initialTodayInput.required = true;
          initialTodayInput.placeholder = "오늘 진행할 작업을 입력하세요";
          todayContainer.appendChild(initialTodayInput);
        }
      }

      reportModal.style.display = 'flex';
    });
  }

  // 보고서 제출
  if (reportForm) {
    reportForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // 로그인 상태 확인
      if (!token || !currentUser) {
        showAlert('보고서를 제출하려면 로그인이 필요합니다.', '로그인 필요');
        return;
      }

      // 팀 선택 확인
      if (!currentActiveTeamId) {
        showAlert('팀을 먼저 선택하세요.', '알림');
        return;
      }

      const summaryInput = document.getElementById('summaryInput');
      const issuesInput = document.getElementById('issuesInput');
      const assistanceInput = document.getElementById('assistanceInput');
      const progressInput = document.getElementById('progressInput');
      const sendEmailCheckbox = document.getElementById('sendEmailCheckbox');

      if (!summaryInput || !issuesInput || !assistanceInput || !progressInput) {
        showAlert('필요한 입력 필드를 찾을 수 없습니다.', '오류');
        return;
      }

      const summary = summaryInput.value.trim();
      const yesterdayInputs = Array.from(document.querySelectorAll('.yesterdayInput'));
      const yesterdayArray = yesterdayInputs.map(input => input.value.trim()).filter(val => val !== '');
      const todayInputs = Array.from(document.querySelectorAll('.todayInput'));
      const todayArray = todayInputs.map(input => input.value.trim()).filter(val => val !== '');
      const issues = issuesInput.value.trim();
      const assistance = assistanceInput.value.trim();
      const progress = parseInt(progressInput.value.trim());
      const sendEmail = sendEmailCheckbox ? sendEmailCheckbox.checked : true;

      // 간단한 유효성 검사
      if (summary === '') {
        showAlert('오늘 요약을 입력해주세요.', '필수 항목');
        return;
      }

      if (yesterdayArray.length === 0) {
        showAlert('어제 진행한 일을 하나 이상 입력해주세요.', '필수 항목');
        return;
      }

      if (todayArray.length === 0) {
        showAlert('오늘 할 일을 하나 이상 입력해주세요.', '필수 항목');
        return;
      }

      try {
        console.log('보고서 제출 중...');

        // 보고서 API 제출
        const response = await apiRequest(`/reports/${currentActiveTeamId}`, 'POST', {
          summary,
          yesterday_work: yesterdayArray,
          today_work: todayArray,
          issues: [{
            text: issues || '이슈 없음',
            severity: 'normal',
            comments: []
          }],
          help_needed: assistance,
          progress: isNaN(progress) ? 0 : progress,
          individualTodo: todayArray.map(text => ({
            id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            text,
            completed: false,
            created_at: new Date().toISOString()
          })),
          send_email: sendEmail
        });

        if (response.success) {
          console.log('보고서 제출 성공');
          
          // 성공 시 팀 멤버들에게 알림 가상 로직 추가
          // 실제 구현에서는 서버에서 알림을 처리하고 클라이언트는 폴링으로 가져오지만,
          // 가상 구현에서는 로컬에 알림을 추가합니다.
          if (response.report && response.report.id) {
            const reporterName = currentUser.nickname || currentUser.name || '팀원';
            const dummyNotification = {
              id: `report_${response.report.id}_${Date.now()}`,
              title: `${reporterName}님이 새 보고서를 작성했습니다`,
              content: `${summary.substring(0, 50)}${summary.length > 50 ? '...' : ''}`,
              timestamp: new Date(),
              read: true, // 자신의 글이므로 읽음으로 표시
              teamId: currentActiveTeamId,
              reportId: response.report.id
            };
            
            // 자신의 알림에 추가 (데모 목적)
            addNotification(dummyNotification);
            
            // 실제 구현에서는 서버가 다른 사용자에게 알림을 전송합니다
          }
          
          // 팀 데이터 다시 로드
          loadTeamDetails(currentActiveTeamId, currentGroupNameDisplay.textContent.replace(' Blitz-Q', ''));
          closeModal(reportModal);

          const emailMsg = sendEmail ? ' 팀원들에게 이메일 알림이 발송되었습니다.' : '';
          showAlert(`보고서가 성공적으로 제출되었습니다.${emailMsg}`, '완료');
        }
      } catch (error) {
        console.error('보고서 제출 오류:', error);
        showAlert('보고서 제출 중 오류가 발생했습니다. 나중에 다시 시도해주세요.', '오류');
        // 모달은 닫지 않음 (사용자가 내용을 다시 시도할 수 있도록)
      }
    });
  }

  // ------------------- 그룹 추가/수정/삭제 -------------------
  // 그룹 선택
  if (groupList) {
    groupList.addEventListener('click', function (e) {
      const groupItem = e.target.closest('.group-item');
      if (groupItem && !e.target.closest('.group-item-actions')) {
        const activeGroup = document.querySelector('.group-item.active');
        if (activeGroup) {
          activeGroup.classList.remove('active');
        }
        groupItem.classList.add('active');
        const teamId = groupItem.dataset.teamId;
        const teamName = groupItem.dataset.groupName;
        loadTeamDetails(teamId, teamName);
      }
    });
  }

  // 그룹 추가 모달 열기
  if (addGroupBtn) {
    addGroupBtn.addEventListener('click', function () {
      // 로그인 체크
      if (!token || !currentUser) {
        showAlert('팀을 생성하려면 로그인이 필요합니다.', '로그인 필요');
        return;
      }

      modalTitle.textContent = '그룹 추가';
      groupNameInput.value = '';
      currentEditingGroup = null;
      groupModal.style.display = 'flex';
    });
  }

  // 그룹 수정 버튼 클릭
  if (groupList) {
    groupList.addEventListener('click', function (e) {
      const editBtn = e.target.closest('.edit-group');
      if (editBtn) {
        e.stopPropagation(); // 그룹 선택 이벤트 막기

        // 로그인 체크
        if (!token || !currentUser) {
          showAlert('팀을 수정하려면 로그인이 필요합니다.', '로그인 필요');
          return;
        }

        const groupItem = editBtn.closest('.group-item');
        const teamId = groupItem.dataset.teamId;
        const teamName = groupItem.dataset.groupName;

        modalTitle.textContent = '그룹 수정';
        groupNameInput.value = teamName;
        currentEditingGroup = {
          id: teamId,
          name: teamName
        };
        groupModal.style.display = 'flex';
      }
    });
  }

  // 커스텀 확인 모달 함수
  function showConfirm(message, callback, title = '확인') {
    if (confirmModal && confirmMessage && confirmTitle) {
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;

      // 콜백 함수 저장
      confirmCallback = callback;

      // 모달 표시
      confirmModal.style.display = 'flex';
    } else {
      // 폴백: 모달 요소가 없는 경우 기본 confirm 사용
      if (confirm(message)) {
        callback();
      }
    }
  }

  // 확인 버튼 이벤트 리스너
  if (confirmOkBtn) {
    confirmOkBtn.addEventListener('click', function () {
      closeModal(confirmModal);
      if (confirmCallback && typeof confirmCallback === 'function') {
        confirmCallback();
      }
    });
  }

  // 취소 버튼 이벤트 리스너
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', function () {
      closeModal(confirmModal);
    });
  }

  // 닫기 버튼 이벤트 리스너
  if (confirmCloseBtn) {
    confirmCloseBtn.addEventListener('click', function () {
      closeModal(confirmModal);
    });
  }

  // 모달 외부 클릭 이벤트 리스너는 이미 다른 모달에도 적용되어 있으므로 생략

  // 기존 팀 삭제 코드 수정 (그룹 삭제 버튼 클릭 부분)
  if (groupList) {
    groupList.addEventListener('click', function (e) {
      const deleteBtn = e.target.closest('.delete-group');
      if (deleteBtn) {
        e.stopPropagation(); // 그룹 선택 이벤트 막기

        // 로그인 체크
        if (!token || !currentUser) {
          showAlert('팀을 삭제하려면 로그인이 필요합니다.', '로그인 필요');
          return;
        }

        const groupItem = deleteBtn.closest('.group-item');
        const teamId = groupItem.dataset.teamId;
        const teamName = groupItem.dataset.groupName;

        // 기존 confirm 대신 커스텀 확인 모달 사용
        showConfirm(
          `정말로 "${teamName}" 팀을 삭제하시겠습니까?`,
          function () {
            deleteTeam(teamId, groupItem);
          },
          '팀 삭제 확인'
        );
      }
    });
  }

  // 팀 삭제 함수
  async function deleteTeam(teamId, groupItem) {
    try {
      console.log('팀 삭제 요청:', teamId);

      const response = await apiRequest(`/teams/${teamId}`, 'DELETE');

      if (response.success) {
        console.log('팀 삭제 성공');

        // UI에서 팀 항목 제거
        groupItem.remove();

        // 첫 번째 남은 팀 선택 또는 UI 초기화
        const firstGroup = document.querySelector('.group-item');
        if (firstGroup) {
          firstGroup.classList.add('active');
          const newTeamId = firstGroup.dataset.teamId;
          const newTeamName = firstGroup.dataset.groupName;
          loadTeamDetails(newTeamId, newTeamName);
        } else {
          // 남은 팀이 없는 경우
          updateTeamView(null);
        }

        showAlert('팀이 삭제되었습니다.', '완료');
      }
    } catch (error) {
      console.error('팀 삭제 오류:', error);
      showAlert('팀 삭제 중 오류가 발생했습니다. 나중에 다시 시도해주세요.', '오류');
    }
  }

  // 그룹 모달 확인 버튼
  if (confirmGroupModal) {
    confirmGroupModal.addEventListener('click', async function () {
      const newGroupName = groupNameInput.value.trim();

      if (newGroupName === '') {
        showAlert('그룹 이름을 입력해주세요.', '필수 항목');
        return;
      }

      try {
        if (currentEditingGroup) {
          console.log('팀 수정 중:', currentEditingGroup.id, newGroupName);

          // 그룹 수정
          const response = await apiRequest(`/teams/${currentEditingGroup.id}`, 'PUT', {
            name: newGroupName,
            description: ''
          });

          if (response.success) {
            console.log('팀 수정 성공');

            // UI 업데이트
            const groupItem = document.querySelector(`.group-item[data-team-id="${currentEditingGroup.id}"]`);
            if (groupItem) {
              groupItem.dataset.groupName = newGroupName;
              groupItem.querySelector('.group-name').textContent = newGroupName;

              // 현재 선택된 그룹인 경우 이름 업데이트
              if (groupItem.classList.contains('active')) {
                currentGroupNameDisplay.textContent = `${newGroupName} Blitz-Q`;
              }
            }

            showAlert('팀 정보가 수정되었습니다.', '완료');
          }
        } else {
          console.log('새 팀 생성 중:', newGroupName);

          // 새 그룹 추가
          const response = await apiRequest('/teams', 'POST', {
            name: newGroupName,
            description: ''
          });

          if (response.success && response.team) {
            console.log('팀 생성 성공:', response.team);

            // 팀 목록 다시 로드
            loadTeams();

            showAlert('새 팀이 생성되었습니다.', '완료');
          }
        }

        closeModal(groupModal);
      } catch (error) {
        console.error('팀 생성/수정 오류:', error);
        showAlert('팀 생성/수정 중 오류가 발생했습니다. 나중에 다시 시도해주세요.', '오류');
      }
    });
  }

  // ------------------- 초대 모달 (코드 6자리) -------------------
  if (inviteBtn) {
    inviteBtn.addEventListener('click', async function () {
      // 로그인 체크
      if (!token || !currentUser) {
        showAlert('팀원을 초대하려면 로그인이 필요합니다.', '로그인 필요');
        return;
      }

      // 팀 선택 확인
      if (!currentActiveTeamId) {
        showAlert('팀을 먼저 선택하세요.', '알림');
        return;
      }

      try {
        console.log('초대 코드 생성 요청 중...');

        // 초대 코드 생성 API 호출
        const response = await apiRequest(`/teams/${currentActiveTeamId}/invite`, 'POST', {
          expiresIn: 7,  // 7일 유효
          maxUses: 5     // 최대 5번 사용 가능
        });

        if (response.success && response.inviteCode) {
          console.log('초대 코드 생성 성공:', response.inviteCode);
          inviteLinkInput.value = response.inviteCode;
          inviteModal.style.display = 'flex';
        }
      } catch (error) {
        console.error('초대 코드 생성 오류:', error);

        // 임시 코드 생성 (API 실패 시)
        const tempCode = Math.floor(100000 + Math.random() * 900000);
        inviteLinkInput.value = tempCode.toString();
        inviteModal.style.display = 'flex';

        console.log('임시 초대 코드 생성:', tempCode);

        showAlert('서버 연결 문제로 임시 코드가 생성되었습니다. 이 코드는 실제로 동작하지 않을 수 있습니다.', '주의');
      }
    });
  }

  // 초대 코드 복사
  if (copyInviteBtn) {
    copyInviteBtn.addEventListener('click', function () {
      if (inviteLinkInput) {
        inviteLinkInput.select();
        document.execCommand('copy');
        // 복사 성공 표시
        const originalText = this.textContent;
        this.textContent = '복사 완료!';
        setTimeout(() => {
          this.textContent = originalText;
        }, 2000);

        showAlert('초대 코드가 클립보드에 복사되었습니다.', '알림');
      }
    });
  }

  // ------------------- 코드 입력 -------------------
  if (codeInputBtn) {
    codeInputBtn.addEventListener('click', function () {
      // 로그인 체크
      if (!token || !currentUser) {
        showAlert('팀에 참가하려면 로그인이 필요합니다.', '로그인 필요');
        return;
      }

      openModal(codeInputModal);
      if (codeInputField) {
        codeInputField.value = '';
        codeInputField.focus();
      }
    });
  }

  if (confirmCodeInputModal) {
    confirmCodeInputModal.addEventListener('click', async function () {
      if (!codeInputField) return;

      const code = codeInputField.value.trim();

      if (code === '') {
        showAlert('초대 코드를 입력해주세요.', '필수 항목');
        return;
      }

      try {
        console.log('팀 참가 요청 중...', code);

        // 초대 코드로 팀 참가 API 호출
        const response = await apiRequest('/teams/join', 'POST', {
          inviteCode: code
        });

        if (response.success) {
          console.log('팀 참가 성공:', response.team);
          showAlert('팀에 성공적으로 참가했습니다.', '완료');
          closeModal(codeInputModal);

          // 팀 목록 다시 로드
          loadTeams();
        }
      } catch (error) {
        console.error('팀 참가 오류:', error);
        showAlert(error.message || '팀 참가 중 오류가 발생했습니다. 코드를 확인하고 다시 시도해주세요.', '오류');
      }
    });
  }

  // 코드 입력 필드 제한 (타이핑 할 때마다 검사)
  if (codeInputField) {
    codeInputField.addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9A-Z]/g, '').substring(0, 12);
    });
  }

  // ------------------- 코멘트 모달 -------------------
  // 수정된 댓글 모달 열기 함수
  async function openCommentModal(memberId, issueIndex, reportDate) {
    if (!commentModal || !commentListContainer || !newCommentInput || !currentActiveTeamId) return;

    // 댓글 목록 초기화 및 로딩 표시
    commentListContainer.innerHTML = `
    <div class="loading-indicator">
      <div class="loader"></div>
      <p class="loading-text">댓글을 불러오는 중...</p>
    </div>
  `;

    // 모달 표시
    commentModal.style.display = 'flex';

    try {
      console.log(`코멘트 불러오기: 팀 ${currentActiveTeamId}, 멤버 ${memberId}, 이슈 ${issueIndex}, 날짜 ${reportDate || '지정되지 않음'}`);

      // URL 구성 (날짜 파라미터 포함)
      let url = `/reports/comments/${currentActiveTeamId}/${memberId}/${issueIndex}`;
      if (reportDate) {
        url += `?date=${reportDate}`;
      }

      // API 요청
      const response = await apiRequest(url, 'GET');

      if (response.success && response.issue) {
        console.log('이슈 데이터 받음:', response.issue);
        const issue = response.issue;

        // 응답에서 보고서 날짜 업데이트 (있는 경우)
        if (response.reportDate) {
          selectedReportDate = response.reportDate;
        }

        document.getElementById('commentModalTitle').textContent = `"${issue.text || '이슈'}"에 대한 코멘트`;

        // 코멘트 목록 표시
        commentListContainer.innerHTML = '';

        if (issue.comments && issue.comments.length > 0) {
          console.log('코멘트 목록:', issue.comments);

          // 코멘트 시간순 정렬 (최신순)
          issue.comments.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
          );

          issue.comments.forEach(comment => {
            const commentItem = document.createElement('div');
            commentItem.classList.add('comment-item');
            commentItem.innerHTML = `
            <div class="comment-header">
              <span class="comment-author">${comment.author_name}</span>
              <span class="comment-date">${new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
          `;
            commentListContainer.appendChild(commentItem);
          });
        } else {
          console.log('코멘트 없음');

          commentListContainer.innerHTML = `
          <p style="text-align: center; color: var(--gray-color); padding: 15px;">
            아직 코멘트가 없습니다. 첫 번째 코멘트를 작성해보세요.
          </p>
        `;
        }

        newCommentInput.value = '';
      }
    } catch (error) {
      console.error('코멘트 로드 오류:', error);

      // 오류 메시지 표시
      commentListContainer.innerHTML = `
      <div class="error-message">
        <p>코멘트를 불러오는 중 오류가 발생했습니다.</p>
        <p>${error.message || '나중에 다시 시도해주세요.'}</p>
      </div>
    `;
    }
  }

  // 코멘트 추가
  // 수정된 코멘트 제출 이벤트 리스너
  if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', async function () {
      if (!newCommentInput || !commentModal || !currentActiveTeamId || !selectedReportMemberId || selectedIssueIndex === null) return;

      // 로그인 확인
      if (!token || !currentUser) {
        showAlert('코멘트를 작성하려면 로그인이 필요합니다.', '로그인 필요');
        return;
      }

      const commentText = newCommentInput.value.trim();
      if (commentText === '') {
        showAlert('코멘트 내용을 입력해주세요.', '필수 항목');
        return;
      }

      // 전송 중 표시
      const originalBtnText = this.textContent;
      this.textContent = '전송 중...';
      this.disabled = true;

      try {
        console.log('코멘트 추가 요청 중...', selectedReportDate);

        // 코멘트 추가 API 호출 (날짜 포함)
        const response = await apiRequest(
          `/reports/comments/${currentActiveTeamId}/${selectedReportMemberId}/${selectedIssueIndex}`,
          'POST',
          {
            text: commentText,
            reportDate: selectedReportDate
          }
        );

        if (response.success) {
          console.log('코멘트 추가 성공:', response.comment);

          // 서버에서 반환된 보고서 날짜 저장 (있는 경우)
          if (response.reportDate) {
            selectedReportDate = response.reportDate;
          }

          // 코멘트 목록 새로고침
          openCommentModal(selectedReportMemberId, selectedIssueIndex, selectedReportDate);
          showAlert('코멘트가 성공적으로 추가되었습니다.', '완료');
        }
      } catch (error) {
        console.error('코멘트 추가 오류:', error);
        showAlert('코멘트 추가 중 오류가 발생했습니다. 나중에 다시 시도해주세요.', '오류');
      } finally {
        // 버튼 상태 복원
        this.textContent = originalBtnText;
        this.disabled = false;
      }
    });
  }

  // ------------------- 로그인 관련 -------------------
  if (loginBtn) {
    loginBtn.addEventListener('click', function () {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login.html';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      handleLogout();
    });
  }

  // ------------------- 초기 로드 -------------------
  // 인증 상태 확인하여 UI 업데이트
  checkAuthStatus();
});
