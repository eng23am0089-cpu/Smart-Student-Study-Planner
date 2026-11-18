import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  BarChart3,
  History,
  Brain,
  Clock3,
  Target,
  AlertTriangle,
  Play,
  RefreshCw,
  ChevronRight,
  Menu,
  X,
  Plus,
  CheckCircle2,
  Timer,
  TrendingUp,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import "./index.css";


const STUDENT_ID = 2;

const API = "/api";


function App() {

  const [studentData, setStudentData] =
    useState(null);

  const [priorities, setPriorities] =
    useState([]);

  const [studyPlan, setStudyPlan] =
    useState([]);

  const [selectedSubjectPlan, setSelectedSubjectPlan] =
    useState(null);

  const [analysis, setAnalysis] =
    useState(null);

  const [history, setHistory] =
    useState(null);


  // Topic IDs with at least one completed study session.
  // Loaded from backend history so the tick survives refresh.
  const [completedTopicIds, setCompletedTopicIds] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [selectedTopic, setSelectedTopic] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================
  // LOAD ALL BACKEND DATA
  // ==========================================

  const loadDashboard = async () => {

    try {

      setRefreshing(true);

      setError("");

      const [
        studentResponse,
        priorityResponse,
        planResponse,
        analysisResponse,
        historyResponse,
      ] = await Promise.all([

        fetch(
          `${API}/students/${STUDENT_ID}/data`
        ),

        fetch(
          `${API}/students/${STUDENT_ID}/priorities`
        ),

        fetch(
          `${API}/students/${STUDENT_ID}/study-plan`
        ),

        fetch(
          `${API}/students/${STUDENT_ID}/analysis`
        ),

        fetch(
          `${API}/students/${STUDENT_ID}/study-sessions`
        ),

      ]);


      if (
        !studentResponse.ok ||
        !priorityResponse.ok ||
        !planResponse.ok ||
        !analysisResponse.ok ||
        !historyResponse.ok
      ) {

        throw new Error(
          "Backend returned an error."
        );

      }


      const studentJson =
        await studentResponse.json();

      const priorityJson =
        await priorityResponse.json();

      const planJson =
        await planResponse.json();

      const analysisJson =
        await analysisResponse.json();

      const historyJson =
        await historyResponse.json();


      setStudentData(
        studentJson
      );

      setPriorities(
        priorityJson.priorities || []
      );

      setStudyPlan(
        planJson.study_plan || []
      );

      setAnalysis(
        analysisJson.analysis || null
      );

      setHistory(
        historyJson
      );


      const completedIds = (
        historyJson.sessions || []
      )
        .filter(
          (session) =>
            session.status === "completed"
        )
        .map(
          (session) =>
            Number(session.topic_id)
        );

      setCompletedTopicIds(
        [...new Set(completedIds)]
      );

    } catch (err) {

      console.error(err);

      setError(
        "Unable to connect to backend. Make sure FastAPI is running."
      );

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  };


  useEffect(() => {

    loadDashboard();

  }, []);


  // ==========================================
  // MESSAGE
  // ==========================================

  const showMessage = (text) => {

    setMessage(text);

    setTimeout(() => {

      setMessage("");

    }, 3500);

  };


  const showError = (text) => {

    if (!text) {
      return;
    }

    setError(text);

    setTimeout(() => {

      setError("");

    }, 5000);

  };


  // ==========================================
  // NAVIGATION
  // ==========================================

  const navigate = (page) => {

    setActivePage(page);

    setMobileMenu(false);

  };


  // ==========================================
  // GET ALL TOPICS
  // ==========================================

  const getAllTopics = () => {

    if (!studentData?.subjects) {

      return [];

    }

    return studentData.subjects.flatMap(
      (subject) =>

        subject.topics.map(
          (topic) => ({

            ...topic,

            subject:
              subject.subject,

            subject_id:
              subject.subject_id,

            difficulty:
              subject.difficulty,

            exam_date:
              subject.exam_date,

          })
        )

    );

  };


  const getTotalTopics = () => {

    return getAllTopics().length;

  };


  const getCompletedTopics = () => {

    return getAllTopics().filter(
      (topic) =>
        topic.completed
    ).length;

  };


  const getAverageProgress = () => {

    const topics =
      getAllTopics();

    if (!topics.length) {

      return 0;

    }

    const total =
      topics.reduce(
        (sum, topic) =>
          sum +
          Number(
            topic.progress || 0
          ),
        0
      );

    return Math.round(
      total / topics.length
    );

  };


  // ==========================================
  // UPDATE TOPIC PROGRESS
  // ==========================================

  const updateTopicProgress = async (
    topicId,
    progress,
    confidence
  ) => {

    try {

      const params =
        new URLSearchParams({

          progress:
            String(progress),

          confidence:
            String(confidence),

        });


      const response =
        await fetch(
          `${API}/topics/${topicId}/progress?${params}`,
          {
            method: "PUT",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Failed to update progress"
        );

      }


      showMessage(
        "Topic progress updated successfully!"
      );


      await loadDashboard();

    } catch (err) {

      console.error(err);

      showError(
        err.message
      );

    }

  };


  // ==========================================
  // CREATE STUDY SESSION
  // ==========================================

  const createStudySession = async (
    topicId,
    minutes
  ) => {

    try {

      const params =
        new URLSearchParams({

          student_id:
            String(STUDENT_ID),

          topic_id:
            String(topicId),

          planned_minutes:
            String(minutes),

        });


      const response =
        await fetch(
          `${API}/study-sessions?${params}`,
          {
            method: "POST",
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Could not create study session"
        );

      }


      showMessage(
        `Study session #${data.session_id} created!`
      );


      await loadDashboard();

      return data;

    } catch (err) {

      console.error(err);

      showError(
        err.message
      );

      return null;

    }

  };


  // ==========================================
  // COMPLETE STUDY SESSION
  // ==========================================

  const completeStudySession =
    async (
      sessionId,
      actualMinutes
    ) => {

      try {

        const params =
          new URLSearchParams({

            actual_minutes:
              String(actualMinutes),

          });


        const response =
          await fetch(
            `${API}/study-sessions/${sessionId}/complete?${params}`,
            {
              method: "PUT",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Could not complete session"
          );

        }


        showMessage(
          `Session completed! Adherence: ${data.adherence_percentage}%`
        );


        await loadDashboard();

        return data;

      } catch (err) {

        console.error(err);

        showError(
          err.message
        );

        return null;

      }

    };


  // ==========================================
  // CHART DATA
  // ==========================================

  const chartData =
    history?.sessions
      ?.slice()
      .reverse()
      .map(
        (session, index) => ({

          session:
            `S${index + 1}`,

          hours:
            Number(
              session.actual_minutes || 0
            ) / 60,

        })
      ) || [];


  // ==========================================
  // DASHBOARD
  // ==========================================

  const renderDashboard = () => {

    const recommended =
      priorities[0];


    return (

      <>

        <section className="welcome-section">

          <div>

            <p className="eyebrow">
              STUDY OVERVIEW
            </p>

            <h1>

              Good morning,{" "}

              <span>
                {
                  studentData?.student ||
                  "Student"
                } 👋
              </span>

            </h1>

            <p className="welcome-text">

              Here's your personalized
              study overview.

            </p>

          </div>


          <button
            className="refresh-button"
            onClick={
              loadDashboard
            }
          >

            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            Refresh

          </button>

        </section>


        <section className="stats-grid">

          <StatCard
            icon={
              <Clock3 size={21} />
            }
            label="Daily Study Goal"
            value={`${
              studentData?.daily_study_hours ||
              0
            } hrs`}
            description="Available today"
          />


          <StatCard
            icon={
              <Target size={21} />
            }
            label="Study Adherence"
            value={`${
              analysis?.study_adherence_percentage ||
              0
            }%`}
            description={
              analysis?.study_behavior ||
              "No study history"
            }
          />


          <StatCard
            icon={
              <BookOpen size={21} />
            }
            label="Active Topics"
            value={
              analysis?.total_active_topics ||
              0
            }
            description={`${
              getCompletedTopics()
            } completed`}
          />


          <StatCard
            icon={
              <AlertTriangle
                size={21}
              />
            }
            label="Weak Topics"
            value={
              analysis?.weak_topics?.length ||
              0
            }
            description="Need focused attention"
            alert
          />

        </section>


        <section className="dashboard-grid">


          <div className="panel plan-panel">

            <div className="panel-header">

              <div>

                <p className="panel-kicker">
                  PERSONALIZED
                </p>

                <h2>
                  Today's Study Plan
                </h2>

              </div>


              <button
                className="icon-button"
                onClick={() =>
                  navigate(
                    "Study Plan"
                  )
                }
              >

                <ChevronRight
                  size={20}
                />

              </button>

            </div>


            <div className="plan-list">

              {studyPlan.length > 0 ? (

                studyPlan.map(
                  (session, index) => (

                    <div
                      className="plan-item"
                      key={
                        session.topic_id
                      }
                    >

                      <div className="plan-number">

                        {
                          index + 1
                        }

                      </div>


                      <div className="plan-info">

                        <div className="plan-title-row">

                          <h3>
                            {
                              session.topic
                            }
                          </h3>

                          <span
                            className={`priority-badge ${session.priority_level.toLowerCase()}`}
                          >
                            {
                              session.priority_level
                            }
                          </span>

                        </div>


                        <p>
                          {
                            session.subject
                          }
                        </p>


                        <div className="plan-progress">

                          <div
                            className="plan-progress-bar"
                            style={{
                              width:
                                `${Math.min(
                                  100,
                                  session.priority_score *
                                    10
                                )}%`,
                            }}
                          />

                        </div>

                      </div>


                      <div className="plan-time">

                        <strong>
                          {
                            session.planned_minutes
                          }
                        </strong>

                        <span>
                          min
                        </span>

                      </div>

                    </div>

                  )
                )

              ) : (

                <EmptyState
                  message="No study plan available."
                />

              )}

            </div>


            <button
              className="primary-button full-width"
              onClick={() =>
                navigate(
                  "Study Plan"
                )
              }
            >

              <CalendarDays
                size={18}
              />

              View Complete Study Plan

            </button>

          </div>


          <div className="smart-card">

            <div className="smart-icon">

              <Brain size={27} />

            </div>


            <p className="panel-kicker">
              SMART STUDY ASSISTANT
            </p>


            <h2>
              What should I study now?
            </h2>


            {recommended ? (

              <>

                <p className="smart-description">

                  Based on your exam
                  urgency, progress,
                  confidence and difficulty.

                </p>


                <div className="recommended-topic">

                  <div>

                    <span>
                      RECOMMENDED TOPIC
                    </span>

                    <h3>
                      {
                        recommended.topic
                      }
                    </h3>

                    <p>
                      {
                        recommended.subject
                      }
                    </p>

                  </div>


                  <div className="score-circle">

                    {
                      recommended.priority_score
                    }

                  </div>

                </div>


                <button
                  className="smart-button"
                  onClick={() => {

                    setSelectedTopic(
                      recommended
                    );

                    navigate(
                      "Study Session"
                    );

                  }}
                >

                  <Play
                    size={18}
                    fill="currentColor"
                  />

                  Start Smart Session

                </button>

              </>

            ) : (

              <p className="smart-description">

                Add subjects and topics
                to receive a recommendation.

              </p>

            )}

          </div>

        </section>


        <section className="dashboard-grid lower-grid">

          <div className="panel">

            <div className="panel-header">

              <div>

                <p className="panel-kicker">
                  LEARNING STATUS
                </p>

                <h2>
                  Overall Progress
                </h2>

              </div>


              <span className="large-percentage">

                {getAverageProgress()}%

              </span>

            </div>


            <div className="large-progress">

              <div
                style={{
                  width:
                    `${getAverageProgress()}%`,
                }}
              />

            </div>


            <div className="progress-summary">

              <div>

                <strong>
                  {
                    getCompletedTopics()
                  }
                </strong>

                <span>
                  Completed
                </span>

              </div>


              <div>

                <strong>
                  {
                    getTotalTopics() -
                    getCompletedTopics()
                  }
                </strong>

                <span>
                  Remaining
                </span>

              </div>


              <div>

                <strong>
                  {
                    getTotalTopics()
                  }
                </strong>

                <span>
                  Total Topics
                </span>

              </div>

            </div>

          </div>


          <div className="panel chart-panel">

            <div className="panel-header">

              <div>

                <p className="panel-kicker">
                  DATABASE ACTIVITY
                </p>

                <h2>
                  Study Activity
                </h2>

              </div>

              <BarChart3
                size={21}
              />

            </div>


            <div className="chart-container">

              {chartData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={chartData}
                  >

                    <XAxis
                      dataKey="session"
                      axisLine={false}
                      tickLine={false}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />

                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="hours"
                      strokeWidth={2}
                      fillOpacity={0.15}
                    />

                  </AreaChart>

                </ResponsiveContainer>

              ) : (

                <EmptyState
                  message="Complete study sessions to see activity."
                />

              )}

            </div>

          </div>

        </section>


        <section className="panel weak-panel">

          <div className="panel-header">

            <div>

              <p className="panel-kicker">
                PRIORITY ENGINE
              </p>

              <h2>
                Topics Needing Attention
              </h2>

            </div>


            <button
              className="text-button"
              onClick={() =>
                navigate(
                  "Progress"
                )
              }
            >

              View Analysis

              <ChevronRight
                size={17}
              />

            </button>

          </div>


          <div className="topic-grid">

            {priorities
              .slice(0, 4)
              .map(
                (topic) => (

                  <div
                    className="topic-card"
                    key={
                      topic.topic_id
                    }
                  >

                    <div className="topic-card-top">

                      <span
                        className={`priority-dot ${topic.priority_level.toLowerCase()}`}
                      />

                      <span
                        className={`priority-badge ${topic.priority_level.toLowerCase()}`}
                      >
                        {
                          topic.priority_level
                        }
                      </span>

                    </div>


                    <h3>
                      {
                        topic.topic
                      }
                    </h3>

                    <p>
                      {
                        topic.subject
                      }
                    </p>


                    <div className="topic-score">

                      <span>
                        Priority score
                      </span>

                      <strong>

                        {
                          topic.priority_score
                        }

                        /10

                      </strong>

                    </div>

                  </div>

                )
              )}

          </div>

        </section>

      </>

    );

  };


  // ==========================================
  // PAGE ROUTER
  // ==========================================

  const renderPage = () => {

    switch (activePage) {


      case "Subjects":

        return (

          <SubjectsPage

            studentData={
              studentData
            }

            refresh={
              loadDashboard
            }

            showMessage={
              showMessage
            }

            showError={
              showError
            }

            setSelectedTopic={
              setSelectedTopic
            }

            setSelectedSubjectPlan={
              setSelectedSubjectPlan
            }

            completedTopicIds={
              completedTopicIds
            }

            navigate={
              navigate
            }

          />

        );


      case "Study Plan":

        return (

          <StudyPlanPage

            studyPlan={
              selectedSubjectPlan
                ? selectedSubjectPlan.study_plan || []
                : studyPlan
            }

            selectedPlan={
              selectedSubjectPlan
            }

            setSelectedTopic={
              setSelectedTopic
            }

            completedTopicIds={
              completedTopicIds
            }

            navigate={
              navigate
            }

          />

        );


      case "Study Session":

        return (

          <StudySessionPage

            topic={
              selectedTopic ||
              priorities[0]
            }

            createSession={
              createStudySession
            }

            completeSession={
              completeStudySession
            }

          />

        );


      case "Progress":

        return (

          <ProgressPage

            studentData={
              studentData
            }

            analysis={
              analysis
            }

            priorities={
              priorities
            }

            updateTopicProgress={
              updateTopicProgress
            }

          />

        );


      case "History":

        return (

          <HistoryPage
            history={
              history
            }
          />

        );


      case "AI Planner":

        return (

          <AIPlannerPage

            priorities={
              priorities
            }

            analysis={
              analysis
            }

            setSelectedTopic={
              setSelectedTopic
            }

            navigate={
              navigate
            }

          />

        );


      default:

        return renderDashboard();

    }

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="loading-screen">

        <div className="loading-logo">

          <Brain size={30} />

        </div>

        <h2>
          Smart Study Planner
        </h2>

        <p>
          Loading your study data...
        </p>

        <div className="loader" />

      </div>

    );

  }


  // ==========================================
  // MAIN UI
  // ==========================================

  return (

    <div className="app-shell">


      <aside
        className={`sidebar ${
          mobileMenu
            ? "open"
            : ""
        }`}
      >

        <div className="brand">

          <div className="brand-icon">

            <Brain size={23} />

          </div>


          <div>

            <h2>
              StudyFlow
            </h2>

            <span>
              Smart Planner
            </span>

          </div>


          <button
            className="mobile-close"
            onClick={() =>
              setMobileMenu(false)
            }
          >

            <X size={21} />

          </button>

        </div>


        <nav>

          <NavItem
            icon={
              <LayoutDashboard
                size={19}
              />
            }
            label="Dashboard"
            active={
              activePage ===
              "Dashboard"
            }
            onClick={() =>
              navigate(
                "Dashboard"
              )
            }
          />


          <NavItem
            icon={
              <BookOpen
                size={19}
              />
            }
            label="Subjects"
            active={
              activePage ===
              "Subjects"
            }
            onClick={() =>
              navigate(
                "Subjects"
              )
            }
          />


          <NavItem
            icon={
              <CalendarDays
                size={19}
              />
            }
            label="Study Plan"
            active={
              activePage ===
              "Study Plan"
            }
            onClick={() =>
              navigate(
                "Study Plan"
              )
            }
          />


          <NavItem
            icon={
              <Play size={19} />
            }
            label="Study Session"
            active={
              activePage ===
              "Study Session"
            }
            onClick={() =>
              navigate(
                "Study Session"
              )
            }
          />


          <NavItem
            icon={
              <BarChart3
                size={19}
              />
            }
            label="Progress"
            active={
              activePage ===
              "Progress"
            }
            onClick={() =>
              navigate(
                "Progress"
              )
            }
          />


          <NavItem
            icon={
              <History
                size={19}
              />
            }
            label="History"
            active={
              activePage ===
              "History"
            }
            onClick={() =>
              navigate(
                "History"
              )
            }
          />


          <div className="nav-divider" />


          <NavItem
            icon={
              <Brain size={19} />
            }
            label="AI Planner"
            active={
              activePage ===
              "AI Planner"
            }
            onClick={() =>
              navigate(
                "AI Planner"
              )
            }
            special
          />

        </nav>


        <div className="sidebar-bottom">

          <div className="student-mini">

            <div className="avatar">

              {(
                studentData?.student ||
                "S"
              )
                .charAt(0)
                .toUpperCase()}

            </div>


            <div>

              <strong>
                {
                  studentData?.student ||
                  "Student"
                }
              </strong>

              <span>
                Student
              </span>

            </div>

          </div>

        </div>

      </aside>


      {mobileMenu && (

        <div
          className="mobile-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
        />

      )}


      <main className="main-content">

        <header className="topbar">

          <button
            className="mobile-menu-button"
            onClick={() =>
              setMobileMenu(true)
            }
          >

            <Menu size={22} />

          </button>


          <div className="topbar-title">

            Smart Student Study Planner

          </div>


          <div className="topbar-right">

            <div className="status-indicator">

              <span />

              System active

            </div>


            <div className="top-avatar">

              {(
                studentData?.student ||
                "S"
              )
                .charAt(0)
                .toUpperCase()}

            </div>

          </div>

        </header>


        {message && (

          <div className="success-toast">

            <CheckCircle2
              size={18}
            />

            {message}

          </div>

        )}


        {error && (

          <div className="error-banner">

            {error}

          </div>

        )}


        <div className="page-content">

          {renderPage()}

        </div>

      </main>

    </div>

  );

}


// ==========================================
// NAV ITEM
// ==========================================

function NavItem({
  icon,
  label,
  active,
  onClick,
  special = false,
}) {

  return (

    <button
      className={`nav-item ${
        active
          ? "active"
          : ""
      } ${
        special
          ? "special"
          : ""
      }`}
      onClick={
        onClick
      }
    >

      {icon}

      <span>
        {label}
      </span>

    </button>

  );

}


// ==========================================
// STAT CARD
// ==========================================

function StatCard({
  icon,
  label,
  value,
  description,
  alert = false,
}) {

  return (

    <div
      className={`stat-card ${
        alert
          ? "alert-card"
          : ""
      }`}
    >

      <div className="stat-top">

        <div className="stat-icon">

          {icon}

        </div>

      </div>


      <p>
        {label}
      </p>

      <h2>
        {value}
      </h2>

      <span>
        {description}
      </span>

    </div>

  );

}


// ==========================================
// PAGE HEADING
// ==========================================

function PageHeading({
  eyebrow,
  title,
  description,
  icon,
}) {

  return (

    <section className="module-heading">

      <div className="module-heading-icon">

        {icon}

      </div>


      <div>

        <p className="panel-kicker">
          {eyebrow}
        </p>

        <h1>
          {title}
        </h1>

        <p>
          {description}
        </p>

      </div>

    </section>

  );

}


// ==========================================
// SUBJECTS PAGE
// ==========================================

function SubjectsPage({
  studentData,
  refresh,
  showMessage,
  showError,
  setSelectedTopic,
  setSelectedSubjectPlan,
  completedTopicIds = [],
  navigate,
}) {

  const [showSubjectForm, setShowSubjectForm] =
    useState(false);

  const [topicSubjectId, setTopicSubjectId] =
    useState(null);

  const [subjectName, setSubjectName] =
    useState("");

  const [difficulty, setDifficulty] =
    useState(3);

  const [examDate, setExamDate] =
    useState("");

  const [subjectHours, setSubjectHours] =
    useState({});

  const [topicName, setTopicName] =
    useState("");

  const [topicProgress, setTopicProgress] =
    useState(0);

  const [topicConfidence, setTopicConfidence] =
    useState(0);

  const [subjectPlan, setSubjectPlan] =
    useState(null);

  const [subjectPlanLoading, setSubjectPlanLoading] =
    useState(false);


  // ==========================================
  // SUBJECT HOURS
  // ==========================================

  useEffect(() => {

    if (!studentData?.subjects) {

      return;

    }

    const hours = {};

    studentData.subjects.forEach(
      (subject) => {

        hours[
          subject.subject_id
        ] =
          subject.daily_study_hours ??
          1;

      }
    );

    setSubjectHours(
      hours
    );

  }, [studentData]);


  // ==========================================
  // CREATE SUBJECT
  // ==========================================

  const createSubject =
    async (e) => {

      e.preventDefault();


      if (
        !subjectName.trim() ||
        !examDate
      ) {

        showError(
          "Please enter subject name and exam date."
        );

        return;

      }


      const allocatedHours =
        Number(
          subjectHours.newSubject ||
          1
        );


      const totalHours =
        Number(
          studentData?.daily_study_hours ||
          0
        );


      if (
        allocatedHours <= 0 ||
        allocatedHours > totalHours
      ) {

        showError(
          `Subject hours must be between 0 and ${totalHours} hours.`
        );

        return;

      }


      try {

        const params =
          new URLSearchParams({

            name:
              subjectName.trim(),

            difficulty:
              String(difficulty),

            exam_date:
              examDate,

            student_id:
              String(STUDENT_ID),

            daily_study_hours:
              String(
                allocatedHours
              ),

          });


        const response =
          await fetch(
            `${API}/subjects?${params}`,
            {
              method: "POST",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to create subject"
          );

        }


        setSubjectName("");

        setDifficulty(3);

        setExamDate("");

        setShowSubjectForm(
          false
        );


        showMessage(
          "Subject created successfully!"
        );


        await refresh();

      } catch (err) {

        console.error(err);

        showError(
          err.message
        );

      }

    };


  // ==========================================
  // CREATE TOPIC
  // ==========================================

  const createTopic =
    async (
      e,
      subjectId
    ) => {

      e.preventDefault();


      if (!topicName.trim()) {

        showError(
          "Please enter a topic name."
        );

        return;

      }


      try {

        const params =
          new URLSearchParams({

            name:
              topicName.trim(),

            subject_id:
              String(subjectId),

          });


        const response =
          await fetch(
            `${API}/topics?${params}`,
            {
              method: "POST",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to create topic"
          );

        }


        setTopicName("");

        setTopicSubjectId(
          null
        );


        showMessage(
          "Topic created successfully!"
        );


        await refresh();


        // Set initial progress
        // and confidence after creation.

        if (
          Number(topicProgress) !== 0 ||
          Number(topicConfidence) !== 0
        ) {

          const progressParams =
            new URLSearchParams({

              progress:
                String(
                  topicProgress
                ),

              confidence:
                String(
                  topicConfidence
                ),

            });


          await fetch(
            `${API}/topics/${data.topic_id}/progress?${progressParams}`,
            {
              method: "PUT",
            }
          );


          setTopicProgress(0);

          setTopicConfidence(0);

          await refresh();

        }

      } catch (err) {

        console.error(err);

        showError(
          err.message
        );

      }

    };


  // ==========================================
  // UPDATE SUBJECT HOURS
  // ==========================================

  const updateSubjectHours =
    async (subjectId) => {

      const hours =
        Number(
          subjectHours[
            subjectId
          ]
        );


      const totalHours =
        Number(
          studentData?.daily_study_hours ||
          0
        );


      if (
        !hours ||
        hours <= 0
      ) {

        showError(
          "Study hours must be greater than 0."
        );

        return;

      }


      if (
        hours > totalHours
      ) {

        showError(
          `Subject hours cannot exceed ${totalHours} hours.`
        );

        return;

      }


      try {

        const params =
          new URLSearchParams({

            daily_study_hours:
              String(hours),

          });


        const response =
          await fetch(
            `${API}/subjects/${subjectId}/study-hours?${params}`,
            {
              method: "PUT",
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Failed to update subject study hours"
          );

        }


        showMessage(
          "Subject study hours updated!"
        );


        await refresh();

      } catch (err) {

        console.error(err);

        showError(
          err.message
        );

      }

    };


  // ==========================================
  // GENERATE SUBJECT PLAN
  // ==========================================

  const generateSubjectPlan =
    async (subject) => {

      try {

        setSubjectPlanLoading(
          true
        );

        setSubjectPlan(
          null
        );


        const response =
          await fetch(
            `${API}/students/${STUDENT_ID}/subjects/${subject.subject_id}/study-plan`
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            "Could not generate subject plan"
          );

        }


        // Store plan locally
        setSubjectPlan(
          data
        );


        // IMPORTANT:
        // Store selected subject plan
        // in the main App.

        setSelectedSubjectPlan(
          data
        );


        showMessage(
          `${data.subject} study plan generated!`
        );

      } catch (err) {

        console.error(err);

        showError(
          err.message
        );

      } finally {

        setSubjectPlanLoading(
          false
        );

      }

    };


  // ==========================================
  // OPEN OVERALL STUDY PLAN
  // ==========================================

  const openOverallPlan =
    () => {

      setSelectedSubjectPlan(
        null
      );

      navigate(
        "Study Plan"
      );

    };


  return (

    <div className="module-page">


      <PageHeading

        eyebrow="LEARNING STRUCTURE"

        title="Subjects & Topics"

        description="Manage subjects, exam dates, study time allocation and individual learning topics."

        icon={
          <BookOpen
            size={25}
          />
        }

      />


      <div className="action-row">

        <button
          className="primary-button"
          onClick={() =>
            setShowSubjectForm(
              !showSubjectForm
            )
          }
        >

          <Plus size={17} />

          Add Subject

        </button>

      </div>


      {/* ======================================
          ADD SUBJECT
      ====================================== */}

      {showSubjectForm && (

        <form
          className="form-panel"
          onSubmit={
            createSubject
          }
        >

          <h2>
            Create New Subject
          </h2>


          <div className="form-grid">

            <div className="form-field">

              <label>
                Subject Name
              </label>

              <input
                value={
                  subjectName
                }
                onChange={(e) =>
                  setSubjectName(
                    e.target.value
                  )
                }
                placeholder="Example: Deep Learning"
              />

            </div>


            <div className="form-field">

              <label>
                Difficulty (1-5)
              </label>

              <input
                type="number"
                min="1"
                max="5"
                value={
                  difficulty
                }
                onChange={(e) =>
                  setDifficulty(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="form-field">

              <label>
                Exam Date
              </label>

              <input
                type="date"
                value={
                  examDate
                }
                onChange={(e) =>
                  setExamDate(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="form-field">

              <label>
                Daily Study Time
              </label>

              <input
                type="number"
                min="0.25"
                step="0.25"
                value={
                  subjectHours.newSubject ??
                  1
                }
                onChange={(e) =>
                  setSubjectHours({
                    ...subjectHours,
                    newSubject:
                      e.target.value,
                  })
                }
              />

              <small>
                Maximum:{" "}
                {
                  studentData?.daily_study_hours ||
                  0
                }{" "}
                hrs/day
              </small>

            </div>

          </div>


          <button
            className="primary-button"
          >

            <Plus size={16} />

            Create Subject

          </button>

        </form>

      )}


      {/* ======================================
          SUBJECTS
      ====================================== */}

      <div className="subjects-list">

        {studentData?.subjects?.map(
          (subject) => (

            <div
              className="subject-panel"
              key={
                subject.subject_id
              }
            >

              <div className="subject-header">

                <div className="subject-title">

                  <div className="subject-icon">

                    <GraduationCap
                      size={21}
                    />

                  </div>


                  <div>

                    <h2>
                      {
                        subject.subject
                      }
                    </h2>

                    <p>

                      Difficulty:{" "}
                      {
                        subject.difficulty
                      }
                      /5

                      {" • "}

                      Exam:{" "}
                      {
                        subject.exam_date
                      }

                    </p>

                  </div>

                </div>


                <div className="subject-header-actions">


                  {/* STUDY HOURS */}

                  <div className="subject-hours-control">

                    <label>
                      Study Time
                    </label>


                    <div className="subject-hours-input">

                      <input
                        type="number"
                        min="0.25"
                        step="0.25"
                        value={
                          subjectHours[
                            subject.subject_id
                          ] ??
                          subject.daily_study_hours ??
                          1
                        }
                        onChange={(e) =>
                          setSubjectHours({

                            ...subjectHours,

                            [subject.subject_id]:
                              e.target.value,

                          })
                        }
                      />

                      <span>
                        hrs/day
                      </span>

                    </div>


                    <button
                      type="button"
                      className="outline-button"
                      onClick={() =>
                        updateSubjectHours(
                          subject.subject_id
                        )
                      }
                    >

                      Save

                    </button>

                  </div>


                  {/* GENERATE SUBJECT PLAN */}

                  <button
                    type="button"
                    className="outline-button"
                    onClick={() =>
                      generateSubjectPlan(
                        subject
                      )
                    }
                    disabled={
                      subjectPlanLoading
                    }
                  >

                    <Sparkles
                      size={16}
                    />

                    {
                      subjectPlanLoading
                        ? "Generating..."
                        : "Generate Plan"
                    }

                  </button>


                  {/* ADD TOPIC */}

                  <button
                    type="button"
                    className="outline-button"
                    onClick={() =>
                      setTopicSubjectId(
                        topicSubjectId ===
                        subject.subject_id
                          ? null
                          : subject.subject_id
                      )
                    }
                  >

                    <Plus size={16} />

                    Add Topic

                  </button>

                </div>

              </div>


              {/* ADD TOPIC FORM */}

              {topicSubjectId ===
                subject.subject_id && (

                <form
                  className="form-panel"
                  onSubmit={(e) =>
                    createTopic(
                      e,
                      subject.subject_id
                    )
                  }
                >

                  <h2>
                    Add Topic
                  </h2>


                  <div className="form-grid">

                    <div className="form-field">

                      <label>
                        Topic Name
                      </label>

                      <input
                        value={
                          topicName
                        }
                        onChange={(e) =>
                          setTopicName(
                            e.target.value
                          )
                        }
                        placeholder="Example: SVM"
                      />

                    </div>


                    <div className="form-field">

                      <label>
                        Initial Progress %
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={
                          topicProgress
                        }
                        onChange={(e) =>
                          setTopicProgress(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    <div className="form-field">

                      <label>
                        Confidence /10
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={
                          topicConfidence
                        }
                        onChange={(e) =>
                          setTopicConfidence(
                            e.target.value
                          )
                        }
                      />

                    </div>

                  </div>


                  <button
                    className="primary-button"
                  >

                    <Plus size={16} />

                    Add Topic

                  </button>

                </form>

              )}


              {/* TOPIC LIST */}

              <div className="subject-topic-list">

                {subject.topics.length > 0 ? (

                  subject.topics.map(
                    (topic) => (

                      <div
                        className="subject-topic"
                        key={
                          topic.topic_id
                        }
                      >

                        <div>

                          <strong>
                            {
                              topic.topic
                            }
                          </strong>


                          {completedTopicIds.includes(
                            Number(topic.topic_id)
                          ) && (
                            <span className="topic-completed-badge">
                              <CheckCircle2 size={15} />
                              Completed
                            </span>
                          )}

                          <div className="mini-progress">

                            <div
                              style={{
                                width:
                                  `${topic.progress}%`,
                              }}
                            />

                          </div>

                        </div>


                        <div className="topic-percent">

                          {
                            topic.progress
                          }%

                        </div>


                        <span className="confidence-label">

                          Confidence:{" "}
                          {
                            topic.confidence
                          }/10

                        </span>


                        {topic.completed && (

                          <CheckCircle2
                            size={18}
                            className="completed-icon"
                          />

                        )}

                      </div>

                    )
                  )

                ) : (

                  <EmptyState
                    message="No topics added yet."
                  />

                )}

              </div>

            </div>

          )
        )}

      </div>


      {/* ======================================
          SUBJECT PLAN MODAL
      ====================================== */}

      {subjectPlan && (

        <div
          className="plan-modal-overlay"
          onClick={() =>
            setSubjectPlan(null)
          }
        >

          <div
            className="plan-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="plan-modal-header">

              <div>

                <p className="panel-kicker">

                  SUBJECT-SPECIFIC PLAN

                </p>

                <h2>
                  {
                    subjectPlan.subject
                  }
                </h2>

                <p>

                  Difficulty:{" "}
                  {
                    subjectPlan.difficulty
                  }
                  /5

                  {" • "}

                  Exam:{" "}
                  {
                    subjectPlan.exam_date
                  }

                </p>

              </div>


              <button
                className="icon-button"
                onClick={() =>
                  setSubjectPlan(
                    null
                  )
                }
              >

                <X size={20} />

              </button>

            </div>


            <div className="subject-plan-summary">

              <div>

                <span>
                  Topics
                </span>

                <strong>
                  {
                    subjectPlan.total_topics
                  }
                </strong>

              </div>


              <div>

                <span>
                  Planned Time
                </span>

                <strong>
                  {
                    subjectPlan.total_planned_minutes
                  }{" "}
                  min
                </strong>

              </div>


              <div>

                <span>
                  Daily Allocation
                </span>

                <strong>
                  {
                    subjectPlan.daily_study_hours
                  }{" "}
                  hrs
                </strong>

              </div>

            </div>


            <div className="subject-plan-list">

              {subjectPlan.study_plan?.map(
                (item, index) => (

                  <div
                    className="subject-plan-item"
                    key={
                      item.topic_id
                    }
                  >

                    <div className="plan-number">

                      {
                        index + 1
                      }

                    </div>


                    <div className="subject-plan-info">

                      <div className="plan-title-row">

                        <h3>
                          {
                            item.topic
                          }
                        </h3>

                        <span
                          className={`priority-badge ${item.priority_level.toLowerCase()}`}
                        >
                          {
                            item.priority_level
                          }
                        </span>

                          {completedTopicIds.includes(
                            Number(item.topic_id)
                          ) && (
                            <span className="topic-completed-badge">
                              <CheckCircle2 size={14} />
                              Completed
                            </span>
                          )}

                      </div>


                      <p>

                        Priority score:{" "}

                        <strong>
                          {
                            item.priority_score
                          }
                          /10
                        </strong>

                      </p>

                    </div>


                    <div className="subject-plan-time">

                      <strong>
                        {
                          item.planned_minutes
                        }
                      </strong>

                      <span>
                        min
                      </span>

                    </div>


                    <button
                      type="button"
                      className="primary-button small-button"
                      onClick={() => {

                        setSelectedTopic(
                          item
                        );

                        setSubjectPlan(
                          null
                        );

                        navigate(
                          "Study Session"
                        );

                      }}
                    >

                      <Play size={15} />

                      Start

                    </button>

                  </div>

                )
              )}

            </div>


            <div className="plan-modal-footer">

              <button
                className="outline-button"
                onClick={() =>
                  setSubjectPlan(
                    null
                  )
                }
              >

                Close

              </button>


              <button
                className="primary-button"
                onClick={() => {

                  setSubjectPlan(
                    null
                  );

                  navigate(
                    "Study Plan"
                  );

                }}
              >

                <CalendarDays
                  size={16}
                />

                Open This Study Plan

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


// ==========================================
// STUDY PLAN PAGE
// ==========================================

function StudyPlanPage({
  studyPlan,
  selectedPlan,
  setSelectedTopic,
  completedTopicIds = [],
  navigate,
}) {

  const totalMinutes =
    studyPlan.reduce(
      (sum, item) =>
        sum +
        Number(
          item.planned_minutes || 0
        ),
      0
    );


  return (

    <div className="module-page">

      <PageHeading

        eyebrow={
          selectedPlan
            ? "SUBJECT-SPECIFIC PLAN"
            : "ADAPTIVE PLANNING"
        }

        title={
          selectedPlan
            ? `${selectedPlan.subject} Study Plan`
            : "Today's Study Plan"
        }

        description={
          selectedPlan
            ? `Personalized plan for ${selectedPlan.subject}, using ${selectedPlan.daily_study_hours} hours allocated to this subject.`
            : "Generated from urgency, remaining work, weakness and difficulty."
        }

        icon={
          <CalendarDays
            size={25}
          />
        }

      />


      {selectedPlan && (

        <div className="selected-plan-banner">

          <Sparkles size={18} />

          <span>

            Showing plan for{" "}

            <strong>
              {
                selectedPlan.subject
              }
            </strong>

            {" • "}

            {
              selectedPlan.daily_study_hours
            }

            {" hours/day"}

          </span>


          <button
            className="outline-button"
            onClick={() => {

              // Return to overall
              // student plan.

              window.location.reload();

            }}
          >

            Overall Plan

          </button>

        </div>

      )}


      <div className="plan-summary-grid">

        <SummaryCard
          icon={
            <Clock3 size={20} />
          }
          label="Planned Time"
          value={
            `${totalMinutes} min`
          }
        />


        <SummaryCard
          icon={
            <BookOpen size={20} />
          }
          label="Study Tasks"
          value={
            studyPlan.length
          }
        />


        <SummaryCard
          icon={
            <Target size={20} />
          }
          label="High Priority"
          value={
            studyPlan.filter(
              (item) =>
                item.priority_level ===
                "HIGH"
            ).length
          }
        />

      </div>


      <div className="full-plan-list">

        {studyPlan.length > 0 ? (

          studyPlan.map(
            (item, index) => (

              <div
                className="full-plan-card"
                key={
                  item.topic_id
                }
              >

                <div className="full-plan-number">

                  {
                    index + 1
                  }

                </div>


                <div className="full-plan-content">

                  <div className="full-plan-title">

                    <h2>
                      {
                        item.topic
                      }
                    </h2>

                    <span
                      className={`priority-badge ${item.priority_level.toLowerCase()}`}
                    >
                      {
                        item.priority_level
                      }
                    </span>

                  </div>


                  <p>
                    {
                      item.subject
                    }
                  </p>


                  <div className="priority-factors">

                    Priority score:{" "}

                    <strong>
                      {
                        item.priority_score
                      }
                      /10
                    </strong>

                  </div>

                </div>


                <div className="full-plan-time">

                  <strong>
                    {
                      item.planned_minutes
                    }
                  </strong>

                  <span>
                    minutes
                  </span>

                </div>
                {completedTopicIds.includes(
                  Number(item.topic_id)
                ) ? (
                  <div className="completed-plan-status">
                    <CheckCircle2 size={18} />
                    <span>Completed</span>
                  </div>
                ) : (
                  


                <button
                  className="primary-button"
                  onClick={() => {

                    setSelectedTopic(
                      item
                    );

                    navigate(
                      "Study Session"
                    );

                  }}
                >

                  <Play size={16} />

                  Start

                </button>
                )}

              </div>

            )
          )

        ) : (

          <div className="panel">

            <EmptyState
              message="No incomplete topics available."
            />

          </div>

        )}

      </div>

    </div>

  );

}


// ==========================================
// STUDY SESSION PAGE
// ==========================================

function StudySessionPage({
  topic,
  createSession,
  completeSession,
}) {

  const [plannedMinutes,
    setPlannedMinutes] =
    useState(
      topic?.planned_minutes ||
      60
    );


  const [actualMinutes,
    setActualMinutes] =
    useState("");


  const [sessionId,
    setSessionId] =
    useState(null);


  const [started,
    setStarted] =
    useState(false);


  const startSession =
    async () => {

      if (!topic) {

        return;

      }


      const data =
        await createSession(
          topic.topic_id,
          Number(
            plannedMinutes
          )
        );


      if (data) {

        setSessionId(
          data.session_id
        );

        setStarted(
          true
        );

      }

    };


  const finishSession =
    async () => {

      if (!sessionId) {

        return;

      }


      const minutes =
        Number(
          actualMinutes
        );


      if (
        Number.isNaN(
          minutes
        ) ||
        minutes < 0
      ) {

        return;

      }


      const result =
        await completeSession(
          sessionId,
          minutes
        );


      if (result) {

        setStarted(
          false
        );

        setSessionId(
          null
        );

        setActualMinutes(
          ""
        );

      }

    };


  return (

    <div className="module-page">

      <PageHeading

        eyebrow="FOCUSED LEARNING"

        title="Study Session"

        description="Record your actual study time so the planner can learn from your behavior."

        icon={
          <Timer size={25} />
        }

      />


      {!topic ? (

        <div className="panel empty-large">

          <Brain size={35} />

          <h2>
            No topic selected
          </h2>

          <p>
            Select a topic from
            the Study Plan.
          </p>

        </div>

      ) : (

        <div className="session-layout">

          <div className="session-main">

            <div className="session-topic-icon">

              <Brain size={32} />

            </div>


            <p className="panel-kicker">
              CURRENT FOCUS
            </p>


            <h2>
              {
                topic.topic
              }
            </h2>


            <p>
              {
                topic.subject
              }
            </p>


            <div className="session-score">

              <div>

                <span>
                  Priority Score
                </span>

                <strong>
                  {
                    topic.priority_score ||
                    "—"
                  }
                </strong>

              </div>


              <div>

                <span>
                  Priority
                </span>

                <strong>
                  {
                    topic.priority_level ||
                    "HIGH"
                  }
                </strong>

              </div>

            </div>


            {!started ? (

              <>

                <div className="form-field session-field">

                  <label>
                    Planned Minutes
                  </label>

                  <input
                    type="number"
                    min="5"
                    value={
                      plannedMinutes
                    }
                    onChange={(e) =>
                      setPlannedMinutes(
                        e.target.value
                      )
                    }
                  />

                </div>


                <button
                  className="primary-button session-start-button"
                  onClick={
                    startSession
                  }
                >

                  <Play
                    size={18}
                    fill="currentColor"
                  />

                  Start Study Session

                </button>

              </>

            ) : (

              <>

                <div className="session-active">

                  <div className="active-indicator" />

                  <strong>

                    Session #
                    {
                      sessionId
                    }
                    {" "}is active

                  </strong>

                  <span>

                    Focus on{" "}
                    {
                      topic.topic
                    }

                  </span>

                </div>


                <div className="form-field session-field">

                  <label>
                    Actual Study Minutes
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      actualMinutes
                    }
                    onChange={(e) =>
                      setActualMinutes(
                        e.target.value
                      )
                    }
                    placeholder="Example: 45"
                  />

                </div>


                <button
                  className="primary-button session-start-button"
                  onClick={
                    finishSession
                  }
                >

                  <CheckCircle2
                    size={18}
                  />

                  Complete Session

                </button>

              </>

            )}

          </div>


          <div className="panel">

            <p className="panel-kicker">
              SESSION GUIDE
            </p>

            <h2>
              Focus Strategy
            </h2>


            <div className="guide-list">

              <GuideItem
                number="01"
                text="Study the selected topic without distractions."
              />

              <GuideItem
                number="02"
                text="Record the actual time you spent studying."
              />

              <GuideItem
                number="03"
                text="Update your confidence after studying."
              />

              <GuideItem
                number="04"
                text="Your future plans use this information."
              />

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


// ==========================================
// PROGRESS PAGE
// ==========================================

function ProgressPage({
  studentData,
  analysis,
  priorities,
  updateTopicProgress,
}) {

  const topics =
    studentData?.subjects?.flatMap(
      (subject) =>

        subject.topics.map(
          (topic) => ({

            ...topic,

            subject:
              subject.subject,

          })
        )
    ) || [];


  const averageProgress =
    topics.length
      ? Math.round(
          topics.reduce(
            (sum, topic) =>
              sum +
              Number(
                topic.progress || 0
              ),
            0
          ) /
          topics.length
        )
      : 0;


  return (

    <div className="module-page">

      <PageHeading

        eyebrow="LEARNING ANALYTICS"

        title="Progress & Analytics"

        description="Update your learning state and see how the planning system responds."

        icon={
          <BarChart3 size={25} />
        }

      />


      <div className="analytics-grid">

        <SummaryCard
          icon={
            <TrendingUp
              size={20}
            />
          }
          label="Average Progress"
          value={`${averageProgress}%`}
        />


        <SummaryCard
          icon={
            <Target size={20} />
          }
          label="Adherence"
          value={`${
            analysis?.study_adherence_percentage ||
            0
          }%`}
        />


        <SummaryCard
          icon={
            <AlertTriangle
              size={20}
            />
          }
          label="Weak Topics"
          value={
            analysis?.weak_topics?.length ||
            0
          }
        />

      </div>


      <div className="panel">

        <div className="panel-header">

          <div>

            <p className="panel-kicker">
              TOPIC PERFORMANCE
            </p>

            <h2>
              Update Learning Progress
            </h2>

          </div>

        </div>


        <div className="progress-topic-list">

          {topics.map(
            (topic) => (

              <ProgressTopic
                key={
                  topic.topic_id
                }
                topic={
                  topic
                }
                priority={
                  priorities.find(
                    (p) =>
                      p.topic_id ===
                      topic.topic_id
                  )
                }
                onSave={
                  updateTopicProgress
                }
              />

            )
          )}

        </div>

      </div>


      <div className="panel analysis-panel">

        <div className="panel-header">

          <div>

            <p className="panel-kicker">
              STUDENT ANALYSIS
            </p>

            <h2>
              Current Learning State
            </h2>

          </div>

        </div>


        <div className="analysis-list">

          <AnalysisRow
            label="Study Behavior"
            value={
              analysis?.study_behavior ||
              "Unknown"
            }
          />


          <AnalysisRow
            label="Study Adherence"
            value={`${
              analysis?.study_adherence_percentage ||
              0
            }%`}
          />


          <AnalysisRow
            label="Weak Topics"
            value={
              analysis?.weak_topics?.join(
                ", "
              ) ||
              "None"
            }
          />


          <AnalysisRow
            label="High Remaining Work"
            value={
              analysis?.high_remaining_work_topics?.join(
                ", "
              ) ||
              "None"
            }
          />

        </div>

      </div>

    </div>

  );

}


// ==========================================
// PROGRESS TOPIC
// ==========================================

function ProgressTopic({
  topic,
  priority,
  onSave,
}) {

  const [progress,
    setProgress] =
    useState(
      topic.progress ?? 0
    );


  const [confidence,
    setConfidence] =
    useState(
      topic.confidence ?? 0
    );


  // Keep the sliders synchronized with the latest
  // values returned by the backend.
  // This is important after saving progress because
  // the parent page refreshes the student data.
  useEffect(() => {
    setProgress(
      Number(topic.progress ?? 0)
    );

    setConfidence(
      Number(topic.confidence ?? 0)
    );
  }, [topic.topic_id, topic.progress, topic.confidence]);


  return (

    <div className="progress-topic">

      <div className="progress-topic-header">

        <div>

          <h3>
            {
              topic.topic
            }
          </h3>

          <p>
            {
              topic.subject
            }
          </p>

        </div>


        {priority && (

          <span
            className={`priority-badge ${priority.priority_level.toLowerCase()}`}
          >

            {
              priority.priority_level
            }

          </span>

        )}

      </div>


      <div className="progress-control">

        <label>

          Progress

          <strong>
            {
              progress
            }%
          </strong>

        </label>


        <input
          type="range"
          min="0"
          max="100"
          value={
            progress
          }
          onChange={(e) =>
            setProgress(
              e.target.value
            )
          }
        />

      </div>


      <div className="progress-control">

        <label>

          Confidence

          <strong>
            {
              confidence
            }/10
          </strong>

        </label>


        <input
          type="range"
          min="0"
          max="10"
          value={
            confidence
          }
          onChange={(e) =>
            setConfidence(
              e.target.value
            )
          }
        />

      </div>


      <button
        className="outline-button"
        onClick={() =>
          onSave(
            topic.topic_id,
            Number(progress),
            Number(confidence)
          )
        }
      >

        <CheckCircle2
          size={16}
        />

        Save Progress

      </button>

    </div>

  );

}


// ==========================================
// HISTORY PAGE
// ==========================================

function HistoryPage({
  history,
}) {

  return (

    <div className="module-page">

      <PageHeading

        eyebrow="ACTIVITY RECORD"

        title="Study History"

        description="Real study-session records stored in your database."

        icon={
          <History size={25} />
        }

      />


      <div className="history-summary-grid">

        <SummaryCard
          icon={
            <History size={20} />
          }
          label="Total Sessions"
          value={
            history?.total_sessions ||
            0
          }
        />


        <SummaryCard
          icon={
            <Clock3 size={20} />
          }
          label="Planned Minutes"
          value={
            history?.total_planned_minutes ||
            0
          }
        />


        <SummaryCard
          icon={
            <TrendingUp
              size={20}
            />
          }
          label="Actual Minutes"
          value={
            history?.total_actual_minutes ||
            0
          }
        />


        <SummaryCard
          icon={
            <Target size={20} />
          }
          label="Overall Adherence"
          value={`${
            history?.overall_adherence_percentage ||
            0
          }%`}
        />

      </div>


      <div className="panel">

        <div className="panel-header">

          <div>

            <p className="panel-kicker">
              DATABASE HISTORY
            </p>

            <h2>
              Study Sessions
            </h2>

          </div>

        </div>


        {history?.sessions?.length > 0 ? (

          <div className="history-table-wrapper">

            <table className="history-table">

              <thead>

                <tr>

                  <th>
                    Session
                  </th>

                  <th>
                    Topic
                  </th>

                  <th>
                    Planned
                  </th>

                  <th>
                    Actual
                  </th>

                  <th>
                    Adherence
                  </th>

                  <th>
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {history.sessions.map(
                  (session) => (

                    <tr
                      key={
                        session.session_id
                      }
                    >

                      <td>
                        #
                        {
                          session.session_id
                        }
                      </td>


                      <td>

                        <strong>
                          {
                            session.topic
                          }
                        </strong>

                      </td>


                      <td>
                        {
                          session.planned_minutes
                        }{" "}
                        min
                      </td>


                      <td>
                        {
                          session.actual_minutes
                        }{" "}
                        min
                      </td>


                      <td>

                        <strong>
                          {
                            session.adherence_percentage
                          }%
                        </strong>

                      </td>


                      <td>

                        <span className="status-pill">

                          {
                            session.status
                          }

                        </span>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        ) : (

          <EmptyState
            message="No study sessions recorded yet."
          />

        )}

      </div>

    </div>

  );

}


// ==========================================
// AI PLANNER
// ==========================================

function AIPlannerPage({
  priorities,
  analysis,
  setSelectedTopic,
  navigate,
}) {

  const recommended =
    priorities[0];


  return (

    <div className="module-page">

      <PageHeading

        eyebrow="INTELLIGENT PLANNING"

        title="AI Planner"

        description="Understand why the system recommends a topic and what factors influence its priority."

        icon={
          <Brain size={25} />
        }

      />


      <div className="ai-planner-layout">

        <div className="ai-main-card">

          <div className="ai-main-icon">

            <Brain size={30} />

          </div>


          <p className="panel-kicker">
            CURRENT RECOMMENDATION
          </p>


          {recommended ? (

            <>

              <h2>
                {
                  recommended.topic
                }
              </h2>

              <p>
                {
                  recommended.subject
                }
              </p>


              <div className="ai-score">

                <strong>
                  {
                    recommended.priority_score
                  }
                </strong>

                <span>
                  Priority score / 10
                </span>

              </div>


              <div className="ai-reason-grid">

                <Reason
                  label="Urgency"
                  value={
                    recommended.urgency_score
                  }
                />

                <Reason
                  label="Remaining Work"
                  value={
                    recommended.remaining_work_score
                  }
                />

                <Reason
                  label="Weakness"
                  value={
                    recommended.weakness_score
                  }
                />

                <Reason
                  label="Difficulty"
                  value={
                    recommended.difficulty_score
                  }
                />

              </div>


              <button
                className="primary-button"
                onClick={() => {

                  setSelectedTopic(
                    recommended
                  );

                  navigate(
                    "Study Session"
                  );

                }}
              >

                <Play size={18} />

                Start Recommended Session

              </button>

            </>

          ) : (

            <EmptyState
              message="No recommendation available."
            />

          )}

        </div>


        <div className="panel">

          <div className="panel-header">

            <div>

              <p className="panel-kicker">
                SYSTEM ANALYSIS
              </p>

              <h2>
                Current Student State
              </h2>

            </div>

          </div>


          <div className="analysis-list">

            <AnalysisRow
              label="Study Behavior"
              value={
                analysis?.study_behavior ||
                "Unknown"
              }
            />


            <AnalysisRow
              label="Study Adherence"
              value={`${
                analysis?.study_adherence_percentage ||
                0
              }%`}
            />


            <AnalysisRow
              label="Weak Topics"
              value={
                analysis?.weak_topics?.length ||
                0
              }
            />


            <AnalysisRow
              label="High Remaining Work"
              value={
                analysis?.high_remaining_work_topics?.length ||
                0
              }
            />


            <AnalysisRow
              label="Active Topics"
              value={
                analysis?.total_active_topics ||
                0
              }
            />

          </div>

        </div>

      </div>

    </div>

  );

}


// ==========================================
// SUMMARY CARD
// ==========================================

function SummaryCard({
  icon,
  label,
  value,
}) {

  return (

    <div className="summary-card">

      <div className="summary-icon">

        {icon}

      </div>


      <span>
        {label}
      </span>


      <strong>
        {value}
      </strong>

    </div>

  );

}


// ==========================================
// ANALYSIS ROW
// ==========================================

function AnalysisRow({
  label,
  value,
}) {

  return (

    <div className="analysis-row">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );

}


// ==========================================
// REASON
// ==========================================

function Reason({
  label,
  value,
}) {

  return (

    <div className="reason-card">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );

}


// ==========================================
// GUIDE ITEM
// ==========================================

function GuideItem({
  number,
  text,
}) {

  return (

    <div className="guide-item">

      <div>
        {number}
      </div>

      <p>
        {text}
      </p>

    </div>

  );

}


// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({
  message,
}) {

  return (

    <div className="empty-state">

      <BookOpen size={24} />

      <p>
        {message}
      </p>

    </div>

  );

}


export default App;