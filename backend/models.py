from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from database import Base


# ==========================================
# STUDENT
# ==========================================

class Student(Base):

    __tablename__ = "students"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    daily_study_hours = Column(
        Float,
        nullable=False
    )

    preferred_study_time = Column(
        String,
        nullable=True
    )

    subjects = relationship(
        "Subject",
        back_populates="student"
    )

    study_sessions = relationship(
        "StudySession",
        back_populates="student"
    )


# ==========================================
# SUBJECT
# ==========================================

class Subject(Base):

    __tablename__ = "subjects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    difficulty = Column(
        Integer,
        nullable=False
    )

    exam_date = Column(
        Date,
        nullable=True
    )

    # Daily study hours specifically
    # allocated to this subject
    daily_study_hours = Column(
        Float,
        nullable=False,
        default=1.0
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id")
    )

    student = relationship(
        "Student",
        back_populates="subjects"
    )

    topics = relationship(
        "Topic",
        back_populates="subject"
    )


# ==========================================
# TOPIC
# ==========================================

class Topic(Base):

    __tablename__ = "topics"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String,
        nullable=False
    )

    completed = Column(
        Boolean,
        default=False
    )

    progress = Column(
        Float,
        default=0
    )

    confidence = Column(
        Float,
        default=0
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id")
    )

    subject = relationship(
        "Subject",
        back_populates="topics"
    )


# ==========================================
# STUDY SESSION
# ==========================================

class StudySession(Base):

    __tablename__ = "study_sessions"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id")
    )

    topic_id = Column(
        Integer,
        ForeignKey("topics.id")
    )

    planned_minutes = Column(
        Integer
    )

    actual_minutes = Column(
        Integer,
        default=0
    )

    status = Column(
        String,
        default="planned"
    )

    student = relationship(
        "Student",
        back_populates="study_sessions"
    )