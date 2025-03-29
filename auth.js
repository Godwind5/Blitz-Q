// auth.js - 인증 관련 서버 코드 (SQLite3 연동)
const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// 환경 변수 로드
require('dotenv').config();

// Google OAuth 설정
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

// JWT 토큰 검증 미들웨어 - 여기서 먼저 정의
function authenticateToken(userModel) {
    return function(req, res, next) {
        // 쿠키 또는 헤더에서 토큰 가져오기
        const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: '인증 토큰이 필요합니다.' });
        }
        
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
            }
            
            try {
                // 사용자 정보 조회
                const user = await userModel.getUserById(decoded.id);
                if (!user) {
                    return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
                }
                
                req.user = user;
                next();
            } catch (error) {
                console.error('인증 처리 중 오류:', error);
                return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
            }
        });
    };
}

// 인증 확인 및 리다이렉트 미들웨어 - 여기서 먼저 정의
function checkAuth(userModel) {
    return function(req, res, next) {
        // 쿠키 또는 헤더에서 토큰 가져오기
        const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            // API 요청인 경우 JSON 응답, 일반 페이지 요청인 경우 리다이렉트
            if (req.xhr || req.path.startsWith('/api/')) {
                return res.status(401).json({ message: '로그인이 필요합니다.' });
            } else {
                return res.redirect('/login.html');
            }
        }
        
        // 토큰 검증
        jwt.verify(token, JWT_SECRET, async (err, decoded) => {
            if (err) {
                if (req.xhr || req.path.startsWith('/api/')) {
                    return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
                } else {
                    return res.redirect('/login.html');
                }
            }
            
            try {
                // 사용자 정보 조회
                const user = await userModel.getUserById(decoded.id);
                if (!user) {
                    if (req.xhr || req.path.startsWith('/api/')) {
                        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
                    } else {
                        return res.redirect('/login.html');
                    }
                }
                
                req.user = user;
                next();
            } catch (error) {
                console.error('인증 처리 중 오류:', error);
                if (req.xhr || req.path.startsWith('/api/')) {
                    return res.status(500).json({ message: '서버 오류가 발생했습니다.' });
                } else {
                    return res.redirect('/login.html');
                }
            }
        });
    };
}

// Passport 설정과 인증 라우터 생성
module.exports = function(app, userModel) {
    // 미들웨어 함수 인스턴스 생성
    const authTokenMiddleware = authenticateToken(userModel);
    const checkAuthMiddleware = checkAuth(userModel);
    
    // Passport 초기화
    app.use(passport.initialize());
    app.use(passport.session());
    
    // 세션 직렬화
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    
    // 세션 역직렬화
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.getUserById(id);
            done(null, user || null);
        } catch (error) {
            done(error, null);
        }
    });
    
    // 로컬 전략 설정
    passport.use(new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                const user = await userModel.getUserByEmail(email);
                
                if (!user) {
                    return done(null, false, { message: '등록되지 않은 이메일입니다.' });
                }
                
                // 비밀번호 확인
                const isMatch = await userModel.verifyPassword(password, user.password);
                
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
                }
            } catch (error) {
                return done(error);
            }
        }
    ));
    
    // Google 전략 설정
    passport.use(new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: '/api/auth/google/callback',
            scope: ['profile', 'email']
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // 이메일로 사용자 찾기
                const userEmail = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
                
                if (!userEmail) {
                    return done(null, false, { message: '이메일 정보를 가져올 수 없습니다.' });
                }
                
                let user = await userModel.getUserByEmail(userEmail);
                
                if (user) {
                    // 기존 사용자 업데이트
                    await userModel.updateLastLogin(user.id);
                    await userModel.updateUserProfile(user.id, {
                        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                    });
                    
                    // 최신 사용자 정보 가져오기
                    user = await userModel.getUserById(user.id);
                    return done(null, user);
                } else {
                    // 새 사용자 생성
                    const newUser = await userModel.createUser({
                        email: userEmail,
                        name: profile.displayName,
                        nickname: profile.displayName,
                        avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null
                    });
                    
                    return done(null, newUser);
                }
            } catch (error) {
                return done(error);
            }
        }
    ));
    
    // 인증 라우터 생성
    const authRouter = express.Router();
    
    // 로그인 엔드포인트
    authRouter.post('/login', (req, res, next) => {
        passport.authenticate('local', { session: false }, async (err, user, info) => {
            if (err) {
                return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
            }
            
            if (!user) {
                return res.status(401).json({ success: false, message: info.message });
            }
            
            try {
                // 마지막 로그인 시간 업데이트
                await userModel.updateLastLogin(user.id);
                
                // JWT 토큰 생성
                const token = jwt.sign(
                    { id: user.id, email: user.email, role: user.role },
                    JWT_SECRET,
                    { expiresIn: req.body.rememberMe ? '7d' : '24h' }
                );
                
                // 비밀번호 필드 제거
                const userResponse = { ...user };
                delete userResponse.password;
                
                // 쿠키에 토큰 설정
                res.cookie('auth_token', token, {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: req.body.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
                });
                
                return res.json({
                    success: true,
                    message: '로그인 성공',
                    user: userResponse,
                    token
                });
            } catch (error) {
                console.error('로그인 처리 중 오류:', error);
                return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
            }
        })(req, res, next);
    });
    
    // 회원가입 엔드포인트
    authRouter.post('/register', async (req, res) => {
        try {
            const { name, email, password, nickname } = req.body;
            
            // 이메일 중복 확인
            const existingUser = await userModel.getUserByEmail(email);
            if (existingUser) {
                return res.status(400).json({ success: false, message: '이미 사용 중인 이메일입니다.' });
            }
            
            // 새 사용자 생성
            const newUser = await userModel.createUser({
                email,
                password,
                name,
                nickname: nickname || name
            });
            
            // 응답에서 비밀번호 제거
            const userResponse = { ...newUser };
            delete userResponse.password;
            
            return res.status(201).json({
                success: true,
                message: '회원가입 성공',
                user: userResponse
            });
        } catch (error) {
            console.error('회원가입 오류:', error);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    });
    
    // 구글 로그인 시작
    authRouter.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    // 구글 로그인 콜백
    authRouter.get('/google/callback', 
        passport.authenticate('google', { session: false, failureRedirect: '/login.html' }),
        (req, res) => {
            try {
                // JWT 토큰 생성
                const token = jwt.sign(
                    { id: req.user.id, email: req.user.email, role: req.user.role },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                // 쿠키에 토큰 설정
                res.cookie('auth_token', token, {
                    httpOnly: false,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000
                });
                
                // 로그인 후 리디렉션 - index.html 페이지로 이동
                res.redirect('/index.html');
            } catch (error) {
                console.error('구글 로그인 콜백 처리 오류:', error);
                res.redirect('/login.html?error=server');
            }
        }
    );
    
    // 로그아웃 엔드포인트
    authRouter.get('/logout', (req, res) => {
        res.clearCookie('auth_token');
        res.json({ success: true, message: '로그아웃 성공' });
    });
    
    // 현재 사용자 정보 엔드포인트 - 수정된 미들웨어 사용
    authRouter.get('/me', authTokenMiddleware, (req, res) => {
        try {
            // 비밀번호 제거
            const userResponse = { ...req.user };
            delete userResponse.password;
            
            res.json({ success: true, user: userResponse });
        } catch (error) {
            console.error('사용자 정보 조회 오류:', error);
            res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    });
    
    // 프로필 업데이트 엔드포인트 - 수정된 미들웨어 사용
    authRouter.put('/profile', authTokenMiddleware, async (req, res) => {
        try {
            const { name, nickname, avatar } = req.body;
            
            const result = await userModel.updateUserProfile(req.user.id, {
                name,
                nickname,
                avatar
            });
            
            if (result.changes > 0) {
                // 업데이트된 사용자 정보 가져오기
                const updatedUser = await userModel.getUserById(req.user.id);
                const userResponse = { ...updatedUser };
                delete userResponse.password;
                
                return res.json({
                    success: true,
                    message: '프로필이 업데이트되었습니다.',
                    user: userResponse
                });
            } else {
                return res.json({
                    success: true,
                    message: '변경된 내용이 없습니다.',
                    user: req.user
                });
            }
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    });
    
    // 비밀번호 변경 엔드포인트 - 수정된 미들웨어 사용
    authRouter.put('/password', authTokenMiddleware, async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            
            // 현재 비밀번호 확인
            const isMatch = await userModel.verifyPassword(currentPassword, req.user.password);
            
            if (!isMatch) {
                return res.status(401).json({ success: false, message: '현재 비밀번호가 일치하지 않습니다.' });
            }
            
            // 새 비밀번호로 업데이트
            await userModel.updatePassword(req.user.id, newPassword);
            
            return res.json({
                success: true,
                message: '비밀번호가 변경되었습니다.'
            });
        } catch (error) {
            console.error('비밀번호 변경 오류:', error);
            return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
        }
    });
    
    // 미들웨어 함수를 라우터에 첨부
    authRouter.authenticateToken = authTokenMiddleware;
    authRouter.checkAuth = checkAuthMiddleware;
    
    // 라우터 반환
    return authRouter;
};
