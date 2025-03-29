// 로그인 페이지 JavaScript 코드
document.addEventListener('DOMContentLoaded', function() {
    // 패스워드 표시/숨김 토글
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // 아이콘 변경
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    // 회원가입 모달 표시
    const showSignupBtn = document.getElementById('showSignup');
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
            signupModal.show();
        });
    }
    
    // 로그인 폼 제출 처리
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // 로그인 폼 제출 처리 - 데이터베이스 오류 처리 개선
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember-me').checked;
            
            // 로딩 상태 표시
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
            
            // API로 로그인 요청
            fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, rememberMe })
            })
            .then(response => {
                // 상태 코드에 따른 상세 처리
                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                } else if (response.status === 429) {
                    throw new Error('Too many login attempts. Please try again later');
                } else if (!response.ok) {
                    throw new Error('Login failed');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // 로그인 성공 처리
                    showNotification('success', 'Login successful! Redirecting...');
                    
                    // 토큰이 있다면 저장
                    if (data.token) {
                        localStorage.setItem('authToken', data.token);
                    }
                    
                    // 사용자 정보 저장
                    if (data.user) {
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                    
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1000);
                } else {
                    // 오류 메시지 표시
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    showNotification('error', data.message || 'Login failed. Please check your email and password.');
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                showNotification('error', error.message || 'Server error. Please try again later.');
            });
        });
    }
    
    // 회원가입 폼 제출 처리
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
            
            // 비밀번호 확인
            if (password !== passwordConfirm) {
                showNotification('error', '비밀번호가 일치하지 않습니다.');
                return;
            }
            
            // 로딩 상태 표시
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 가입 중...';
            
            // API로 회원가입 요청
            fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 회원가입 성공
                    showNotification('success', '회원가입 성공! 로그인하세요.');
                    
                    // 모달 닫기
                    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                    signupModal.hide();
                    
                    // 로그인 폼에 이메일 입력
                    document.getElementById('email').value = email;
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                } else {
                    // 오류 메시지 표시
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    showNotification('error', data.message || '회원가입 실패.');
                }
            })
            .catch(error => {
                console.error('회원가입 오류:', error);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                showNotification('error', '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.');
            });
        });
    }
    
    // Google 로그인 버튼 설정
    const googleLoginBtn = document.getElementById('googleLogin');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            // Google OAuth 리디렉션
            window.location.href = '/api/auth/google';
        });
    }
});

// 알림 표시 함수
function showNotification(type, message) {
    // 기존 알림 제거
    const existingAlerts = document.querySelectorAll('.alert-floating');
    existingAlerts.forEach(alert => alert.remove());
    
    // 새 알림 생성
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-floating alert-${type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.zIndex = '9999';
    alertDiv.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // 3초 후 자동으로 닫기
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            alertDiv.remove();
        }, 150);
    }, 3000);
}
