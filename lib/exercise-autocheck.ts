// =============================================
// EXERCISE AUTO-CHECK
// =============================================
// Auto-grades a student's exercise submission against the teacher-defined
// correct answers. Supports four question types:
//
//   1. MULTIPLE_CHOICE — student's selected option index must equal the
//      teacher's `correctAnswer` index. Correct = 10, wrong = 0.
//
//   2. FILL_IN_BLANK — the teacher's correct answer is stored in
//      `options[0]`. Comparison is case-insensitive and trims whitespace so
//      that "Tawheed", "TAWHEED" and "tawheed" all match.
//
//   3. MATCHING — the teacher defines pairs `{ left, right }[]` in `options`.
//      The student's answer is JSON `{ [leftIndex]: rightIndex }`. A pair is
//      correct when the student assigned the original right index to that
//      left index (i.e. `parsed[i] === i`). Score is the fraction of correct
//      pairs scaled to 0-10.
//
//   4. WRITING — graded with the same heuristic / model-answer engine used
//      for exam-prep (lib/exam-prep-autocheck). When the teacher provides a
//      "Model Answer / Rubric" (stored in `explanation`), the answer is
//      matched against it; otherwise the heuristic fallback is used.
//
// Each question is scored on a 0-10 scale. The submission is stored in the
// database as GRADED with the per-question scores and feedback so the student
// sees the result immediately.

import { autoCheckResponse } from "@/lib/exam-prep-autocheck";

export type ExerciseQuestionType =
    | "MULTIPLE_CHOICE"
    | "FILL_IN_BLANK"
    | "WRITING"
    | "MATCHING";

export interface ExerciseQuestionInput {
    id: string;
    questionType: string;
    question: string;
    // string[] for MULTIPLE_CHOICE / FILL_IN_BLANK, { left, right }[] for MATCHING
    options: unknown;
    correctAnswer: number; // index for MC
    explanation: string | null; // model answer / rubric for WRITING
    order: number;
}

export interface ExerciseAnswerInput {
    questionIndex: number;
    answer: string;
}

export interface ExerciseScore {
    questionIndex: number;
    score: number; // 0-10
    feedback: string;
}

export interface ExerciseAutoCheckResult {
    scores: ExerciseScore[];
    totalScore: number; // sum of per-question scores
    totalPossible: number; // number of questions
}

// =============================================
// Per-type graders
// =============================================

/** Grade a MULTIPLE_CHOICE question. The student answer is the option index as a string. */
function gradeMultipleChoice(
    questionIndex: number,
    question: ExerciseQuestionInput,
    answer: string
): ExerciseScore {
    const selected = parseInt(answer, 10);
    const correctIdx = question.correctAnswer;
    const options = Array.isArray(question.options) ? question.options : [];

    if (Number.isNaN(selected)) {
        return {
            questionIndex,
            score: 0,
            feedback: "No option selected.",
        };
    }

    const isCorrect = selected === correctIdx;
    const correctLabel =
        correctIdx >= 0 && correctIdx < options.length
            ? `${String.fromCharCode(65 + correctIdx)}. ${options[correctIdx]}`
            : "(correct answer not set)";

    return {
        questionIndex,
        score: isCorrect ? 10 : 0,
        feedback: isCorrect
            ? `Correct! You selected ${String.fromCharCode(65 + selected)}. ${options[selected] ?? ""}`.trim()
            : `Incorrect. You selected ${String.fromCharCode(65 + selected)}. The correct answer is ${correctLabel}.`,
    };
}

/** Grade a FILL_IN_BLANK question. Case-insensitive, whitespace-trimmed comparison. */
function gradeFillInBlank(
    questionIndex: number,
    question: ExerciseQuestionInput,
    answer: string
): ExerciseScore {
    const options = Array.isArray(question.options) ? question.options : [];
    const correctRaw = options[0];
    const correct = (correctRaw != null ? String(correctRaw) : "").toLowerCase().trim();
    const student = (answer || "").toLowerCase().trim();

    if (!student) {
        return {
            questionIndex,
            score: 0,
            feedback: "No answer provided.",
        };
    }

    const isCorrect = correct.length > 0 && student === correct;

    return {
        questionIndex,
        score: isCorrect ? 10 : 0,
        feedback: isCorrect
            ? `Correct! "${answer}" matches the expected answer.`
            : `Incorrect. Your answer: "${answer}". The correct answer is: ${correctRaw || "(not set)"}.`,
    };
}

/** Grade a MATCHING question. Student answer is JSON { [leftIndex]: rightIndex }. */
function gradeMatching(
    questionIndex: number,
    question: ExerciseQuestionInput,
    answer: string
): ExerciseScore {
    const pairs: { left: string; right: string }[] = Array.isArray(question.options)
        ? question.options
        : [];

    if (pairs.length === 0) {
        return {
            questionIndex,
            score: 0,
            feedback: "This matching question has no pairs defined.",
        };
    }

    let parsed: Record<number, number> = {};
    try {
        parsed = answer ? JSON.parse(answer) : {};
    } catch {
        parsed = {};
    }

    let correctCount = 0;
    const details: string[] = [];

    pairs.forEach((pair, leftIdx) => {
        const assigned = parsed[leftIdx];
        const isCorrect = assigned === leftIdx;
        if (isCorrect) correctCount++;
        details.push(
            `${pair.left} → ${assigned != null && pairs[assigned] ? pairs[assigned].right : "(no match)"} ${isCorrect ? "✓" : `✗ (correct: ${pair.right})`}`
        );
    });

    const score = Math.round((correctCount / pairs.length) * 10);

    return {
        questionIndex,
        score,
        feedback: `${correctCount}/${pairs.length} pairs matched correctly. ${details.join(" | ")}`,
    };
}

/** Grade a WRITING question using the exam-prep auto-check engine.
 *
 * The scoring logic (model-answer matching + heuristic fallback) is reused
 * from the exam-prep engine, but the feedback is rewritten in English because
 * course exercises are not French-exam-specific.
 */
function gradeWriting(
    questionIndex: number,
    question: ExerciseQuestionInput,
    answer: string
): ExerciseScore {
    const result = autoCheckResponse(
        questionIndex,
        "WRITING",
        answer || "",
        null, // exercises don't carry a word limit
        question.explanation // model answer / rubric
    );

    const { score, criteria } = result;
    const parts: string[] = [];

    // No response
    if (criteria.length === 0) {
        return {
            questionIndex,
            score: 0,
            feedback: "No response detected. Please write a complete answer for this question.",
        };
    }

    // Content sufficiency note for trivially short answers
    if (criteria.length < 5) {
        parts.push(
            "Content: your answer is far too short to be evaluated. Please write a complete, developed response addressing the prompt."
        );
    }

    // Length feedback
    parts.push(`Length: ${criteria.length} words.`);

    // Structure feedback
    if (criteria.structureScore >= 8) {
        parts.push("Structure: good variety and appropriate sentence length.");
    } else if (criteria.structureScore >= 6) {
        parts.push("Structure: acceptable, but try varying your sentence length.");
    } else {
        parts.push(
            "Structure: needs improvement. Use complete sentences and logical connectors."
        );
    }

    // Vocabulary feedback
    if (criteria.vocabularyScore >= 8) {
        parts.push("Vocabulary: rich and varied, good use of connectors.");
    } else if (criteria.vocabularyScore >= 6) {
        parts.push("Vocabulary: correct, but enrich your vocabulary and use more connectors.");
    } else {
        parts.push(
            "Vocabulary: limited or repetitive. Use synonyms and logical connectors (however, furthermore, indeed...)."
        );
    }

    // Accuracy feedback
    if (criteria.accuracyScore >= 8) {
        parts.push("Language accuracy: good command of grammar and verbs.");
    } else if (criteria.accuracyScore >= 6) {
        parts.push("Language accuracy: acceptable. Check your agreements and conjugation.");
    } else {
        parts.push(
            "Language accuracy: needs improvement. Pay attention to articles, agreements and verb conjugation."
        );
    }

    // Model answer / rubric feedback
    const hasModel = !!question.explanation && question.explanation.trim().length > 0;
    if (hasModel) {
        if (criteria.modelScore >= 10) {
            parts.push("Model answer match: perfect — your answer matches the expected model. Full score (10/10).");
        } else if (criteria.modelScore >= 8) {
            parts.push("Model answer match: excellent — key words and ideas are well covered.");
        } else if (criteria.modelScore >= 6) {
            parts.push("Model answer match: good — most key points are present.");
        } else if (criteria.modelScore >= 4) {
            parts.push("Model answer match: partial — try to include more of the key ideas from the model.");
        } else {
            parts.push("Model answer match: weak — review the essential points of the expected answer.");
        }
    }

    // Overall note
    if (score >= 8) {
        parts.push("Excellent work! Final score assigned automatically.");
    } else if (score >= 6) {
        parts.push("Good work. A few improvements possible. Final score assigned automatically.");
    } else if (score >= 4) {
        parts.push("Answer needs development. Final score assigned automatically.");
    } else {
        parts.push("Insufficient answer. Final score assigned automatically.");
    }

    return {
        questionIndex,
        score,
        feedback: parts.join(" "),
    };
}

// =============================================
// Main entry point
// =============================================

/**
 * Auto-check an entire exercise submission.
 * @param questions  The exercise questions (with teacher-defined correct answers).
 * @param answers    The student's answers, keyed by question `order`.
 * @returns          Per-question scores + feedback, total score, and total possible.
 */
export function autoCheckExercise(
    questions: ExerciseQuestionInput[],
    answers: ExerciseAnswerInput[]
): ExerciseAutoCheckResult {
    const scores: ExerciseScore[] = questions.map((q) => {
        const ans = answers.find((a) => a.questionIndex === q.order);
        const answerText = ans?.answer ?? "";

        switch (q.questionType) {
            case "MULTIPLE_CHOICE":
                return gradeMultipleChoice(q.order, q, answerText);
            case "FILL_IN_BLANK":
                return gradeFillInBlank(q.order, q, answerText);
            case "MATCHING":
                return gradeMatching(q.order, q, answerText);
            case "WRITING":
            default:
                return gradeWriting(q.order, q, answerText);
        }
    });

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    return {
        scores,
        totalScore,
        totalPossible: questions.length,
    };
}
