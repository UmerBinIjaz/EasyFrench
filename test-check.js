const text = "Je m'appelle Umer.";
const ans = "Je m'appelle Ali Ahmed.";

const FRENCH_STOPWORDS = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc',
    'or', 'ni', 'car', 'que', 'qui', 'quoi', 'dont', 'où', 'ce', 'cette', 'ces',
    'cet', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre',
    'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'on',
    'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'lui', 'en', 'y', 'à',
    'au', 'aux', 'dans', 'sur', 'pour', 'par', 'avec', 'sans', 'sous', 'vers',
    'est', 'sont', 'été', 'être', 'a', 'as', 'ont', 'ai', 'avons', 'avez',
    'pas', 'ne', 'plus', 'très', 'bien', 'tout', 'tous', 'toute', 'toutes',
    'comme', 'si', 'quand', 'alors', 'ici', 'là', 'cela', 'ça', 'il', 'elle'
]);

function extractKeywords(str) {
    const tokens = (str || '')
        .toLowerCase()
        .replace(/[.,!?;:()«»"'\-–—]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .filter((t) => t.length > 2 && !FRENCH_STOPWORDS.has(t));
    return new Set(tokens);
}

const modKw = extractKeywords(text);
const stuKw = extractKeywords(ans);

console.log('Model Keywords:', Array.from(modKw));
console.log('Student Keywords:', Array.from(stuKw));

let hits = 0;
for (const kw of modKw) {
    if (stuKw.has(kw)) hits++;
}

console.log('Hits:', hits, 'Total Mod:', modKw.size);
console.log('Score:', Math.round((hits / modKw.size) * 10));
