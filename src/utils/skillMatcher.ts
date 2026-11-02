import { Internship, MatchedInternship, SkillGapAnalysisItem } from '../types.ts';

// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL SKILL MAP  (alias → normalized canonical)
// Covers 300+ common resume variants, abbreviations, and typos
// ─────────────────────────────────────────────────────────────────────────────
export const SKILL_CANONICAL_MAP: Record<string, string> = {
  // ── Programming Languages ──────────────────────────────────────────────────
  'python': 'python', 'py': 'python', 'python3': 'python', 'python 3': 'python',
  'javascript': 'javascript', 'js': 'javascript', 'es6': 'javascript', 'es2015': 'javascript',
  'typescript': 'typescript', 'ts': 'typescript',
  'java': 'java', 'java 11': 'java', 'java 17': 'java', 'java 21': 'java',
  'c++': 'c++', 'cpp': 'c++', 'c plus plus': 'c++',
  'c#': 'c#', 'csharp': 'c#', 'c sharp': 'c#', '.net': 'c#', 'dotnet': 'c#',
  'golang': 'go', 'go': 'go', 'go lang': 'go',
  'rust': 'rust',
  'php': 'php', 'php7': 'php', 'php8': 'php',
  'ruby': 'ruby', 'ror': 'ruby on rails', 'ruby on rails': 'ruby on rails', 'rails': 'ruby on rails',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'scala': 'scala',
  'r': 'r',
  'matlab': 'matlab',
  'dart': 'dart',
  'bash': 'bash', 'shell': 'bash', 'shell scripting': 'bash', 'bash scripting': 'bash', 'sh': 'bash',
  'powershell': 'powershell',
  'perl': 'perl',
  'haskell': 'haskell',
  'elixir': 'elixir',
  'lua': 'lua',
  'assembly': 'assembly',
  'vhdl': 'vhdl',
  'verilog': 'verilog',
  'solidity': 'solidity',

  // ── Frontend ───────────────────────────────────────────────────────────────
  'react': 'react', 'react.js': 'react', 'reactjs': 'react', 'react js': 'react',
  'next.js': 'next.js', 'nextjs': 'next.js', 'next js': 'next.js',
  'angular': 'angular', 'angularjs': 'angular', 'angular.js': 'angular',
  'vue': 'vue', 'vue.js': 'vue', 'vuejs': 'vue', 'vue js': 'vue', 'nuxt': 'vue',
  'svelte': 'svelte', 'sveltekit': 'svelte',
  'html': 'html', 'html5': 'html', 'html 5': 'html',
  'css': 'css', 'css3': 'css', 'css 3': 'css',
  'tailwind': 'tailwind css', 'tailwind css': 'tailwind css', 'tailwindcss': 'tailwind css',
  'bootstrap': 'bootstrap', 'bootstrap 5': 'bootstrap',
  'material ui': 'material ui', 'mui': 'material ui',
  'chakra ui': 'chakra ui',
  'shadcn': 'shadcn',
  'sass': 'sass', 'scss': 'sass',
  'less': 'less',
  'framer motion': 'framer motion', 'framer': 'framer motion',
  'three.js': 'three.js', 'threejs': 'three.js', 'webgl': 'three.js',
  'figma': 'figma',
  'adobe xd': 'figma',
  'sketch': 'sketch',
  'storybook': 'storybook',
  'webpack': 'webpack',
  'vite': 'vite',
  'redux': 'redux', 'redux toolkit': 'redux',
  'zustand': 'zustand',
  'react native': 'react native',
  'expo': 'react native',
  'flutter': 'flutter',
  'ionic': 'ionic',

  // ── Backend & APIs ─────────────────────────────────────────────────────────
  'node': 'node.js', 'node.js': 'node.js', 'nodejs': 'node.js', 'node js': 'node.js',
  'express': 'express', 'express.js': 'express', 'expressjs': 'express',
  'fastapi': 'fastapi', 'fast api': 'fastapi',
  'django': 'django',
  'flask': 'flask',
  'spring': 'spring', 'spring boot': 'spring', 'springboot': 'spring',
  'laravel': 'laravel',
  'nest.js': 'nest.js', 'nestjs': 'nest.js', 'nest js': 'nest.js',
  'hapi': 'hapi',
  'fastify': 'fastify',
  'koa': 'koa',
  'microservices': 'microservices', 'micro services': 'microservices', 'micro-services': 'microservices',
  'rest api': 'rest api', 'rest': 'rest api', 'restful': 'rest api', 'restful api': 'rest api',
  'graphql': 'graphql', 'graph ql': 'graphql',
  'grpc': 'grpc', 'rpc': 'grpc',
  'websockets': 'web sockets', 'web sockets': 'web sockets', 'websocket': 'web sockets',
  'socket.io': 'web sockets',
  'oauth': 'oauth',
  'jwt': 'jwt',

  // ── Databases ──────────────────────────────────────────────────────────────
  'sql': 'sql', 'mysql': 'sql', 'postgresql': 'sql', 'postgres': 'sql',
  'sqlite': 'sql', 'mariadb': 'sql', 'mssql': 'sql', 'oracle db': 'sql',
  'mongodb': 'mongodb', 'mongo': 'mongodb', 'mongo db': 'mongodb',
  'redis': 'redis',
  'cassandra': 'cassandra',
  'dynamodb': 'dynamodb', 'dynamo db': 'dynamodb',
  'firebase': 'firebase',
  'firestore': 'firebase',
  'supabase': 'supabase',
  'neo4j': 'neo4j',
  'elasticsearch': 'elasticsearch', 'elastic search': 'elasticsearch', 'opensearch': 'elasticsearch',
  'snowflake': 'snowflake',
  'bigquery': 'bigquery', 'big query': 'bigquery',
  'databricks': 'databricks',
  'pinecone': 'vector databases', 'weaviate': 'vector databases', 'chroma': 'vector databases',
  'vector database': 'vector databases', 'vector databases': 'vector databases',
  'qdrant': 'vector databases',
  'prisma': 'prisma',
  'sequelize': 'sequelize',
  'mongoose': 'mongodb',

  // ── AI / ML / Data ─────────────────────────────────────────────────────────
  'machine learning': 'machine learning', 'ml': 'machine learning',
  'deep learning': 'deep learning', 'dl': 'deep learning', 'neural network': 'deep learning',
  'pytorch': 'pytorch', 'torch': 'pytorch',
  'tensorflow': 'tensorflow', 'tf': 'tensorflow', 'keras': 'tensorflow',
  'nlp': 'nlp', 'natural language processing': 'nlp',
  'computer vision': 'computer vision', 'cv': 'computer vision',
  'opencv': 'opencv',
  'yolo': 'opencv',
  'transformers': 'transformers', 'hugging face': 'transformers', 'huggingface': 'transformers',
  'langchain': 'langchain', 'lang chain': 'langchain',
  'llm': 'langchain', 'large language model': 'langchain',
  'openai': 'langchain',
  'rag': 'vector databases',
  'scikit-learn': 'scikit-learn', 'sklearn': 'scikit-learn', 'scikit learn': 'scikit-learn',
  'pandas': 'pandas',
  'numpy': 'numpy',
  'matplotlib': 'matplotlib',
  'seaborn': 'matplotlib',
  'data analysis': 'data analysis', 'data analytics': 'data analysis',
  'data visualization': 'data analysis',
  'tableau': 'tableau',
  'power bi': 'power bi', 'powerbi': 'power bi',
  'spark': 'spark', 'apache spark': 'spark', 'pyspark': 'spark',
  'hadoop': 'hadoop',
  'kafka': 'kafka', 'apache kafka': 'kafka',
  'airflow': 'airflow', 'apache airflow': 'airflow',
  'dbt': 'dbt',
  'etl': 'etl',
  'cuda': 'cuda',
  'onnx': 'onnx',
  'tensorrt': 'onnx',
  'ab testing': 'ab testing',
  'statistics': 'statistics', 'statistical analysis': 'statistics',
  'r programming': 'r',

  // ── Cloud & DevOps ─────────────────────────────────────────────────────────
  'docker': 'docker', 'dockerfile': 'docker', 'docker compose': 'docker',
  'kubernetes': 'kubernetes', 'k8s': 'kubernetes',
  'aws': 'aws', 'amazon web services': 'aws', 'amazon aws': 'aws',
  'azure': 'azure', 'microsoft azure': 'azure',
  'gcp': 'gcp', 'google cloud': 'gcp', 'google cloud platform': 'gcp',
  'linux': 'linux', 'ubuntu': 'linux', 'centos': 'linux', 'debian': 'linux', 'unix': 'linux',
  'git': 'git', 'github': 'git', 'gitlab': 'git', 'version control': 'git', 'bitbucket': 'git',
  'ci/cd': 'ci/cd', 'ci cd': 'ci/cd', 'cicd': 'ci/cd',
  'jenkins': 'ci/cd', 'github actions': 'ci/cd', 'gitlab ci': 'ci/cd', 'circle ci': 'ci/cd',
  'terraform': 'terraform', 'infrastructure as code': 'terraform', 'iac': 'terraform',
  'ansible': 'ansible',
  'pulumi': 'pulumi',
  'helm': 'helm',
  'prometheus': 'prometheus', 'grafana': 'prometheus', 'monitoring': 'prometheus',
  'datadog': 'datadog',
  'nginx': 'nginx',
  'apache': 'apache',
  'serverless': 'serverless',
  'lambda': 'aws',
  's3': 'aws',
  'ec2': 'aws',
  'cloudformation': 'terraform',
  'vercel': 'vercel',
  'netlify': 'netlify',
  'heroku': 'heroku',

  // ── Security ───────────────────────────────────────────────────────────────
  'security': 'security', 'cybersecurity': 'security', 'cyber security': 'security',
  'information security': 'security', 'infosec': 'security', 'appsec': 'security',
  'networking': 'networking', 'network security': 'networking', 'tcp/ip': 'networking',
  'wireshark': 'wireshark',
  'cryptography': 'cryptography', 'encryption': 'cryptography',
  'owasp': 'owasp', 'owasp top 10': 'owasp',
  'burp suite': 'burp suite', 'penetration testing': 'burp suite', 'pentest': 'burp suite',
  'sast': 'security', 'dast': 'security',
  'zero trust': 'security',

  // ── CS Fundamentals ────────────────────────────────────────────────────────
  'data structures': 'data structures', 'dsa': 'data structures', 'ds': 'data structures',
  'algorithms': 'algorithms', 'algorithm': 'algorithms',
  'system design': 'system design', 'hld': 'system design', 'lld': 'system design',
  'object oriented programming': 'oop', 'oop': 'oop', 'oops': 'oop',
  'design patterns': 'design patterns',
  'operating systems': 'linux', 'os': 'linux',
  'computer networks': 'networking',
  'dbms': 'sql',

  // ── Embedded / Hardware ────────────────────────────────────────────────────
  'ros': 'ros/ros2', 'ros2': 'ros/ros2', 'ros/ros2': 'ros/ros2',
  'embedded systems': 'embedded systems', 'embedded': 'embedded systems',
  'arduino': 'embedded systems',
  'raspberry pi': 'embedded systems',
  'fpga': 'fpga',
  'c': 'c++',  // C maps to c++ tier for matching

  // ── Mobile ─────────────────────────────────────────────────────────────────
  'android': 'android', 'android development': 'android',
  'ios': 'ios', 'ios development': 'ios',
  'jetpack compose': 'android',
  'swiftui': 'ios',

  // ── Blockchain / Web3 ──────────────────────────────────────────────────────
  'blockchain': 'blockchain', 'web3': 'blockchain',
  'ethereum': 'blockchain',
  'smart contracts': 'solidity',
  'defi': 'blockchain',
  'nft': 'blockchain',
  'hardhat': 'solidity',
  'truffle': 'solidity',
  'ipfs': 'blockchain',

  // ── Game Development ──────────────────────────────────────────────────────
  'unity': 'unity', 'unity3d': 'unity',
  'unreal engine': 'unreal engine', 'unreal': 'unreal engine', 'ue5': 'unreal engine',
  'game development': 'unity',
  'opengl': 'opengl',

  // ── Project & Soft Skills ─────────────────────────────────────────────────
  'agile': 'agile', 'scrum': 'agile', 'kanban': 'agile',
  'jira': 'jira',
  'confluence': 'confluence',
  'notion': 'notion',
  'communication': 'communication',
  'leadership': 'leadership',
  'problem solving': 'problem solving',
  'teamwork': 'teamwork',
};

// ─────────────────────────────────────────────────────────────────────────────
// SKILL CATEGORY GROUPS — used for semantic "related skill" bonus
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_GROUPS: Record<string, string[]> = {
  languages:    ['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby on rails', 'swift', 'kotlin', 'bash'],
  frontend:     ['react', 'vue', 'angular', 'next.js', 'html', 'css', 'tailwind css', 'bootstrap', 'svelte'],
  backend:      ['node.js', 'express', 'fastapi', 'django', 'flask', 'spring', 'nest.js', 'microservices', 'rest api', 'graphql'],
  databases:    ['sql', 'mongodb', 'redis', 'cassandra', 'dynamodb', 'firebase', 'snowflake', 'bigquery', 'elasticsearch'],
  aiml:         ['machine learning', 'deep learning', 'pytorch', 'tensorflow', 'nlp', 'computer vision', 'scikit-learn', 'transformers', 'langchain'],
  data:         ['pandas', 'numpy', 'data analysis', 'tableau', 'power bi', 'spark', 'kafka', 'etl', 'ab testing', 'statistics'],
  cloud:        ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'terraform', 'linux', 'ansible'],
  security:     ['security', 'networking', 'cryptography', 'owasp', 'burp suite', 'wireshark'],
  mobile:       ['react native', 'flutter', 'android', 'ios', 'swift', 'kotlin'],
  fundamentals: ['data structures', 'algorithms', 'system design', 'oop', 'design patterns'],
};

// Get which group a skill belongs to
function getSkillGroup(skill: string): string | null {
  for (const [group, skills] of Object.entries(SKILL_GROUPS)) {
    if (skills.includes(skill)) return group;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACT SKILLS FROM PLAIN TEXT (smarter: longest-match first, context aware)
// ─────────────────────────────────────────────────────────────────────────────
export function extractSkillsLocally(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const foundSkills = new Set<string>();

  // Sort keys longest-first to avoid partial matches shadowing longer phrases
  const sortedKeys = Object.keys(SKILL_CANONICAL_MAP).sort((a, b) => b.length - a.length);

  for (const key of sortedKeys) {
    const canonical = SKILL_CANONICAL_MAP[key];
    // Escape regex special chars
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Word-boundary aware: key must not be preceded/followed by alphanumeric chars
    const regex = new RegExp(`(?<![a-z0-9_])${escaped}(?![a-z0-9_])`, 'i');
    if (regex.test(lower)) {
      foundSkills.add(canonical);
    }
  }

  return Array.from(foundSkills);
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZE a skill string using the canonical map
// ─────────────────────────────────────────────────────────────────────────────
function normalizeSkill(skill: string): string {
  const lower = skill.toLowerCase().trim();
  return SKILL_CANONICAL_MAP[lower] || lower;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUZZY SKILL MATCH — checks if candidateSkill covers a jobSkill or vice-versa
// Returns a score between 0 and 1:
//   1.0 = exact canonical match
//   0.7 = same skill group (semantic overlap)
//   0.5 = one is substring of the other (partial alias match)
//   0.0 = no relation
// ─────────────────────────────────────────────────────────────────────────────
function skillMatchScore(candidateSkill: string, jobSkill: string): number {
  const c = normalizeSkill(candidateSkill);
  const j = normalizeSkill(jobSkill);

  // Exact canonical match
  if (c === j) return 1.0;

  // Substring containment (catches e.g. "postgresql" vs "sql")
  if (c.includes(j) || j.includes(c)) return 0.8;

  // Same skill group → semantic bonus
  const cGroup = getSkillGroup(c);
  const jGroup = getSkillGroup(j);
  if (cGroup && jGroup && cGroup === jGroup) return 0.4;

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ELIGIBILITY EXTRACTION (from resume text)
// Detects college year (1st, 2nd, 3rd, 4th/final), graduation batch & degree
// ─────────────────────────────────────────────────────────────────────────────
export interface CandidateEligibility {
  collegeYear: number; // 1 | 2 | 3 | 4
  collegeYearLabel: string;
  graduationYear?: number;
  detectedDegree: string;
  confidence: 'high' | 'medium' | 'default';
}

function detectDegree(lower: string): string {
  if (/b\.?tech|bachelor of technology/i.test(lower)) return 'B.Tech';
  if (/b\.?e\.?|bachelor of engineering/i.test(lower)) return 'B.E.';
  if (/bca|bachelor of computer applications/i.test(lower)) return 'BCA';
  if (/mca|master of computer applications/i.test(lower)) return 'MCA';
  if (/m\.?tech|master of technology/i.test(lower)) return 'M.Tech';
  if (/b\.?s\.?|bachelor of science/i.test(lower)) return 'B.S.';
  return 'B.Tech / BE';
}

export function extractEligibilityFromResume(text: string): CandidateEligibility {
  const lower = text.toLowerCase();
  const degree = detectDegree(lower);

  // 1. Explicit 3rd Year / Pre-final indicators (2026 Graduating Batch)
  if (
    /(?:^|\b)(?:3rd|third)\s*year/i.test(lower) ||
    /pre-?final\s*year/i.test(lower) ||
    /penultimate\s*year/i.test(lower) ||
    /junior\s*(?:year|student)/i.test(lower) ||
    /batch\s*(?:of\s*)?2026/i.test(lower) ||
    /class\s*(?:of\s*)?2026/i.test(lower) ||
    /2022\s*[-–—to]+\s*2026/i.test(lower) ||
    /expected\s*(?:graduation|pass\s*out)?\s*[:\s]*2026/i.test(lower)
  ) {
    return {
      collegeYear: 3,
      collegeYearLabel: '3rd Year (Pre-Final Year / Batch 2026)',
      graduationYear: 2026,
      detectedDegree: degree,
      confidence: 'high',
    };
  }

  // 2. Explicit 4th Year / Final Year indicators (2025 Graduating Batch)
  if (
    /(?:^|\b)(?:4th|fourth|final)\s*year/i.test(lower) ||
    /senior\s*(?:year|student)/i.test(lower) ||
    /batch\s*(?:of\s*)?2025/i.test(lower) ||
    /class\s*(?:of\s*)?2025/i.test(lower) ||
    /2021\s*[-–—to]+\s*2025/i.test(lower) ||
    /expected\s*(?:graduation|pass\s*out)?\s*[:\s]*2025/i.test(lower)
  ) {
    return {
      collegeYear: 4,
      collegeYearLabel: '4th Year (Final Year / Batch 2025)',
      graduationYear: 2025,
      detectedDegree: degree,
      confidence: 'high',
    };
  }

  // 3. 2nd Year (2027 Graduating Batch)
  if (
    /(?:^|\b)(?:2nd|second)\s*year/i.test(lower) ||
    /sophomore/i.test(lower) ||
    /batch\s*(?:of\s*)?2027/i.test(lower) ||
    /class\s*(?:of\s*)?2027/i.test(lower) ||
    /2023\s*[-–—to]+\s*2027/i.test(lower) ||
    /expected\s*(?:graduation|pass\s*out)?\s*[:\s]*2027/i.test(lower)
  ) {
    return {
      collegeYear: 2,
      collegeYearLabel: '2nd Year (Sophomore / Batch 2027)',
      graduationYear: 2027,
      detectedDegree: degree,
      confidence: 'high',
    };
  }

  // 4. 1st Year (2028 Graduating Batch)
  if (
    /(?:^|\b)(?:1st|first)\s*year/i.test(lower) ||
    /freshman/i.test(lower) ||
    /batch\s*(?:of\s*)?2028/i.test(lower) ||
    /class\s*(?:of\s*)?2028/i.test(lower) ||
    /2024\s*[-–—to]+\s*2028/i.test(lower)
  ) {
    return {
      collegeYear: 1,
      collegeYearLabel: '1st Year (Freshman / Batch 2028)',
      graduationYear: 2028,
      detectedDegree: degree,
      confidence: 'high',
    };
  }

  // 5. Generic year match from education section
  const gradMatch = lower.match(/(?:graduating|graduation|passing\s*out|passout|batch|class\s*of)\s*(?:in\s*)?[:\s]*(202[4-9])/i);
  if (gradMatch) {
    const yr = parseInt(gradMatch[1], 10);
    if (yr === 2025) {
      return { collegeYear: 4, collegeYearLabel: '4th Year (Final Year / Batch 2025)', graduationYear: 2025, detectedDegree: degree, confidence: 'medium' };
    }
    if (yr === 2026) {
      return { collegeYear: 3, collegeYearLabel: '3rd Year (Pre-Final Year / Batch 2026)', graduationYear: 2026, detectedDegree: degree, confidence: 'medium' };
    }
    if (yr === 2027) {
      return { collegeYear: 2, collegeYearLabel: '2nd Year (Batch 2027)', graduationYear: 2027, detectedDegree: degree, confidence: 'medium' };
    }
    if (yr >= 2028) {
      return { collegeYear: 1, collegeYearLabel: '1st Year (Batch 2028)', graduationYear: yr, detectedDegree: degree, confidence: 'medium' };
    }
  }

  // Default to 3rd year (pre-final) for typical active student internships
  return {
    collegeYear: 3,
    collegeYearLabel: '3rd Year (Pre-Final Year / Batch 2026)',
    graduationYear: 2026,
    detectedDegree: degree,
    confidence: 'default',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN MATCH FUNCTION — computes match between candidate skills & internship
// ─────────────────────────────────────────────────────────────────────────────
export function matchInternship(
  candidateSkills: string[], 
  internship: Internship,
  candidateYear: number = 3
): MatchedInternship {
  const normCandidate = candidateSkills.map(s => normalizeSkill(s));

  const normRequired  = internship.requiredSkills.map(s  => normalizeSkill(s));
  const normPreferred = internship.preferredSkills.map(s => normalizeSkill(s));

  // ── Required skills scoring ──────────────────────────────────────────────
  let reqScore = 0;
  const matchedRequired: string[]  = [];
  const lackingRequired: string[]  = [];

  for (const req of normRequired) {
    // Find best matching candidate skill
    let best = 0;
    for (const c of normCandidate) {
      const score = skillMatchScore(c, req);
      if (score > best) best = score;
    }
    reqScore += best;
    if (best >= 0.5) {
      matchedRequired.push(req);
    } else {
      lackingRequired.push(req);
    }
  }

  const reqRatio = normRequired.length > 0
    ? reqScore / normRequired.length
    : 1.0; // no required skills → perfect on required

  // ── Preferred skills scoring ─────────────────────────────────────────────
  let prefScore = 0;
  const matchedPreferred: string[] = [];
  const lackingPreferred: string[] = [];

  for (const pref of normPreferred) {
    let best = 0;
    for (const c of normCandidate) {
      const score = skillMatchScore(c, pref);
      if (score > best) best = score;
    }
    prefScore += best;
    if (best >= 0.5) {
      matchedPreferred.push(pref);
    } else {
      lackingPreferred.push(pref);
    }
  }

  const prefRatio = normPreferred.length > 0
    ? prefScore / normPreferred.length
    : 0;

  // ── Composite score ──────────────────────────────────────────────────────
  // Weight: Required 75%, Preferred 25%
  // Also add a small "breadth bonus" if the candidate has many skills at all
  const breadthBonus = Math.min(5, Math.floor(normCandidate.length / 4));
  const rawScore = (reqRatio * 75) + (prefRatio * 25) + breadthBonus;

  // Floor at 10% if candidate has ≥1 skill in the same category group as internship
  const categorySkills = SKILL_GROUPS[internship.category] ||
                         SKILL_GROUPS['fundamentals'] || [];
  const hasCategoryOverlap = normCandidate.some(c =>
    categorySkills.some(cs => skillMatchScore(c, cs) >= 0.5)
  );
  const floorScore = hasCategoryOverlap ? 15 : 5;

  const matchPercentage = Math.min(100, Math.max(floorScore, Math.round(rawScore)));

  // ── Match tier ───────────────────────────────────────────────────────────
  let matchTier: MatchedInternship['matchTier'] = 'gap';
  if      (matchPercentage >= 72) matchTier = 'excellent';
  else if (matchPercentage >= 50) matchTier = 'good';
  else if (matchPercentage >= 28) matchTier = 'moderate';
  else                             matchTier = 'gap';

  const allMatched = Array.from(new Set([...matchedRequired, ...matchedPreferred]));
  const allLacking = Array.from(new Set([...lackingRequired, ...lackingPreferred]));

  // ── Year & Eligibility Assessment ────────────────────────────────────────
  let isEligible = true;
  let eligibilityReason = internship.eligibilityCriteria || 'Eligible: Open for your student year.';

  if (internship.eligibleYears && internship.eligibleYears.length > 0) {
    if (internship.eligibleYears.includes(candidateYear)) {
      isEligible = true;
      eligibilityReason = internship.eligibilityCriteria || `Eligible: Open for ${candidateYear}th Year students.`;
    } else {
      isEligible = false;
      const batches = internship.eligibleBatches?.join(' / ') || `${internship.eligibleYears.join('th / ')}th Year`;
      eligibilityReason = `Ineligible: This opening requires ${batches} students only (You are ${candidateYear}th Year).`;
    }
  }

  return {
    ...internship,
    matchPercentage,
    matchedSkills: allMatched,
    lackingSkills: allLacking,
    matchTier,
    isEligible,
    eligibilityReason,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL GAP AGGREGATOR
// ─────────────────────────────────────────────────────────────────────────────
export function aggregateSkillGaps(matchedInternships: MatchedInternship[]): SkillGapAnalysisItem[] {
  const gapCount: Record<string, { count: number; roles: Set<string> }> = {};

  matchedInternships.forEach(item => {
    item.lackingSkills.forEach(skill => {
      if (!gapCount[skill]) {
        gapCount[skill] = { count: 0, roles: new Set() };
      }
      gapCount[skill].count += 1;
      gapCount[skill].roles.add(item.role);
    });
  });

  const resources: Record<string, string> = {
    'docker':          'Learn Docker: write Dockerfiles, multi-stage builds, and docker compose for local dev stacks.',
    'kubernetes':      'Try Minikube or Kind locally. Deploy pods, services, and configmaps; then try a Helm chart.',
    'aws':             'Create an AWS Free Tier account. Experiment with S3, Lambda, EC2, and RDS.',
    'azure':           'Use Azure Free Tier. Try Azure Functions, App Service, and Blob Storage.',
    'gcp':             'Try Google Cloud Free Tier: Cloud Run, BigQuery sandbox, and Vertex AI.',
    'sql':             'Practice complex JOINs, CTEs, window functions, and query optimization on LeetCode DB or SQLZoo.',
    'typescript':      'Migrate a JavaScript project to TypeScript with strict mode, interfaces, and generics.',
    'pytorch':         'Follow the official "Deep Learning with PyTorch: 60 Minute Blitz" tutorial.',
    'tensorflow':      'Complete the TensorFlow 2.x beginner tutorial and build a classification model.',
    'fastapi':         'Build an async REST API with FastAPI, Pydantic schemas, and auto-generated OpenAPI docs.',
    'tailwind css':    'Build a responsive landing page with utility classes, responsive prefixes, and dark mode.',
    'microservices':   'Study REST/gRPC decomposition, API gateways, and service discovery patterns.',
    'graphql':         'Define a schema, write queries, mutations, and resolvers with Apollo or Strawberry (Python).',
    'redis':           'Learn in-memory caching, TTL keys, pub/sub, and rate-limiting patterns.',
    'linux':           'Master bash scripting, file permissions, cron jobs, and systemd service management.',
    'security':        'Study the OWASP Top 10 (SQLi, XSS, CSRF, broken auth) and practice with DVWA.',
    'machine learning':'Complete Andrew Ng\'s Machine Learning Specialization on Coursera (free audit).',
    'deep learning':   'Work through the fast.ai Practical Deep Learning for Coders course (free).',
    'nlp':             'Follow HuggingFace NLP course and fine-tune a BERT model on a text classification task.',
    'react':           'Build 3 projects: a todo app, a weather dashboard, and a full CRUD app with hooks.',
    'next.js':         'Build a blog with Next.js App Router, API routes, and deploy to Vercel.',
    'system design':   'Read "Designing Data-Intensive Applications" and study Grokking System Design problems.',
    'data structures': 'Solve 50+ LeetCode Easy/Medium problems covering arrays, trees, graphs, and dynamic programming.',
    'algorithms':      'Practice sorting, searching, dynamic programming, and greedy algorithms on LeetCode/Codeforces.',
    'kafka':           'Run Kafka locally with Docker and implement a producer-consumer demo in Python or Java.',
    'spark':           'Complete DataBricks Community Edition free courses and run a PySpark job on sample data.',
    'ci/cd':           'Set up a GitHub Actions workflow to lint, test, build Docker, and deploy your project.',
    'terraform':       'Write a Terraform config that provisions an EC2 instance and S3 bucket on AWS Free Tier.',
    'mongodb':         'Build a Node.js + MongoDB CRUD API using Mongoose with schema validation.',
    'react native':    'Build a cross-platform to-do app with React Native Expo and publish it.',
    'flutter':         'Complete the official Flutter codelab and publish an app to the Android emulator.',
    'blockchain':      'Complete CryptoZombies and deploy a Solidity ERC-20 token contract on a test network.',
    'solidity':        'Read the Solidity docs and write a simple crowdfunding smart contract on Hardhat.',
  };

  const results: SkillGapAnalysisItem[] = Object.entries(gapCount).map(([skill, data]) => {
    let importance: SkillGapAnalysisItem['importance'] = 'Recommended';
    if (data.count >= 4) importance = 'High';
    else if (data.count >= 2) importance = 'Medium';

    return {
      skill,
      frequencyMissing: data.count,
      rolesDemanding: Array.from(data.roles),
      importance,
      learningResourceTip:
        resources[skill] ||
        `Complete a mini portfolio project demonstrating ${skill} and publish it to GitHub.`,
    };
  });

  return results.sort((a, b) => b.frequencyMissing - a.frequencyMissing);
}
