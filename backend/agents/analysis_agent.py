def analyze_topic(topic, subject):
    """
    Analyze the current state of a single topic.
    """

    progress = max(
        0,
        min(100, topic.progress)
    )

    confidence = max(
        0,
        min(10, topic.confidence)
    )

    # --------------------------------------
    # Remaining work
    # --------------------------------------

    remaining_work = 100 - progress

    # --------------------------------------
    # Determine weakness
    # --------------------------------------

    if confidence <= 3:
        weakness_level = "HIGH"

    elif confidence <= 6:
        weakness_level = "MEDIUM"

    else:
        weakness_level = "LOW"

    # --------------------------------------
    # Determine progress level
    # --------------------------------------

    if progress < 30:
        progress_level = "LOW"

    elif progress < 70:
        progress_level = "MEDIUM"

    else:
        progress_level = "HIGH"

    # --------------------------------------
    # Determine recommendation
    # --------------------------------------

    if confidence <= 3 and progress < 50:
        recommendation = "Needs focused study"

    elif confidence <= 5:
        recommendation = "Needs revision and practice"

    elif progress < 70:
        recommendation = "Continue learning"

    else:
        recommendation = "Needs light revision"

    return {
        "topic_id": topic.id,
        "topic": topic.name,
        "subject": subject.name,
        "progress": progress,
        "confidence": confidence,
        "remaining_work_percentage": remaining_work,
        "weakness_level": weakness_level,
        "progress_level": progress_level,
        "recommendation": recommendation
    }


def analyze_student(subjects, session_history):
    """
    Analyze the overall student's current learning state.
    """

    topic_analysis = []

    for subject in subjects:

        for topic in subject.topics:

            if topic.completed:
                continue

            analysis = analyze_topic(
                topic,
                subject
            )

            topic_analysis.append(analysis)

    # --------------------------------------
    # Analyze study adherence
    # --------------------------------------

    if session_history:

        total_planned = sum(
            session.planned_minutes
            for session in session_history
        )

        total_actual = sum(
            session.actual_minutes
            for session in session_history
        )

        if total_planned > 0:
            adherence = (
                total_actual / total_planned
            ) * 100
        else:
            adherence = 0

    else:
        adherence = 0

    adherence = max(
        0,
        min(100, adherence)
    )

    # --------------------------------------
    # Determine study behavior
    # --------------------------------------

    if not session_history:
        study_behavior = "No study history available"

    elif adherence < 50:
        study_behavior = "Low study adherence"

    elif adherence < 80:
        study_behavior = "Moderate study adherence"

    else:
        study_behavior = "Good study adherence"

    # --------------------------------------
    # Find weak topics
    # --------------------------------------

    weak_topics = [
        analysis["topic"]
        for analysis in topic_analysis
        if analysis["weakness_level"] == "HIGH"
    ]

    # --------------------------------------
    # Find topics with high remaining work
    # --------------------------------------

    unfinished_topics = [
        analysis["topic"]
        for analysis in topic_analysis
        if analysis["remaining_work_percentage"] >= 50
    ]

    return {
        "total_active_topics": len(topic_analysis),
        "study_adherence_percentage": round(
            adherence,
            2
        ),
        "study_behavior": study_behavior,
        "weak_topics": weak_topics,
        "high_remaining_work_topics": unfinished_topics,
        "topic_analysis": topic_analysis
    }