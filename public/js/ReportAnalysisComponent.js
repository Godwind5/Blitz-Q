// This would be part of your frontend code, import it where needed

class ReportAnalysisComponent {
    constructor(container, apiBaseUrl) {
        this.container = container;
        this.apiBaseUrl = apiBaseUrl || '';
        this.reportId = null;
        this.analysis = null;
        this.isLoading = false;
        this.error = null;
    }

    // Initialize the component
    init(reportId) {
        this.reportId = reportId;
        this.render();
        this.fetchAnalysis();
    }

    // Fetch analysis from the server
    async fetchAnalysis() {
        if (!this.reportId) return;

        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/reports/${this.reportId}/analysis`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                this.analysis = data.analysis;
            } else {
                this.error = data.message || '분석 결과를 가져오는 데 실패했습니다.';
            }
        } catch (error) {
            console.error('Analysis fetch error:', error);
            this.error = '서버 연결 오류가 발생했습니다.';
        } finally {
            this.isLoading = false;
            this.render();
        }
    }

    // Regenerate analysis
    async regenerateAnalysis() {
        if (!this.reportId) return;

        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/reports/${this.reportId}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Set a polling interval to check for the analysis
                this.startPolling();
            } else {
                this.error = data.message || '분석을 시작하는 데 실패했습니다.';
                this.isLoading = false;
            }
        } catch (error) {
            console.error('Analysis regeneration error:', error);
            this.error = '서버 연결 오류가 발생했습니다.';
            this.isLoading = false;
        }

        this.render();
    }

    // Poll for analysis results
    startPolling() {
        this.isLoading = true;
        this.render();

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/reports/${this.reportId}/analysis`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });

                const data = await response.json();

                if (response.ok && data.analysis) {
                    this.analysis = data.analysis;
                    this.isLoading = false;
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }

            this.render();
        }, 3000); // Poll every 3 seconds

        // Stop polling after 1 minute if no response
        setTimeout(() => {
            if (this.isLoading) {
                clearInterval(pollInterval);
                this.isLoading = false;
                this.error = '분석 시간이 초과되었습니다. 나중에 다시 시도해주세요.';
                this.render();
            }
        }, 60000);
    }

    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('auth_token') || '';
    }

    // Render the component
    render() {
        if (!this.container) return;

        let html = '';

        if (this.isLoading) {
            html = `
          <div class="analysis-loading">
            <div class="spinner"></div>
            <p>AI가 보고서를 분석하고 있습니다...</p>
          </div>
        `;
        } else if (this.error) {
            html = `
          <div class="analysis-error">
            <p>오류: ${this.error}</p>
            <button id="retry-analysis" class="btn btn-primary">다시 시도</button>
          </div>
        `;
        } else if (this.analysis) {
            html = `
          <div class="analysis-results">
            <h3>AI 분석 결과</h3>
            
            <div class="analysis-section">
              <h4>요약</h4>
              <p>${this.analysis.summary || '요약 정보 없음'}</p>
            </div>
            
            <div class="analysis-section">
              <h4>진행 상황 분석</h4>
              <p>${this.analysis.progress_analysis || '진행 상황 분석 없음'}</p>
            </div>
            
            <div class="analysis-section">
              <h4>이슈 분석</h4>
              <p>${this.analysis.issues_analysis || '이슈 분석 없음'}</p>
            </div>
            
            <div class="analysis-section">
              <h4>실행 항목</h4>
              <ul>
                ${(this.analysis.action_items || []).map(item => `<li>${item}</li>`).join('') || '<li>실행 항목 없음</li>'}
              </ul>
            </div>
            
            <div class="analysis-section">
              <h4>제안사항</h4>
              <ul>
                ${(this.analysis.suggestions || []).map(item => `<li>${item}</li>`).join('') || '<li>제안사항 없음</li>'}
              </ul>
            </div>
            
            <div class="analysis-section">
              <h4>보고서 품질 점수</h4>
              <div class="quality-score">
                <span class="score">${this.analysis.quality_score || 'N/A'}</span>/10
              </div>
            </div>
            
            <div class="analysis-section">
              <h4>종합 피드백</h4>
              <p>${this.analysis.overall_feedback || '종합 피드백 없음'}</p>
            </div>
            
            <button id="regenerate-analysis" class="btn btn-secondary">분석 재실행</button>
          </div>
        `;
        } else {
            html = `
          <div class="analysis-empty">
            <p>이 보고서에 대한 AI 분석 결과가 없습니다.</p>
            <button id="generate-analysis" class="btn btn-primary">분석 시작</button>
          </div>
        `;
        }

        this.container.innerHTML = html;

        // Add event listeners
        const generateBtn = this.container.querySelector('#generate-analysis');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.regenerateAnalysis());
        }

        const regenerateBtn = this.container.querySelector('#regenerate-analysis');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateAnalysis());
        }

        const retryBtn = this.container.querySelector('#retry-analysis');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.fetchAnalysis());
        }
    }
}
