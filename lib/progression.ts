// ============================================================
// Progression Logic for Lesson Completion & Content Sequencing
// ============================================================
//
// Scenarios:
//   1. Lesson Only        → Mark Complete → Next Lesson unlocked immediately
//   2. Quiz Only          → Mark Complete → Quiz → Next unlocked after quiz passed
//   3. Exercise Only      → Mark Complete → Exercise → Next unlocked after exercise submit
//   4. Exercise + Quiz    → Mark Complete → Exercise → Quiz → Next unlocked after quiz passed
// ============================================================

export type ContentComposition = "lesson-only" | "exercise-only" | "quiz-only" | "exercise-quiz";

export interface LessonContentInfo {
    composition: ContentComposition;
    hasExercise: boolean;
    hasQuiz: boolean;
    exerciseId: string | null;
    quizId: string | null;
}

/**
 * Determines the content composition of a lesson based on its
 * associated exercises and quizzes.
 */
export function getLessonContentInfo(lesson: any): LessonContentInfo {
    const exercises = lesson.exercises ?? [];
    const quizzes = lesson.quizzes ?? [];

    // Filter quizzes to only actual QUIZ type (not EXERCISE type quizzes)
    const actualQuizzes = quizzes.filter((q: any) => q.type === "QUIZ" || !q.type);
    const actualExercises = exercises.filter((e: any) => e.id);

    const hasExercise = actualExercises.length > 0;
    const hasQuiz = actualQuizzes.length > 0;

    let composition: ContentComposition = "lesson-only";
    if (hasExercise && hasQuiz) {
        composition = "exercise-quiz";
    } else if (hasExercise) {
        composition = "exercise-only";
    } else if (hasQuiz) {
        composition = "quiz-only";
    }

    return {
        composition,
        hasExercise,
        hasQuiz,
        exerciseId: hasExercise ? actualExercises[0].id : null,
        quizId: hasQuiz ? actualQuizzes[0].id : null,
    };
}

/**
 * Determines whether the current lesson is "fully satisfied" — meaning
 * the student has done everything required to unlock the next lesson.
 *
 * For lesson-only:        lesson must be marked complete
 * For exercise-only:      lesson must be complete AND exercise must be submitted
 * For exercise-quiz:      lesson must be complete AND exercise submitted AND quiz passed
 */
export function isLessonFullySatisfied(
    lesson: any,
    isLessonCompleted: boolean,
    isExerciseSubmitted: boolean,
    isQuizPassed: boolean,
): boolean {
    if (!isLessonCompleted) return false;

    const info = getLessonContentInfo(lesson);

    if (info.composition === "lesson-only") {
        return true; // lesson completion is all that's needed
    }
    if (info.composition === "exercise-only") {
        return isExerciseSubmitted;
    }
    if (info.composition === "quiz-only") {
        return isQuizPassed;
    }
    if (info.composition === "exercise-quiz") {
        return isExerciseSubmitted && isQuizPassed;
    }

    return false;
}

/**
 * Returns the next action / redirect path after marking a lesson as complete.
 *
 * Scenario 1 (lesson-only):      null (stay on page, nextlessons unlocked)
 * Scenario 2 (exercise-only):    "/dashboard/exercises/{exerciseId}"
 * Scenario 3 (exercise-quiz):    "/dashboard/exercises/{exerciseId}"
 */
export function getPostCompletionAction(
    lesson: any,
): { action: "none" | "redirect"; url: string | null } {
    const info = getLessonContentInfo(lesson);

    if (info.hasExercise) {
        return { action: "redirect", url: `/dashboard/exercises/${info.exerciseId}` };
    }
    if (info.hasQuiz) {
        return { action: "redirect", url: `/dashboard/quizzes/${info.quizId}` };
    }

    // Lesson only — no redirect needed
    return { action: "none", url: null };
}

/**
 * Determines what action to show on the "Next" button / bottom nav
 * after a lesson is completed.
 */
export function getNextActionAfterLesson(
    lesson: any,
    isLessonCompleted: boolean,
    isExerciseSubmitted: boolean,
    isQuizPassed: boolean,
    nextLessonId: string | null,
    courseId: string,
): { label: string; url: string; enabled: boolean } {
    const info = getLessonContentInfo(lesson);

    // If lesson is NOT yet completed, the next step is the lesson completion itself
    if (!isLessonCompleted) {
        return { label: "Mark as Complete", url: "#", enabled: true };
    }

    // Lesson is completed — now check what's next based on composition
    if (info.hasExercise && !isExerciseSubmitted) {
        return {
            label: "Solve Exercise →",
            url: `/dashboard/exercises/${info.exerciseId}`,
            enabled: true,
        };
    }

    if (info.hasQuiz && !isQuizPassed) {
        return {
            label: "Take Quiz →",
            url: `/dashboard/quizzes/${info.quizId}`,
            enabled: true,
        };
    }

    // Everything is satisfied — go to next lesson or back to course
    if (nextLessonId) {
        return {
            label: "Next Lesson →",
            url: `/dashboard/lessons/${nextLessonId}`,
            enabled: true,
        };
    }

    // No next lesson — back to course
    return {
        label: "Back to Course →",
        url: `/dashboard/courses/${lesson.courseId}`,
        enabled: true,
    };
}

/**
 * Checks whether the given lesson should be accessible (locked/unlocked)
 * based on the student's progress on PREVIOUS lessons.
 *
 * A lesson is locked if any previous lesson is not fully satisfied
 * (i.e., its exercise/quiz requirements haven't been met).
 */
export function isLessonLocked(
    allLessons: any[],
    currentLessonId: string,
    completedLessonIds: Set<string>,
    submittedExerciseLessonIds: Set<string>,
    passedQuizLessonIds: Set<string>,
): boolean {
    const currentIdx = allLessons.findIndex((l: any) => l.id === currentLessonId);
    if (currentIdx <= 0) return false; // first lesson always unlocked

    // The lesson immediately before this one must be fully satisfied
    const prevLesson = allLessons[currentIdx - 1];
    if (!prevLesson) return false;

    const prevCompleted = completedLessonIds.has(prevLesson.id);
    const prevExerciseSubmitted = submittedExerciseLessonIds.has(prevLesson.id);
    const prevQuizPassed = passedQuizLessonIds.has(prevLesson.id);

    return !isLessonFullySatisfied(prevLesson, prevCompleted, prevExerciseSubmitted, prevQuizPassed);
}

/**
 * Builds a set of lesson IDs for which the student has submitted exercises.
 */
export function buildSubmittedExerciseLessonIds(
    lessonExercises: Map<string, string>,  // lessonId → exerciseId
    submittedExerciseIds: Set<string>,     // set of submitted exercise IDs
): Set<string> {
    const result = new Set<string>();
    for (const [lessonId, exerciseId] of lessonExercises) {
        if (submittedExerciseIds.has(exerciseId)) {
            result.add(lessonId);
        }
    }
    return result;
}

/**
 * Builds a set of lesson IDs for which the student has passed quizzes.
 */
export function buildPassedQuizLessonIds(
    lessonQuizzes: Map<string, string>,  // lessonId → quizId
    passedQuizIds: Set<string>,          // set of passed quiz IDs
): Set<string> {
    const result = new Set<string>();
    for (const [lessonId, quizId] of lessonQuizzes) {
        if (passedQuizIds.has(quizId)) {
            result.add(lessonId);
        }
    }
    return result;
}