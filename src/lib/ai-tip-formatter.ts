
export interface ParsedTipSection {
  type: 'header' | 'numbered' | 'bullet' | 'paragraph' | 'emphasis';
  content: string;
  icon?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface ParsedTip {
  summary: string;
  sections: ParsedTipSection[];
}

// Map keywords to appropriate icons and urgency levels
const KEYWORD_MAPPING = {
  'mask': { icon: 'Mask', urgency: 'high' as const },
  'doctor': { icon: 'Stethoscope', urgency: 'high' as const },
  'emergency': { icon: 'AlertTriangle', urgency: 'high' as const },
  'immediate': { icon: 'Clock', urgency: 'high' as const },
  'exercise': { icon: 'Activity', urgency: 'medium' as const },
  'outdoor': { icon: 'TreePine', urgency: 'medium' as const },
  'indoor': { icon: 'Home', urgency: 'low' as const },
  'hydration': { icon: 'Droplets', urgency: 'medium' as const },
  'medication': { icon: 'Pill', urgency: 'high' as const },
  'monitor': { icon: 'Eye', urgency: 'medium' as const },
  'avoid': { icon: 'Ban', urgency: 'high' as const },
};

export const parseAITip = (tipText: string): ParsedTip => {
  if (!tipText) {
    return { summary: '', sections: [] };
  }

  const lines = tipText.split('\n').filter(line => line.trim());
  const sections: ParsedTipSection[] = [];
  let summary = '';

  // Extract summary from first sentence or paragraph
  const firstLine = lines[0]?.trim();
  if (firstLine) {
    const firstSentence = firstLine.split('.')[0] + '.';
    summary = firstSentence.length < 150 ? firstSentence : firstLine.substring(0, 147) + '...';
  }

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Detect numbered lists (1. 2. 3. etc.)
    if (/^\d+\.\s/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^\d+\.\s/, '');
      const { icon, urgency } = getIconAndUrgency(content);
      sections.push({
        type: 'numbered',
        content,
        icon,
        urgency
      });
    }
    // Detect bullet points (- or * at start)
    else if (/^[-*]\s/.test(trimmedLine)) {
      const content = trimmedLine.replace(/^[-*]\s/, '');
      const { icon, urgency } = getIconAndUrgency(content);
      sections.push({
        type: 'bullet',
        content,
        icon,
        urgency
      });
    }
    // Detect emphasized text (**text**)
    else if (trimmedLine.includes('**')) {
      sections.push({
        type: 'emphasis',
        content: trimmedLine.replace(/\*\*/g, ''),
        urgency: 'medium'
      });
    }
    // Regular paragraphs
    else if (trimmedLine.length > 20) {
      const { icon, urgency } = getIconAndUrgency(trimmedLine);
      sections.push({
        type: 'paragraph',
        content: trimmedLine,
        icon,
        urgency
      });
    }
  }

  return { summary, sections };
};

const getIconAndUrgency = (text: string): { icon?: string; urgency: 'low' | 'medium' | 'high' } => {
  const lowerText = text.toLowerCase();
  
  for (const [keyword, mapping] of Object.entries(KEYWORD_MAPPING)) {
    if (lowerText.includes(keyword)) {
      return mapping;
    }
  }
  
  // Default urgency based on text content
  if (lowerText.includes('immediately') || lowerText.includes('urgent') || lowerText.includes('emergency')) {
    return { urgency: 'high' };
  }
  if (lowerText.includes('consider') || lowerText.includes('monitor') || lowerText.includes('watch')) {
    return { urgency: 'medium' };
  }
  
  return { urgency: 'low' };
};

export const getUrgencyColor = (urgency: 'low' | 'medium' | 'high'): string => {
  switch (urgency) {
    case 'high': return 'text-red-700 bg-red-50 border-red-200';
    case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'low': return 'text-blue-700 bg-blue-50 border-blue-200';
    default: return 'text-gray-700 bg-gray-50 border-gray-200';
  }
};
