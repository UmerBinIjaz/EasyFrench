// =============================================
// EXAM PREP AUTO-CHECK LOGIC
// =============================================
// Auto-checking for Expression Écrite (WRITING) and Expression Orale
// (SPEAKING) responses. Produces an auto-score (0-10) and structured
// feedback. This is the final grade — no teacher review step.
//
// Scoring strategy:
//  1. If the teacher provided a "Model Answer / Rubric" for the question,
//     the student's response is compared directly against it. An exact
//     match (case/accent/punctuation-insensitive) earns 10/10; partial
//     matches are scored by keyword coverage. The language heuristics are
//     NOT blended in — the model answer is the source of truth.
//  2. If NO model answer is provided, the system falls back to the
//     heuristic engine (length, structure, vocabulary, accuracy).

export type AutoCheckScore = {
    questionIndex: number;
    score: number; // 0-10
    feedback: string;
    criteria: {
        length: number; // word count
        lengthScore: number; // 0-10
        structureScore: number; // 0-10
        vocabularyScore: number; // 0-10
        accuracyScore: number; // 0-10
        modelScore: number; // 0-10 (overlap with model answer/rubric; 0 if none provided)
    };
};

export type AutoCheckQuestion = {
    questionIndex: number;
    questionType: string; // "WRITING" | "SPEAKING"
    answer: string;
    wordLimit?: string | null; // e.g. "80-120"
    modelAnswer?: string | null; // Teacher-provided model answer / rubric (explanation field)
};

// =============================================
// Helpers
// =============================================

/** Count words in a text, trimming whitespace and ignoring empty tokens. */
export function countWords(text: string): number {
    const trimmed = (text || "").trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
}

/** Count sentences in a text using terminal punctuation. */
export function countSentences(text: string): number {
    const trimmed = (text || "").trim();
    if (!trimmed) return 0;
    const matches = trimmed.match(/[.!?]+/g);
    return matches ? matches.length : 1;
}

/** Parse a wordLimit string like "80-120" into { min, max }. */
export function parseWordLimit(wordLimit?: string | null): { min: number; max: number } | null {
    if (!wordLimit) return null;
    const match = wordLimit.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (match) {
        return { min: parseInt(match[1], 10), max: parseInt(match[2], 10) };
    }
    const single = wordLimit.match(/(\d+)/);
    if (single) {
        const n = parseInt(single[1], 10);
        return { min: Math.round(n * 0.8), max: n };
    }
    return null;
}

// Common French function words / connectors for vocabulary & structure checks.
const FRENCH_CONNECTORS = [
    "et", "mais", "ou", "donc", "or", "ni", "car",
    "parce que", "puisque", "bien que", "quoique", "afin que",
    "pour que", "de sorte que", "cependant", "néanmoins", "toutefois",
    "en outre", "de plus", "en effet", "c'est-à-dire", "autrement dit",
    "d'abord", "ensuite", "puis", "enfin", "finalement",
    "d'une part", "d'autre part", "non seulement", "mais encore",
    "alors", "donc", "ainsi", "par conséquent", "en conséquence",
];

const FRENCH_ARTICLES = [
    "le", "la", "les", "un", "une", "des", "du", "de la",
    "au", "aux", "ce", "cette", "ces", "cet", "mon", "ma", "mes",
    "ton", "ta", "tes", "son", "sa", "ses", "notre", "nos", "votre", "vos", "leur", "leurs",
];

const FRENCH_PRONOUNS = [
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "me", "te", "se", "lui", "leur", "y", "en",
    "qui", "que", "quoi", "dont", "où", "lequel", "laquelle", "lesquels", "lesquelles",
    "ce", "celui", "celle", "ceux", "celles",
];

const FRENCH_VERB_ENDINGS = [
    "er", "ir", "re", "ez", "ent", "ons", "ais", "ait", "ions", "iez",
    "é", "ée", "ées", "ai", "as", "a", "ont", "is", "it", "it",
];

// =============================================
// Individual criterion scorers (each returns 0-10)
// =============================================

/** Score based on whether the response meets the word limit. */
function scoreLength(wordCount: number, wordLimit?: string | null): number {
    const limit = parseWordLimit(wordLimit);
    if (!limit) {
        // No limit specified: use a soft baseline (aim for at least 40 words).
        if (wordCount === 0) return 0;
        if (wordCount < 15) return 3;
        if (wordCount < 30) return 5;
        if (wordCount < 50) return 7;
        return 9;
    }
    const { min, max } = limit;
    if (wordCount === 0) return 0;
    if (wordCount >= min && wordCount <= max) return 10;
    // Slightly under or over is acceptable.
    if (wordCount >= min * 0.8 && wordCount <= max * 1.15) return 8;
    if (wordCount < min * 0.8) {
        const ratio = wordCount / min;
        return Math.max(2, Math.round(ratio * 8));
    }
    // Over the limit.
    const ratio = max / wordCount;
    return Math.max(3, Math.round(ratio * 8));
}

/** Score based on sentence variety and average sentence length. */
function scoreStructure(text: string): number {
    const words = countWords(text);
    const sentences = countSentences(text);
    if (words === 0) return 0;
    if (sentences === 0) return 2;
    // A couple of words is not a real sentence structure to assess.
    if (words < 3) return 1;
    const avgLen = words / sentences;
    // Ideal average sentence length for French writing: 8-18 words.
    if (avgLen >= 8 && avgLen <= 18) return 10;
    if (avgLen >= 6 && avgLen <= 22) return 8;
    if (avgLen >= 4 && avgLen <= 28) return 6;
    if (avgLen < 4) return 4; // too choppy
    return 5; // run-on sentences
}

/** Score based on vocabulary variety (unique words ratio) and connector usage. */
function scoreVocabulary(text: string): number {
    const words = countWords(text);
    if (words === 0) return 0;
    // Unique-word ratio is meaningless for a handful of words; do not reward
    // "variety" when there is almost no content to vary.
    if (words < 5) return 1;
    const tokens = (text || "")
        .toLowerCase()
        .replace(/[.,!?;:()«»"'\-–—]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
    const unique = new Set(tokens);
    const uniqueRatio = unique.size / tokens.length;
    // Count connectors used.
    const lower = (text || "").toLowerCase();
    const connectorHits = FRENCH_CONNECTORS.filter((c) => lower.includes(c)).length;
    let score = 0;
    // Unique ratio: higher is better (but not too high = repetitive short text).
    if (uniqueRatio >= 0.6 && uniqueRatio <= 0.85) score += 5;
    else if (uniqueRatio >= 0.45) score += 4;
    else if (uniqueRatio >= 0.3) score += 2;
    else score += 1;
    // Connectors: reward variety.
    if (connectorHits >= 4) score += 5;
    else if (connectorHits >= 2) score += 4;
    else if (connectorHits >= 1) score += 2;
    else score += 1;
    return Math.min(10, score);
}

/** Score based on basic French language accuracy signals. */
function scoreAccuracy(text: string): number {
    const words = countWords(text);
    if (words === 0) return 0;
    // Accuracy cannot be demonstrated with almost no language; a near-empty
    // answer must not earn a participation baseline.
    if (words < 5) return 1;
    const lower = (text || "").toLowerCase();
    const tokens = lower.split(/\s+/).filter(Boolean);
    let score = 5; // baseline
    // Presence of articles (French requires them frequently).
    const articleHits = FRENCH_ARTICLES.filter((a) => tokens.includes(a)).length;
    if (articleHits >= 3) score += 2;
    else if (articleHits >= 1) score += 1;
    // Presence of pronouns.
    const pronounHits = FRENCH_PRONOUNS.filter((p) => tokens.includes(p)).length;
    if (pronounHits >= 2) score += 1;
    // Verb endings present (rough verb detection).
    const verbHits = tokens.filter((t) => FRENCH_VERB_ENDINGS.some((e) => t.endsWith(e) && t.length > 3)).length;
    if (verbHits >= 3) score += 2;
    else if (verbHits >= 1) score += 1;
    // Penalize excessive repetition of the same word.
    const freq: Record<string, number> = {};
    for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
    const maxFreq = Math.max(...Object.values(freq));
    if (maxFreq > words * 0.25 && words > 10) score -= 2;
    return Math.max(0, Math.min(10, score));
}

// French stopwords excluded from keyword extraction (kept short to preserve meaning).
const FRENCH_STOPWORDS = new Set([
    "le", "la", "les", "un", "une", "des", "du", "de", "et", "ou", "mais", "donc",
    "or", "ni", "car", "que", "qui", "quoi", "dont", "où", "ce", "cette", "ces",
    "cet", "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "notre",
    "nos", "votre", "vos", "leur", "leurs", "je", "tu", "il", "elle", "on",
    "nous", "vous", "ils", "elles", "me", "te", "se", "lui", "en", "y", "à",
    "au", "aux", "dans", "sur", "pour", "par", "avec", "sans", "sous", "vers",
    "est", "sont", "été", "être", "a", "as", "ont", "ai", "avons", "avez",
    "pas", "ne", "plus", "très", "bien", "tout", "tous", "toute", "toutes",
    "comme", "si", "quand", "alors", "ici", "là", "cela", "ça", "il", "elle",
]);

/** Extract meaningful keywords (lowercased, stopwords removed, length > 2). */
function extractKeywords(text: string): Set<string> {
    const tokens = (text || "")
        .toLowerCase()
        .replace(/[.,!?;:()«»"'\-–—]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .filter((t) => t.length > 2 && !FRENCH_STOPWORDS.has(t));
    return new Set(tokens);
}

/**
 * Normalize text for comparison: lowercase, strip accents, collapse
 * whitespace, and remove punctuation so that "Bonjour!" and "bonjour"
 * are treated as identical.
 */
function normalizeForCompare(text: string): string {
    return (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip diacritics
        .replace(/[.,!?;:()«»"'’\-–—]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Score the student's response against the teacher-provided Model Answer / Rubric.
 *
 * - An exact match (case/accent/punctuation-insensitive) earns 10/10.
 * - Otherwise the score is driven by keyword coverage: how many of the
 *   model's meaningful keywords appear in the answer.
 * - Returns 0 when no model answer is provided (the caller then falls back
 *   to the heuristic engine).
 */
function scoreModelAnswer(answer: string, modelAnswer?: string | null): number {
    if (!modelAnswer || !modelAnswer.trim()) return 0;
    const answerWords = countWords(answer);
    if (answerWords === 0) return 0;

    // Exact / near-exact match (ignoring case, accents, punctuation, spacing).
    const normAnswer = normalizeForCompare(answer);
    const normModel = normalizeForCompare(modelAnswer);
    if (normAnswer && normModel && normAnswer === normModel) return 10;

    const modelKeywords = extractKeywords(modelAnswer);
    const answerKeywords = extractKeywords(answer);
    if (modelKeywords.size === 0) return 0;

    // Overlap: how many model keywords appear in the answer.
    let hits = 0;
    for (const kw of modelKeywords) {
        if (answerKeywords.has(kw)) hits++;
    }
    const coverage = hits / modelKeywords.size; // 0-1

    // Map coverage to a 0-10 score.
    return Math.max(0, Math.min(10, Math.round(coverage * 10)));
}

/**
 * Content-sufficiency multiplier. A response that is far too short cannot
 * demonstrate the required skills, regardless of surface features (unique-word
 * ratio, verb endings, etc.). This drives the final score toward 0 for trivial
 * or non-answers (e.g. a single off-topic word) so they are not rewarded.
 * If the teacher provided a model answer (hasModel = true), we are less
 * strict about length because the teacher's rubric defines what is acceptable.
 */
function contentMultiplier(wordCount: number, hasModel: boolean): number {
    if (wordCount <= 0) return 0;
    
    if (hasModel) {
        // If teacher provided a model, even short answers (e.g., "Je m'appelle Umer" = 3 words) are valid
        if (wordCount < 2) return 0.2; // 1 word is still too short for a sentence
        return 1; // 2+ words is fine if it matches the rubric keywords
    } else {
        // No model answer: scoring relies purely on heuristics, so length is strictly required
        if (wordCount < 5) return 0.15; // trivial / non-answer
        if (wordCount < 10) return 0.7; // very short attempt
        return 1;
    }
}

// =============================================
// Main auto-check function
// =============================================

/**
 * Auto-check a single writing/speaking response.
 * Returns a score (0-10) and structured feedback.
 */
export function autoCheckResponse(
    questionIndex: number,
    questionType: string,
    answer: string,
    wordLimit?: string | null,
    modelAnswer?: string | null
): AutoCheckScore {
    const text = (answer || "").trim();
    const wordCount = countWords(text);

    const lengthScore = scoreLength(wordCount, wordLimit);
    const structureScore = scoreStructure(text);
    const vocabularyScore = scoreVocabulary(text);
    const accuracyScore = scoreAccuracy(text);
    const modelScore = scoreModelAnswer(text, modelAnswer);

    // Scoring strategy:
    //  - If a model answer/rubric is provided, the model match IS the score
    //    (the model answer is the source of truth — heuristics are not blended).
    //  - Otherwise, fall back to the heuristic weighted average.
    const hasModel = !!modelAnswer && modelAnswer.trim().length > 0;

    let score: number;
    if (hasModel) {
        // The model-answer match drives the final score directly. We still
        // apply the content-sufficiency gate so a trivially short answer that
        // happens to share a keyword is not over-rewarded.
        const sufficiency = contentMultiplier(wordCount, hasModel);
        score = Math.round(modelScore * sufficiency);
    } else {
        const rawScore =
            lengthScore * 0.3 +
            structureScore * 0.25 +
            vocabularyScore * 0.25 +
            accuracyScore * 0.2;
        // Content-sufficiency gate: a trivially short / non-answer cannot earn a
        // passing grade just for surface features. Scale the raw score down.
        const sufficiency = contentMultiplier(wordCount, hasModel);
        score = Math.round(rawScore * sufficiency);
    }

    // Build feedback.
    const feedbackParts: string[] = [];
    const limit = parseWordLimit(wordLimit);

    if (wordCount === 0) {
        return {
            questionIndex,
            score: 0,
            feedback:
                "Aucune réponse détectée. Veuillez rédiger une réponse complète pour cette question. (No response detected — please write a complete answer.)",
            criteria: {
                length: 0,
                lengthScore: 0,
                structureScore: 0,
                vocabularyScore: 0,
                accuracyScore: 0,
                modelScore: 0,
            },
        };
    }

    // Content-sufficiency note for trivially short answers.
    if (!hasModel && wordCount < 5) {
        feedbackParts.push(
            "Contenu: réponse beaucoup trop courte pour être évaluée sans modèle. Rédigez une réponse complète et développée répondant à la consigne."
        );
    } else if (hasModel && wordCount < 2) {
        feedbackParts.push(
            "Contenu: réponse d'un seul mot, trop courte. Formulez une phrase complète."
        );
    }

    // Length feedback.
    if (limit) {
        if (wordCount < limit.min) {
            feedbackParts.push(
                `Longueur: ${wordCount} mots — en dessous de la fourchette recommandée (${limit.min}-${limit.max}). Développez davantage vos idées.`
            );
        } else if (wordCount > limit.max) {
            feedbackParts.push(
                `Longueur: ${wordCount} mots — au-dessus de la fourchette recommandée (${limit.min}-${limit.max}). Soyez plus concis.`
            );
        } else {
            feedbackParts.push(
                `Longueur: ${wordCount} mots — dans la fourchette recommandée (${limit.min}-${limit.max}). Très bien.`
            );
        }
    } else {
        feedbackParts.push(`Longueur: ${wordCount} mots.`);
    }

    // Structure feedback.
    const sentences = countSentences(text);
    if (structureScore >= 8) {
        feedbackParts.push(`Structure: ${sentences} phrase(s) — bonne variété et longueur moyenne appropriée.`);
    } else if (structureScore >= 6) {
        feedbackParts.push(`Structure: ${sentences} phrase(s) — acceptable, mais variez la longueur des phrases.`);
    } else {
        feedbackParts.push(
            `Structure: ${sentences} phrase(s) — structure à améliorer. Utilisez des phrases complètes et des connecteurs logiques.`
        );
    }

    // Vocabulary feedback.
    if (vocabularyScore >= 8) {
        feedbackParts.push("Vocabulaire: riche et varié, bon usage des connecteurs.");
    } else if (vocabularyScore >= 6) {
        feedbackParts.push("Vocabulaire: correct, mais enrichissez votre lexique et utilisez plus de connecteurs.");
    } else {
        feedbackParts.push(
            "Vocabulaire: limité ou répétitif. Utilisez des synonymes et des connecteurs logiques (cependant, de plus, en effet...)."
        );
    }

    // Accuracy feedback.
    if (accuracyScore >= 8) {
        feedbackParts.push("Précision linguistique: bonne maîtrise des articles, pronoms et verbes.");
    } else if (accuracyScore >= 6) {
        feedbackParts.push("Précision linguistique: acceptable. Vérifiez les accords et la conjugaison.");
    } else {
        feedbackParts.push(
            "Précision linguistique: à améliorer. Attention aux articles, aux accords et à la conjugaison des verbes."
        );
    }

    // Model answer / rubric feedback.
    if (hasModel) {
        const normAnswer = normalizeForCompare(text);
        const normModel = normalizeForCompare(modelAnswer || "");
        if (normAnswer && normModel && normAnswer === normModel) {
            feedbackParts.push("Correspondance avec la réponse modèle: parfaite — réponse identique au modèle attendu. Score complet (10/10).");
        } else if (modelScore >= 8) {
            feedbackParts.push("Correspondance avec la réponse modèle: excellente — mots-clés et idées clés bien couverts.");
        } else if (modelScore >= 6) {
            feedbackParts.push("Correspondance avec la réponse modèle: bonne — la plupart des points clés sont présents.");
        } else if (modelScore >= 4) {
            feedbackParts.push("Correspondance avec la réponse modèle: partielle — essayez d'inclure davantage d'idées clés du modèle.");
        } else {
            feedbackParts.push("Correspondance avec la réponse modèle: faible — reprenez les points essentiels de la réponse attendue.");
        }
    }

    // Overall note (final auto-checked score — no teacher review step).
    if (score >= 8) {
        feedbackParts.push("Excellent travail! Score final attribué automatiquement.");
    } else if (score >= 6) {
        feedbackParts.push("Bon travail. Quelques améliorations possibles. Score final attribué automatiquement.");
    } else if (score >= 4) {
        feedbackParts.push("Réponse à développer. Score final attribué automatiquement.");
    } else {
        feedbackParts.push("Réponse insuffisante. Score final attribué automatiquement.");
    }

    return {
        questionIndex,
        score,
        feedback: feedbackParts.join(" "),
        criteria: {
            length: wordCount,
            lengthScore,
            structureScore,
            vocabularyScore,
            accuracyScore,
            modelScore,
        },
    };
}

/**
 * Auto-check a batch of writing/speaking responses.
 * Only WRITING and SPEAKING questions are auto-checked; others are skipped.
 */
export function autoCheckBatch(questions: AutoCheckQuestion[]): AutoCheckScore[] {
    return questions
        .filter((q) => q.questionType === "WRITING" || q.questionType === "SPEAKING")
        .map((q) => autoCheckResponse(q.questionIndex, q.questionType, q.answer, q.wordLimit, q.modelAnswer));
}
