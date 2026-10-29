import { Domain } from "@/types";

export const DOMAINS: Domain[] = [
  // --- Category A: CSE / IT (32 domains) ---
  {
    id: "dom-01",
    slug: "dotnet",
    name: ".NET",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Enterprise software development with C#, .NET Core, CLR runtime architecture, ASP.NET Web API, and LINQ.",
    icon: "Code2",
    hasCoding: true,
    hasSimulationOrPractical: false,
    subjects: [
      { slug: "csharp-fundamentals", name: "C# Fundamentals & CLR", topics: ["Memory Management", "Garbage Collection", "Async/Await", "Generics"] },
      { slug: "aspnet-core", name: "ASP.NET Core & Web API", topics: ["Middleware", "Dependency Injection", "Entity Framework Core", "Authentication"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-02",
    slug: "ai-domain",
    name: "AI Domain",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Foundational and applied Artificial Intelligence, search algorithms, heuristic optimization, and knowledge representation.",
    icon: "Brain",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "ai-principles", name: "AI Principles & Search", topics: ["A* Search", "Minimax & Alpha-Beta", "Constraint Satisfaction", "Heuristics"] },
      { slug: "knowledge-systems", name: "Knowledge Representation", topics: ["Ontologies", "First-Order Logic", "Probabilistic Reasoning", "Bayes Nets"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-03",
    slug: "ai-ml",
    name: "AI/ML",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Supervised and unsupervised learning, loss functions, backpropagation, model regularization, and neural networks.",
    icon: "Binary",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "ml-algorithms", name: "Machine Learning Foundations", topics: ["Linear/Logistic Regression", "Decision Trees", "SVMs", "Ensemble Methods"] },
      { slug: "neural-nets", name: "Deep Neural Networks", topics: ["Gradient Descent", "Activation Functions", "Backpropagation", "Overfitting"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-04",
    slug: "agentic-ai",
    name: "Agentic AI",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Autonomous reasoning agents, multi-agent orchestration, ReAct prompting, tool calling, and planning frameworks.",
    icon: "Bot",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "agent-architecture", name: "Agent Architectures", topics: ["ReAct Framework", "Tool Calling", "Memory Architecture", "Planning"] },
      { slug: "multi-agent-systems", name: "Multi-Agent Coordination", topics: ["Consensus Mechanisms", "CrewAI/AutoGen Patterns", "Task Decomposition", "Evaluation"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-05",
    slug: "app-development",
    name: "App Development",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Native and cross-platform mobile application engineering across React Native, Flutter, iOS, and Android architectures.",
    icon: "Smartphone",
    hasCoding: true,
    hasSimulationOrPractical: false,
    subjects: [
      { slug: "mobile-architecture", name: "Mobile App Architecture", topics: ["State Management", "Lifecycle Events", "Navigation Systems", "Offline Storage"] },
      { slug: "native-apis", name: "Hardware & Platform APIs", topics: ["Background Tasks", "Push Notifications", "Permissions", "Performance Optimization"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-06",
    slug: "ar-vr",
    name: "AR/VR",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Augmented and Virtual Reality systems, 3D rendering pipelines, spatial computing, WebXR, and Unity/Unreal paradigms.",
    icon: "Glasses",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "spatial-computing", name: "Spatial Computing & Tracking", topics: ["6DoF Tracking", "SLAM", "Projection Matrices", "Stereoscopic Rendering"] },
      { slug: "xr-engines", name: "XR Engines & Interaction", topics: ["Raycasting", "Haptic Feedback", "Occlusion", "WebXR Standards"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-07",
    slug: "aws",
    name: "AWS",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Amazon Web Services infrastructure, EC2 compute, S3 storage, VPC networking, IAM security, and serverless Lambda.",
    icon: "Cloud",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "aws-core-services", name: "AWS Core Infrastructure", topics: ["VPC & Subnets", "EC2 & Auto Scaling", "S3 Storage Classes", "Route 53"] },
      { slug: "aws-security-serverless", name: "Security & Serverless Architecture", topics: ["IAM Roles & Policies", "AWS Lambda", "API Gateway", "DynamoDB"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-08",
    slug: "azure",
    name: "Azure",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Microsoft Azure cloud services, Virtual Networks, Azure AD (Entra ID), App Services, and Azure DevOps integration.",
    icon: "CloudRain",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "azure-cloud-core", name: "Azure Core Services", topics: ["Resource Groups", "Virtual Machines", "Azure VNet", "Blob Storage"] },
      { slug: "azure-identity-governance", name: "Identity & Governance", topics: ["Entra ID", "RBAC", "Azure Policies", "App Service Plans"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-09",
    slug: "blockchain",
    name: "Blockchain",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Distributed ledger technologies, cryptographic hashing, consensus protocols (PoW, PoS), and smart contracts.",
    icon: "Link2",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "blockchain-fundamentals", name: "Cryptographic Ledgers", topics: ["Merkle Trees", "Proof of Work vs Stake", "Byzantine Fault Tolerance", "Wallets"] },
      { slug: "smart-contracts", name: "Smart Contracts & Gas", topics: ["EVM", "Solidity Concepts", "Gas Optimization", "Reentrancy Attacks"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-10",
    slug: "ccna-200-301",
    name: "CCNA 200-301",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Cisco Certified Network Associate fundamentals: IPv4/IPv6 subnetting, routing protocols (OSPF), VLANs, and network security.",
    icon: "Network",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "network-fundamentals", name: "Network Fundamentals & Subnetting", topics: ["IPv4 Subnetting (VLSM)", "OSI & TCP/IP Model", "Cabling & Topology", "IPv6 Addressing"] },
      { slug: "switching-routing", name: "Routing & Switching Technologies", topics: ["VLANs & Trunking (802.1Q)", "Spanning Tree Protocol (STP)", "OSPFv2 Configuration", "NAT & Access Control Lists"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-11",
    slug: "cyber-security",
    name: "Cyber Security",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Defensive and offensive security, vulnerability assessment, cryptography, threat modeling, and OWASP Top 10 vulnerabilities.",
    icon: "ShieldCheck",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "security-fundamentals", name: "Security Architecture & Cryptography", topics: ["CIA Triad", "Symmetric vs Asymmetric Crypto", "Public Key Infrastructure (PKI)", "Hashing & Digital Signatures"] },
      { slug: "application-network-security", name: "Web & Network Defense", topics: ["OWASP Top 10", "SQL Injection & XSS", "Firewalls & IDS/IPS", "Penetration Testing Methodology"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-12",
    slug: "data-analytics",
    name: "Data Analytics",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Descriptive and diagnostic analytics, exploratory data analysis, data storytelling, KPI dashboards, and statistical sampling.",
    icon: "PieChart",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "eda-statistics", name: "Exploratory Data Analysis", topics: ["Central Tendency & Dispersion", "Correlation vs Causation", "Hypothesis Testing", "Data Cleansing"] },
      { slug: "visualization-reporting", name: "Business Intelligence & KPIs", topics: ["Dashboard Design", "Cohort Analysis", "Funnel Metrics", "Trend Forecasting"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-13",
    slug: "data-engineering",
    name: "Data Engineering",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Big data infrastructure, ETL/ELT pipelines, distributed processing with Apache Spark, data lakes, and dimensional modeling.",
    icon: "Database",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "etl-pipelines", name: "ETL/ELT Architecture", topics: ["Data Warehouse Schemas (Star/Snowflake)", "Batch vs Streaming", "Partitioning & Sharding", "Data Quality"] },
      { slug: "distributed-computing", name: "Distributed Data Frameworks", topics: ["Apache Spark RDDs/DataFrames", "Kafka Event Streams", "Delta Lake / Parquet", "Airflow Orchestration"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-14",
    slug: "data-science",
    name: "Data Science",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Statistical modeling, feature engineering, predictive modeling, machine learning workflows, and model performance metrics.",
    icon: "TrendingUp",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "statistical-inference", name: "Statistical Modeling & Inference", topics: ["Probability Distributions", "p-values & Confidence Intervals", "ANOVA", "Sampling Techniques"] },
      { slug: "feature-engineering", name: "Feature Engineering & Evaluation", topics: ["Normalization vs Standardization", "Encoding Categoricals", "ROC-AUC & Confusion Matrix", "Cross-Validation"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-15",
    slug: "devops",
    name: "DevOps",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "CI/CD automation, infrastructure as code (Terraform), continuous monitoring, container orchestration, and site reliability.",
    icon: "GitBranch",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "cicd-automation", name: "CI/CD Pipelines & Version Control", topics: ["GitHub Actions / GitLab CI", "Build Artifacts", "Automated Testing Gates", "Canary Deployments"] },
      { slug: "iac-monitoring", name: "Infrastructure as Code & Observability", topics: ["Terraform State & Modules", "Prometheus & Grafana", "Log Aggregation", "Zero Downtime Deployments"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-16",
    slug: "docker",
    name: "Docker",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Containerization fundamentals, Dockerfiles, multi-stage builds, volume mounts, bridge networks, and Docker Compose orchestration.",
    icon: "Boxes",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "container-basics", name: "Containerization & Docker CLI", topics: ["Images vs Containers", "Dockerfile Directives", "Layer Caching", "Docker Run Flags"] },
      { slug: "advanced-docker", name: "Multi-stage & Networking", topics: ["Multi-Stage Builds", "Named Volumes & Bind Mounts", "Bridge & Overlay Networks", "Docker Compose"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-17",
    slug: "dsa-system-design",
    name: "DSA & System Design",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Data structures, algorithmic paradigms (DP, graphs, trees), time complexity, high-scale system design, and caching strategies.",
    icon: "Cpu",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "data-structures-algorithms", name: "Advanced Data Structures & Algorithms", topics: ["Trees & Graphs", "Dynamic Programming", "Greedy & Divide-and-Conquer", "Complexity Analysis (Big-O)"] },
      { slug: "system-design", name: "Distributed System Design", topics: ["Load Balancing", "Consistent Hashing", "CAP Theorem", "Caching & Database Sharding"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-18",
    slug: "full-stack-development",
    name: "Full Stack Development",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Modern end-to-end web engineering: React/Next.js frontends, Node/Express backends, RESTful APIs, and relational databases.",
    icon: "Layers",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "frontend-architecture", name: "Frontend Architecture", topics: ["Component Lifecycle", "State Management", "DOM Manipulation", "Responsive Design"] },
      { slug: "backend-api-design", name: "Backend APIs & Database Integration", topics: ["RESTful Principles", "JWT Authentication", "ORM/Query Optimization", "CORS & Security"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-19",
    slug: "generative-ai-llm",
    name: "Generative AI & LLM",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Large Language Models, Transformer attention architectures, fine-tuning (LoRA), prompt engineering, and Retrieval-Augmented Generation (RAG).",
    icon: "Sparkles",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "transformer-architecture", name: "Transformers & Attention Mechanisms", topics: ["Self-Attention & Multi-Head", "Positional Encoding", "Tokenization & Embeddings", "KV Cache"] },
      { slug: "rag-fine-tuning", name: "RAG & LLM Application Engineering", topics: ["Vector Databases & Embeddings", "Prompt Engineering & Few-shot", "LoRA / QLoRA Fine-tuning", "Hallucination Mitigation"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-20",
    slug: "graphic-design",
    name: "Graphic Design",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Visual design principles, color theory, typography, raster vs vector graphics, composition, and digital brand identity.",
    icon: "Palette",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "visual-principles", name: "Visual Arts & Composition", topics: ["Color Theory & Harmonies", "Typography Hierarchy", "Rule of Thirds & Grid Systems", "Contrast & White Space"] },
      { slug: "digital-production", name: "Digital Formats & Production", topics: ["Vector vs Raster (SVG/PNG)", "DPI/Resolution Standards", "CMYK vs RGB", "Design Export Workflows"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-21",
    slug: "java",
    name: "Java",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Core Java, JVM architecture, garbage collection algorithms, multithreading, collections framework, and streams API.",
    icon: "Coffee",
    hasCoding: true,
    hasSimulationOrPractical: false,
    subjects: [
      { slug: "core-java", name: "Core Java & OOP", topics: ["Inheritance & Polymorphism", "Exception Handling", "Collections Framework", "Generics"] },
      { slug: "jvm-concurrency", name: "JVM Architecture & Concurrency", topics: ["Thread Synchronization", "ExecutorService", "Memory Model (JMM)", "Garbage Collection (G1/ZGC)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-22",
    slug: "java-full-stack",
    name: "Java Full Stack",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Enterprise Java full-stack engineering: Spring Boot, Spring Security, Hibernate/JPA, microservices, and modern frontend integration.",
    icon: "Server",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "spring-boot", name: "Spring Boot & Microservices", topics: ["Spring IoC & Bean Scope", "Spring Data JPA", "Spring Security", "Microservices Communication"] },
      { slug: "enterprise-integration", name: "Enterprise Architecture & Integration", topics: ["Kafka/RabbitMQ Messaging", "API Gateway & Service Discovery", "Database Transactions (ACID)", "Full Stack Testing"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-23",
    slug: "manual-testing",
    name: "Manual Testing",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Software testing life cycle (STLC), test case design, black-box testing techniques, bug life cycle, and quality assurance standards.",
    icon: "ClipboardCheck",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "testing-fundamentals", name: "Software Testing Life Cycle", topics: ["SDLC vs STLC", "Test Plan & Strategy", "Verification vs Validation", "Defect Life Cycle"] },
      { slug: "test-design-techniques", name: "Test Case Design & Execution", topics: ["Boundary Value Analysis", "Equivalence Partitioning", "Decision Table Testing", "Regression & Smoke Testing"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-24",
    slug: "machine-learning-ml",
    name: "Machine Learning (ML)",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Mathematical foundations of ML, gradient descent optimization, loss functions, clustering, dimensionality reduction, and model validation.",
    icon: "LineChart",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "supervised-unsupervised", name: "Supervised & Unsupervised Learning", topics: ["Linear/Logistic Regression", "k-Means & Hierarchical Clustering", "PCA Dimensionality Reduction", "Random Forests"] },
      { slug: "optimization-tuning", name: "Model Optimization & Tuning", topics: ["Bias-Variance Tradeoff", "Hyperparameter Tuning (Grid/Random)", "L1/L2 Regularization", "Ensemble Stacking"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-25",
    slug: "metaverse",
    name: "Metaverse",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Virtual worlds, digital asset interoperability, avatars, 3D spatial networking, spatial audio, and decentralized identities.",
    icon: "Globe",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "virtual-worlds", name: "Virtual Reality World-Building", topics: ["Spatial Networking", "Avatar Avatars & Rigging", "Spatial Audio Simulation", "Latency in Real-time Virtual Worlds"] },
      { slug: "digital-economy", name: "Metaverse Economy & Identity", topics: ["Asset Interoperability (glTF/USD)", "Decentralized Identifiers (DID)", "Virtual Land Economics", "Privacy in Immersive Worlds"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-26",
    slug: "python",
    name: "Python",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Python language mastery: data structures, object-oriented programming, generators, decorators, memory management, and standard libraries.",
    icon: "Terminal",
    hasCoding: true,
    hasSimulationOrPractical: false,
    subjects: [
      { slug: "python-core", name: "Core Python & Data Structures", topics: ["Lists/Dicts/Sets Operations", "Functions & Lambdas", "OOP & Dunder Methods", "File I/O & Exceptions"] },
      { slug: "advanced-python", name: "Advanced Python Mechanics", topics: ["Decorators & Generators", "Context Managers", "Global Interpreter Lock (GIL)", "Asyncio & Concurrency"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-27",
    slug: "python-full-stack-development",
    name: "Python Full Stack Development",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Django, FastAPI, SQLAlchemy, modern asynchronous APIs, background workers (Celery), and frontend web integration.",
    icon: "Code",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "fastapi-django", name: "Web Frameworks (Django & FastAPI)", topics: ["Django ORM & Migrations", "FastAPI Pydantic Schemas", "Dependency Injection", "Authentication & JWT"] },
      { slug: "async-production", name: "Asynchronous Production Web Systems", topics: ["Celery & Redis Task Queues", "Async Database Drivers", "WebSockets", "Dockerized Deployments"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-28",
    slug: "quantum-computing",
    name: "Quantum Computing",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Qubits, quantum superposition, entanglement, quantum gates (Hadamard, CNOT), Deutsch-Jozsa, Shor's, and Grover's algorithms.",
    icon: "Atom",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "quantum-mechanics-circuits", name: "Qubits & Quantum Circuits", topics: ["Bloch Sphere", "Superposition & Entanglement", "Pauli & Hadamard Gates", "CNOT & Multi-Qubit Gates"] },
      { slug: "quantum-algorithms", name: "Quantum Algorithms & Error Correction", topics: ["Grover's Search Algorithm", "Shor's Factoring", "Quantum Teleportation", "No-Cloning Theorem"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-29",
    slug: "selenium-testing",
    name: "Selenium Testing",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Automated browser testing using Selenium WebDriver, XPath locators, Page Object Model (POM), TestNG, and cross-browser suites.",
    icon: "CheckSquare",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "webdriver-locators", name: "Selenium WebDriver & Locators", topics: ["WebDriver Architecture", "XPath & CSS Selectors", "Implicit vs Explicit Waits", "Handling Alerts & Frames"] },
      { slug: "framework-design", name: "Test Automation Frameworks", topics: ["Page Object Model (POM)", "TestNG Annotations & Data Providers", "Parallel Test Execution", "Extent Reports Integration"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-30",
    slug: "servicenow",
    name: "ServiceNow",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "ITSM, ITOM, CMDB configuration, ServiceNow workflows, Business Rules, Client Scripts, and Service Portal engineering.",
    icon: "Wrench",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "servicenow-fundamentals", name: "ServiceNow Administration & ITSM", topics: ["Incident/Problem/Change Management", "CMDB & Configuration Items", "User & Role Management", "Tables & Form Customization"] },
      { slug: "servicenow-development", name: "ServiceNow Development & Scripting", topics: ["Business Rules (Before/After/Async)", "Client Scripts & UI Policies", "GlideRecord API", "Flow Designer Workflows"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-31",
    slug: "ui-ux-design",
    name: "UI/UX Design",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "User research, wireframing, interactive prototyping in Figma, Nielsen Norman usability heuristics, design systems, and WCAG accessibility.",
    icon: "Compass",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "ux-research-heuristics", name: "User Research & Usability Heuristics", topics: ["User Personas & Journey Mapping", "Nielsen 10 Usability Heuristics", "Information Architecture", "Usability Testing"] },
      { slug: "ui-design-systems", name: "Design Systems & Accessibility", topics: ["Atomic Design Principles", "WCAG 2.1 Contrast Standards", "Auto Layout & Prototyping", "Micro-Interactions"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-32",
    slug: "web3",
    name: "Web3",
    categoryCode: "cse_it",
    categoryName: "CSE / IT",
    description: "Decentralized applications (dApps), ethers.js/web3.js integration, IPFS decentralized storage, token standards (ERC-20, ERC-721), and DAO governance.",
    icon: "ShieldAlert",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "dapp-architecture", name: "dApp Architecture & Providers", topics: ["Web3 Providers & Signers", "Connecting Wallets (MetaMask)", "Contract ABI & Event Listeners", "IPFS Storage"] },
      { slug: "tokenomics-security", name: "Token Standards & Smart Contract Security", topics: ["ERC-20 & ERC-721 Interfaces", "Smart Contract Auditing", "Oracle Integration (Chainlink)", "DAO Governance Models"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },

  // --- Category B: ECE / EEE (8 domains) ---
  {
    id: "dom-33",
    slug: "electrical-cad",
    name: "Electrical CAD",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "Electrical schematic drafting, panel wiring diagrams, single-line diagrams (SLD), component footprint design, and BOM generation.",
    icon: "Zap",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "schematic-design", name: "Electrical Schematic Drafting", topics: ["ANSI/IEC Standard Symbols", "Ladder Logic Diagrams", "Terminal Strips & Cross-Referencing", "Cable Schedule Generation"] },
      { slug: "panel-engineering", name: "Control Panel & Power Distribution", topics: ["Panel Layout & Clearance", "Single-Line Diagrams (SLD)", "Busbar Sizing Calculations", "Short-Circuit Protection Selection"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-34",
    slug: "embedded-systems",
    name: "Embedded Systems",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "Microcontroller architecture (ARM Cortex, AVR), timers, interrupts, communication protocols (SPI, I2C, UART), and RTOS task scheduling.",
    icon: "Cpu",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "microcontroller-peripherals", name: "Microcontrollers & Peripherals", topics: ["GPIO & Interrupt Service Routines", "Timers & PWM Generation", "SPI/I2C/UART Protocols", "ADC/DAC Conversion"] },
      { slug: "rtos-embedded-c", name: "Real-Time Operating Systems (RTOS)", topics: ["Task Scheduling (Preemptive/Cooperative)", "Semaphores & Mutexes", "Memory Constraints & Watchdog Timers", "Low Power Modes"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-35",
    slug: "internet-of-things-iot",
    name: "Internet of Things (IoT)",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "IoT sensor networks, edge gateways, MQTT/CoAP protocols, wireless technologies (LoRaWAN, Zigbee, BLE), and cloud telemetry.",
    icon: "Wifi",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "iot-protocols-sensors", name: "IoT Protocols & Sensor Interfaces", topics: ["MQTT Publish/Subscribe", "CoAP vs HTTP", "Sensor Calibration & Conditioning", "Edge Computing Concepts"] },
      { slug: "wireless-iot-cloud", name: "Wireless Networks & Cloud Telemetry", topics: ["LoRaWAN & BLE Mesh", "IoT Security & Device Certificates", "Time-Series Telemetry Ingestion", "Firmware Over-The-Air (FOTA)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-36",
    slug: "hybrid-electric-vehicles",
    name: "Hybrid & Electric Vehicles",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "EV powertrain architecture, lithium-ion battery management systems (BMS), motor controllers (PMSM, BLDC), and regenerative braking.",
    icon: "Car",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "bms-energy-storage", name: "Battery Management Systems (BMS)", topics: ["Li-ion Chemistry & Thermal Runaway", "State of Charge (SoC) Estimation", "Cell Balancing (Active vs Passive)", "Battery Pack Thermal Management"] },
      { slug: "ev-powertrains-traction", name: "Powertrain & Motor Drives", topics: ["PMSM vs Induction Motors", "Inverter & Field-Oriented Control", "Regenerative Braking Dynamics", "Charging Standards (CCS/CHAdeMO)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-37",
    slug: "industrial-robotics",
    name: "Industrial Robotics",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "Articulated industrial manipulators, SCARA robots, teach pendants, safety interlocks (ISO 10218), path planning, and PLC integration.",
    icon: "Workflow",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "robot-kinematics-hardware", name: "Manipulator Kinematics & Mechanics", topics: ["Degrees of Freedom & Workspace", "Forward & Inverse Kinematics", "End-Effectors & Grippers", "Payload & Repeatability"] },
      { slug: "safety-plc-integration", name: "Industrial Cell Integration & Safety", topics: ["ISO 13849 Safety Categories", "Teach Pendant Programming", "PLC & Fieldbus Communication", "Machine Vision Guidance"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-38",
    slug: "robotics",
    name: "Robotics",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "Mobile robotics, Robot Operating System (ROS 2), SLAM algorithms, LiDAR/optical sensor fusion, and trajectory optimization.",
    icon: "Bot",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "ros-navigation", name: "Robot Operating System (ROS/ROS2)", topics: ["ROS Nodes, Topics & Services", "URDF Robot Modeling", "Transform Tree (tf2)", "Differential Drive Kinematics"] },
      { slug: "slam-sensor-fusion", name: "Localization & Autonomous Navigation", topics: ["LiDAR & Visual Odometry", "Kalman Filtering (EKF/UKF)", "Occupancy Grid Mapping", "Path Planning (A*, RRT*)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-39",
    slug: "vlsi",
    name: "VLSI",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "Very Large Scale Integration: CMOS digital logic, Verilog/VHDL RTL synthesis, static timing analysis (STA), setup/hold slack, and physical layout.",
    icon: "Microchip",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "digital-rtl-design", name: "Digital RTL Design (Verilog)", topics: ["Combinational vs Sequential Logic", "Finite State Machines (Mealy/Moore)", "Blocking vs Non-blocking Assignments", "RTL Synthesis"] },
      { slug: "sta-physical-design", name: "Static Timing Analysis & CMOS Layout", topics: ["Setup & Hold Time Violations", "Clock Skew & Jitter", "CMOS Inverter Characteristics", "Placement & Routing Flow"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-40",
    slug: "drone-engineering",
    name: "Drone Engineering",
    categoryCode: "ece_eee",
    categoryName: "ECE / EEE",
    description: "Unmanned aerial vehicles (UAVs), aerodynamics of multirotors, flight controllers (PX4, ArduPilot), PID tuning, ESC telemetry, and telemetry links.",
    icon: "Send",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "uav-aerodynamics-propulsion", name: "Aerodynamics & Propulsion Systems", topics: ["Thrust-to-Weight Ratio", "BLDC Motor & ESC Selection", "Propeller Pitch & Diameter", "LiPo Battery Sizing"] },
      { slug: "flight-control-avionics", name: "Avionics & Autonomous Navigation", topics: ["IMU Sensors & Sensor Fusion", "PID Attitude Control Loops", "PX4 / ArduPilot Architecture", "Geofencing & Fail-safe Systems"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },

  // --- Category C: Mechanical (5 domains) ---
  {
    id: "dom-41",
    slug: "autocad",
    name: "AutoCAD",
    categoryCode: "mechanical",
    categoryName: "Mechanical",
    description: "2D drafting and 3D modeling, geometric dimensioning and tolerancing (GD&T), orthographic projections, isometric views, and parametric constraints.",
    icon: "PenTool",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "drafting-principles", name: "2D Drafting & Geometric Construction", topics: ["Orthographic Projections", "Layers & Line Types", "Hatching & Section Views", "Blocks & Dynamic Blocks"] },
      { slug: "gdt-parametric", name: "GD&T & Parametric Dimensioning", topics: ["Datum References", "Form & Position Tolerances", "Parametric Constraints", "Plotting & Viewports"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-42",
    slug: "catia",
    name: "CATIA",
    categoryCode: "mechanical",
    categoryName: "Mechanical",
    description: "Advanced solid modeling (Part Design), Generative Shape Design (surfacing), Assembly Design, DMU Kinematics, and sheet metal fabrication.",
    icon: "Boxes",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "part-surface-design", name: "Part & Generative Shape Design", topics: ["Pad, Pocket & Shaft Features", "Splines & Lofting", "G0, G1, G2 Surface Continuity", "Draft Angles & Fillets"] },
      { slug: "assembly-kinematics", name: "Assembly Design & Kinematics", topics: ["Coincidence & Contact Constraints", "Interference & Clash Detection", "DMU Kinematics Revolute Joints", "BOM Generation"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-43",
    slug: "car-design",
    name: "Car Design",
    categoryCode: "mechanical",
    categoryName: "Mechanical",
    description: "Automotive exterior styling, vehicle packaging, ergonomic ergonomics, aerodynamic drag coefficients (Cd), and chassis rigidity.",
    icon: "Gauge",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "vehicle-packaging-aerodynamics", name: "Packaging & Aerodynamic Styling", topics: ["Wheelbase & Track Dimensions", "Drag Coefficient (Cd) Optimization", "Downforce & Ground Effect", "A-Pillar Blind Spot Mitigation"] },
      { slug: "chassis-crashworthiness", name: "Body-in-White (BIW) & Safety", topics: ["Monocoque vs Ladder Frame", "Crumple Zones & Crash Energy", "Torsional Stiffness", "Material Selection (Al vs Steel)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-44",
    slug: "machine-design",
    name: "Machine Design",
    categoryCode: "mechanical",
    categoryName: "Mechanical",
    description: "Strength of materials, theories of failure (Von Mises, Tresca), fatigue design (S-N curve), shaft design, gear trains, and rolling bearings.",
    icon: "Cog",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "theories-of-failure", name: "Static & Dynamic Failure Theories", topics: ["Maximum Distortion Energy (Von Mises)", "Maximum Shear Stress (Tresca)", "Stress Concentration Factors", "S-N Curve & Endurance Limit"] },
      { slug: "mechanical-elements", name: "Machine Element Sizing", topics: ["Shafts Subjected to Torsion/Bending", "Spur & Helical Gear Sizing", "Bearing L10 Rating Life", "Bolted & Welded Joint Design"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-45",
    slug: "ic-engine-design",
    name: "IC Engine Design",
    categoryCode: "mechanical",
    categoryName: "Mechanical",
    description: "Thermodynamics of Otto, Diesel, and Dual cycles, combustion chamber design, valve timing diagrams, turbocharging, and emission control (BS-VI).",
    icon: "Flame",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "engine-thermodynamics", name: "Thermodynamic Cycles & Performance", topics: ["Otto vs Diesel Thermal Efficiency", "Indicated & Brake Power (BMEP)", "Compression Ratio Limits", "Heat Balance Sheet"] },
      { slug: "engine-components-emissions", name: "Component Design & Emissions", topics: ["Piston & Connecting Rod Sizing", "Valve Timing Diagrams & VVT", "Turbocharging & Intercooling", "Catalytic Converters & SCR (BS-VI)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },

  // --- Category D: Chemical (2 domains) ---
  {
    id: "dom-46",
    slug: "aspen-plus",
    name: "Aspen Plus",
    categoryCode: "chemical",
    categoryName: "Chemical",
    description: "Process steady-state simulation, thermodynamic property methods (NRTL, UNIQUAC, Peng-Robinson), RadFrac distillation, and heat exchanger networks.",
    icon: "FlaskConical",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "property-methods-flowsheets", name: "Thermodynamic Models & Flowsheet Setup", topics: ["Equation of State vs Activity Coefficient Models", "NRTL & UNIQUAC Binary Parameters", "Material & Energy Balances", "Convergence Algorithms"] },
      { slug: "unit-operations-simulation", name: "Distillation & Reactor Modeling", topics: ["RadFrac Column Sizing & Stages", "Reflux Ratio Optimization", "Heater & HeatX Design", "Sensitivity Analysis"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-47",
    slug: "aspen-hysys",
    name: "Aspen HYSYS",
    categoryCode: "chemical",
    categoryName: "Chemical",
    description: "Hydrocarbon process simulation, oil characterization, natural gas processing, compressors, separators, and dynamic relief valve analysis.",
    icon: "Activity",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "oil-gas-simulation", name: "Upstream & Gas Processing Simulation", topics: ["Peng-Robinson for Hydrocarbons", "Oil Assay Characterization", "Two-Phase & Three-Phase Separators", "Gas Dehydration (TEG)"] },
      { slug: "rotating-equipment-piping", name: "Compressors, Expanders & Dynamics", topics: ["Centrifugal Compressor Polytropic Curves", "Pipeline Hydraulics & Pressure Drops", "Steady-State to Dynamic Transition", "Blowdown & Relief Valve Sizing"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },

  // --- Category E: Civil (1 domain) ---
  {
    id: "dom-48",
    slug: "construction-planning",
    name: "Construction Planning",
    categoryCode: "civil",
    categoryName: "Civil",
    description: "Project management in civil engineering, Critical Path Method (CPM), PERT, resource leveling, cost estimation, quantity surveying, and Primavera/MSP.",
    icon: "Building2",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "cpm-pert-scheduling", name: "Project Scheduling (CPM & PERT)", topics: ["Activity-on-Node (AON) Networks", "Early/Late Start & Float Calculation", "Critical Path Determination", "PERT Probability Distribution"] },
      { slug: "estimation-resource-leveling", name: "Estimation, Contracts & Resource Leveling", topics: ["Quantity Surveying & Rate Analysis", "Resource Smoothing vs Leveling", "Earned Value Management (EVM)", "Tender Contracts & FIDIC"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },

  // --- Category F: Management (17 domains) ---
  {
    id: "dom-49",
    slug: "acca-f4-business",
    name: "ACCA F4 Business",
    categoryCode: "management",
    categoryName: "Management",
    description: "Corporate and Business Law (Global/Eng): legal system fundamentals, law of obligations (contracts, torts), company law, and corporate insolvency.",
    icon: "Scale",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "law-of-obligations", name: "Contract Law & Tort of Negligence", topics: ["Offer, Acceptance & Consideration", "Breach of Contract & Remedies", "Duty of Care & Negligence", "Vicarious Liability"] },
      { slug: "corporate-governance-law", name: "Company Formation, Directors & Insolvency", topics: ["Separate Legal Personality (Salomon v Salomon)", "Directors' Duties & Ultra Vires", "Share Capital & Dividends", "Winding Up & Liquidation Procedures"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-50",
    slug: "business-analytics",
    name: "Business Analytics",
    categoryCode: "management",
    categoryName: "Management",
    description: "Prescriptive and predictive analytics for business decisions, customer lifetime value (CLV), churn modeling, market basket analysis, and ROI attribution.",
    icon: "BarChart",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "business-metrics-kpis", name: "Business Decision Modeling & KPIs", topics: ["Customer Acquisition Cost (CAC) & LTV", "Churn Rate & Cohort Analysis", "A/B Testing Statistical Significance", "Price Elasticity of Demand"] },
      { slug: "market-basket-optimization", name: "Predictive & Prescriptive Methods", topics: ["Market Basket Analysis (Apriori)", "Linear Programming for Resource Allocation", "Decision Trees for Risk Scoring", "Marketing Mix Modeling (MMM)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-51",
    slug: "digital-marketing",
    name: "Digital Marketing",
    categoryCode: "management",
    categoryName: "Management",
    description: "Search Engine Optimization (SEO), Pay-Per-Click (PPC) advertising, conversion rate optimization (CRO), email marketing, and Google Analytics 4.",
    icon: "Megaphone",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "seo-content-marketing", name: "Search Engine Optimization (SEO)", topics: ["On-Page vs Off-Page SEO", "Technical SEO (Crawlability & Core Web Vitals)", "Keyword Intent & Search Volume", "Backlink Acquisition Strategies"] },
      { slug: "paid-media-analytics", name: "Paid Ads & Performance Analytics", topics: ["Google Ads Auction & Quality Score", "CPC, CPM, CTR & ROAS Metrics", "GA4 Event Tracking & Conversions", "Remarketing & Audience Segmentation"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-52",
    slug: "entrepreneurship",
    name: "Entrepreneurship",
    categoryCode: "management",
    categoryName: "Management",
    description: "Lean Startup methodology, Business Model Canvas, product-market fit, cap table management, venture capital valuation, and pitch structuring.",
    icon: "Rocket",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "lean-startup-canvas", name: "Venture Ideation & Lean Startup", topics: ["Business Model Canvas (BMC)", "Minimum Viable Product (MVP) Testing", "Pivot vs Persevere Decision Framework", "Customer Discovery Interviews"] },
      { slug: "startup-financing", name: "Startup Finance & Pitching", topics: ["Cap Tables & Dilution", "SAFE Notes vs Convertible Debt", "Pre-money vs Post-money Valuation", "Term Sheet Key Clauses (Liquidation Preference)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-53",
    slug: "finance",
    name: "Finance",
    categoryCode: "management",
    categoryName: "Management",
    description: "Corporate finance: Capital budgeting (NPV, IRR), Capital Asset Pricing Model (CAPM), working capital management, financial ratios, and WACC.",
    icon: "DollarSign",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "capital-budgeting-cost", name: "Capital Budgeting & Cost of Capital", topics: ["Net Present Value (NPV) & IRR", "Weighted Average Cost of Capital (WACC)", "Discounted Cash Flow (DCF)", "Modigliani-Miller Theorem"] },
      { slug: "financial-statement-analysis", name: "Financial Ratio Analysis & Risk", topics: ["Liquidity, Solvency & Profitability Ratios", "DuPont Analysis", "Operating vs Financial Leverage", "Working Capital Cycle"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-54",
    slug: "human-resource",
    name: "Human Resource",
    categoryCode: "management",
    categoryName: "Management",
    description: "Strategic human resource management: talent acquisition, performance appraisal (360-degree, OKRs), employee engagement, and Indian labor laws.",
    icon: "Users",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "talent-acquisition-performance", name: "Talent Management & Appraisals", topics: ["Competency Mapping", "360-Degree Feedback & OKRs", "Compensation Benchmarking & CTC", "Succession Planning"] },
      { slug: "employee-relations-labor-law", name: "Labor Law & Organizational Behavior", topics: ["Industrial Disputes Act & Factories Act", "Attrition & Retention Strategies", "POSH Compliance", "Change Management Models (Kotter's 8-step)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-55",
    slug: "investment-banking",
    name: "Investment Banking",
    categoryCode: "management",
    categoryName: "Management",
    description: "M&A advisory, financial modeling (LBO, DCF), comparable company analysis (Trading Comps), IPO underwriting, and debt restructuring.",
    icon: "Briefcase",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "valuation-methodologies", name: "Corporate Valuation Methodologies", topics: ["Discounted Cash Flow (DCF) Modeling", "Comparable Company Analysis (CCA)", "Precedent Transaction Analysis", "Enterprise Value vs Equity Value"] },
      { slug: "ma-lbo-transactions", name: "Mergers & Acquisitions and LBO", topics: ["Accretion/Dilution Analysis", "Leveraged Buyout (LBO) Debt Tranches", "Synergies & Purchase Price Allocation", "IPO Process & Underwriting Syndicates"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-56",
    slug: "microsoft-excel",
    name: "Microsoft Excel",
    categoryCode: "management",
    categoryName: "Management",
    description: "Advanced spreadsheet engineering: XLOOKUP, INDEX/MATCH, Dynamic Arrays (FILTER, UNIQUE), Pivot Tables, Power Query, and financial modeling formulas.",
    icon: "FileSpreadsheet",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "formulas-lookups", name: "Advanced Formulas & Dynamic Arrays", topics: ["XLOOKUP vs VLOOKUP", "INDEX-MATCH Multi-Condition", "Dynamic Array Functions (FILTER, SORT, UNIQUE)", "Logical Functions (IFS, SWITCH)"] },
      { slug: "data-modeling-pivots", name: "Data Analysis & Power Query", topics: ["Pivot Tables & Calculated Fields", "Data Validation & Conditional Formatting", "Power Query ETL in Excel", "What-If Analysis (Goal Seek & Data Tables)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-57",
    slug: "placement-preparation",
    name: "Placement Preparation",
    categoryCode: "management",
    categoryName: "Management",
    description: "Quantitative aptitude (time-speed-distance, permutations, probability), logical reasoning, data interpretation, and verbal ability for campus recruitment.",
    icon: "Award",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "quantitative-aptitude", name: "Quantitative Aptitude & Numeracy", topics: ["Percentages, Profit & Loss", "Time, Speed & Distance", "Permutations & Combinations", "Probability & Statistics"] },
      { slug: "logical-verbal-reasoning", name: "Logical Reasoning & Verbal Ability", topics: ["Syllogisms & Blood Relations", "Seating Arrangements", "Reading Comprehension", "Critical Reasoning & Sentence Correction"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-58",
    slug: "power-bi",
    name: "Power BI",
    categoryCode: "management",
    categoryName: "Management",
    description: "Business intelligence modeling in Power BI: DAX formulas (CALCULATE, FILTER, RELATED), Power Query M transformations, star schemas, and dashboard security.",
    icon: "BarChart2",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "data-modeling-powerquery", name: "Power Query ETL & Star Schemas", topics: ["M Code Transformations", "Fact vs Dimension Tables", "Relationship Cardinality (1:*, *:*)", "Bi-directional Cross Filtering"] },
      { slug: "dax-visualizations", name: "DAX Measures & Advanced Visuals", topics: ["CALCULATE Function & Context Transition", "Row Context vs Filter Context", "Time Intelligence Functions", "Row-Level Security (RLS)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-59",
    slug: "salesforce",
    name: "Salesforce",
    categoryCode: "management",
    categoryName: "Management",
    description: "Salesforce CRM architecture: standard/custom objects, validation rules, Flow automations, SOQL/SOSL queries, Apex triggers, and security sharing models.",
    icon: "Cloud",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "salesforce-administration", name: "CRM Administration & Automation", topics: ["Standard Objects (Lead, Account, Opportunity)", "Profiles, Permission Sets & Roles", "Record-Level Security (OWD)", "Salesforce Flow Builder"] },
      { slug: "apex-soql-development", name: "Apex Programming & SOQL", topics: ["SOQL Queries & Relationships", "Apex Trigger Context Variables", "Governor Limits & Bulkification", "Asynchronous Apex (Queueable/Batch)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-60",
    slug: "sap",
    name: "SAP",
    categoryCode: "management",
    categoryName: "Management",
    description: "Enterprise resource planning fundamentals: SAP S/4HANA architecture, organizational units, master data, cross-module integration, and transaction codes.",
    icon: "Database",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "s4hana-architecture", name: "SAP S/4HANA Enterprise Architecture", topics: ["In-Memory HANA Database", "Universal Journal (ACDOCA)", "Client, Company Code & Plant Hierarchy", "SAP Fiori Launchpad"] },
      { slug: "erp-master-data", name: "ERP Master Data & Module Integration", topics: ["Business Partner (BP) Concept", "Procure-to-Pay (P2P) Flow", "Order-to-Cash (O2C) Flow", "Transaction Codes & Authorization"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-61",
    slug: "sap-grc-arm",
    name: "SAP GRC ARM",
    categoryCode: "management",
    categoryName: "Management",
    description: "Governance, Risk, and Compliance: Access Risk Management (ARM), Access Control, Segregation of Duties (SoD), emergency access (Firefighter), and audit trails.",
    icon: "Shield",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "access-risk-analysis", name: "Access Risk Analysis (ARA) & SoD", topics: ["Segregation of Duties (SoD) Rulebooks", "Risk Id & Function Creation", "Mitigating Controls & Approvals", "User vs Role Level Risk Analysis"] },
      { slug: "arm-emergency-access", name: "Access Request (ARM) & Firefighter (EAM)", topics: ["ARM Workflow Stages", "Emergency Access Management (EAM/Firefighter)", "Firefighter ID vs Role Assignment", "Log Review & Audit Trails"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-62",
    slug: "sap-mm",
    name: "SAP MM",
    categoryCode: "management",
    categoryName: "Management",
    description: "Materials Management in SAP: Purchasing organizations, material master records, purchase requisitions (PR), purchase orders (PO), goods receipt (MIGO), and invoice verification (MIRO).",
    icon: "Package",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "procurement-master-data", name: "Procurement Cycle & Master Data", topics: ["Material Master & Vendor/BP", "Purchasing Info Records (PIR)", "Purchase Requisition (PR) to PO Flow", "Source Determination & Quota"] },
      { slug: "inventory-invoice-verification", name: "Inventory Management & Invoice (LIV)", topics: ["Movement Types in Goods Receipt (MIGO)", "Valuation Classes & Account Determination", "Invoice Verification (MIRO) & Tolerances", "Physical Inventory Procedures"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-63",
    slug: "sap-successfactors",
    name: "SAP SuccessFactors",
    categoryCode: "management",
    categoryName: "Management",
    description: "Cloud HCM suite: Employee Central (EC) master data, Position Management, Foundation Objects, Role-Based Permissions (RBP), and Performance & Goals.",
    icon: "UserCheck",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "employee-central-data", name: "Employee Central & Data Models", topics: ["MDF (Metadata Framework) Objects", "Foundation Objects vs Generic Objects", "Event & Event Reasons", "Position Management & Propagation"] },
      { slug: "rbp-talent-modules", name: "Role-Based Permissions & Talent", topics: ["Permission Groups & Permission Roles", "Target Population Configuration", "Goal Management & Rating Scales", "SuccessFactors Integration Center"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-64",
    slug: "stock-marketing",
    name: "Stock Marketing",
    categoryCode: "management",
    categoryName: "Management",
    description: "Equity markets, technical analysis (candlestick patterns, RSI, MACD), fundamental analysis (P/E, EPS), derivatives (Options Greeks, Futures hedging), and SEBI compliance.",
    icon: "TrendingUp",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "technical-analysis", name: "Technical Analysis & Charting", topics: ["Candlestick Formations (Doji, Hammer)", "Support, Resistance & Trendlines", "RSI, MACD & Moving Averages", "Volume & Price Action Confirmation"] },
      { slug: "derivatives-market-microstructure", name: "Options, Futures & Risk Management", topics: ["Call/Put Options & Option Greeks (Delta, Theta)", "Hedging with Index Futures", "Order Types (Limit, Stop-Loss, Bracket)", "Risk-Reward Ratio & Position Sizing"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-65",
    slug: "supply-chain-management",
    name: "Supply Chain Management",
    categoryCode: "management",
    categoryName: "Management",
    description: "End-to-end logistics, Bullwhip effect mitigation, Economic Order Quantity (EOQ), safety stock formulas, warehouse management systems (WMS), and cold chain logistics.",
    icon: "Truck",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "inventory-demand-planning", name: "Inventory Models & Demand Forecasting", topics: ["Economic Order Quantity (EOQ)", "Safety Stock & Reorder Point (ROP)", "Bullwhip Effect Causes & Cures", "ABC/XYZ Inventory Classification"] },
      { slug: "logistics-network-design", name: "Logistics, Warehousing & Distribution", topics: ["Cross-Docking & Hub-and-Spoke", "Incoterms (FOB, CIF, DDP)", "Total Landed Cost Analysis", "Reverse Logistics & Green SCM"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },

  // --- Category G: Medical, Pharma & Biology (7 domains) ---
  {
    id: "dom-66",
    slug: "bioinformatics",
    name: "Bioinformatics",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Computational genomics: Pairwise & multiple sequence alignment (BLAST, Smith-Waterman), phylogenetic trees, PDB structural modeling, and next-gen sequencing (NGS).",
    icon: "Dna",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "sequence-alignment-algorithms", name: "Sequence Alignment & Databases", topics: ["Needleman-Wunsch & Smith-Waterman", "BLAST Heuristics (E-value)", "PAM & BLOSUM Scoring Matrices", "NCBI, UniProt & Ensembl Resources"] },
      { slug: "structural-bioinformatics-ngs", name: "Structural Genomics & NGS Pipelines", topics: ["Protein Secondary Structure Prediction", "PDB File Format & Molecular Docking", "FASTQ Quality Scores & Trimming", "Variant Calling (VCF) Workflows"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-67",
    slug: "biostatistics",
    name: "Biostatistics",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Clinical epidemiology and biological statistics: Survival analysis (Kaplan-Meier, Cox proportional hazards), odds ratios, relative risk, clinical trial sample size, and power analysis.",
    icon: "PieChart",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "epidemiological-statistics", name: "Epidemiological Measures & Hypothesis Testing", topics: ["Odds Ratio (OR) vs Relative Risk (RR)", "Sensitivity, Specificity & ROC Curves", "Chi-Square & Fisher Exact Tests", "Type I and Type II Errors in Trials"] },
      { slug: "survival-analysis-modeling", name: "Survival Analysis & Regression Models", topics: ["Kaplan-Meier Survival Curves & Log-Rank", "Cox Proportional Hazards Model", "Logistic Regression in Epidemiology", "Sample Size Calculation & Statistical Power"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-68",
    slug: "clinical-sas",
    name: "Clinical SAS",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Statistical analysis in clinical trials: CDISC standards (SDTM, ADaM), PROC SQL, SAS Macro programming, adverse event tables, and regulatory FDA submission data packages.",
    icon: "FileCode",
    hasCoding: true,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "sas-programming-macros", name: "SAS Base, PROC SQL & Macro Facility", topics: ["DATA Step Processing & PDV", "PROC SQL Joins & Subqueries", "Macro Variables (%LET) & Macro Programs", "PROC FORMAT & Reporting Procedures"] },
      { slug: "cdisc-clinical-reporting", name: "CDISC SDTM & ADaM Standards", topics: ["SDTM Domains (DM, AE, LB, VS)", "ADaM Datasets (ADSL, ADAE)", "Adverse Event Table Generation", "21 CFR Part 11 Regulatory Compliance"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-69",
    slug: "genetic-engineering",
    name: "Genetic Engineering",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Recombinant DNA technology, restriction endonucleases, plasmid cloning vectors, CRISPR-Cas9 gene editing, cDNA libraries, and transgenic organism design.",
    icon: "Binary",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "recombinant-dna-technology", name: "Cloning Vectors & Molecular Tools", topics: ["Restriction Enzymes & DNA Ligase", "Plasmid Vectors (pBR322, pUC19)", "Bacterial Transformation & Selection (Blue-White)", "PCR Primers & Amplification"] },
      { slug: "gene-editing-transgenics", name: "CRISPR-Cas9 & Gene Therapy", topics: ["Guide RNA Design & PAM Sequences", "Non-Homologous End Joining vs HDR", "Viral Vectors for Gene Therapy (AAV)", "Knockout Mice Generation"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-70",
    slug: "microbiology",
    name: "Microbiology",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Bacterial physiology, Gram staining mechanisms, viral replication cycles, antimicrobial resistance mechanisms (beta-lactamases), culture media, and sterilization protocols.",
    icon: "Microscope",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "bacterial-morphology-staining", name: "Bacterial Structure & Identification", topics: ["Gram Positive vs Negative Cell Wall", "Endospore Formation & Resistance", "Selective & Differential Culture Media", "Autoclaving & Sterilization Validation"] },
      { slug: "antimicrobial-mechanisms", name: "Antimicrobial Agents & Virology", topics: ["Mechanisms of Antibiotic Action (Cell Wall, Ribosome)", "Bacterial Resistance (Efflux Pumps, Enzymes)", "Viral Replication & Lytic/Lysogenic Cycles", "Kirby-Bauer Disk Diffusion Testing"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-71",
    slug: "molecular-biology",
    name: "Molecular Biology",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Central dogma mechanisms: DNA replication fork enzymology, RNA transcription, post-transcriptional modifications, protein translation, Western blotting, and qPCR.",
    icon: "Dna",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "dna-replication-transcription", name: "DNA Replication & RNA Processing", topics: ["DNA Polymerase Proofreading & Okazaki Fragments", "RNA Polymerase Promoters & Transcription", "mRNA Splicing (Spliceosome, Exons/Introns)", "5' Capping & Polyadenylation"] },
      { slug: "translation-molecular-assays", name: "Translation & Analytical Techniques", topics: ["Ribosome tRNA Codon-Anticodon Pairing", "Post-Translational Modifications", "Western Blotting Protocol & Controls", "Real-Time Quantitative PCR (qPCR)"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  },
  {
    id: "dom-72",
    slug: "nano-science-technology",
    name: "NANO SCIENCE & TECHNOLOGY",
    categoryCode: "med_pharma_bio",
    categoryName: "Medical & Biology",
    description: "Nanomaterials synthesis (sol-gel, CVD), quantum confinement effects, carbon nanotubes, characterization techniques (SEM, TEM, AFM, XRD), and targeted nanomedicine.",
    icon: "Atom",
    hasCoding: false,
    hasSimulationOrPractical: true,
    subjects: [
      { slug: "nanomaterial-physics-synthesis", name: "Quantum Confinement & Synthesis Methods", topics: ["Surface-to-Volume Ratio & Quantum Dots", "Top-Down vs Bottom-Up Synthesis", "Chemical Vapor Deposition (CVD)", "Carbon Nanotubes & Graphene Properties"] },
      { slug: "characterization-nanomedicine", name: "Nano-Characterization & Applications", topics: ["Scanning Electron Microscopy (SEM)", "Transmission Electron Microscopy (TEM)", "Atomic Force Microscopy (AFM)", "Liposomal Nanocarriers for Drug Delivery"] }
    ],
    questionCount: 50,
    approvedCount: 50,
    difficultyDistribution: { basic: 10, intermediate: 15, advanced: 15, professional: 10 }
  }
];

export function getDomainBySlug(slug: string): Domain | undefined {
  return DOMAINS.find(d => d.slug.toLowerCase() === slug.toLowerCase());
}

export function getDomainsByCategory(categoryCode: string): Domain[] {
  return DOMAINS.filter(d => d.categoryCode === categoryCode);
}
