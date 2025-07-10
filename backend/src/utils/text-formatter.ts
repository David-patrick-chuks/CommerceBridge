// Format Text Based on Style
export function formatText(style: string, text: string): string {
  const scriptMap: Record<string, string> = {
    a: '𝓪', b: '𝓫', c: '𝓬', d: '𝓭', e: '𝓮', f: '𝓯', g: '𝓰',
    h: '𝓱', i: '𝓲', j: '𝓳', k: '𝓴', l: '𝓵', m: '𝓶', n: '𝓷',
    o: '𝓸', p: '𝓹', q: '𝓺', r: '𝓻', s: '𝓼', t: '𝓽', u: '𝓾',
    v: '𝓿', w: '𝔀', x: '𝔁', y: '𝔂', z: '𝔃',
    A: '𝓐', B: '𝓑', C: '𝓒', D: '𝓓', E: '𝓔', F: '𝓕', G: '𝓖',
    H: '𝓗', I: '𝓘', J: '𝓙', K: '𝓚', L: '𝓛', M: '𝓜', N: '𝓝',
    O: '𝓞', P: '𝓟', Q: '𝓠', R: '𝓡', S: '𝓢', T: '𝓣', U: '𝓤',
    V: '𝓥', W: '𝓦', X: '𝓧', Y: '𝓨', Z: '𝓩'
  };

  switch (style.toLowerCase()) {
    case "plain":
      return text;
    case "bold":
      return `*${text}*`;
    case "italic":
      return `_${text}_`;
    case "strikethrough":
      return `~${text}~`;
    case "monospace":
      return `\`\`\`${text}\`\`\``;
    case "code":
      return `\`${text}\``; 
    case "all caps":
      return text.toUpperCase();
    case "small caps":
      return toSmallCaps(text);
    case "title case":
      return text.replace(/\b\w/g, char => char.toUpperCase());
    case "sentence case":
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    case "lowercase":
      return text.toLowerCase();
    case "uppercase":
      return text.toUpperCase();
    case "high contrast":
      return toBoldUnicode(text);
    case "dimmed":
      return text.split('').map(char => char + '\u0336').join('');
    case "script":
      return text.split('').map(c => scriptMap[c] || c).join('');
    default:
      return text;
  }
}

// Helper: Convert to Unicode Small Caps
function toSmallCaps(str: string): string {
  const map: Record<string, string> = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ',
    i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
    q: 'ǫ', r: 'ʀ', s: 's', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
    y: 'ʏ', z: 'ᴢ'
  };
  return str.toLowerCase().split('').map(c => map[c] || c).join('');
}

// Helper: Convert to Unicode Bold
function toBoldUnicode(str: string): string {
  const A = '𝗔'.charCodeAt(0), a = '𝗮'.charCodeAt(0);
  return str.split('').map(c => {
    if (/[A-Z]/.test(c)) return String.fromCharCode(A + c.charCodeAt(0) - 65);
    if (/[a-z]/.test(c)) return String.fromCharCode(a + c.charCodeAt(0) - 97);
    return c;
  }).join('');
}

// Convenience functions for common formatting
export const formatBold = (text: string) => formatText('bold', text);
export const formatItalic = (text: string) => formatText('italic', text);
export const formatStrikethrough = (text: string) => formatText('strikethrough', text);
export const formatMonospace = (text: string) => formatText('monospace', text);
export const formatScript = (text: string) => formatText('script', text);
export const formatTitleCase = (text: string) => formatText('title case', text);
export const formatHighContrast = (text: string) => formatText('high contrast', text);
export const formatCode = (text: string) => formatText('code', text);

// WhatsApp-specific formatting helpers
export const formatWhatsAppBold = (text: string) => `*${text}*`;
export const formatWhatsAppItalic = (text: string) => `_${text}_`;
export const formatWhatsAppStrikethrough = (text: string) => `~${text}~`;
export const formatWhatsAppMonospace = (text: string) => `\`${text}\``;
export const formatWhatsAppCodeBlock = (text: string) => `\`\`\`${text}\`\`\``; 