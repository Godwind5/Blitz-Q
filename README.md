# 🏆 Blitz-Q
> **Grand Prize Winner of Dankook University ZeroThon 2025 (National-Level Competition)**  
> AI-powered Daily Stand-up Automation Platform for Maximizing Team Collaboration Efficiency

[한국어 README](README_KR.md)

## 🎯 Project Overview

**"What's our team doing?"** - This project started with this simple question.

This phrase comes up in every team project: "What's our team doing?" Blitz-Q was born to solve this frustration. Like Blitzcrank's Q skill in League of Legends, it's an AI-powered collaboration tool that **hooks all team members' schedules and progress at once**.

### 🚀 Core Values
- **Efficiency**: Manual report compilation → AI automated comprehensive analysis
- **Transparency**: Real-time sharing of all team members' progress
- **Insights**: AI-driven team status analysis and improvement suggestions

## ✨ Key Features

### 📊 Smart Report System
- **Personal Daily Reports**: Input yesterday's work, today's tasks, and issues
- **AI Auto-Synthesis**: AI compiles individual reports into comprehensive team reports
- **Real-time Progress Tracking**: Visualization of individual/team project progress

### 🤖 AI Analysis Engine
- **Google Gemini API** based intelligent analysis
- **Automatic Issue Detection**: Identification of team issues and bottlenecks
- **Solution Recommendations**: Specific and actionable improvement suggestions
- **Trend Analysis**: Pattern recognition in team performance changes

### 💬 Collaborative Communication
- **Issue-based Comment System**: Team communication on specific problems
- **Personal Task Management**: Checklist-based task tracking
- **Real-time Notifications**: Instant sharing of important updates

### 🏢 Team Management
- **Easy Team Creation**: One-click team creation and management
- **Invite Code System**: Simple team member invitation with 12-digit codes
- **Permission Management**: Role-based access control (Admin/Member)

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js**: Robust server architecture
- **SQLite3**: Lightweight database (for development/testing)
- **JWT**: Secure authentication system
- **Passport.js**: Social login integration

### Frontend
- **Vanilla JavaScript**: Optimized performance with pure JavaScript
- **HTML5** + **CSS3**: Modern web standard-based UI
- **Responsive Design**: Perfect usability on all devices

### AI & External APIs
- **Google Gemini API**: Advanced natural language processing and analysis
- **Google OAuth 2.0**: Simple and secure login

### DevOps & Tools
- **dotenv**: Environment variable management
- **bcrypt**: Password encryption
- **nodemon**: Enhanced development efficiency

## 📂 Project Structure

```
Blitz-Q/
├── 📁 public/              # Frontend files
│   ├── 📄 index.html        # Main dashboard
│   ├── 📄 login.html        # Login page
│   ├── 📄 report.html       # Report creation page
│   ├── 📁 css/             # Stylesheets
│   ├── 📁 js/              # Client-side scripts
│   └── 📁 images/          # Static image assets
├── 📁 database/            # Database files
├── 📄 server.js            # Main server file (1,800+ lines)
├── 📄 auth.js              # Authentication module
├── 📄 database.js          # Database management
├── 📄 reportAnalysis.js    # AI analysis engine
├── 📄 package.json         # Dependency management
└── 📄 .env.example         # Environment variable template
```

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/Godwind5/Blitz-Q.git
cd Blitz-Q
npm install
```

### 2. Environment Setup
Create a `.env` file and add the following:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# JWT Security Key
JWT_SECRET=your_super_secret_jwt_key

# Gemini AI API
GEMINI_API_KEY=your_gemini_api_key

# Session Security Key  
SESSION_SECRET=your_session_secret
```

### 3. Run Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 4. Open in Browser
Visit http://localhost:3000 to experience Blitz-Q!

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Standard login
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - Logout

### Team Management
- `GET /api/teams` - Get my teams
- `POST /api/teams` - Create new team
- `GET /api/teams/:teamId/members` - Get team members
- `POST /api/teams/:teamId/invite` - Generate invite code
- `POST /api/teams/join` - Join team with invite code

### Reports
- `POST /api/reports/:teamId` - Submit daily report
- `GET /api/reports/:teamId/user-latest` - Get my latest report
- `GET /api/reports/:reportId/analysis` - Get AI analysis results
- `GET /api/reports/team-summary/:teamId` - Get team comprehensive analysis

## 🏆 Award Story

Won **Grand Prize** among 19 teams at **Dankook University ZeroThon 2025** - a **national-level hackathon competition**!

🔗 **Official Event Links:**
- [ZeroThon 2025 Official Website](https://zerothon-2025.github.io/)
- [Dankook University Official Announcement](https://swcu.dankook.ac.kr/en/-5?p_p_id=dku_bbs_web_BbsPortlet&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_dku_bbs_web_BbsPortlet_cur=2&_dku_bbs_web_BbsPortlet_action=view_message&_dku_bbs_web_BbsPortlet_orderBy=createDate&_dku_bbs_web_BbsPortlet_bbsMessageId=25260)

### Development Process
- **Duration**: March 26-29, 2025 (100 hours)
- **Team**: 2 Backend, 3 Frontend developers
- **Presentation Order**: 18th out of 19 teams (overcame disadvantageous position!)

### Differentiating Factors
1. **Live Server Deployment**: Fully integrated frontend-backend complete product
2. **AI-powered Analysis**: Intelligent insights beyond simple compilation  
3. **Practicality**: Production-ready completion level for immediate business use

### Judge Panel
**Industry professionals from Toss, Naver, and financial public institutions** served as judges, providing thorough validation from a practical perspective.

### Presentation Highlight
> **"What's our team doing?"**
> 
> This single phrase captured the attention of judges and audience,
> leaving a strong impression despite being the second-to-last presentation.

## 📊 Performance Metrics

- **Total Code Lines**: 9,700+ lines
- **Core Server File**: 1,800+ lines (server.js)
- **API Endpoints**: 20+ endpoints
- **Completion Level**: Full frontend-backend integration

## 📝 Development Stories & Blogs
Check out the development process and experiences written by our team members!

- [Team Development Journey](https://velog.io/@orimuchim/단국대-제로톤신바람-참가-후기) - From project planning to winning the grand prize
- [Frontend Developer's Experience](https://velog.io/@limhwi/단국대-제로톤0329-후기) - UI/UX implementation and teamwork stories  
- [Detailed Development Process](https://velog.io/@minj_nn/2025.03.29-DKU-ZeroThon) - Technical challenges and solution processes

## 👥 Team Introduction

An innovative collaboration tool created by **Team Shinbaram**.

- **Backend**: Robust server architecture and AI analysis engine implementation
- **Frontend**: Intuitive and responsive user interface design
- **Planning**: Feature design reflecting real workplace needs

## 📄 License

This project is under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Join us in advancing Blitz-Q!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact

Feel free to reach out with any questions or suggestions about the project!

---

<div align="center">

**⚡ Blitz-Q: Setting New Standards for Team Collaboration ⚡**

Made with ❤️ by Team Shinbaram | Grand Prize Winner of Dankook University ZeroThon 2025

</div>
