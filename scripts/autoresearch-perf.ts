import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

let openai: OpenAI;
let modelName = 'gpt-4o';

if (process.env.OPENROUTER_API_KEY) {
  openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://lifetrek.ai",
      "X-Title": "Lifetrek Autoresearch",
    }
  });
  modelName = 'anthropic/claude-3.5-sonnet';
} else if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.error("❌ Missing OPENROUTER_API_KEY or OPENAI_API_KEY in environment variables");
  process.exit(1);
}
const getProjectRoot = () => path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = getProjectRoot();

async function runLighthouse(): Promise<any> {
  console.log('🚀 Running Lighthouse audit...');
  const reportPath = path.join(REPO_ROOT, 'lh-report.json');
  try {
    execSync(`npx lighthouse http://localhost:4173 --output=json --output-path=${reportPath} --chrome-flags="--headless"`, { stdio: 'pipe' });
  } catch (e) {
    // Lighthouse often exits with non-zero if scores are low. We ignore and parse the output anyway.
  }
  
  if (!fs.existsSync(reportPath)) {
    throw new Error('Lighthouse report not generated');
  }
  
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  return report;
}

function extractKeyMetrics(report: any) {
  const scores = {
    performance: report.categories.performance?.score || 0,
    accessibility: report.categories.accessibility?.score || 0,
    bestPractices: report.categories['best-practices']?.score || 0,
    seo: report.categories.seo?.score || 0,
  };
  
  const metrics = {
    lcp: report.audits['largest-contentful-paint']?.displayValue,
    cls: report.audits['cumulative-layout-shift']?.displayValue,
    tbt: report.audits['total-blocking-time']?.displayValue,
  };

  const failingAudits = Object.values(report.audits)
    .filter((a: any) => a.score !== null && a.score < 0.9 && a.weight > 0)
    .map((a: any) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      score: a.score,
      displayValue: a.displayValue,
    }));

  return { scores, metrics, failingAudits };
}

async function askLLMForPatch(failingAudits: any[]): Promise<{ file: string, search: string, replace: string } | null> {
  console.log('🧠 Asking LLM for a patch based on failing audits...');
  
  const topAudits = failingAudits.slice(0, 3);
  const prompt = `
You are an expert web performance and accessibility engineer.
Here are the top failing Lighthouse audits for our Vite React application running locally:
${JSON.stringify(topAudits, null, 2)}

Your goal is to propose a single, highly likely fix in our source code (e.g., in src/components or src/pages or index.html).
Return a JSON object exactly matching this structure:
{
  "file": "path/to/file.tsx",
  "search": "exact string to replace (must match exactly)",
  "replace": "new string to replace it with"
}

Only return valid JSON matching this structure. Do NOT include markdown blocks (\`\`\`json). Just the raw JSON object.
Make an educated guess on the file name if the audit details show a specific DOM element or snippet, like "src/App.tsx" or "index.html". Add loading="lazy" or aria-labels as appropriate.
  `;

  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: 'You are an autonomous web performance engineer. You only output raw JSON.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  });

  try {
    const raw = response.choices[0].message.content || '{}';
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse LLM response', e);
    return null;
  }
}

function applyPatch(patch: { file: string, search: string, replace: string }) {
  const targetPath = path.resolve(REPO_ROOT, patch.file);
  if (!fs.existsSync(targetPath)) {
    throw new Error(`File not found: ${targetPath}`);
  }
  
  const content = fs.readFileSync(targetPath, 'utf8');
  if (!content.includes(patch.search)) {
    throw new Error(`Target string not found in ${targetPath}. Found:\n${content.substring(0, 100)}...`);
  }
  
  const newContent = content.replace(patch.search, patch.replace);
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log(`✅ Patched ${patch.file}`);
}

async function runAutoresearchLoop() {
  console.log('--- Starting Autoresearch Perf Loop ---');
  let previewProcess: any;

  try {
    console.log('📦 Building project for baseline...');
    execSync('npm run build', { stdio: 'inherit', cwd: REPO_ROOT });
    
    console.log('🌐 Starting preview server...');
    previewProcess = spawn('npm', ['run', 'preview'], { cwd: REPO_ROOT, stdio: 'ignore' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const baseReport = await runLighthouse();
    const baseMetrics = extractKeyMetrics(baseReport);
    console.log('📊 Baseline Scores:', baseMetrics.scores);
    
    if (baseMetrics.failingAudits.length === 0) {
      console.log('🎉 No failing audits found. Site is perfect!');
      process.exit(0);
    }
    
    const patch = await askLLMForPatch(baseMetrics.failingAudits);
    if (!patch) {
      console.error('❌ LLM failed to provide a patch.');
      process.exit(1);
    }
    
    console.log(`🛠️ Attempting to patch ${patch.file}...`);
    applyPatch(patch);
    
    console.log('📦 Verifying build with patch...');
    execSync('npm run build', { stdio: 'inherit', cwd: REPO_ROOT });
    
    // Restart preview server
    previewProcess.kill();
    previewProcess = spawn('npm', ['run', 'preview'], { cwd: REPO_ROOT, stdio: 'ignore' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newReport = await runLighthouse();
    const newMetrics = extractKeyMetrics(newReport);
    console.log('📊 New Scores:', newMetrics.scores);
    
    const isPerfBetterOrSame = newMetrics.scores.performance >= baseMetrics.scores.performance;
    const isA11yBetterOrSame = newMetrics.scores.accessibility >= baseMetrics.scores.accessibility;
    const isAnyBetter = newMetrics.scores.performance > baseMetrics.scores.performance || newMetrics.scores.accessibility > baseMetrics.scores.accessibility;
    
    if (isPerfBetterOrSame && isA11yBetterOrSame && isAnyBetter) {
      console.log('🏆 Scores improved! Committing changes...');
      execSync('git add .', { cwd: REPO_ROOT });
      execSync(`git commit -m "chore(auto-perf): applied optimization to ${patch.file}"`, { cwd: REPO_ROOT });
      console.log('✅ Changes committed.');
    } else {
      console.log('📉 Scores did not improve significantly or regressed. Reverting...');
      execSync('git checkout -- .', { cwd: REPO_ROOT });
      console.log('⏪ Reverted changes.');
    }
    
  } catch (error) {
    console.error('❌ Loop failed:', error);
    console.log('⏪ Reverting any changes...');
    execSync('git checkout -- .', { cwd: REPO_ROOT });
  } finally {
    if (previewProcess) previewProcess.kill();
  }
}

runAutoresearchLoop();
