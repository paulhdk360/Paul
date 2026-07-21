// Converts common text emoticons typed by the user (e.g. ";)", ":D") into
// real emoji characters before a message is sent, so they render properly
// instead of staying as literal punctuation.
const EMOTICON_MAP: [RegExp, string][] = [
  [/:'\(/g, "😢"],
  [/:-?D/g, "😄"],
  [/:-?\)/g, "🙂"],
  [/:-?\(/g, "🙁"],
  [/;-?\)/g, "😉"],
  [/:-?[Pp]/g, "😛"],
  [/:-?[Oo]/g, "😮"],
  [/:-?\|/g, "😐"],
  [/x[Dd]/g, "😆"],
  [/<3/g, "❤️"],
];

export function replaceEmoticons(text: string): string {
  let result = text;
  for (const [pattern, emoji] of EMOTICON_MAP) {
    result = result.replace(pattern, emoji);
  }
  return result;
}
