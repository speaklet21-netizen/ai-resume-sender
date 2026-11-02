export interface SampleResume {
  id: string;
  title: string;
  tagline: string;
  candidateName: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  experienceLevel: string;
  content: string;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    id: 'sample-fullstack',
    title: 'Full-Stack Web Engineering Student',
    tagline: 'React, Node.js, TypeScript, SQL, Git & Tailwind CSS',
    candidateName: 'Alex Rivera',
    email: 'alex.rivera.dev@gmail.com',
    phone: '+1 (415) 555-0192',
    linkedin: 'https://www.linkedin.com/in/alex-rivera-webdev',
    portfolio: 'https://alexrivera.dev',
    experienceLevel: 'Fresher / Student (Senior CS Major)',
    content: `ALEX RIVERA
San Francisco, CA • alex.rivera.dev@gmail.com • +1 (415) 555-0192 • linkedin.com/in/alex-rivera-webdev • github.com/alexrivera-dev

EDUCATION
University of California, Berkeley — B.S. in Computer Science (Expected May 2026)
GPA: 3.82 / 4.0. Coursework: Data Structures & Algorithms, Web Development, Database Management, Operating Systems.

TECHNICAL SKILLS
• Programming Languages: JavaScript (ES6+), TypeScript, Python, HTML5, CSS3, SQL
• Frontend Frameworks & UI: React, Next.js, Tailwind CSS, Responsive Design, Redux Toolkit
• Backend & APIs: Node.js, Express, RESTful APIs, PostgreSQL, MongoDB, JWT Authentication
• Tools & Systems: Git, GitHub, Linux / Bash, Postman, Jest, Vite, Vercel

PROJECTS
TaskFlow – Collaborative Real-time Kanban Workspace
• Built responsive full-stack Kanban application using React, TypeScript, Tailwind CSS, and Node.js with Express.
• Implemented drag-and-drop task boards, real-time board sync via WebSockets, and PostgreSQL database with optimized queries.
• Deployed frontend to Vercel and backend to Render with automated GitHub Actions CI.

CampusEats – University Food Delivery Aggregator
• Designed and shipped a campus order management mobile-web platform using React, REST APIs, and MongoDB.
• Built role-based authentication with bcrypt and JWT; created interactive cart checkout and real-time status tracking.

EXPERIENCE
Undergraduate Teaching Assistant – CS 61B Data Structures (Jan 2024 - Present)
• Mentored 45+ students weekly on tree traversals, graph algorithms, and asymptotic complexity in Java and Python.`,
  },
  {
    id: 'sample-aiml',
    title: 'AI & Data Science Student',
    tagline: 'Python, PyTorch, Scikit-Learn, Pandas, NLP & Machine Learning',
    candidateName: 'Maya Patel',
    email: 'maya.patel.ai@gmail.com',
    phone: '+1 (617) 555-8421',
    linkedin: 'https://www.linkedin.com/in/maya-patel-datascience',
    portfolio: 'https://mayapatel-ai.github.io',
    experienceLevel: 'Student / Masters Candidate',
    content: `MAYA PATEL
Boston, MA • maya.patel.ai@gmail.com • +1 (617) 555-8421 • linkedin.com/in/maya-patel-datascience • github.com/mayapatel-ai

EDUCATION
Boston University — M.S. in Data Science & Machine Learning (Expected Dec 2025)
B.S. in Applied Mathematics & Computer Science, Tufts University (2024, GPA: 3.90)

TECHNICAL SKILLS
• Core Languages: Python, SQL, C++, Bash
• Machine Learning & Deep Learning: PyTorch, TensorFlow, Scikit-Learn, Deep Learning, Machine Learning, Computer Vision
• NLP & LLMs: HuggingFace Transformers, NLP, Word2Vec, BERT, LangChain, Prompt Engineering
• Data Analytics: Pandas, NumPy, SciPy, Matplotlib, Seaborn, Tableau, Data Analysis
• Developer Tools: Git, Linux, Jupyter, FastAPI, Docker basics

PROJECTS
MedSummarize – Clinical Notes Summarization with Transformers
• Fine-tuned BioBERT and T5 transformer models on MIMIC-III clinical notes dataset using PyTorch and HuggingFace.
• Achieved 0.44 ROUGE-L score, reducing doctor note reading time by 38% in simulated evaluations.
• Packaged inference model as a FastAPI endpoint with Swagger documentation.

StockTrend – Real-time Financial News Sentiment Analyzer
• Built automated sentiment extraction pipeline in Python analyzing 10k+ daily SEC filings using Pandas and NLP models.
• Stored processed sentiment signals in PostgreSQL database; generated interactive visualization dashboards in Streamlit.

EXPERIENCE
Student Research Assistant – BU Cognitive Computing Lab (Sept 2024 - Present)
• Investigated attention pruning methods to decrease multimodal model inference latency by 22% with zero accuracy drop.`,
  },
  {
    id: 'sample-cloud',
    title: 'Cloud & Backend Systems Student',
    tagline: 'Java, Docker, Kubernetes, AWS, Linux, Microservices & Python',
    candidateName: 'Jordan Taylor',
    email: 'jordan.taylor.cloud@gmail.com',
    phone: '+1 (512) 555-3914',
    linkedin: 'https://www.linkedin.com/in/jordan-taylor-cloud',
    portfolio: 'https://jordantaylor.tech',
    experienceLevel: 'Student / Junior Engineer',
    content: `JORDAN TAYLOR
Austin, TX • jordan.taylor.cloud@gmail.com • +1 (512) 555-3914 • linkedin.com/in/jordan-taylor-cloud • github.com/jordantaylor-cloud

EDUCATION
University of Texas at Austin — B.S. in Computer Science (Expected Dec 2025)
Focus: Distributed Systems, Operating Systems, Cloud Computing

TECHNICAL SKILLS
• Languages: Java, Python, Go, Bash, C++, SQL
• Cloud & Infrastructure: AWS (EC2, S3, RDS, Lambda), Docker, Kubernetes, Linux, CI/CD
• Backend & Systems: Spring, Spring Boot, Microservices, REST API, Redis, Kafka
• Engineering Tools: Git, Terraform basics, Prometheus, Grafana, PostgreSQL

PROJECTS
AutoScaler – Microservices Load Simulator & Autoscaler
• Developed distributed event-driven microservices architecture in Java with Spring Boot and Kafka event queues.
• Containerized 4 microservices using Docker and orchestrated deployment onto local Kubernetes cluster with HPA (Horizontal Pod Autoscaling).
• Monitored memory, CPU, and request latency using Prometheus and Grafana dashboards.

ServerlessFileVault – Secure AWS Cloud File Storage
• Built serverless REST API using AWS Lambda, API Gateway, S3, and DynamoDB with automated Python CI/CD tests.
• Implemented fine-grained IAM roles, presigned URLs for encrypted uploads, and auto-thumbnail generation.

EXPERIENCE
DevOps Club President – UT Austin ACM Chapter (2024 - Present)
• Organized hands-on workshops on Docker, Kubernetes pod scheduling, and cloud architecture for 120+ student developers.`,
  },
];
