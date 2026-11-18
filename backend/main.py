from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date

from database import engine, Base, get_db
import models

from agents.priority_engine import calculate_priority
from agents.planning_agent import create_study_plan
from agents.analysis_agent import analyze_student


# ==========================================
# CREATE DATABASE TABLES
# ==========================================

Base.metadata.create_all(bind=engine)


# ==========================================
# DATABASE MIGRATION
# ==========================================

def add_missing_subject_column():

    with engine.connect() as connection:

        try:

            result = connection.execute(
                text("PRAGMA table_info(subjects)")
            )

            columns = [
                row[1]
                for row in result
            ]

            if "daily_study_hours" not in columns:

                connection.execute(
                    text(
                        """
                        ALTER TABLE subjects
                        ADD COLUMN daily_study_hours
                        FLOAT DEFAULT 1.0
                        """
                    )
                )

                connection.commit()

                print(
                    "Added daily_study_hours column."
                )

        except Exception as error:

            print(
                "Database migration warning:",
                error
            )


add_missing_subject_column()


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="Smart Student Study Planner",
    description="Agentic AI based personalized study planner",
    version="1.0.0"
)


# ==========================================
# HOME
# ==========================================

@app.get("/")
def home():

    return {
        "message":
        "Smart Student Study Planner API is running!"
    }


# ==========================================
# CREATE STUDENT
# ==========================================

@app.post("/students")
def create_student(
    name: str,
    daily_study_hours: float,
    preferred_study_time: str,
    db: Session = Depends(get_db)
):

    if daily_study_hours <= 0:

        return {
            "message":
            "Daily study hours must be greater than 0"
        }

    student = models.Student(

        name=name,

        daily_study_hours=
        daily_study_hours,

        preferred_study_time=
        preferred_study_time
    )

    db.add(student)

    db.commit()

    db.refresh(student)

    return {

        "message":
        "Student created successfully",

        "student_id":
        student.id,

        "name":
        student.name,

        "daily_study_hours":
        student.daily_study_hours,

        "preferred_study_time":
        student.preferred_study_time
    }


# ==========================================
# UPDATE STUDENT
# ==========================================

@app.put("/students/{student_id}")
def update_student(
    student_id: int,
    name: str,
    daily_study_hours: float,
    preferred_study_time: str,
    db: Session = Depends(get_db)
):

    student = db.query(
        models.Student
    ).filter(
        models.Student.id == student_id
    ).first()

    if not student:

        return {
            "message":
            "Student not found"
        }

    if daily_study_hours <= 0:

        return {
            "message":
            "Daily study hours must be greater than 0"
        }

    student.name = name

    student.daily_study_hours = (
        daily_study_hours
    )

    student.preferred_study_time = (
        preferred_study_time
    )

    db.commit()

    db.refresh(student)

    return {

        "message":
        "Student updated successfully",

        "student_id":
        student.id,

        "name":
        student.name,

        "daily_study_hours":
        student.daily_study_hours,

        "preferred_study_time":
        student.preferred_study_time
    }


# ==========================================
# CREATE SUBJECT
# ==========================================

@app.post("/subjects")
def create_subject(
    name: str,
    difficulty: int,
    exam_date: date,
    student_id: int,
    daily_study_hours: float = 1.0,
    db: Session = Depends(get_db)
):

    student = db.query(
        models.Student
    ).filter(
        models.Student.id == student_id
    ).first()

    if not student:

        return {
            "message":
            "Student not found"
        }

    if difficulty < 1 or difficulty > 5:

        return {
            "message":
            "Difficulty must be between 1 and 5"
        }

    if daily_study_hours <= 0:

        return {
            "message":
            "Subject study hours must be greater than 0"
        }

    if daily_study_hours > student.daily_study_hours:

        return {
            "message":
            f"Subject study hours cannot exceed student's daily study hours ({student.daily_study_hours} hours)"
        }

    subject = models.Subject(

        name=name,

        difficulty=difficulty,

        exam_date=exam_date,

        daily_study_hours=
        daily_study_hours,

        student_id=student_id
    )

    db.add(subject)

    db.commit()

    db.refresh(subject)

    return {

        "message":
        "Subject created successfully",

        "subject_id":
        subject.id,

        "name":
        subject.name,

        "difficulty":
        subject.difficulty,

        "exam_date":
        str(subject.exam_date),

        "daily_study_hours":
        subject.daily_study_hours
    }


# ==========================================
# UPDATE SUBJECT STUDY HOURS
# ==========================================

@app.put(
    "/subjects/{subject_id}/study-hours"
)
def update_subject_study_hours(
    subject_id: int,
    daily_study_hours: float,
    db: Session = Depends(get_db)
):

    subject = db.query(
        models.Subject
    ).filter(
        models.Subject.id == subject_id
    ).first()

    if not subject:

        return {
            "message":
            "Subject not found"
        }

    student = db.query(
        models.Student
    ).filter(
        models.Student.id ==
        subject.student_id
    ).first()

    if daily_study_hours <= 0:

        return {
            "message":
            "Study hours must be greater than 0"
        }

    if student and (
        daily_study_hours >
        student.daily_study_hours
    ):

        return {
            "message":
            f"Subject study hours cannot exceed student's daily study hours ({student.daily_study_hours} hours)"
        }

    subject.daily_study_hours = (
        daily_study_hours
    )

    db.commit()

    db.refresh(subject)

    return {

        "message":
        "Subject study hours updated successfully",

        "subject_id":
        subject.id,

        "subject":
        subject.name,

        "daily_study_hours":
        subject.daily_study_hours
    }


# ==========================================
# GET SUBJECT
# ==========================================

@app.get("/subjects/{subject_id}")
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db)
):

    subject = db.query(
        models.Subject
    ).filter(
        models.Subject.id == subject_id
    ).first()

    if not subject:

        return {
            "message":
            "Subject not found"
        }

    return {

        "subject_id":
        subject.id,

        "subject":
        subject.name,

        "difficulty":
        subject.difficulty,

        "exam_date":
        str(subject.exam_date)
        if subject.exam_date
        else None,

        "daily_study_hours":
        subject.daily_study_hours,

        "topics": [

            {
                "topic_id":
                topic.id,

                "topic":
                topic.name,

                "progress":
                topic.progress,

                "confidence":
                topic.confidence,

                "completed":
                topic.completed
            }

            for topic in subject.topics

        ]
    }


# ==========================================
# CREATE TOPIC
# ==========================================

@app.post("/topics")
def create_topic(
    name: str,
    subject_id: int,
    db: Session = Depends(get_db)
):

    subject = db.query(
        models.Subject
    ).filter(
        models.Subject.id == subject_id
    ).first()

    if not subject:

        return {
            "message":
            "Subject not found"
        }

    topic = models.Topic(

        name=name,

        subject_id=subject_id,

        progress=0,

        confidence=0,

        completed=False
    )

    db.add(topic)

    db.commit()

    db.refresh(topic)

    return {

        "message":
        "Topic created successfully",

        "topic_id":
        topic.id,

        "name":
        topic.name,

        "subject_id":
        topic.subject_id,

        "progress":
        topic.progress,

        "confidence":
        topic.confidence
    }


# ==========================================
# CREATE STUDY SESSION
# ==========================================

@app.post("/study-sessions")
def create_study_session(
    student_id: int,
    topic_id: int,
    planned_minutes: int,
    db: Session = Depends(get_db)
):

    if planned_minutes <= 0:

        return {
            "message":
            "Planned minutes must be greater than 0"
        }

    topic = db.query(
        models.Topic
    ).filter(
        models.Topic.id == topic_id
    ).first()

    if not topic:

        return {
            "message":
            "Topic not found"
        }

    session = models.StudySession(

        student_id=
        student_id,

        topic_id=
        topic_id,

        planned_minutes=
        planned_minutes,

        actual_minutes=0,

        status="planned"
    )

    db.add(session)

    db.commit()

    db.refresh(session)

    return {

        "message":
        "Study session created successfully",

        "session_id":
        session.id,

        "student_id":
        session.student_id,

        "topic_id":
        session.topic_id,

        "planned_minutes":
        session.planned_minutes,

        "status":
        session.status
    }


# ==========================================
# COMPLETE STUDY SESSION
# ==========================================

@app.put(
    "/study-sessions/{session_id}/complete"
)
def complete_study_session(
    session_id: int,
    actual_minutes: int,
    db: Session = Depends(get_db)
):

    session = db.query(
        models.StudySession
    ).filter(
        models.StudySession.id ==
        session_id
    ).first()

    if not session:

        return {
            "message":
            "Study session not found"
        }

    if actual_minutes < 0:

        return {
            "message":
            "Actual study minutes cannot be negative"
        }

    session.actual_minutes = (
        actual_minutes
    )

    session.status = "completed"

    db.commit()

    db.refresh(session)

    if session.planned_minutes > 0:

        adherence = (
            actual_minutes /
            session.planned_minutes
        ) * 100

    else:

        adherence = 0

    adherence = max(
        0,
        min(100, adherence)
    )

    return {

        "message":
        "Study session completed successfully",

        "session_id":
        session.id,

        "topic_id":
        session.topic_id,

        "planned_minutes":
        session.planned_minutes,

        "actual_minutes":
        session.actual_minutes,

        "status":
        session.status,

        "adherence_percentage":
        round(adherence, 2)
    }


# ==========================================
# GET STUDY SESSION HISTORY
# ==========================================

@app.get(
    "/students/{student_id}/study-sessions"
)
def get_study_session_history(
    student_id: int,
    db: Session = Depends(get_db)
):

    sessions = db.query(
        models.StudySession
    ).filter(
        models.StudySession.student_id ==
        student_id
    ).order_by(
        models.StudySession.id.desc()
    ).all()

    if not sessions:

        return {

            "student_id":
            student_id,

            "total_sessions":
            0,

            "total_planned_minutes":
            0,

            "total_actual_minutes":
            0,

            "overall_adherence_percentage":
            0,

            "sessions": []
        }

    session_history = []

    for session in sessions:

        topic = db.query(
            models.Topic
        ).filter(
            models.Topic.id ==
            session.topic_id
        ).first()

        if session.planned_minutes > 0:

            adherence = (
                session.actual_minutes /
                session.planned_minutes
            ) * 100

        else:

            adherence = 0

        adherence = max(
            0,
            min(100, adherence)
        )

        session_history.append({

            "session_id":
            session.id,

            "topic_id":
            session.topic_id,

            "topic":
            topic.name
            if topic
            else "Unknown",

            "planned_minutes":
            session.planned_minutes,

            "actual_minutes":
            session.actual_minutes,

            "status":
            session.status,

            "adherence_percentage":
            round(
                adherence,
                2
            )
        })

    total_planned = sum(
        session["planned_minutes"]
        for session in session_history
    )

    total_actual = sum(
        session["actual_minutes"]
        for session in session_history
    )

    if total_planned > 0:

        overall_adherence = (
            total_actual /
            total_planned
        ) * 100

    else:

        overall_adherence = 0

    return {

        "student_id":
        student_id,

        "total_sessions":
        len(session_history),

        "total_planned_minutes":
        total_planned,

        "total_actual_minutes":
        total_actual,

        "overall_adherence_percentage":
        round(
            overall_adherence,
            2
        ),

        "sessions":
        session_history
    }


# ==========================================
# UPDATE TOPIC PROGRESS
# ==========================================

@app.put(
    "/topics/{topic_id}/progress"
)
def update_topic_progress(
    topic_id: int,
    progress: float,
    confidence: float,
    db: Session = Depends(get_db)
):

    topic = db.query(
        models.Topic
    ).filter(
        models.Topic.id ==
        topic_id
    ).first()

    if not topic:

        return {
            "message":
            "Topic not found"
        }

    if progress < 0 or progress > 100:

        return {
            "message":
            "Progress must be between 0 and 100"
        }

    if confidence < 0 or confidence > 10:

        return {
            "message":
            "Confidence must be between 0 and 10"
        }

    topic.progress = progress

    topic.confidence = confidence

    if progress >= 100:

        topic.completed = True

    else:

        topic.completed = False

    db.commit()

    db.refresh(topic)

    return {

        "message":
        "Topic progress updated successfully",

        "topic_id":
        topic.id,

        "topic":
        topic.name,

        "progress":
        topic.progress,

        "confidence":
        topic.confidence,

        "completed":
        topic.completed
    }


# ==========================================
# CALCULATE STUDENT PRIORITIES
# ==========================================

@app.get(
    "/students/{student_id}/priorities"
)
def get_student_priorities(
    student_id: int,
    db: Session = Depends(get_db)
):

    subjects = db.query(
        models.Subject
    ).filter(
        models.Subject.student_id ==
        student_id
    ).all()

    if not subjects:

        return {

            "student_id":
            student_id,

            "total_topics":
            0,

            "priorities":
            []
        }

    priorities = []

    for subject in subjects:

        for topic in subject.topics:

            if topic.completed:

                continue

            priority = calculate_priority(
                topic,
                subject
            )

            priorities.append(
                priority
            )

    priorities.sort(
        key=lambda x:
        x["priority_score"],
        reverse=True
    )

    return {

        "student_id":
        student_id,

        "total_topics":
        len(priorities),

        "priorities":
        priorities
    }


# ==========================================
# GET STUDENT DATA
# ==========================================

@app.get(
    "/students/{student_id}/data"
)
def get_student_data(
    student_id: int,
    db: Session = Depends(get_db)
):

    student = db.query(
        models.Student
    ).filter(
        models.Student.id ==
        student_id
    ).first()

    if not student:

        return {
            "message":
            "Student not found"
        }

    result = []

    for subject in student.subjects:

        subject_data = {

            "subject_id":
            subject.id,

            "subject":
            subject.name,

            "difficulty":
            subject.difficulty,

            "exam_date":
            str(subject.exam_date)
            if subject.exam_date
            else None,

            "daily_study_hours":
            subject.daily_study_hours,

            "topics": []
        }

        for topic in subject.topics:

            subject_data["topics"].append({

                "topic_id":
                topic.id,

                "topic":
                topic.name,

                "progress":
                topic.progress,

                "confidence":
                topic.confidence,

                "completed":
                topic.completed
            })

        result.append(
            subject_data
        )

    return {

        "student_id":
        student.id,

        "student":
        student.name,

        "daily_study_hours":
        student.daily_study_hours,

        "preferred_study_time":
        student.preferred_study_time,

        "subjects":
        result
    }


# ==========================================
# OVERALL STUDY PLAN
# ==========================================

@app.get(
    "/students/{student_id}/study-plan"
)
def get_study_plan(
    student_id: int,
    db: Session = Depends(get_db)
):

    student = db.query(
        models.Student
    ).filter(
        models.Student.id ==
        student_id
    ).first()

    if not student:

        return {
            "message":
            "Student not found"
        }

    subjects = db.query(
        models.Subject
    ).filter(
        models.Subject.student_id ==
        student_id
    ).all()

    if not subjects:

        return {
            "message":
            "No subjects found for this student"
        }

    priorities = []

    for subject in subjects:

        for topic in subject.topics:

            if topic.completed:

                continue

            priority = calculate_priority(
                topic,
                subject
            )

            priorities.append(
                priority
            )

    if not priorities:

        return {

            "student_id":
            student_id,

            "message":
            "No incomplete topics available for planning",

            "study_plan":
            []
        }

    priorities.sort(
        key=lambda x:
        x["priority_score"],
        reverse=True
    )

    plan = create_study_plan(

        priorities,

        student.daily_study_hours
    )

    return {

        "student_id":
        student_id,

        "student":
        student.name,

        "daily_study_hours":
        student.daily_study_hours,

        "total_topics":
        len(priorities),

        "total_planned_minutes":
        sum(
            item["planned_minutes"]
            for item in plan
        ),

        "study_plan":
        plan
    }


# ==========================================
# SUBJECT-SPECIFIC STUDY PLAN
# ==========================================

@app.get(
    "/students/{student_id}/subjects/{subject_id}/study-plan"
)
def get_subject_study_plan(
    student_id: int,
    subject_id: int,
    db: Session = Depends(get_db)
):

    student = db.query(
        models.Student
    ).filter(
        models.Student.id ==
        student_id
    ).first()

    if not student:

        return {
            "message":
            "Student not found"
        }

    subject = db.query(
        models.Subject
    ).filter(
        models.Subject.id ==
        subject_id,
        models.Subject.student_id ==
        student_id
    ).first()

    if not subject:

        return {
            "message":
            "Subject not found for this student"
        }

    priorities = []

    for topic in subject.topics:

        if topic.completed:

            continue

        priority = calculate_priority(
            topic,
            subject
        )

        priorities.append(
            priority
        )

    priorities.sort(
        key=lambda x:
        x["priority_score"],
        reverse=True
    )

    if not priorities:

        return {

            "student_id":
            student_id,

            "subject_id":
            subject.id,

            "subject":
            subject.name,

            "difficulty":
            subject.difficulty,

            "exam_date":
            str(subject.exam_date)
            if subject.exam_date
            else None,

            "daily_study_hours":
            subject.daily_study_hours,

            "total_topics":
            0,

            "total_planned_minutes":
            0,

            "study_plan":
            []
        }

    plan = create_study_plan(

        priorities,

        subject.daily_study_hours
    )

    return {

        "student_id":
        student_id,

        "subject_id":
        subject.id,

        "subject":
        subject.name,

        "difficulty":
        subject.difficulty,

        "exam_date":
        str(subject.exam_date)
        if subject.exam_date
        else None,

        "daily_study_hours":
        subject.daily_study_hours,

        "total_topics":
        len(priorities),

        "total_planned_minutes":
        sum(
            item["planned_minutes"]
            for item in plan
        ),

        "study_plan":
        plan
    }


# ==========================================
# ANALYZE STUDENT
# ==========================================

@app.get(
    "/students/{student_id}/analysis"
)
def get_student_analysis(
    student_id: int,
    db: Session = Depends(get_db)
):

    student = db.query(
        models.Student
    ).filter(
        models.Student.id ==
        student_id
    ).first()

    if not student:

        return {
            "message":
            "Student not found"
        }

    subjects = db.query(
        models.Subject
    ).filter(
        models.Subject.student_id ==
        student_id
    ).all()

    if not subjects:

        return {
            "message":
            "No subjects found for this student"
        }

    session_history = db.query(
        models.StudySession
    ).filter(
        models.StudySession.student_id ==
        student_id
    ).all()

    analysis = analyze_student(
        subjects,
        session_history
    )

    return {

        "student_id":
        student.id,

        "student":
        student.name,

        "analysis":
        analysis
    }