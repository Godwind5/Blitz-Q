const { GoogleGenerativeAI } = require("@google/generative-ai");
const { run, get, all } = require('./database'); // 이 줄 추가
require("dotenv").config();

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

// Function to analyze report with conversation history
async function analyzeReport(report, userName, teamName) {
    try {
        // Format the report data for analysis
        const reportData = formatReportForAnalysis(report, userName, teamName);

        // 이전 대화 기록 가져오기
        let history = [];
        if (report.ai_conversation) {
            try {
                history = JSON.parse(report.ai_conversation);
            } catch (e) {
                console.error('대화 기록 파싱 오류:', e);
            }
        }

        // Start a chat session with history
        const chatSession = model.startChat({
            generationConfig,
            history: history,
        });

        // Send the report data for analysis
        const result = await chatSession.sendMessage(reportData);
        const analysisText = result.response.text();

        console.log("AI Analysis completed for report:", report.id);

        // 새 대화 내용 저장을 위한 추가
        const newMessage = {
            role: "user",
            parts: [{ text: reportData }]
        };

        const aiResponse = {
            role: "model",
            parts: [{ text: analysisText }]
        };

        // 기존 히스토리에 새 대화 추가
        const updatedHistory = [...history, newMessage, aiResponse];

        // 대화 내용 DB에 저장
        await run(
            `UPDATE daily_reports SET ai_conversation = ? WHERE id = ?`,
            [JSON.stringify(updatedHistory), report.id]
        );

        // Try to parse the response as JSON, fallback to raw text if parsing fails
        try {
            return JSON.parse(analysisText);
        } catch (parseError) {
            console.error("Error parsing AI response as JSON:", parseError);
            return {
                summary: analysisText.substring(0, 200) + "...",
                raw_analysis: analysisText
            };
        }
    } catch (error) {
        console.error("Error during AI report analysis:", error);
        return { error: "AI 분석 중 오류가 발생했습니다." };
    }
}

// Format report data for AI analysis
function formatReportForAnalysis(report, userName, teamName) {
  const yesterday = report.yesterday_work ? 
    (typeof report.yesterday_work === 'string' ? report.yesterday_work : JSON.stringify(report.yesterday_work)) : 
    "정보 없음";
  
  const today = report.today_work ? 
    (typeof report.today_work === 'string' ? report.today_work : JSON.stringify(report.today_work)) : 
    "정보 없음";
  
  const issues = report.issues && Array.isArray(report.issues) ? 
    report.issues.map(issue => `- ${issue.title || issue.text || '제목 없음'}: ${issue.description || '설명 없음'}`).join('\n') : 
    "이슈 없음";
  
  const todos = report.individualTodo && Array.isArray(report.individualTodo) ?
    report.individualTodo.map(todo => `- [${todo.completed ? 'X' : ' '}] ${todo.text || '내용 없음'}`).join('\n') :
    "할 일 없음";
  
  const progress = typeof report.progress === 'number' ? `${report.progress}%` : '정보 없음';
  
  // Format the prompt for the AI
  return `
당신은 팀 보고서를 분석하는 AI 어시스턴트입니다. 다음 일일 보고서를 분석하고 "한국어로" 인사이트를 제공해주세요.

팀: ${teamName || '정보 없음'}
작성자: ${userName || '정보 없음'}
날짜: ${report.report_date || '정보 없음'}
진행률: ${progress}

== 어제 한 일 ==
${yesterday}

== 오늘 할 일 ==
${today}

== 이슈 및 문제점 ==
${issues}

== 개인 할 일 목록 ==
${todos}

== 도움이 필요한 사항 ==
${report.help_needed || '정보 없음'}

이 보고서에 대해 다음 사항들을 분석해주세요:
1. 업무 진행 상황 요약
2. 발견된 주요 이슈와 해결 방안 제안
3. 진행 상황에 따른 제안사항
4. 전반적인 보고서의 품질과 완성도

JSON 형식으로 답변해주세요:
{
  "summary": "전체 요약",
  "progress_analysis": "진행 상황 분석",
  "issues_analysis": "이슈 분석",
  "action_items": ["실행 항목 1", "실행 항목 2", ...],
  "suggestions": ["제안사항 1", "제안사항 2", ...],
  "quality_score": 0-10 사이의 점수,
  "overall_feedback": "종합적인 피드백"
}
`;
}

// 팀 종합 보고서 분석
async function analyzeTeamSummary(summary, teamName) {
    try {
      // 분석을 위한 데이터 형식화
      const promptData = formatTeamSummaryForAnalysis(summary, teamName);
      
      // 채팅 세션 시작
      const chatSession = model.startChat({
        generationConfig,
        history: []
      });
      
      // 보고서 데이터 전송
      const result = await chatSession.sendMessage(promptData);
      const analysisText = result.response.text();
      
      console.log("Team Summary Analysis completed for:", teamName);
      
      // JSON 형식으로 파싱, 실패시 텍스트 반환
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error("Error parsing AI response as JSON:", parseError);
        return { 
          team_overview: analysisText.substring(0, 200) + "...",
          raw_analysis: analysisText
        };
      }
    } catch (error) {
      console.error("Error during team summary analysis:", error);
      return { error: "팀 보고서 분석 중 오류가 발생했습니다." };
    }
  }
  
  // 팀 종합 보고서 분석용 프롬프트 형식화
  function formatTeamSummaryForAnalysis(summary, teamName) {
    // 어제 한 일 요약
    const yesterdayWorks = summary.yesterdayWorkSummary.map(item => 
      `- ${item.member}: ${item.work}`
    ).join('\n');
    
    // 오늘 할 일 요약
    const todayWorks = summary.todayWorkSummary.map(item => 
      `- ${item.member}: ${item.work}`
    ).join('\n');
    
    // 이슈 요약
    const issues = summary.issuesSummary.map(item => 
      `- ${item.member}의 이슈 (${item.severity}): ${item.issue} (댓글 ${item.commentCount}개)`
    ).join('\n');
    
    return `
  당신은 팀 보고서를 분석하는 AI 어시스턴트입니다. 다음 팀 종합 보고서를 분석하고 전체적인 인사이트와 팀 협업 제안을 "한국어로" 제공해주세요.
  
  팀: ${teamName || '정보 없음'}
  날짜: ${summary.date || '정보 없음'}
  팀원 수: ${summary.memberCount}명
  보고서 제출 수: ${summary.reportCount}건
  팀 평균 진행률: ${summary.progressAverage}%
  
  == 어제 팀원들이 한 일 ==
  ${yesterdayWorks || '정보 없음'}
  
  == 오늘 팀원들이 할 일 ==
  ${todayWorks || '정보 없음'}
  
  == 보고된 이슈 및 문제점 ==
  ${issues || '보고된 이슈 없음'}
  
  이 팀 보고서를 종합하여 다음 내용을 JSON 형식으로 분석해주세요:
  
  1. 팀 전체의 업무 진행 상황 요약
  2. 여러 팀원이 공통적으로 언급한 주요 이슈 식별
  3. 팀 협업 개선 제안
  4. 우선순위가 높은 작업 식별
  5. 종합적인 팀 평가 및 제안사항
  
  JSON 형식으로 답변해주세요:
  {
    "team_overview": "팀 전체 상황 요약",
    "common_issues": ["공통 이슈 1", "공통 이슈 2", ...],
    "priority_tasks": ["우선순위 작업 1", "우선순위 작업 2", ...],
    "collaboration_suggestions": ["협업 제안 1", "협업 제안 2", ...],
    "progress_evaluation": "진행 상황 평가",
    "overall_recommendations": "종합 제안사항"
  }
  `;
  }
  
  // 이 함수들을 module.exports에 추가
  module.exports = {
    analyzeReport,
    analyzeTeamSummary
  };

// 팀 종합 보고서 분석
async function analyzeTeamSummary(summary, teamName) {
    try {
      // 분석을 위한 데이터 형식화
      const promptData = formatTeamSummaryForAnalysis(summary, teamName);
      
      // 채팅 세션 시작
      const chatSession = model.startChat({
        generationConfig,
        history: []
      });
      
      // 보고서 데이터 전송
      const result = await chatSession.sendMessage(promptData);
      const analysisText = result.response.text();
      
      console.log("Team Summary Analysis completed for:", teamName);
      
      // JSON 형식으로 파싱, 실패시 텍스트 반환
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error("Error parsing AI response as JSON:", parseError);
        return { 
          team_overview: analysisText.substring(0, 200) + "...",
          raw_analysis: analysisText
        };
      }
    } catch (error) {
      console.error("Error during team summary analysis:", error);
      return { error: "팀 보고서 분석 중 오류가 발생했습니다." };
    }
  }
  
  // 팀 종합 보고서 분석용 프롬프트 형식화
  function formatTeamSummaryForAnalysis(summary, teamName) {
    // 어제 한 일 요약
    const yesterdayWorks = summary.yesterdayWorkSummary.map(item => 
      `- ${item.member}: ${item.work}`
    ).join('\n');
    
    // 오늘 할 일 요약
    const todayWorks = summary.todayWorkSummary.map(item => 
      `- ${item.member}: ${item.work}`
    ).join('\n');
    
    // 이슈 요약
    const issues = summary.issuesSummary.map(item => 
      `- ${item.member}의 이슈 (${item.severity}): ${item.issue} (댓글 ${item.commentCount}개)`
    ).join('\n');
    
    return `
  당신은 팀 보고서를 분석하는 AI 어시스턴트입니다. 다음 팀 종합 보고서를 분석하고 전체적인 인사이트와 팀 협업 제안을 "한국어로" 제공해주세요.
  
  팀: ${teamName || '정보 없음'}
  날짜: ${summary.date || '정보 없음'}
  팀원 수: ${summary.memberCount}명
  보고서 제출 수: ${summary.reportCount}건
  팀 평균 진행률: ${summary.progressAverage}%
  
  == 어제 팀원들이 한 일 ==
  ${yesterdayWorks || '정보 없음'}
  
  == 오늘 팀원들이 할 일 ==
  ${todayWorks || '정보 없음'}
  
  == 보고된 이슈 및 문제점 ==
  ${issues || '보고된 이슈 없음'}
  
  이 팀 보고서를 종합하여 다음 내용을 JSON 형식으로 분석해주세요:
  
  1. 팀 전체의 업무 진행 상황 요약
  2. 여러 팀원이 공통적으로 언급한 주요 이슈 식별
  3. 팀 협업 개선 제안
  4. 우선순위가 높은 작업 식별
  5. 종합적인 팀 평가 및 제안사항
  
  JSON 형식으로 답변해주세요:
  {
    "team_overview": "팀 전체 상황 요약",
    "common_issues": ["공통 이슈 1", "공통 이슈 2", ...],
    "priority_tasks": ["우선순위 작업 1", "우선순위 작업 2", ...],
    "collaboration_suggestions": ["협업 제안 1", "협업 제안 2", ...],
    "progress_evaluation": "진행 상황 평가",
    "overall_recommendations": "종합 제안사항"
  }
  `;
  }

  module.exports = {
    analyzeReport,
    analyzeTeamSummary  // 이 줄 추가
  };
