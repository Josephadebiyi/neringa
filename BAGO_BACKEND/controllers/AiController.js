import { query, queryOne } from '../lib/postgres/db.js';
import { askClaude, isAiEnabled } from '../services/aiService.js';

// ── Feature 2: Smart Package Compliance Check ─────────────────────────────────
// POST /api/bago/ai/compliance-check
// Body: { category, weight, fromLocation, toLocation }
export async function complianceCheck(req, res) {
  if (!isAiEnabled()) {
    return res.json({ success: true, riskLevel: 'low', notes: '', requiredDocs: [] });
  }
  try {
    const { category = '', weight = 0, fromLocation = '', toLocation = '' } = req.body;

    const prompt = `You are a customs and international shipping compliance expert.

A package is being sent via a peer-to-peer traveler delivery service.

Package details:
- Type/Category: ${category || 'unspecified'}
- Weight: ${weight}kg
- From: ${fromLocation}
- To: ${toLocation}

Assess the customs and legal risk of carrying this package across borders.

Respond ONLY with a valid JSON object — no markdown, no explanation outside the JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "notes": "one or two plain-English sentences about customs considerations",
  "requiredDocs": ["list", "of", "required", "documents"]
}

- "low": standard goods, no special requirements
- "medium": may need customs declaration or certificate (food, electronics over threshold, cosmetics)
- "high": restricted/prohibited items, strict documentation required (lithium batteries, medication, plants, currency)

Keep notes concise and actionable.`;

    const raw = await askClaude({
      system: 'You are a shipping compliance assistant. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 400,
    });

    let parsed;
    try {
      // Strip any accidental markdown fences
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { riskLevel: 'low', notes: '', requiredDocs: [] };
    }

    return res.json({
      success: true,
      riskLevel: parsed.riskLevel ?? 'low',
      notes: parsed.notes ?? '',
      requiredDocs: Array.isArray(parsed.requiredDocs) ? parsed.requiredDocs : [],
    });
  } catch (err) {
    console.error('complianceCheck error:', err.message);
    // Never block checkout — graceful fallback
    return res.json({ success: true, riskLevel: 'low', notes: '', requiredDocs: [] });
  }
}

// ── Feature 3: Traveler Price Recommendation ──────────────────────────────────
// GET /api/bago/ai/price-recommendation?from=&to=&currency=&rating=
export async function priceRecommendation(req, res) {
  if (!isAiEnabled()) {
    return res.json({ success: true, suggestedMin: null, suggestedMax: null, reasoning: '' });
  }
  try {
    const { from = '', to = '', currency = 'USD', rating = '0' } = req.query;

    // Fetch similar trips on this route for market context
    let marketContext = '';
    try {
      const similar = await query(
        `SELECT price_per_kg, available_kg, status
         FROM public.trips
         WHERE (from_location ILIKE $1 OR from_location ILIKE $2)
           AND (to_location ILIKE $3 OR to_location ILIKE $4)
           AND currency = $5
           AND status IN ('active', 'verified', 'pending')
           AND departure_date >= NOW() - INTERVAL '30 days'
         ORDER BY created_at DESC
         LIMIT 10`,
        [`%${from.split(',')[0]}%`, `%${from}%`, `%${to.split(',')[0]}%`, `%${to}%`, currency],
      );
      if (similar.rows.length > 0) {
        const prices = similar.rows.map((r) => parseFloat(r.price_per_kg)).filter(Boolean);
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        marketContext = `Market data for this route (${prices.length} active trips): min ${currency} ${min.toFixed(2)}/kg, max ${currency} ${max.toFixed(2)}/kg, avg ${currency} ${avg.toFixed(2)}/kg.`;
      }
    } catch (_) {
      // market context is optional
    }

    const prompt = `You are a pricing advisor for a peer-to-peer package delivery marketplace.

A traveler wants to set a price per kg for carrying packages on their trip:
- Route: ${from} → ${to}
- Currency: ${currency}
- Traveler rating: ${parseFloat(rating).toFixed(1)}/5.0
${marketContext ? `- ${marketContext}` : '- No comparable trips on this route yet.'}

Suggest a competitive price range per kg that will attract senders while fairly compensating the traveler.

Respond ONLY with valid JSON — no markdown:
{
  "suggestedMin": <number>,
  "suggestedMax": <number>,
  "reasoning": "one sentence explaining the suggestion"
}`;

    const raw = await askClaude({
      system: 'You are a delivery pricing advisor. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 200,
    });

    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { suggestedMin: null, suggestedMax: null, reasoning: '' };
    }

    return res.json({
      success: true,
      suggestedMin: typeof parsed.suggestedMin === 'number' ? parsed.suggestedMin : null,
      suggestedMax: typeof parsed.suggestedMax === 'number' ? parsed.suggestedMax : null,
      reasoning: parsed.reasoning ?? '',
      currency,
    });
  } catch (err) {
    console.error('priceRecommendation error:', err.message);
    return res.json({ success: true, suggestedMin: null, suggestedMax: null, reasoning: '' });
  }
}

// ── Feature 5: Smart Traveler Match Score ─────────────────────────────────────
// POST /api/bago/ai/match-scores
// Body: { weight, category, from, to, tripIds: string[] }
export async function matchScores(req, res) {
  if (!isAiEnabled()) {
    return res.json({ success: true, scores: [] });
  }
  try {
    const { weight = 0, category = '', from = '', to = '', tripIds = [] } = req.body;

    if (!Array.isArray(tripIds) || tripIds.length === 0) {
      return res.json({ success: true, scores: [] });
    }

    // Look up trip details from DB
    const placeholders = tripIds.map((_, i) => `$${i + 1}`).join(', ');
    const tripsResult = await query(
      `SELECT
         t.id,
         t.from_location,
         t.to_location,
         t.available_kg,
         t.price_per_kg,
         t.currency,
         t.travel_means,
         t.departure_date,
         COALESCE(
           (SELECT AVG(r.rating)::numeric(3,1) FROM public.reviews r WHERE r.trip_id = t.id),
           0
         ) AS avg_rating,
         COUNT(DISTINCT sr.id) AS completed_trips
       FROM public.trips t
       LEFT JOIN public.shipment_requests sr
         ON sr.trip_id = t.id AND sr.status = 'completed'
       WHERE t.id = ANY($1::uuid[])
       GROUP BY t.id`,
      [tripIds],
    ).catch(() => ({ rows: [] }));

    if (tripsResult.rows.length === 0) {
      return res.json({ success: true, scores: [] });
    }

    const tripsJson = tripsResult.rows
      .map(
        (t, i) =>
          `${i + 1}. ID: ${t.id} | Route: ${t.from_location} → ${t.to_location} | ` +
          `Available: ${t.available_kg}kg | Price: ${t.currency} ${t.price_per_kg}/kg | ` +
          `Rating: ${t.avg_rating}/5 | Completed trips: ${t.completed_trips} | ` +
          `Travel: ${t.travel_means} | Departs: ${t.departure_date?.toString().slice(0, 10) ?? 'TBD'}`,
      )
      .join('\n');

    const prompt = `You are a shipment matching expert for a peer-to-peer delivery platform.

Sender's package:
- Weight needed: ${weight}kg
- Category: ${category || 'general goods'}
- Pickup: ${from}
- Delivery: ${to}

Available travelers:
${tripsJson}

Score each traveler 0-100 for how well they match the sender's needs. Consider:
- Route alignment (does from/to match?)
- Capacity (can they carry the weight?)
- Traveler credibility (rating + completed trips)
- Departure timing

Assign ONE badge per traveler:
- "Top Match" — score 80+, great all-round fit
- "Good Fit" — score 50-79, acceptable option
- "Available" — score below 50, limited match

Respond ONLY with valid JSON — no markdown:
{
  "scores": [
    { "tripId": "<uuid>", "score": <0-100>, "badge": "Top Match"|"Good Fit"|"Available" }
  ]
}`;

    const raw = await askClaude({
      system: 'You are a shipment matching assistant. Always respond with valid JSON only.',
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 600,
    });

    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = { scores: [] };
    }

    const scores = Array.isArray(parsed.scores)
      ? parsed.scores.filter((s) => s.tripId && typeof s.score === 'number')
      : [];

    return res.json({ success: true, scores });
  } catch (err) {
    console.error('matchScores error:', err.message);
    return res.json({ success: true, scores: [] });
  }
}
