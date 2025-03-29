// server.js - Integrated Express server with all modules
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const reportAnalysis = require('./reportAnalysis');

// 환경 변수 로드
require('dotenv').config();

// 데이터베이스 모듈을 가져옵니다 (별도의 파일로 유지됨)
const { run, get, all } = require('./database');

// Express 앱 초기화
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// express-session 미들웨어 추가
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  }
}));

// ================ 모델 정의 - User ================
const userModel = {
  // 사용자 생성
  async createUser({ email, password, name, nickname = null, avatar = null }) {
    try {
      const userId = 'user_' + uuidv4();
      let hashedPassword = null;
      
      if (password) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      }
      
      const result = await run(
        `INSERT INTO users (id, email, password, name, nickname, avatar, last_login) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, email, hashedPassword, name, nickname || name, avatar]
      );
      
      if (result.changes > 0) {
        return await this.getUserById(userId);
      }
      return null;
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      throw error;
    }
  },

  // 이메일로 사용자 찾기
  async getUserByEmail(email) {
    try {
      return await get('SELECT * FROM users WHERE email = ?', [email]);
    } catch (error) {
      console.error('이메일로 사용자 찾기 오류:', error);
      throw error;
    }
  },

  // ID로 사용자 찾기
  async getUserById(id) {
    try {
      return await get('SELECT * FROM users WHERE id = ?', [id]);
    } catch (error) {
      console.error('ID로 사용자 찾기 오류:', error);
      throw error;
    }
  },

  // 사용자 로그인 시간 업데이트
  async updateLastLogin(userId) {
    try {
      return await run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('로그인 시간 업데이트 오류:', error);
      throw error;
    }
  },

  // 사용자 프로필 업데이트
  async updateUserProfile(userId, { name, nickname, avatar }) {
    try {
      const updates = [];
      const params = [];
      
      if (name) {
        updates.push('name = ?');
        params.push(name);
      }
      
      if (nickname) {
        updates.push('nickname = ?');
        params.push(nickname);
      }
      
      if (avatar) {
        updates.push('avatar = ?');
        params.push(avatar);
      }
      
      if (updates.length === 0) {
        return { changes: 0 };
      }
      
      params.push(userId);
      
      return await run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      throw error;
    }
  },

  // 사용자 비밀번호 변경
  async updatePassword(userId, newPassword) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      return await run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, userId]
      );
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      throw error;
    }
  },

  // 비밀번호 확인
  async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);
      throw error;
    }
  },

  // 사용자의 팀 목록 가져오기
  async getUserTeams(userId) {
    try {
      return await all(
        `SELECT t.* FROM teams t
         JOIN team_members tm ON t.id = tm.team_id
         WHERE tm.user_id = ?`,
        [userId]
      );
    } catch (error) {
      console.error('사용자 팀 목록 가져오기 오류:', error);
      throw error;
    }
  }
};

// ================ 모델 정의 - Team ================
const teamModel = {
  // 팀 생성
  async createTeam({ name, description, createdBy }) {
    try {
      const teamId = 'team_' + uuidv4();
      
      // 팀 생성
      await run(
        `INSERT INTO teams (id, name, description, created_by)
         VALUES (?, ?, ?, ?)`,
        [teamId, name, description, createdBy]
      );
      
      // 팀 생성자를 관리자로 추가
      await run(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES (?, ?, 'admin')`,
        [teamId, createdBy]
      );
      
      return await this.getTeamById(teamId);
    } catch (error) {
      console.error('팀 생성 오류:', error);
      throw error;
    }
  },

  // ID로 팀 정보 가져오기
  async getTeamById(teamId) {
    try {
      return await get('SELECT * FROM teams WHERE id = ?', [teamId]);
    } catch (error) {
      console.error('팀 정보 가져오기 오류:', error);
      throw error;
    }
  },

  // 팀 정보 업데이트
  async updateTeam(teamId, { name, description }) {
    try {
      const updates = [];
      const params = [];
      
      if (name) {
        updates.push('name = ?');
        params.push(name);
      }
      
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      
      if (updates.length === 0) {
        return { changes: 0 };
      }
      
      params.push(teamId);
      
      return await run(
        `UPDATE teams SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    } catch (error) {
      console.error('팀 업데이트 오류:', error);
      throw error;
    }
  },

  // 팀 멤버 목록 가져오기
  async getTeamMembers(teamId) {
    try {
      return await all(
        `SELECT u.id, u.name, u.nickname, u.avatar, u.email, tm.role, tm.joined_at
         FROM users u
         JOIN team_members tm ON u.id = tm.user_id
         WHERE tm.team_id = ?`,
        [teamId]
      );
    } catch (error) {
      console.error('팀 멤버 목록 가져오기 오류:', error);
      throw error;
    }
  },

  // 멤버 추가
  async addTeamMember(teamId, userId, role = 'member') {
    try {
      return await run(
        `INSERT INTO team_members (team_id, user_id, role)
         VALUES (?, ?, ?)`,
        [teamId, userId, role]
      );
    } catch (error) {
      console.error('팀 멤버 추가 오류:', error);
      throw error;
    }
  },

  // 멤버 역할 변경
  async updateMemberRole(teamId, userId, newRole) {
    try {
      return await run(
        `UPDATE team_members SET role = ?
         WHERE team_id = ? AND user_id = ?`,
        [newRole, teamId, userId]
      );
    } catch (error) {
      console.error('멤버 역할 변경 오류:', error);
      throw error;
    }
  },

  // 멤버 제거
  async removeTeamMember(teamId, userId) {
    try {
      return await run(
        `DELETE FROM team_members
         WHERE team_id = ? AND user_id = ?`,
        [teamId, userId]
      );
    } catch (error) {
      console.error('팀 멤버 제거 오류:', error);
      throw error;
    }
  },

  // 초대 코드 생성
  async createInviteCode(teamId, createdBy, { expiresIn = 7, maxUses = 0 } = {}) {
    try {
      const inviteId = 'invite_' + uuidv4();
      const inviteCode = crypto.randomBytes(6).toString('hex').toUpperCase();
      
      let expiresAt = null;
      if (expiresIn > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresIn);
      }
      
      await run(
        `INSERT INTO team_invites (id, team_id, invite_code, created_by, expires_at, max_uses)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [inviteId, teamId, inviteCode, createdBy, expiresAt?.toISOString(), maxUses]
      );
      
      return await this.getInviteByCode(inviteCode);
    } catch (error) {
      console.error('초대 코드 생성 오류:', error);
      throw error;
    }
  },

  // 초대 코드로 초대 정보 가져오기
  async getInviteByCode(inviteCode) {
    try {
      return await get(
        `SELECT * FROM team_invites WHERE invite_code = ?`,
        [inviteCode]
      );
    } catch (error) {
      console.error('초대 코드 조회 오류:', error);
      throw error;
    }
  },

  // 초대 코드로 팀 가입
  async joinTeamByInviteCode(inviteCode, userId) {
    try {
      // 초대 코드 유효성 확인
      const invite = await this.getInviteByCode(inviteCode);
      
      if (!invite) {
        throw new Error('유효하지 않은 초대 코드입니다.');
      }
      
      const now = new Date();
      
      // 만료 여부 확인
      if (invite.expires_at && new Date(invite.expires_at) < now) {
        throw new Error('만료된 초대 코드입니다.');
      }
      
      // 사용 횟수 확인
      if (invite.max_uses > 0 && invite.uses >= invite.max_uses) {
        throw new Error('최대 사용 횟수를 초과한 초대 코드입니다.');
      }
      
      // 이미 팀에 속해 있는지 확인
      const isAlreadyMember = await get(
        `SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?`,
        [invite.team_id, userId]
      );
      
      if (isAlreadyMember) {
        throw new Error('이미 팀에 가입되어 있습니다.');
      }
      
      // 팀에 멤버 추가
      await this.addTeamMember(invite.team_id, userId);
      
      // 초대 코드 사용 횟수 증가
      await run(
        `UPDATE team_invites SET uses = uses + 1 WHERE id = ?`,
        [invite.id]
      );
      
      return await this.getTeamById(invite.team_id);
    } catch (error) {
      console.error('팀 가입 오류:', error);
      throw error;
    }
  },

  // 팀 삭제
  async deleteTeam(teamId) {
    try {
      return await run(
        'DELETE FROM teams WHERE id = ?',
        [teamId]
      );
    } catch (error) {
      console.error('팀 삭제 오류:', error);
      throw error;
    }
  },

  // 모든 팀 멤버 제거
  async removeAllTeamMembers(teamId) {
    try {
      return await run(
        'DELETE FROM team_members WHERE team_id = ?',
        [teamId]
      );
    } catch (error) {
      console.error('팀 멤버 전체 제거 오류:', error);
      throw error;
    }
  },

  // 팀 초대 코드 만료 처리
  async expireInviteCode(inviteCode) {
    try {
      return await run(
        'UPDATE team_invites SET expires_at = CURRENT_TIMESTAMP WHERE invite_code = ?',
        [inviteCode]
      );
    } catch (error) {
      console.error('초대 코드 만료 처리 오류:', error);
      throw error;
    }
  },

  // 팀 초대 코드 삭제
  async deleteInviteCode(inviteCode) {
    try {
      return await run(
        'DELETE FROM team_invites WHERE invite_code = ?',
        [inviteCode]
      );
    } catch (error) {
      console.error('초대 코드 삭제 오류:', error);
      throw error;
    }
  }
};

// ================ 모델 정의 - DailyReport ================
// 보고서 모델 - 완성 코드 
const reportModel = {
  // 일일 보고서 생성 또는 업데이트
  async createOrUpdateReport(userId, teamId, date, {
    yesterdayWork, todayWork, issues, helpNeeded, progress, individualTodo, summary
  }) {
    try {
      // 해당 날짜에 이미 보고서가 있는지 확인
      const existingReport = await get(
        `SELECT id, individualTodo FROM daily_reports 
         WHERE user_id = ? AND team_id = ? AND report_date = ?`,
        [userId, teamId, date]
      );
      
      // 기존 할 일 목록 처리
      let mergedTodos = [];
      if (existingReport && existingReport.individualTodo) {
        try {
          // 기존 할 일 목록 파싱
          const existingTodos = JSON.parse(existingReport.individualTodo);
          
          if (individualTodo && Array.isArray(individualTodo)) {
            // 새 할 일 ID 목록 (중복 체크용)
            const newTodoIds = new Set(individualTodo.map(todo => 
              todo.id || `${todo.text}_${Date.now()}`
            ));
            
            // 기존 할 일 중 새 할 일과 중복되지 않는 것만 유지
            const existingNonDuplicates = existingTodos.filter(todo => {
              const todoId = todo.id || `${todo.text}_${Date.now()}`;
              return !newTodoIds.has(todoId);
            });
            
            // 기존 할 일 + 새 할 일 병합
            mergedTodos = [...existingNonDuplicates, ...individualTodo];
          } else {
            mergedTodos = existingTodos;
          }
        } catch (e) {
          console.error('기존 할 일 목록 파싱 오류:', e);
          mergedTodos = individualTodo || [];
        }
      } else {
        mergedTodos = individualTodo || [];
      }
      
      // 각 할 일 항목에 고유 ID 부여 (없는 경우)
      mergedTodos = mergedTodos.map(todo => {
        if (!todo.id) {
          return {
            ...todo,
            id: `todo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
          };
        }
        return todo;
      });
      
      let reportId;
      
      if (existingReport) {
        // 기존 보고서 업데이트
        const updates = [];
        const params = [];
        
        if (yesterdayWork !== undefined) {
          updates.push('yesterday_work = ?');
          params.push(JSON.stringify(yesterdayWork));
        }
        
        if (todayWork !== undefined) {
          updates.push('today_work = ?');
          params.push(JSON.stringify(todayWork));
        }
        
        if (issues !== undefined) {
          updates.push('issues = ?');
          params.push(JSON.stringify(issues));
        }
        
        if (helpNeeded !== undefined) {
          updates.push('help_needed = ?');
          params.push(helpNeeded);
        }
        
        if (progress !== undefined) {
          updates.push('progress = ?');
          params.push(progress);
        }
        
        // 병합된 할 일 목록 사용
        updates.push('individualTodo = ?');
        params.push(JSON.stringify(mergedTodos));
        
        if (summary !== undefined) {
          updates.push('summary = ?');
          params.push(summary);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        
        params.push(existingReport.id);
        
        await run(
          `UPDATE daily_reports 
           SET ${updates.join(', ')} 
           WHERE id = ?`,
          params
        );
        
        reportId = existingReport.id;
      } else {
        // 새 보고서 생성
        reportId = 'report_' + uuidv4();
        
        await run(
          `INSERT INTO daily_reports (
              id, user_id, team_id, report_date, yesterday_work, 
              today_work, issues, help_needed, progress, individualTodo, summary
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reportId, userId, teamId, date, 
            yesterdayWork ? JSON.stringify(yesterdayWork) : null,
            todayWork ? JSON.stringify(todayWork) : null, 
            issues ? JSON.stringify(issues) : null, 
            helpNeeded || null, progress || 0, 
            JSON.stringify(mergedTodos),
            summary || null
          ]
        );
      }
        
      // 보고서 가져오기
      const report = await this.getReportById(reportId);
      
      return report;
    } catch (error) {
      console.error('보고서 생성/업데이트 오류:', error);
      throw error;
    }
  },

  async getReportById(reportId) {
    try {
      const report = await get('SELECT * FROM daily_reports WHERE id = ?', [reportId]);
      if (report) {
        // JSON 문자열을 객체로 변환
        if (report.issues && typeof report.issues === 'string') {
          try {
            report.issues = JSON.parse(report.issues);
          } catch (e) {
            console.error('이슈 JSON 파싱 오류:', e);
            report.issues = [];
          }
        }
        
        if (report.individualTodo && typeof report.individualTodo === 'string') {
          try {
            report.individualTodo = JSON.parse(report.individualTodo);
          } catch (e) {
            console.error('개인 할 일 JSON 파싱 오류:', e);
            report.individualTodo = [];
          }
        }
        
        if (report.yesterday_work && typeof report.yesterday_work === 'string') {
          try {
            report.yesterday_work = JSON.parse(report.yesterday_work);
          } catch (e) {
            report.yesterday_work = report.yesterday_work;
          }
        }
        
        if (report.today_work && typeof report.today_work === 'string') {
          try {
            report.today_work = JSON.parse(report.today_work);
          } catch (e) {
            report.today_work = report.today_work;
          }
        }
      }
      return report;
    } catch (error) {
      console.error('보고서 조회 오류:', error);
      throw error;
    }
  },

  // 사용자의 특정 날짜 보고서 가져오기 - 수정된 부분
  async getUserReportByDate(userId, teamId, date) {
    try {
      // 날짜가 제공되지 않은 경우 가장 최근 보고서 가져오기
      if (!date) {
        console.log(`날짜가 없음, 최신 보고서 조회: 사용자 ${userId}, 팀 ${teamId}`);
        
        // 해당 사용자/팀의 가장 최근 보고서 가져오기
        const report = await get(
          `SELECT * FROM daily_reports 
           WHERE user_id = ? AND team_id = ? 
           ORDER BY report_date DESC LIMIT 1`,
          [userId, teamId]
        );
        
        console.log('최신 보고서 쿼리 결과:', report ? '찾음' : '없음');
        
        if (report) {
          // JSON 문자열을 객체로 변환
          if (report.issues && typeof report.issues === 'string') {
            try {
              report.issues = JSON.parse(report.issues);
            } catch (e) {
              console.error('이슈 JSON 파싱 오류:', e);
              report.issues = [];
            }
          }
          
          if (report.individualTodo && typeof report.individualTodo === 'string') {
            try {
              report.individualTodo = JSON.parse(report.individualTodo);
            } catch (e) {
              console.error('개인 할 일 JSON 파싱 오류:', e);
              report.individualTodo = [];
            }
          } else if (!report.individualTodo) {
            report.individualTodo = [];
          }
          
          if (report.yesterday_work && typeof report.yesterday_work === 'string') {
            try {
              report.yesterday_work = JSON.parse(report.yesterday_work);
            } catch (e) {
              report.yesterday_work = report.yesterday_work;
            }
          }
          
          if (report.today_work && typeof report.today_work === 'string') {
            try {
              report.today_work = JSON.parse(report.today_work);
            } catch (e) {
              report.today_work = report.today_work;
            }
          }
        }
        
        return report;
      }
      
      // 기존 코드: 특정 날짜로 보고서 조회
      console.log(`보고서 조회: 사용자 ${userId}, 팀 ${teamId}, 날짜 ${date}`);
      
      const report = await get(
        `SELECT * FROM daily_reports 
         WHERE user_id = ? AND team_id = ? AND report_date = ?`,
        [userId, teamId, date]
      );
      
      console.log('DB 쿼리 결과:', report ? '찾음' : '없음');
      
      if (report) {
        // JSON 문자열을 객체로 변환
        if (report.issues && typeof report.issues === 'string') {
          try {
            report.issues = JSON.parse(report.issues);
          } catch (e) {
            console.error('이슈 JSON 파싱 오류:', e);
            report.issues = [];
          }
        }
        
        if (report.individualTodo && typeof report.individualTodo === 'string') {
          try {
            report.individualTodo = JSON.parse(report.individualTodo);
          } catch (e) {
            console.error('개인 할 일 JSON 파싱 오류:', e);
            report.individualTodo = [];
          }
        } else if (!report.individualTodo) {
          report.individualTodo = [];
        }
        
        if (report.yesterday_work && typeof report.yesterday_work === 'string') {
          try {
            report.yesterday_work = JSON.parse(report.yesterday_work);
          } catch (e) {
            report.yesterday_work = report.yesterday_work;
          }
        }
        
        if (report.today_work && typeof report.today_work === 'string') {
          try {
            report.today_work = JSON.parse(report.today_work);
          } catch (e) {
            report.today_work = report.today_work;
          }
        }
      }
      
      return report;
    } catch (error) {
      console.error('날짜별 보고서 조회 오류:', error);
      throw error;
    }
  },

  // 사용자의 최근 보고서 가져오기
  async getUserRecentReports(userId, teamId, limit = 7) {
    try {
      const reports = await all(
        `SELECT * FROM daily_reports 
         WHERE user_id = ? AND team_id = ? 
         ORDER BY report_date DESC LIMIT ?`,
        [userId, teamId, limit]
      );
      
      // JSON 문자열을 객체로 변환
      reports.forEach(report => {
        if (report.issues && typeof report.issues === 'string') {
          report.issues = JSON.parse(report.issues);
        }
        if (report.individualTodo && typeof report.individualTodo === 'string') {
          report.individualTodo = JSON.parse(report.individualTodo);
        }
      });
      
      return reports;
    } catch (error) {
      console.error('최근 보고서 조회 오류:', error);
      throw error;
    }
  },

  // 보고서 삭제
  async deleteReport(reportId) {
    try {
      return await run('DELETE FROM daily_reports WHERE id = ?', [reportId]);
    } catch (error) {
      console.error('보고서 삭제 오류:', error);
      throw error;
    }
  },

  // 개인 할 일 목록 업데이트
  async updateReportTodos(reportId, todos) {
    try {
      return await run(
        `UPDATE daily_reports 
         SET individualTodo = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(todos), reportId]
      );
    } catch (error) {
      console.error('할 일 업데이트 오류:', error);
      throw error;
    }
  },

  // 이슈 및 문제 업데이트
  async updateReportIssues(reportId, issues) {
    try {
      return await run(
        `UPDATE daily_reports 
         SET issues = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(issues), reportId]
      );
    } catch (error) {
      console.error('이슈 업데이트 오류:', error);
      throw error;
    }
  },

  // 팀의 최근 보고서 가져오기
  async getTeamRecentReports(teamId, limit = 10) {
    try {
      const reports = await all(
        `SELECT dr.*, u.name, u.nickname, u.avatar 
         FROM daily_reports dr
         JOIN users u ON dr.user_id = u.id
         WHERE dr.team_id = ? 
         ORDER BY dr.report_date DESC, dr.created_at DESC 
         LIMIT ?`,
        [teamId, limit]
      );
      
      // JSON 문자열을 객체로 변환
      reports.forEach(report => {
        if (report.issues && typeof report.issues === 'string') {
          report.issues = JSON.parse(report.issues);
        }
        if (report.individualTodo && typeof report.individualTodo === 'string') {
          report.individualTodo = JSON.parse(report.individualTodo);
        }
      });
      
      return reports;
    } catch (error) {
      console.error('팀 최근 보고서 조회 오류:', error);
      throw error;
    }
  },

  async updateReportAnalysis(reportId, analysis) {
    try {
      return await run(
        `UPDATE daily_reports 
         SET ai_analysis = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(analysis), reportId]
      );
    } catch (error) {
      console.error('AI 분석 업데이트 오류:', error);
      throw error;
    }
  },

  async getReportAnalysis(reportId) {
    try {
      const report = await get(
        'SELECT ai_analysis FROM daily_reports WHERE id = ?', 
        [reportId]
      );
      
      if (report && report.ai_analysis) {
        try {
          return JSON.parse(report.ai_analysis);
        } catch (e) {
          console.error('AI 분석 결과 파싱 오류:', e);
          return { error: 'AI 분석 결과 파싱 오류' };
        }
      }
      
      return null;
    } catch (error) {
      console.error('AI 분석 결과 조회 오류:', error);
      throw error;
    }
  }
};

// app.locals에 모델 저장 (미들웨어에서 접근할 수 있도록)
app.locals.models = {
  getUserById: userModel.getUserById,
  getUserByEmail: userModel.getUserByEmail
};

// 인증 모듈 설정 - userModel 전달 (순서 중요!)
const authModuleFactory = require('./auth');
const authModule = authModuleFactory(app, userModel);

// 루트 라우트 - 로그인 페이지로 리다이렉트 (정적 파일 미들웨어보다 먼저 정의)
app.get('/index.html', (req, res, next) => {
  // 토큰 확인
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    return res.redirect('/login.html');
  }
  
  // JWT 검증 (비동기적으로 처리)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    // 토큰이 유효하면 요청 진행
    next();
  } catch (err) {
    // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
    return res.redirect('/login.html');
  }
});

// 정적 파일 제공 (index 옵션을 false로 설정)
app.use(express.static(path.join(__dirname, 'public'), {
  index: false // index.html을 기본 파일로 사용하지 않음
}));

app.get('*', (req, res, next) => {
  // API 요청은 처리하지 않음
  if (req.url.startsWith('/api/')) {
    return next();
  }
  
  // 정적 파일은 이미 위에서 처리됨
  // HTML 파일 요청은 login.html로 보냄 (클라이언트 라우팅 지원)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  } else {
    next();
  }
});

// ================ 라우터 정의 - Teams ================
// 팀 관련 라우트
const teamsRouter = express.Router();

// 사용자의 모든 팀 가져오기
teamsRouter.get('/', authModule.authenticateToken, async (req, res) => {
  try {
    const teams = await userModel.getUserTeams(req.user.id);
    
    // 각 팀의 멤버 수 가져오기
    const teamsWithMemberCount = await Promise.all(teams.map(async (team) => {
      const members = await teamModel.getTeamMembers(team.id);
      return {
        ...team,
        memberCount: members.length
      };
    }));
    
    res.json({ success: true, teams: teamsWithMemberCount });
  } catch (error) {
    console.error('팀 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '팀 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 새 팀 생성
teamsRouter.post('/', authModule.authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: '팀 이름은 필수 입력 항목입니다.' });
    }
    
    const newTeam = await teamModel.createTeam({
      name,
      description: description || '',
      createdBy: req.user.id
    });
    
    res.status(201).json({ success: true, message: '팀이 생성되었습니다.', team: newTeam });
  } catch (error) {
    console.error('팀 생성 오류:', error);
    res.status(500).json({ success: false, message: '팀 생성 중 오류가 발생했습니다.' });
  }
});

// 특정 팀 정보 가져오기
teamsRouter.get('/:teamId', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const team = await teamModel.getTeamById(teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    res.json({ success: true, team });
  } catch (error) {
    console.error('팀 조회 오류:', error);
    res.status(500).json({ success: false, message: '팀 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 팀 수정
teamsRouter.put('/:teamId', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { name, description } = req.body;
    
    // 팀 존재 여부 및 권한 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 관리자만 팀 수정 가능 (또는 생성자)
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === req.user.id);
    
    if (!currentMember || (currentMember.role !== 'admin' && team.created_by !== req.user.id)) {
      return res.status(403).json({ success: false, message: '팀을 수정할 권한이 없습니다.' });
    }
    
    // 팀 업데이트
    await teamModel.updateTeam(teamId, { name, description });
    
    // 업데이트된 팀 정보 반환
    const updatedTeam = await teamModel.getTeamById(teamId);
    
    res.json({ success: true, message: '팀 정보가 업데이트되었습니다.', team: updatedTeam });
  } catch (error) {
    console.error('팀 수정 오류:', error);
    res.status(500).json({ success: false, message: '팀 수정 중 오류가 발생했습니다.' });
  }
});

// 팀 삭제
teamsRouter.delete('/:teamId', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 생성자만 삭제 가능
    if (team.created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: '팀을 삭제할 권한이 없습니다.' });
    }
    
    // 팀 멤버 삭제
    await teamModel.removeAllTeamMembers(teamId);
    
    // 팀 삭제
    await teamModel.deleteTeam(teamId);
    
    res.json({ success: true, message: '팀이 삭제되었습니다.' });
  } catch (error) {
    console.error('팀 삭제 오류:', error);
    res.status(500).json({ success: false, message: '팀 삭제 중 오류가 발생했습니다.' });
  }
});

// 팀 멤버 목록 가져오기
teamsRouter.get('/:teamId/members', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버 목록 가져오기
    const members = await teamModel.getTeamMembers(teamId);
    
    res.json({ success: true, members });
  } catch (error) {
    console.error('팀 멤버 목록 조회 오류:', error);
    res.status(500).json({ success: false, message: '팀 멤버 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 초대 코드 생성
teamsRouter.post('/:teamId/invite', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { expiresIn, maxUses } = req.body;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버인지 확인
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === req.user.id);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '팀에 속해있지 않습니다.' });
    }
    
    // 초대 코드 생성
    const invite = await teamModel.createInviteCode(teamId, req.user.id, {
      expiresIn: expiresIn || 7, // 기본 7일
      maxUses: maxUses || 0 // 기본 무제한
    });
    
    res.json({ 
      success: true, 
      message: '초대 코드가 생성되었습니다.', 
      inviteCode: invite.invite_code,
      expires: invite.expires_at
    });
  } catch (error) {
    console.error('초대 코드 생성 오류:', error);
    res.status(500).json({ success: false, message: '초대 코드 생성 중 오류가 발생했습니다.' });
  }
});

// 초대 코드로 팀 참가
teamsRouter.post('/join', authModule.authenticateToken, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    
    if (!inviteCode) {
      return res.status(400).json({ success: false, message: '초대 코드를 입력해주세요.' });
    }
    
    // 초대 코드로 팀 가입
    const team = await teamModel.joinTeamByInviteCode(inviteCode, req.user.id);
    
    res.json({ success: true, message: '팀에 참가했습니다.', team });
  } catch (error) {
    console.error('팀 참가 오류:', error);
    res.status(400).json({ success: false, message: error.message || '팀 참가 중 오류가 발생했습니다.' });
  }
});

// 팀 보고서 가져오기
teamsRouter.get('/:teamId/reports', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const date = req.query.date;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버인지 확인
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === req.user.id);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '팀에 속해있지 않습니다.' });
    }
    
    let reports;
    if (date) {
      // 특정 날짜의 보고서 가져오기
      reports = await reportModel.getTeamReportsByDate(teamId, date);
    } else {
      // 최근 보고서 가져오기
      reports = await reportModel.getTeamRecentReports(teamId, 10);
    }
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('팀 보고서 조회 오류:', error);
    res.status(500).json({ success: false, message: '팀 보고서를 가져오는 중 오류가 발생했습니다.' });
  }
});

// ================ 라우터 정의 - Reports ================
// 보고서 관련 라우트
const reportsRouter = express.Router();

// 보고서 생성/업데이트
reportsRouter.post('/:teamId', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { 
      yesterday_work, 
      today_work, 
      individualTodo, 
      issues, 
      help_needed, 
      progress,
      summary,
      skip_analysis = false,  // Add option to skip analysis
      send_email = true
    } = req.body;
    const userId = req.user.id;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버인지 확인
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === userId);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '팀에 속해있지 않습니다.' });
    }
    
    // 현재 날짜
    const today = new Date().toISOString().split('T')[0];
    
    // 보고서 생성 또는 업데이트
    const report = await reportModel.createOrUpdateReport(userId, teamId, today, {
      yesterdayWork: yesterday_work,
      todayWork: today_work,
      issues: issues || [],
      helpNeeded: help_needed,
      progress: progress || 0,
      individualTodo: individualTodo || [],
      summary: summary
    });
    
    // AI 분석 수행 (비동기적으로 처리, 응답 지연 방지)
    if (!skip_analysis) {
      try {
        // 사용자 정보 가져오기
        const user = await userModel.getUserById(userId);
        
        // 분석 작업 백그라운드로 실행
        setTimeout(async () => {
          try {
            // AI 분석 실행
            const analysis = await reportAnalysis.analyzeReport(
              report,
              user.name || user.nickname,
              team.name
            );
            
            // 분석 결과 저장
            await reportModel.updateReportAnalysis(report.id, analysis);
            
            console.log(`AI 분석이 완료되었습니다. 보고서 ID: ${report.id}`);
          } catch (analysisError) {
            console.error('백그라운드 AI 분석 오류:', analysisError);
          }
        }, 0);
        
        // 클라이언트에게 분석이 진행 중임을 알림
        report.ai_analysis_status = 'processing';
      } catch (analysisInitError) {
        console.error('AI 분석 초기화 오류:', analysisInitError);
        report.ai_analysis_status = 'failed';
      }
    } else {
      report.ai_analysis_status = 'skipped';
    }
    
    res.json({ 
      success: true, 
      message: '보고서가 제출되었습니다.' + (!skip_analysis ? ' AI 분석이 백그라운드에서 진행 중입니다.' : ''), 
      report 
    });
  } catch (error) {
    console.error('보고서 생성/업데이트 오류:', error);
    res.status(500).json({ success: false, message: '보고서 제출 중 오류가 발생했습니다.' });
  }
});

// 개인 할 일 업데이트
reportsRouter.put('/todo/:teamId', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const { todoId, completed } = req.body;  // todoIndex 대신 todoId 사용
    const userId = req.user.id;
    
    console.log(`할 일 업데이트 요청: 팀 ${teamId}, 사용자 ${userId}, ID ${todoId}, 완료 ${completed}`);
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 오늘 날짜의 보고서 가져오기
    const today = new Date().toISOString().split('T')[0];
    const report = await reportModel.getUserReportByDate(userId, teamId, today);
    
    if (!report) {
      return res.status(404).json({ success: false, message: '보고서를 찾을 수 없습니다.' });
    }
    
    // 개인 할 일 목록 업데이트
    if (!report.individualTodo || !Array.isArray(report.individualTodo)) {
      return res.status(400).json({ success: false, message: '할 일 목록을 찾을 수 없습니다.' });
    }
    
    // ID로 할 일 항목 찾기
    const todoIndex = report.individualTodo.findIndex(todo => 
      (todo.id && todo.id === todoId) || (!todo.id && todoId === String(todoIndex))
    );
    
    if (todoIndex === -1) {
      return res.status(400).json({ success: false, message: '존재하지 않는 할 일입니다.' });
    }
    
    // 할 일 상태 업데이트
    report.individualTodo[todoIndex].completed = completed;
    
    // 보고서 업데이트
    await reportModel.updateReportTodos(report.id, report.individualTodo);
    
    res.json({ 
      success: true, 
      message: '할 일이 업데이트되었습니다.' 
    });
  } catch (error) {
    console.error('할 일 업데이트 오류:', error);
    res.status(500).json({ success: false, message: '할 일 업데이트 중 오류가 발생했습니다.' });
  }
});

// 댓글 불러오기
reportsRouter.get('/comments/:teamId/:memberId/:issueIndex', authModule.authenticateToken, async (req, res) => {
  try {
    const { teamId, memberId, issueIndex } = req.params;
    const userId = req.user.id;
    
    // 쿼리 파라미터에서 날짜 가져오기 (제공되지 않을 수 있음)
    const reportDate = req.query.date;
    
    console.log(`댓글 요청: 팀 ${teamId}, 멤버 ${memberId}, 이슈 ${issueIndex}, 날짜 ${reportDate || '지정되지 않음'}`);
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버인지 확인
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === userId);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '팀에 속해있지 않습니다.' });
    }
    
    // 날짜 파라미터 유무에 상관없이 작동하도록 수정됨
    const report = await reportModel.getUserReportByDate(memberId, teamId, reportDate);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: reportDate ? 
          `${reportDate} 날짜의 보고서를 찾을 수 없습니다.` : 
          '보고서를 찾을 수 없습니다.' 
      });
    }
    
    // 이슈 확인
    if (!report.issues || !report.issues[issueIndex]) {
      return res.status(400).json({ success: false, message: '존재하지 않는 이슈입니다.' });
    }
    
    // 이슈 및 댓글 정보 반환
    const issue = report.issues[issueIndex];
    
    // 응답에 보고서 날짜 포함
    res.json({
      success: true,
      issue,
      reportDate: report.report_date
    });
  } catch (error) {
    console.error('댓글 조회 오류:', error);
    res.status(500).json({ success: false, message: '댓글을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 알림 가져오기 엔드포인트
reportsRouter.get('/notifications', authModule.authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 현재는 알림이 없음을 반환 (추후 DB에서 실제 알림을 가져올 수 있음)
    res.json({
      success: true,
      notifications: []
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    res.status(500).json({ success: false, message: '알림을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 댓글 추가
reportsRouter.post('/comments/:teamId/:memberId/:issueIndex', authModule.authenticateToken, async (req, res) => {
  try {
    const { teamId, memberId, issueIndex } = req.params;
    const { text, reportDate } = req.body;  // Now also accepting the reportDate
    const userId = req.user.id;
    
    // 텍스트 확인
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: '댓글 내용을 입력해주세요.' });
    }
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 댓글 작성자 정보
    const author = await userModel.getUserById(userId);
    if (!author) {
      return res.status(404).json({ success: false, message: '사용자 정보를 찾을 수 없습니다.' });
    }
    
    // Use the provided date if available, otherwise use today's date
    const date = reportDate || new Date().toISOString().split('T')[0];
    const report = await reportModel.getUserReportByDate(memberId, teamId, date);
    
    if (!report) {
      return res.status(404).json({ success: false, message: '보고서를 찾을 수 없습니다.' });
    }
    
    // 이슈 확인
    if (!report.issues || !report.issues[issueIndex]) {
      return res.status(400).json({ success: false, message: '존재하지 않는 이슈입니다.' });
    }
    
    // 댓글 추가
    const newComment = {
      author_id: userId,
      author_name: author.nickname || author.name,
      text,
      created_at: new Date().toISOString()
    };
    
    if (!report.issues[issueIndex].comments) {
      report.issues[issueIndex].comments = [];
    }
    
    report.issues[issueIndex].comments.push(newComment);
    
    // 보고서 업데이트
    await reportModel.updateReportIssues(report.id, report.issues);
    
    res.json({
      success: true,
      message: '댓글이 추가되었습니다.',
      comment: newComment,
      reportDate: report.report_date
    });
  } catch (error) {
    console.error('댓글 추가 오류:', error);
    res.status(500).json({ success: false, message: '댓글 추가 중 오류가 발생했습니다.' });
  }
});

// Add these endpoints to your reportsRouter

// AI 분석 결과 가져오기
reportsRouter.get('/:reportId/analysis', authModule.authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const userId = req.user.id;
    
    // 보고서 존재 여부 확인
    const report = await reportModel.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: '보고서를 찾을 수 없습니다.' });
    }
    
    // 권한 확인 (보고서 작성자 또는 같은 팀 멤버만 접근 가능)
    if (report.user_id !== userId) {
      const members = await teamModel.getTeamMembers(report.team_id);
      const isMember = members.some(m => m.id === userId);
      
      if (!isMember) {
        return res.status(403).json({ success: false, message: '이 보고서에 접근할 권한이 없습니다.' });
      }
    }
    
    // AI 분석 결과 가져오기
    const analysis = await reportModel.getReportAnalysis(reportId);
    
    if (!analysis) {
      return res.status(404).json({ 
        success: false, 
        message: 'AI 분석 결과가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.' 
      });
    }
    
    res.json({ 
      success: true, 
      analysis 
    });
  } catch (error) {
    console.error('AI 분석 결과 조회 오류:', error);
    res.status(500).json({ success: false, message: 'AI 분석 결과를 가져오는 중 오류가 발생했습니다.' });
  }
});

// AI 분석 재실행
reportsRouter.post('/:reportId/analyze', authModule.authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const userId = req.user.id; 
    
    // 보고서 존재 여부 확인
    const report = await reportModel.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: '보고서를 찾을 수 없습니다.' });
    }
    
    // 권한 확인 (보고서 작성자 또는 관리자만 재분석 가능)
    if (report.user_id !== userId) {
      const members = await teamModel.getTeamMembers(report.team_id);
      const currentMember = members.find(m => m.id === userId);
      
      if (!currentMember || currentMember.role !== 'admin') {
        return res.status(403).json({ success: false, message: '이 보고서를 재분석할 권한이 없습니다.' });
      }
    }
    
    // 사용자 및 팀 정보 가져오기
    const user = await userModel.getUserById(report.user_id);
    const team = await teamModel.getTeamById(report.team_id);
    
    // 분석 작업 시작을 알림
    res.json({ 
      success: true, 
      message: 'AI 분석이 시작되었습니다. 결과는 잠시 후 확인할 수 있습니다.',
      status: 'processing'
    });
    
    // 백그라운드에서 AI 분석 실행
    setTimeout(async () => {
      try {
        // AI 분석 실행
        const analysis = await reportAnalysis.analyzeReport(
          report,
          user.name || user.nickname,
          team.name
        );
        
        // 분석 결과 저장
        await reportModel.updateReportAnalysis(report.id, analysis);
        
        console.log(`AI 분석이 재실행되었습니다. 보고서 ID: ${report.id}`);
      } catch (analysisError) {
        console.error('AI 분석 재실행 오류:', analysisError);
      }
    }, 0);
    
  } catch (error) {
    console.error('AI 분석 재실행 오류:', error);
    res.status(500).json({ success: false, message: 'AI 분석을 시작하는 중 오류가 발생했습니다.' });
  }
});

// 모든 팀 멤버의 보고서 AI 분석 종합 가져오기
reportsRouter.get('/team/:teamId/analysis', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const { date } = req.query;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 권한 확인 (팀 멤버만 접근 가능)
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === userId);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '이 팀에 접근할 권한이 없습니다.' });
    }
    
    // 날짜 필터링
    const dateFilter = date ? `AND report_date = '${date}'` : '';
    
    // 팀 보고서 및 분석 결과 가져오기
    const reports = await all(
      `SELECT dr.id, dr.user_id, dr.report_date, dr.progress, dr.ai_analysis, 
              u.name, u.nickname, u.avatar
       FROM daily_reports dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.team_id = ? ${dateFilter}
       ORDER BY dr.report_date DESC, dr.created_at DESC`,
      [teamId]
    );
    
    // 분석 결과 파싱
    const analyzedReports = reports.map(report => {
      try {
        const analysis = report.ai_analysis ? JSON.parse(report.ai_analysis) : null;
        return {
          id: report.id,
          user_id: report.user_id,
          user_name: report.nickname || report.name,
          avatar: report.avatar,
          report_date: report.report_date,
          progress: report.progress,
          analysis: analysis,
          has_analysis: !!analysis
        };
      } catch (e) {
        console.error(`분석 결과 파싱 오류 (보고서 ID: ${report.id}):`, e);
        return {
          id: report.id,
          user_id: report.user_id,
          user_name: report.nickname || report.name,
          avatar: report.avatar,
          report_date: report.report_date,
          progress: report.progress,
          analysis: null,
          has_analysis: false,
          parse_error: true
        };
      }
    });
    
    res.json({ 
      success: true, 
      team_name: team.name,
      reports: analyzedReports
    });
  } catch (error) {
    console.error('팀 분석 결과 조회 오류:', error);
    res.status(500).json({ success: false, message: '팀 분석 결과를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 새 엔드포인트 추가 - 보고서에 대한 추가 질문
reportsRouter.post('/:reportId/ask', authModule.authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ success: false, message: '질문을 입력해주세요.' });
    }
    
    // 보고서 확인
    const report = await reportModel.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: '보고서를 찾을 수 없습니다.' });
    }
    
    // 대화 기록 가져오기
    let history = [];
    if (report.ai_conversation) {
      try {
        history = JSON.parse(report.ai_conversation);
      } catch (e) {
        console.error('대화 기록 파싱 오류:', e);
      }
    }
    
    // Gemini API 세션 시작
    const chatSession = model.startChat({
      generationConfig,
      history: history,
    });
    
    // 질문 전송
    const result = await chatSession.sendMessage(question);
    const answerText = result.response.text();
    
    // 대화 기록 업데이트
    const newUserMessage = {
      role: "user",
      parts: [{ text: question }]
    };
    
    const newAiMessage = {
      role: "model",
      parts: [{ text: answerText }]
    };
    
    const updatedHistory = [...history, newUserMessage, newAiMessage];
    
    // DB에 업데이트된 대화 기록 저장
    await run(
      `UPDATE daily_reports SET ai_conversation = ? WHERE id = ?`,
      [JSON.stringify(updatedHistory), reportId]
    );
    
    res.json({
      success: true,
      answer: answerText
    });
    
  } catch (error) {
    console.error('AI 질문 처리 오류:', error);
    res.status(500).json({ success: false, message: '질문 처리 중 오류가 발생했습니다.' });
  }
});

// 팀 종합 보고서 생성 엔드포인트
reportsRouter.get('/team-summary/:teamId', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    
    // 팀 존재 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버인지 확인
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === userId);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '이 팀에 접근할 권한이 없습니다.' });
    }
    
    // 날짜 필터링 (기본값은 오늘)
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // 팀의 모든 최신 보고서 가져오기
    const allReports = [];
    
    for (const member of members) {
      const report = await reportModel.getUserReportByDate(member.id, teamId, date);
      if (report) {
        allReports.push({
          member: {
            id: member.id,
            name: member.nickname || member.name
          },
          report
        });
      }
    }
    
    // 보고서 종합 데이터 생성
    const summary = {
      team: team.name,
      date: date,
      memberCount: members.length,
      reportCount: allReports.length,
      yesterdayWorkSummary: [],
      todayWorkSummary: [],
      issuesSummary: [],
      progressAverage: 0,
      totalProgress: 0
    };
    
    // 데이터 종합
    allReports.forEach(item => {
      const report = item.report;
      const memberName = item.member.name;
      
      // 어제 한 일 추가
      if (report.yesterday_work) {
        const yesterdayWorks = Array.isArray(report.yesterday_work) ? 
          report.yesterday_work : [report.yesterday_work];
        
        yesterdayWorks.forEach(work => {
          summary.yesterdayWorkSummary.push({
            member: memberName,
            work: work
          });
        });
      }
      
      // 오늘 할 일 추가
      if (report.today_work) {
        const todayWorks = Array.isArray(report.today_work) ? 
          report.today_work : [report.today_work];
        
        todayWorks.forEach(work => {
          summary.todayWorkSummary.push({
            member: memberName,
            work: work
          });
        });
      }
      
      // 이슈 추가
      if (report.issues && Array.isArray(report.issues)) {
        report.issues.forEach(issue => {
          if (issue.text || issue.title) {
            summary.issuesSummary.push({
              member: memberName,
              issue: issue.text || issue.title,
              severity: issue.severity || 'normal',
              commentCount: (issue.comments && Array.isArray(issue.comments)) ? 
                issue.comments.length : 0
            });
          }
        });
      }
      
      // 진행률 누적
      if (typeof report.progress === 'number') {
        summary.totalProgress += report.progress;
      }
    });
    
    // 평균 진행률 계산
    summary.progressAverage = summary.reportCount > 0 ? 
      Math.round(summary.totalProgress / summary.reportCount) : 0;
    
    // AI 분석 요청
    try {
      // AI 분석 요청 보내기
      const analysis = await reportAnalysis.analyzeTeamSummary(summary, team.name);
      summary.aiAnalysis = analysis;
    } catch (analysisError) {
      console.error('팀 보고서 AI 분석 오류:', analysisError);
      summary.aiAnalysis = { error: 'AI 분석 중 오류가 발생했습니다.' };
    }
    
    res.json({
      success: true,
      summary
    });
    
  } catch (error) {
    console.error('팀 종합 보고서 생성 오류:', error);
    res.status(500).json({ success: false, message: '팀 종합 보고서를 생성하는 중 오류가 발생했습니다.' });
  }
});

// reportsRouter 설정에 추가
reportsRouter.get('/:teamId/user-latest', authModule.authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    
    // 팀 존재 여부 확인
    const team = await teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: '팀을 찾을 수 없습니다.' });
    }
    
    // 팀 멤버인지 확인
    const members = await teamModel.getTeamMembers(teamId);
    const currentMember = members.find(m => m.id === userId);
    
    if (!currentMember) {
      return res.status(403).json({ success: false, message: '팀에 속해있지 않습니다.' });
    }
    
    // 사용자의 가장 최근 보고서 가져오기
    const report = await reportModel.getUserReportByDate(userId, teamId);
    
    res.json({ 
      success: true, 
      report: report || null
    });
    
  } catch (error) {
    console.error('최근 보고서 조회 오류:', error);
    res.status(500).json({ success: false, message: '최근 보고서를 가져오는 중 오류가 발생했습니다.' });
  }
});

// ================ 라우터 설정 ================
// 인증 라우터 설정
app.use('/api/auth', authModule);

// 팀 및 보고서 API 라우터 설정
app.use('/api/teams', teamsRouter);
app.use('/api/reports', reportsRouter);

// 인증 필요한 API 엔드포인트 예시
app.get('/api/protected', authModule.checkAuth, (req, res) => {
  res.json({
    message: '인증된 사용자만 접근 가능한 데이터입니다.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// 인증이 필요한 페이지 라우트 예시
app.get('/dashboard', authModule.checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 로그인 페이지
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 404 에러 처리
app.use((req, res, next) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다.' });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: '서버 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
