
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return {};
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if(!trimmedLine || trimmedLine.startsWith('#')) return;
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                let value = parts.slice(1).join('=').trim();
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                envVars[key] = value;
            }
        });
        return envVars;
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in .env');
  process.exit(1);
}

// Portuguese Brazilian voice - professional male
const VOICE_ID = 'pqHfZKP75CvOlQylNhV4'; // Bill - deep, professional

// Full storytelling script (Condensed for 1:30 video)
const SCRIPT = `
Do lado de fora, parece apenas uma fábrica.
Mas aqui dentro, cada micrômetro importa.
Um desvio mínimo pode comprometer uma cirurgia.

Há mais de 30 anos, a Lifetrek Medical transforma engenharia de precisão em segurança para implantes usados no mundo todo.

Somos ISO 13485 e ANVISA.
Isso significa rastreabilidade total e controle rigoroso em cada lote que sai das nossas salas limpas.

Em células CNC avançadas, usinamos titânio e PEEK com tolerância de mícron.
Implantes e instrumentais feitos para resistir.

Nossa metrologia não só confere a peça.
Ela documenta cada dimensão crítica para seus registros regulatórios.

Da matéria-prima à embalagem estéril, reduzimos seu risco e seu lead time.

Não somos apenas fornecedores.
Trabalhamos com seu P&D para validar processos e acelerar lançamentos.

Lifetrek Medical.
Precisão e parceria para quem impacta vidas.
Fale conosco e vamos criar o futuro da saúde.
`.trim();

async function generateVoiceover() {
  console.log('🎙️ Generating voiceover with ElevenLabs...');
  console.log(`📝 Script length: ${SCRIPT.length} characters`);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: SCRIPT,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  const audioBuffer = await response.arrayBuffer();
  // Ensure directory exists
  const outputDir = path.join(__dirname, '../public/remotion');
  if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
  }
  const outputPath = path.join(outputDir, 'voiceover.mp3');

  fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
  console.log(`✅ Voiceover saved to: ${outputPath}`);
  console.log(`📊 File size: ${(audioBuffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
}

generateVoiceover().catch(console.error);
