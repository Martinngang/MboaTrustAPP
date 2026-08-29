/**
 * Gemini AI API Client — Mobile (MboaTrustAPP)
 *
 * Uses Gemini 2.0 Flash multimodal for:
 *  1. AI Construction Site Photo Inspector
 *  2. AI Cadastral Land Title Deed Scanner
 *
 * Key read from EXPO_PUBLIC_GEMINI_API_KEY env variable.
 * Falls back gracefully when absent.
 */

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? ''

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

export interface AIPhotoInspectionResult {
  score: number
  verdict: 'pass' | 'flag' | 'fail'
  summary: string
  findings: {
    label: string
    severity: 'ok' | 'warning' | 'critical'
    detail: string
  }[]
  fraudFlags: string[]
  gpsNote: string | null
}

export interface AIDeedScanResult {
  titleNumber: string | null
  conservationOffice: string | null
  ownerName: string | null
  plotAreaSqm: number | null
  beaconCoordinates: string | null
  registrationDate: string | null
  authenticityScore: number
  alerts: {
    type: 'missing_stamp' | 'mismatch' | 'date_anomaly' | 'low_confidence' | 'ok'
    message: string
  }[]
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function callGemini(parts: object[]): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY_MISSING')

  const resp = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Gemini API error ${resp.status}: ${err}`)
  }

  const json = await resp.json()
  return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\})/)
    return JSON.parse(match?.[1] ?? text) as T
  } catch {
    return fallback
  }
}

// ── Feature 1: AI Construction Site Photo Inspector ───────────────────────────

const PHOTO_INSPECTOR_PROMPT = `You are an expert Cameroon civil engineering site inspector and AI fraud detection system.
Analyze this construction site photo and return a JSON analysis with this exact structure:
{
  "score": <integer 0-100>,
  "verdict": <"pass" | "flag" | "fail">,
  "summary": <1-2 sentence summary>,
  "findings": [{ "label": <string>, "severity": <"ok"|"warning"|"critical">, "detail": <string> }],
  "fraudFlags": [<strings>],
  "gpsNote": <null or string>
}
Evaluate concrete quality, rebar placement, trench depth, material brands (Cimencam/Dangote), and fraud indicators.
Score: 90-100=excellent, 70-89=good, 50-69=flag, below 50=fail. Return ONLY JSON.`

export async function inspectConstructionPhoto(
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<AIPhotoInspectionResult> {
  const FALLBACK: AIPhotoInspectionResult = {
    score: 0,
    verdict: 'flag',
    summary: 'AI inspection unavailable — manual expert review required.',
    findings: [
      {
        label: 'AI Service Unavailable',
        severity: 'warning',
        detail: 'No Gemini API key configured. A human verifier must review this photo.',
      },
    ],
    fraudFlags: [],
    gpsNote: null,
  }

  try {
    const parts = [
      { text: PHOTO_INSPECTOR_PROMPT },
      { inlineData: { mimeType, data: base64Image } },
    ]
    const raw = await callGemini(parts)
    return safeParseJSON<AIPhotoInspectionResult>(raw, FALLBACK)
  } catch (err) {
    if (err instanceof Error && err.message === 'GEMINI_API_KEY_MISSING') return FALLBACK
    throw err
  }
}

// ── Feature 2: AI Cadastral Land Title Deed Scanner ──────────────────────────

const DEED_SCANNER_PROMPT = `You are an expert in Cameroon real estate law and cadastral document analysis.
Analyze this Titre Foncier / cadastral document and return a JSON:
{
  "titleNumber": <string | null>,
  "conservationOffice": <string | null>,
  "ownerName": <string | null>,
  "plotAreaSqm": <number | null>,
  "beaconCoordinates": <string | null>,
  "registrationDate": <string | null>,
  "authenticityScore": <integer 0-100>,
  "alerts": [{ "type": <"missing_stamp"|"mismatch"|"date_anomaly"|"low_confidence"|"ok">, "message": <string> }]
}
Check for MINDCAF stamps, Conservateur signatures, cadastral plot numbers, French legal descriptions.
Return ONLY JSON.`

export async function scanLandTitleDeed(
  base64Image: string,
  mimeType = 'image/jpeg'
): Promise<AIDeedScanResult> {
  const FALLBACK: AIDeedScanResult = {
    titleNumber: null,
    conservationOffice: null,
    ownerName: null,
    plotAreaSqm: null,
    beaconCoordinates: null,
    registrationDate: null,
    authenticityScore: 0,
    alerts: [
      {
        type: 'low_confidence',
        message: 'AI scan unavailable — please enter deed details manually.',
      },
    ],
  }

  try {
    const parts = [
      { text: DEED_SCANNER_PROMPT },
      { inlineData: { mimeType, data: base64Image } },
    ]
    const raw = await callGemini(parts)
    return safeParseJSON<AIDeedScanResult>(raw, FALLBACK)
  } catch (err) {
    if (err instanceof Error && err.message === 'GEMINI_API_KEY_MISSING') return FALLBACK
    throw err
  }
}
