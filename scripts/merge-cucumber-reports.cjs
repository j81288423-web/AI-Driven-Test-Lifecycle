// @ts-nocheck
/**
 * Merges individual Cucumber JSON report files into a single combined HTML report.
 * Usage: node scripts/merge-cucumber-reports.cjs [jsonDir] [outputHtml]
 *   jsonDir    - Directory containing per-TC JSON files (default: bdd-json-reports)
 *   outputHtml - Output HTML file path (default: cucumber-report.html)
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const jsonDir = process.argv[2] || 'bdd-json-reports';
const outputHtml = process.argv[3] || 'cucumber-report.html';

function scheduleDeferredReportEmail(payload) {
  if (String(process.env.REPORT_EMAIL_DISABLED || '').trim() === '1') {
    console.log('[EMAIL] Deferred report email disabled by REPORT_EMAIL_DISABLED=1');
    return;
  }

  // Avoid sending intermediate emails for long-running parallel batches.
  if (fs.existsSync(path.resolve(process.cwd(), 'parallel-locks'))) {
    console.log('[EMAIL] Skipping email scheduling while parallel-locks exists.');
    return;
  }

  const senderScript = path.resolve(process.cwd(), 'scripts', 'send-cucumber-report-email.js');
  if (!fs.existsSync(senderScript)) {
    console.warn('[EMAIL] send-cucumber-report-email.js not found; skipping email scheduling.');
    return;
  }

  const stateDir = path.resolve(process.cwd(), '.report-email');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  const stateFile = path.join(stateDir, 'latest-report-email.json');
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const state = {
    token,
    reportPath: path.resolve(process.cwd(), payload.reportPath || outputHtml),
    total: String(payload.total || '0'),
    passed: String(payload.passed || '0'),
    failed: String(payload.failed || '0'),
    startedAt: String(payload.startedAt || 'N/A'),
    finishedAt: String(payload.finishedAt || new Date().toLocaleString()),
    duration: String(payload.duration || 'N/A'),
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');

  const child = spawn(process.execPath, [senderScript, '--deferred', stateFile, token], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();

  console.log('[EMAIL] Deferred report email scheduled.');
}

// 1. Read and merge all JSON files
const allFeatures = [];
const files = fs.readdirSync(jsonDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
  console.log('[REPORT] No JSON report files found in', jsonDir);
  process.exit(0);
}

for (const file of files) {
  try {
    const content = fs.readFileSync(path.join(jsonDir, file), 'utf8').trim();
    if (!content) continue;
    const features = JSON.parse(content);
    if (Array.isArray(features)) {
      allFeatures.push(...features);
    }
  } catch (err) {
    console.warn(`[REPORT] Skipping ${file}: ${err.message}`);
  }
}

// 2. Deduplicate features - merge scenarios from same feature
const featureMap = new Map();
for (const feature of allFeatures) {
  const key = feature.uri || feature.id || feature.name;
  if (featureMap.has(key)) {
    const existing = featureMap.get(key);
    existing.elements = existing.elements || [];
    existing.elements.push(...(feature.elements || []));
  } else {
    featureMap.set(key, { ...feature, elements: [...(feature.elements || [])] });
  }
}

// 3. Compute stats
let totalScenarios = 0, passed = 0, failed = 0, skipped = 0, pending = 0;

for (const feature of featureMap.values()) {
  for (const element of (feature.elements || [])) {
    if (element.type !== 'scenario') continue;
    totalScenarios++;
    const steps = element.steps || [];
    const hasFailed = steps.some(s => s.result && s.result.status === 'failed');
    const hasSkipped = steps.some(s => s.result && s.result.status === 'skipped');
    const hasPending = steps.some(s => s.result && s.result.status === 'pending');
    const hasUndefined = steps.some(s => s.result && s.result.status === 'undefined');
    if (hasFailed) failed++;
    else if (hasPending || hasUndefined) pending++;
    else if (hasSkipped && !steps.some(s => s.result && s.result.status === 'passed')) skipped++;
    else passed++;
  }
}

// 4. Generate HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDuration(nanoseconds) {
  if (!nanoseconds || nanoseconds <= 0) return '-';
  const ms = nanoseconds / 1e6;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  const sec = ms / 1000;
  if (sec < 60) return `${sec.toFixed(1)}s`;
  const min = Math.floor(sec / 60);
  const remSec = (sec % 60).toFixed(1);
  return `${min}m ${remSec}s`;
}

function extractArtifactPaths(text) {
  if (!text) return [];
  // Capture Windows absolute file paths that end with common artifact extensions.
  const re = /([A-Za-z]:\\[^\n\r"']+\.(?:png|jpg|jpeg|html))/gi;
  const found = [];
  let m;
  while ((m = re.exec(String(text))) !== null) {
    const candidate = String(m[1] || '').trim();
    if (!candidate) continue;
    if (!found.includes(candidate)) found.push(candidate);
  }
  return found;
}

function toFileUrl(winPath) {
  // Convert local Windows path to file URL for browser rendering in local HTML.
  const normalized = String(winPath || '').replace(/\\/g, '/');
  return `file:///${encodeURI(normalized)}`;
}

function toImageDataUri(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png'
      : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg'
        : null;
    if (!mime) return null;
    const raw = fs.readFileSync(filePath);
    return `data:${mime};base64,${raw.toString('base64')}`;
  } catch (_) {
    return null;
  }
}

function walkFilesRecursive(rootDir) {
  const out = [];
  if (!rootDir || !fs.existsSync(rootDir)) return out;
  const stack = [rootDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) out.push(full);
    }
  }
  return out;
}

function collectRecentFailureScreenshots(limit = 24) {
  const candidateDirs = [
    path.resolve(process.cwd(), '..', 'screenshots'),
    path.resolve(process.cwd(), 'test-results', 'debug-screenshots'),
    path.resolve(process.cwd(), 'screenshots')
  ];

  const seen = new Set();
  const files = [];

  for (const dir of candidateDirs) {
    for (const filePath of walkFilesRecursive(dir)) {
      if (seen.has(filePath)) continue;
      seen.add(filePath);
      if (!/\.(png|jpg|jpeg)$/i.test(filePath)) continue;
      if (!/FAILURE|failed|error|debug/i.test(path.basename(filePath))) continue;
      let mtimeMs = 0;
      try {
        mtimeMs = fs.statSync(filePath).mtimeMs || 0;
      } catch (_) {}
      files.push({ filePath, mtimeMs });
    }
  }

  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files.slice(0, Math.max(1, Number(limit) || 24)).map(f => f.filePath);
}

function normalizeForMatch(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractTCLabelFromText(value) {
  const m = String(value || '').match(/(?:TEST|TC)[_-]?(\d{1,4})/i);
  if (!m || !m[1]) return '';
  return `TC${String(m[1]).padStart(3, '0')}`;
}

function extractTCLabelFromPath(filePath) {
  const normalized = String(filePath || '').replace(/\\/g, '/');
  const fromDir = normalized.match(/\/((?:TC\d{3,4})|UNKNOWN_TEST)\//i);
  if (fromDir && fromDir[1] && String(fromDir[1]).toUpperCase() !== 'UNKNOWN_TEST') {
    return String(fromDir[1]).toUpperCase();
  }
  return extractTCLabelFromText(path.basename(normalized));
}

function getScenarioTCLabel(scenario) {
  if (!scenario) return '';
  const tags = Array.isArray(scenario.tags) ? scenario.tags : [];
  for (const t of tags) {
    const tagName = typeof t === 'string' ? t : t && t.name;
    const label = extractTCLabelFromText(tagName);
    if (label) return label;
  }
  return extractTCLabelFromText(scenario.name || '');
}

function chooseBestScreenshotForStep(step, scenario, screenshotPool) {
  if (!step || !step.result || step.result.status !== 'failed') return null;
  const pool = Array.isArray(screenshotPool) ? screenshotPool : [];
  if (pool.length === 0) return null;

  const scenarioTC = getScenarioTCLabel(scenario);
  let candidatePool = pool;
  if (scenarioTC) {
    const sameTc = pool.filter((p) => extractTCLabelFromPath(p) === scenarioTC);
    if (sameTc.length > 0) {
      candidatePool = sameTc;
    }
  }

  const stepText = normalizeForMatch(step.name || '');
  const scenarioText = normalizeForMatch((scenario && scenario.name) || '');
  if (!stepText && !scenarioText) return null;

  const tokens = new Set([
    ...stepText.split(' ').filter(t => t.length >= 4),
    ...scenarioText.split(' ').filter(t => t.length >= 4)
  ]);

  let best = null;
  let bestScore = 0;

  for (const shot of candidatePool) {
    const base = normalizeForMatch(path.basename(shot));
    if (!base) continue;

    let score = 0;
    for (const tok of tokens) {
      if (base.includes(tok)) score += 1;
    }

    // Boost when large chunks from the step/scenario text appear in filename.
    if (stepText) {
      const chunk = stepText.slice(0, Math.min(28, stepText.length)).trim();
      if (chunk && base.includes(chunk)) score += 3;
    }
    if (scenarioText) {
      const chunk = scenarioText.slice(0, Math.min(24, scenarioText.length)).trim();
      if (chunk && base.includes(chunk)) score += 2;
    }

    if (score > bestScore) {
      best = shot;
      bestScore = score;
    }
  }

  // Require at least a weak textual match to avoid random screenshot attachments.
  return bestScore >= 2 ? best : null;
}

function renderStepArtifacts(step, scenario, screenshotPool) {
  const errorText = (step && step.result && step.result.error_message) || '';
  const paths = extractArtifactPaths(errorText).filter(p => fs.existsSync(p));

  // Fallback: if no explicit screenshot path is present for a failed step,
  // infer the best-matching failure screenshot by step/scenario text.
  if (paths.length === 0) {
    const inferred = chooseBestScreenshotForStep(step, scenario, screenshotPool);
    if (inferred && fs.existsSync(inferred)) {
      paths.push(inferred);
    }
  }

  if (paths.length === 0) return '';

  const links = paths.map((p) => {
    const href = toFileUrl(p);
    const name = escapeHtml(path.basename(p));
    const isImage = /\.(png|jpg|jpeg)$/i.test(p);
    const dataUri = isImage ? toImageDataUri(p) : null;
    const previewSrc = dataUri || href;
    const preview = isImage ? `<img src="${previewSrc}" alt="${name}" class="artifact-image" loading="lazy" />` : '';
    return `<div class="artifact-item"><a href="${href}" target="_blank" rel="noopener noreferrer">${name}</a>${preview}</div>`;
  }).join('');

  return `<div class="step-artifacts"><div class="artifact-title">Attachments</div>${links}</div>`;
}

/**
 * Render Cucumber JSON embeddings (from this.attach() calls).
 * Embeddings appear on steps or on before/after hook entries.
 * @param {Array} embeddings - Array of { data, mime_type } objects
 * @returns {string} HTML string
 */
function normalizeEmbeddings(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) return [];

  const normalized = [];
  for (const item of rawItems) {
    if (!item) continue;

    // Legacy cucumber-json shape: { mime_type, data }
    if (item.data && (item.mime_type || (item.media && item.media.type))) {
      normalized.push(item);
      continue;
    }

    // Newer shape: { body, mediaType } or { body, media: { type } }
    const body = item.body || item.content || '';
    const mediaType = item.mediaType || item.mime_type || (item.media && item.media.type) || '';
    if (body && mediaType) {
      normalized.push({ data: body, mime_type: mediaType });
    }
  }

  return normalized;
}

function renderEmbeddings(embeddings) {
  const normalizedEmbeddings = normalizeEmbeddings(embeddings);
  if (normalizedEmbeddings.length === 0) return '';

  const items = [];
  for (const emb of normalizedEmbeddings) {
    const mime = String(emb.mime_type || emb.media && emb.media.type || '').toLowerCase();
    const data = emb.data || '';
    if (!data) continue;

    if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/jpg') {
      items.push(`<div class="embedding-item"><img src="data:${mime};base64,${data}" alt="Screenshot" class="embedding-image" loading="lazy" /></div>`);
    } else if (mime === 'text/html') {
      // Data may be raw string or base64 depending on how this.attach() was called
      let decoded = data;
      if (!data.startsWith('<') && !data.startsWith('\n')) {
        try { decoded = Buffer.from(data, 'base64').toString('utf8'); } catch (_) { decoded = data; }
      }
      const safeHtml = decoded.length > 200000 ? '[HTML content too large to inline]' : decoded;
      items.push(`<div class="embedding-item"><details><summary class="embedding-toggle">HTML Snapshot</summary><div class="embedding-html-preview">${escapeHtml(safeHtml).substring(0, 2000)}</div></details></div>`);
    } else if (mime === 'text/plain') {
      let decoded = data;
      try { decoded = Buffer.from(data, 'base64').toString('utf8'); } catch (_) { decoded = data; }
      items.push(`<div class="embedding-item"><pre class="embedding-text">${escapeHtml(decoded).substring(0, 2000)}</pre></div>`);
    } else if (mime === 'application/json') {
      // Data may be raw JSON string or base64
      let decoded = data;
      if (!data.startsWith('{') && !data.startsWith('[')) {
        try { decoded = Buffer.from(data, 'base64').toString('utf8'); } catch (_) { decoded = data; }
      }
      let title = 'JSON Context';
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.type === 'step-diagnostics') title = 'Step Diagnostics';
        else if (parsed && parsed.type === 'backend-call-failures') title = 'Backend Call Failures';
        else if (parsed && parsed.type === 'scenario-failure-context') title = 'Failure Context';
        decoded = JSON.stringify(parsed, null, 2);
      } catch (_) {
        // Keep original decoded text when it is not valid JSON.
      }
      items.push(`<div class="embedding-item"><details><summary class="embedding-toggle">${title}</summary><pre class="embedding-json">${escapeHtml(decoded).substring(0, 5000)}</pre></details></div>`);
    }
  }

  if (items.length === 0) return '';
  return `<div class="step-embeddings"><div class="embedding-title">Embedded Attachments</div>${items.join('')}</div>`;
}

/**
 * Collect all embeddings from a scenario's after hooks.
 * Cucumber places this.attach() data from After hooks on scenario.after[].embeddings.
 */
function collectAfterHookEmbeddings(scenario) {
  const all = [];
  const hooks = Array.isArray(scenario.after) ? scenario.after : [];
  for (const hook of hooks) {
    if (Array.isArray(hook.embeddings)) {
      all.push(...hook.embeddings);
    }
    if (Array.isArray(hook.attachments)) {
      all.push(...hook.attachments);
    }
  }
  // Also check before hooks (unlikely but complete)
  const beforeHooks = Array.isArray(scenario.before) ? scenario.before : [];
  for (const hook of beforeHooks) {
    if (Array.isArray(hook.embeddings)) {
      all.push(...hook.embeddings);
    }
    if (Array.isArray(hook.attachments)) {
      all.push(...hook.attachments);
    }
  }
  return all;
}

function getScenarioStatus(element) {
  const steps = element.steps || [];
  if (steps.some(s => s.result && s.result.status === 'failed')) return 'failed';
  if (steps.some(s => s.result && (s.result.status === 'pending' || s.result.status === 'undefined'))) return 'pending';
  if (steps.some(s => s.result && s.result.status === 'passed')) return 'passed';
  return 'skipped';
}

function getScenarioDuration(element) {
  return (element.steps || []).reduce((sum, s) => sum + ((s.result && s.result.duration) || 0), 0);
}

function getStatusColor(status) {
  switch (status) {
    case 'passed': return '#4caf50';
    case 'failed': return '#f44336';
    case 'pending': return '#ff9800';
    case 'skipped': return '#9e9e9e';
    default: return '#757575';
  }
}

const features = [...featureMap.values()];
const timestamp = new Date().toLocaleString();
const passRate = totalScenarios > 0 ? ((passed / totalScenarios) * 100).toFixed(1) : '0.0';
const runStartTime = String(process.env.REPORT_RUN_START || '').trim();
const runEndTime = String(process.env.REPORT_RUN_END || '').trim();
const runDuration = String(process.env.REPORT_RUN_DURATION || '').trim();
const screenshotPoolForInference = collectRecentFailureScreenshots(400);

let featureRows = '';
for (const feature of features) {
  const scenarios = (feature.elements || []).filter(e => e.type === 'scenario');
  if (scenarios.length === 0) continue;

  const featureName = escapeHtml(feature.name);
  const fPassed = scenarios.filter(s => getScenarioStatus(s) === 'passed').length;
  const fFailed = scenarios.filter(s => getScenarioStatus(s) === 'failed').length;
  const fOther = scenarios.length - fPassed - fFailed;
  const fStatus = fFailed > 0 ? 'failed' : (fOther > 0 ? 'pending' : 'passed');

  featureRows += `
  <div class="feature ${fStatus}">
    <div class="feature-header" onclick="this.parentElement.classList.toggle('collapsed')">
      <span class="feature-status" style="background:${getStatusColor(fStatus)}"></span>
      <span class="feature-name">${featureName}</span>
      <span class="feature-stats">${fPassed} passed, ${fFailed} failed${fOther > 0 ? `, ${fOther} other` : ''}</span>
    </div>
    <div class="scenarios">`;

  for (const scenario of scenarios) {
    const sStatus = getScenarioStatus(scenario);
    const sName = escapeHtml(scenario.name);
    const sDuration = formatDuration(getScenarioDuration(scenario));

    featureRows += `
      <div class="scenario ${sStatus}">
        <div class="scenario-header" onclick="this.parentElement.classList.toggle('expanded')">
          <span class="scenario-status" style="background:${getStatusColor(sStatus)}">${sStatus.toUpperCase()}</span>
          <span class="scenario-name">${sName}</span>
          <span class="scenario-duration">${sDuration}</span>
        </div>
        <div class="steps">`;

    for (const step of (scenario.steps || [])) {
      const stepStatus = (step.result && step.result.status) || 'skipped';
      const stepDuration = formatDuration(step.result && step.result.duration);
      const keyword = escapeHtml(step.keyword || '');
      const stepName = escapeHtml(step.name || '');
      const errorMsg = (step.result && step.result.error_message) ? escapeHtml(step.result.error_message) : '';
      const artifactsHtml = renderStepArtifacts(step, scenario, screenshotPoolForInference);
      const stepEmbeddingsHtml = renderEmbeddings([...(Array.isArray(step.embeddings) ? step.embeddings : []), ...(Array.isArray(step.attachments) ? step.attachments : [])]);

      featureRows += `
          <div class="step ${stepStatus}">
            <span class="step-keyword">${keyword}</span>${stepName}
            <span class="step-duration">${stepDuration}</span>
            <span class="step-status-badge" style="color:${getStatusColor(stepStatus)}">${stepStatus}</span>
            ${errorMsg ? `<pre class="error-message">${errorMsg}</pre>` : ''}
        ${artifactsHtml}
        ${stepEmbeddingsHtml}
          </div>`;
    }

    // Render embeddings from After hooks (screenshots/DOM attached on failure)
    const afterHookEmbeddings = collectAfterHookEmbeddings(scenario);
    const afterEmbeddingsHtml = renderEmbeddings(afterHookEmbeddings);
    if (afterEmbeddingsHtml) {
      featureRows += `
          <div class="step after-hook-attachments">
            <span class="step-keyword">Attachments </span>Failure screenshots &amp; context from After hook
        ${afterEmbeddingsHtml}
          </div>`;
    }

    featureRows += `
        </div>
      </div>`;
  }

  featureRows += `
    </div>
  </div>`;
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BDD Test Report - ${timestamp}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
  .header { background: #1a237e; color: white; padding: 24px 32px; border-radius: 8px; margin-bottom: 20px; }
  .header h1 { font-size: 22px; margin-bottom: 8px; }
  .header .timestamp { opacity: 0.8; font-size: 13px; }
  .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .summary-card { background: white; border-radius: 8px; padding: 20px 28px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; min-width: 140px; }
  .summary-card.clickable { cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  .summary-card.clickable:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,0,0,0.12); }
  .summary-card.active-filter { box-shadow: 0 0 0 2px #f44336, 0 6px 14px rgba(0,0,0,0.12); }
  .summary-card .value { font-size: 32px; font-weight: 700; }
  .summary-card .label { font-size: 12px; text-transform: uppercase; color: #666; margin-top: 4px; }
  .summary-card.passed .value { color: #4caf50; }
  .summary-card.failed .value { color: #f44336; }
  .summary-card.total .value { color: #1a237e; }
  .summary-card.rate .value { color: ${passed === totalScenarios ? '#4caf50' : '#ff9800'}; }
  .feature { background: white; border-radius: 8px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  .feature-header { display: flex; align-items: center; padding: 14px 20px; cursor: pointer; gap: 12px; user-select: none; }
  .feature-header:hover { background: #fafafa; }
  .feature-status { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .feature-name { font-weight: 600; flex: 1; }
  .feature-stats { font-size: 12px; color: #888; }
  .feature.collapsed .scenarios { display: none; }
  .feature.hidden-by-filter { display: none; }
  .scenarios { border-top: 1px solid #eee; }
  .scenario { border-bottom: 1px solid #f0f0f0; }
  .scenario.hidden-by-filter { display: none; }
  .scenario:last-child { border-bottom: none; }
  .scenario-header { display: flex; align-items: center; padding: 10px 20px 10px 36px; cursor: pointer; gap: 10px; }
  .scenario-header:hover { background: #fafafa; }
  .scenario-status { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 3px; color: white; flex-shrink: 0; }
  .scenario-name { flex: 1; font-size: 14px; }
  .scenario-duration { font-size: 12px; color: #999; }
  .steps { display: none; padding: 4px 20px 12px 52px; }
  .scenario.expanded .steps { display: block; }
  .step { padding: 4px 0; font-size: 13px; font-family: 'SFMono-Regular', Consolas, monospace; display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
  .step-keyword { font-weight: 700; color: #1a237e; }
  .step-duration { font-size: 11px; color: #aaa; }
  .step-status-badge { font-size: 11px; font-weight: 600; }
  .error-message { background: #fff3f3; color: #c62828; padding: 8px 12px; border-radius: 4px; font-size: 12px; margin-top: 4px; white-space: pre-wrap; word-break: break-word; width: 100%; max-height: 200px; overflow-y: auto; }
  .step-artifacts { width: 100%; background: #f7f9ff; border: 1px solid #e2e8f0; border-radius: 4px; margin-top: 6px; padding: 8px 10px; }
  .artifact-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
  .artifact-item { margin-bottom: 8px; }
  .artifact-item:last-child { margin-bottom: 0; }
  .artifact-item a { color: #1d4ed8; text-decoration: none; font-size: 12px; }
  .artifact-item a:hover { text-decoration: underline; }
  .artifact-image { display: block; margin-top: 6px; max-width: min(780px, 100%); max-height: 320px; border: 1px solid #dbe3f3; border-radius: 4px; background: #fff; }
  .step-embeddings { width: 100%; background: #fffbeb; border: 1px solid #fde68a; border-radius: 4px; margin-top: 6px; padding: 8px 10px; }
  .embedding-title { font-size: 11px; text-transform: uppercase; color: #92400e; font-weight: 700; margin-bottom: 6px; }
  .embedding-item { margin-bottom: 8px; }
  .embedding-item:last-child { margin-bottom: 0; }
  .embedding-image { display: block; max-width: min(780px, 100%); max-height: 400px; border: 1px solid #fde68a; border-radius: 4px; background: #fff; cursor: pointer; }
  .embedding-image:hover { border-color: #f59e0b; box-shadow: 0 2px 8px rgba(245,158,11,0.3); }
  .embedding-toggle { cursor: pointer; font-size: 12px; color: #92400e; font-weight: 600; padding: 4px 0; }
  .embedding-html-preview { background: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 11px; font-family: monospace; max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; margin-top: 4px; }
  .embedding-text { background: #f9f9f9; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; }
  .embedding-json { background: #f0fdf4; padding: 8px; border-radius: 4px; font-size: 11px; max-height: 200px; overflow-y: auto; white-space: pre-wrap; word-break: break-word; margin-top: 4px; }
  .after-hook-attachments { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px 12px; margin-top: 4px; }
</style>
</head>
<body>
<div class="header">
  <h1>BDD Test Report</h1>
  <div class="timestamp">Generated: ${timestamp} | Files merged: ${files.length}</div>
</div>
<div class="summary">
  <div class="summary-card total"><div class="value">${totalScenarios}</div><div class="label">Total Scenarios</div></div>
  <div class="summary-card passed"><div class="value">${passed}</div><div class="label">Passed</div></div>
  <div id="failedCard" class="summary-card failed clickable" data-count="${failed}" title="Click to show only failed scenarios; click again to show all"><div class="value">${failed}</div><div class="label">Failed</div></div>
  ${pending > 0 ? `<div class="summary-card"><div class="value" style="color:#ff9800">${pending}</div><div class="label">Pending</div></div>` : ''}
  ${skipped > 0 ? `<div class="summary-card"><div class="value" style="color:#9e9e9e">${skipped}</div><div class="label">Skipped</div></div>` : ''}
  <div class="summary-card rate"><div class="value">${passRate}%</div><div class="label">Pass Rate</div></div>
  ${runStartTime ? `<div class="summary-card"><div class="value" style="font-size:14px; line-height:1.3">${escapeHtml(runStartTime)}</div><div class="label">Run Started</div></div>` : ''}
  ${runEndTime ? `<div class="summary-card"><div class="value" style="font-size:14px; line-height:1.3">${escapeHtml(runEndTime)}</div><div class="label">Run Ended</div></div>` : ''}
  ${runDuration ? `<div class="summary-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;"><div class="value" style="color: #ffffff; font-size:16px">${escapeHtml(runDuration)}</div><div class="label" style="color: rgba(255,255,255,0.95);">Total Duration</div></div>` : ''}
  </div>
<div class="features">
  ${featureRows}
</div>
<script>
  // Expand all failed scenarios by default
  document.querySelectorAll('.scenario.failed').forEach(el => el.classList.add('expanded'));

  (function enableFailedFilter() {
    const failedCard = document.getElementById('failedCard');
    if (!failedCard) return;

    const failedCount = Number(failedCard.getAttribute('data-count') || '0');
    if (failedCount <= 0) return;

    let failedFilterActive = false;

    function applyFailedFilter(onlyFailed) {
      const features = document.querySelectorAll('.feature');
      features.forEach((feature) => {
        const scenarios = feature.querySelectorAll('.scenario');
        let hasVisibleScenario = false;

        scenarios.forEach((scenario) => {
          const isFailed = scenario.classList.contains('failed');
          const hideScenario = onlyFailed && !isFailed;
          scenario.classList.toggle('hidden-by-filter', hideScenario);

          if (!hideScenario) {
            hasVisibleScenario = true;
          }

          if (onlyFailed && isFailed) {
            scenario.classList.add('expanded');
          }
        });

        feature.classList.toggle('hidden-by-filter', !hasVisibleScenario);
        if (onlyFailed && hasVisibleScenario) {
          feature.classList.remove('collapsed');
        }
      });

      failedCard.classList.toggle('active-filter', onlyFailed);

      if (onlyFailed) {
        const firstFailed = document.querySelector('.scenario.failed:not(.hidden-by-filter)');
        if (firstFailed) {
          firstFailed.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    failedCard.addEventListener('click', () => {
      failedFilterActive = !failedFilterActive;
      applyFailedFilter(failedFilterActive);
    });
  })();
</script>
</body>
</html>`;

// 5. Write output
fs.writeFileSync(outputHtml, html, 'utf8');
console.log(`[REPORT] Combined HTML report: ${outputHtml}`);
console.log(`[REPORT] ${totalScenarios} scenarios: ${passed} passed, ${failed} failed, ${pending} pending, ${skipped} skipped (${passRate}% pass rate)`);

scheduleDeferredReportEmail({
  reportPath: outputHtml,
  total: totalScenarios,
  passed,
  failed,
  startedAt: runStartTime || 'N/A',
  finishedAt: runEndTime || new Date().toLocaleString(),
  duration: runDuration || 'N/A'
});
