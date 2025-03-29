// database.js - SQLite3 데이터베이스 설정
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 데이터베이스 디렉토리 확인 및 생성
const DB_DIR = path.join(__dirname, 'database');
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// 데이터베이스 파일 경로
const DB_PATH = path.join(DB_DIR, 'app.db');

// 필요한 테이블 생성
function createTables() {
    return new Promise((resolve, reject) => {
        // 사용자 테이블
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT,
                name TEXT NOT NULL,
                nickname TEXT,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                role TEXT DEFAULT 'user'
            )
        `, (err) => {
            if (err) return reject(err);
            
            // 팀 테이블
            db.run(`
                CREATE TABLE IF NOT EXISTS teams (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by) REFERENCES users(id)
                )
            `, (err) => {
                if (err) return reject(err);
                
                // 팀 멤버 테이블
                db.run(`
                    CREATE TABLE IF NOT EXISTS team_members (
                        team_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        role TEXT DEFAULT 'member',
                        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (team_id, user_id),
                        FOREIGN KEY (team_id) REFERENCES teams(id),
                        FOREIGN KEY (user_id) REFERENCES users(id)
                    )
                `, (err) => {
                    if (err) return reject(err);
                    
                    // 팀 초대 코드 테이블
                    db.run(`
                        CREATE TABLE IF NOT EXISTS team_invites (
                            id TEXT PRIMARY KEY,
                            team_id TEXT NOT NULL,
                            invite_code TEXT UNIQUE NOT NULL,
                            created_by TEXT NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            expires_at DATETIME,
                            max_uses INTEGER DEFAULT 0,
                            uses INTEGER DEFAULT 0,
                            FOREIGN KEY (team_id) REFERENCES teams(id),
                            FOREIGN KEY (created_by) REFERENCES users(id)
                        )
                    `, (err) => {
                        if (err) return reject(err);
                        
                        // 일일 작업 요약 테이블
                        db.run(`
                            CREATE TABLE IF NOT EXISTS daily_reports (
                                id TEXT PRIMARY KEY,
                                user_id TEXT NOT NULL,
                                team_id TEXT NOT NULL,
                                report_date DATE NOT NULL,
                                yesterday_work TEXT,
                                today_work TEXT,
                                issues TEXT,
                                help_needed TEXT,
                                progress INTEGER DEFAULT 0,
                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES users(id),
                                FOREIGN KEY (team_id) REFERENCES teams(id),
                                UNIQUE (user_id, team_id, report_date)
                            )
                        `, (err) => {
                            if (err) return reject(err);
                            
                            console.log('필요한 모든 테이블이 생성되었습니다.');
                            resolve();
                        });
                    });
                });
            });
        });
    });
}

function updateTables() {
    return new Promise((resolve, reject) => {
        // individualTodo 컬럼 추가
        db.run(`ALTER TABLE daily_reports ADD COLUMN individualTodo TEXT`, (err) => {
            // 이미 컬럼이 있는 경우 무시
            if (err && !err.message.includes('duplicate column name')) {
                console.error('테이블 업데이트 오류:', err);
            } else {
                console.log('daily_reports 테이블에 individualTodo 컬럼이 추가되었습니다.');
            }
            
            // summary 컬럼 추가
            db.run(`ALTER TABLE daily_reports ADD COLUMN summary TEXT`, (err) => {
                if (err && !err.message.includes('duplicate column name')) {
                    console.error('테이블 업데이트 오류:', err);
                } else {
                    console.log('daily_reports 테이블에 summary 컬럼이 추가되었습니다.');
                }
                
                // ai_analysis 컬럼 추가
                db.run(`ALTER TABLE daily_reports ADD COLUMN ai_analysis TEXT`, (err) => {
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('테이블 업데이트 오류:', err);
                    } else {
                        console.log('daily_reports 테이블에 ai_analysis 컬럼이 추가되었습니다.');
                    }
                    
                    // ai_conversation 컬럼 추가
                    db.run(`ALTER TABLE daily_reports ADD COLUMN ai_conversation TEXT`, (err) => {
                        if (err && !err.message.includes('duplicate column name')) {
                            console.error('테이블 업데이트 오류:', err);
                        } else {
                            console.log('daily_reports 테이블에 ai_conversation 컬럼이 추가되었습니다.');
                        }
                        
                        resolve();
                    });
                });
            });
        });
    });
}

// 데이터베이스 연결
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('데이터베이스 연결 오류:', err.message);
    } else {
        console.log('SQLite 데이터베이스에 연결되었습니다.');
        
        // 테이블 생성 후 업데이트 실행
        createTables()
            .then(() => updateTables())
            .then(() => {
                console.log('데이터베이스 설정이 완료되었습니다.');
            })
            .catch(err => {
                console.error('데이터베이스 설정 중 오류 발생:', err);
            });
    }
});

// Promise 기반 쿼리 함수들
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// 데이터베이스 함수 내보내기
module.exports = {
    db,
    run,
    get,
    all,
    close: () => {
        return new Promise((resolve, reject) => {
            db.close(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};
