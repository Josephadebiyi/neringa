import { RESTRICTED_ITEMS } from './restrictedItems.js';
import { askClaude, isAiEnabled } from './aiService.js';

const DEFAULT_MODEL = process.env.ANTHROPIC_VISION_MODEL || process.env.AI_IMAGE_SCAN_MODEL || 'claude-haiku-4-5';

function scanRequired() {
  return process.env.AI_IMAGE_SCAN_REQUIRED === 'true';
}

function imageToClaudeSource(imageInput) {
  if (!imageInput) return null;
  if (Buffer.isBuffer(imageInput)) {
    return {
      type: 'base64',
      media_type: 'image/jpeg',
      data: imageInput.toString('base64'),
    };
  }
  const value = String(imageInput);
  const dataUriMatch = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,(.+)$/i);
  if (dataUriMatch) {
    const mediaType = dataUriMatch[1].toLowerCase() === 'image/jpg'
      ? 'image/jpeg'
      : dataUriMatch[1].toLowerCase();
    return {
      type: 'base64',
      media_type: mediaType,
      data: dataUriMatch[2],
    };
  }
  if (/^https?:\/\//i.test(value)) return null;
  return {
    type: 'base64',
    media_type: 'image/jpeg',
    data: value,
  };
}

function parseJsonObject(text = '') {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeScanResult(raw = {}) {
  const label = String(raw.label || raw.status || 'review').toLowerCase().trim();
  const normalizedLabel = ['allowed', 'restricted', 'prohibited', 'unsafe', 'review'].includes(label)
    ? label
    : 'review';
  const detectedItems = Array.isArray(raw.detectedItems)
    ? raw.detectedItems.map((item) => String(item).slice(0, 80)).filter(Boolean).slice(0, 8)
    : [];
  const confidence = Number.isFinite(Number(raw.confidence))
    ? Math.max(0, Math.min(1, Number(raw.confidence)))
    : 0;
  const claimsProhibited = normalizedLabel === 'prohibited' || normalizedLabel === 'unsafe';
  const outcome = claimsProhibited
    ? (confidence > 0.95 ? 'rejected' : confidence >= 0.70 ? 'manual_review' : 'approved')
    : normalizedLabel === 'restricted'
      ? 'approved_with_conditions'
      : normalizedLabel === 'review'
        ? 'manual_review'
        : 'approved';
  return {
    provider: 'anthropic',
    model: DEFAULT_MODEL,
    label: normalizedLabel,
    outcome,
    allowed: outcome !== 'rejected',
    requiresReview: outcome === 'manual_review',
    confidence,
    detectedItems,
    reason: String(raw.reason || 'Image safety scan completed.').slice(0, 500),
  };
}

export async function scanItemImageForSafety({
  image,
  description = '',
  category = '',
  declaredValue = 0,
} = {}) {
  if (!image) return { skipped: true, reason: 'no_image' };
  if (!isAiEnabled()) {
    if (scanRequired()) {
      return {
        skipped: false,
        allowed: true,
        requiresReview: true,
        label: 'review',
        outcome: 'manual_review',
        reason: 'AI image safety scanning is required but ANTHROPIC_API_KEY is not configured.',
      };
    }
    return { skipped: true, reason: 'ANTHROPIC_API_KEY_not_configured' };
  }

  const imageSource = imageToClaudeSource(image);
  if (!imageSource) {
    if (scanRequired()) {
      return {
        skipped: false,
        allowed: true,
        requiresReview: true,
        label: 'review',
        outcome: 'manual_review',
        reason: 'AI image safety scanning requires uploaded image bytes, not only a remote URL.',
      };
    }
    return { skipped: true, reason: 'remote_url_not_scanned' };
  }

  const prompt = [
    'You are an item safety reviewer for a peer-to-peer travel shipping app.',
    'Inspect the uploaded item photo and decide if the item is allowed, restricted/requires review, or prohibited/unsafe.',
    'Return only JSON with keys: label, confidence, detectedItems, requiresReview, reason.',
    'Allowed label values: allowed, restricted, prohibited, unsafe, review.',
    `Declared category: ${category || 'unknown'}.`,
    `Declared description: ${description || 'unknown'}.`,
    `Declared value: ${declaredValue || 0}.`,
    `Prohibited examples: ${RESTRICTED_ITEMS.prohibited.join(', ')}.`,
    `Restricted examples: ${RESTRICTED_ITEMS.restricted.join(', ')}.`,
    'Use prohibited only when the image clearly shows an explicitly prohibited item. Medicine, alcohol, tobacco, sealed, boxed, wrapped, or unclear contents are not automatically prohibited.',
    'Never invent dangerous items. If uncertain, use review; uncertainty alone is never prohibited.',
  ].join('\n');

  try {
    const content = await askClaude({
      model: DEFAULT_MODEL,
      maxTokens: 700,
      system: 'You are a strict item safety classifier. Return only valid JSON.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: imageSource },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const parsed = parseJsonObject(content);
    if (!parsed) {
      if (scanRequired()) {
        return {
          skipped: false,
          allowed: true,
          requiresReview: true,
          label: 'review',
          outcome: 'manual_review',
          reason: 'AI image safety scan returned an unreadable result.',
        };
      }
      return { skipped: true, reason: 'unreadable_ai_result' };
    }

    return normalizeScanResult(parsed);
  } catch (error) {
    if (scanRequired()) {
      return {
        skipped: false,
        allowed: true,
        requiresReview: true,
        label: 'review',
        outcome: 'manual_review',
        reason: error?.message || 'AI image safety scan failed.',
      };
    }
    return { skipped: true, reason: error?.message || 'AI image safety scan failed.' };
  }
}
