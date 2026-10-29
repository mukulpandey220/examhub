# Nyeras Nxtmove — Production Infrastructure Budget (< ₹10,000 / month)

**Target Operational Region:** India (AWS Mumbai `ap-south-1` / Cloudflare India POPs)  
**Target Concurrency Capacity:** 5,000–10,000 concurrent participants  
**Examination Windows:** 60–75 minutes per cohort  
**Institutional Cost Model:** ₹0 to college / ₹99 all-inclusive per student fee  

---

## 1. Itemized Monthly Cost Table (INR)

| Category | Component / Provider | Specifications / Tier | Monthly Cost (INR) | Pricing Confidence |
| :--- | :--- | :--- | :--- | :--- |
| **Edge & CDN** | Cloudflare Pro / Free Tier | Global DNS, DDoS protection, WAF, SSL, static asset caching | **₹0** (Free Tier / ₹1,650 Pro option) | Confirmed Public Rate |
| **API Compute** | Hetzner Cloud / DigitalOcean / AWS EC2 | 2x CPX31 (4 vCPU, 8 GB RAM, NVMe) or 1x t4g.xlarge (4 vCPU, 16 GB ARM) | **₹2,850** | Confirmed Provider Rate |
| **Database** | MongoDB Atlas Dedicated / Serverless | M10 Dedicated Tier (2 vCPU, 2 GB RAM, 10 GB Storage) with bounded connection pool (50 conn) | **₹4,400** | Confirmed Atlas Pricing |
| **Cache & Realtime** | Upstash Redis (Serverless) / Self-hosted Redis on Compute | Upstash Pay-As-You-Go ($0.20 per 100k commands) or in-memory Redis instance | **₹650** | Measured Usage Estimate |
| **Object Storage** | Cloudflare R2 | 10 GB storage for project attachments & PDF report artifacts (zero egress fee) | **₹120** | Confirmed R2 Pricing |
| **Transactional Email** | Resend / Amazon SES | 25,000 transactional notification emails per month ($0.10 / 1,000 emails) | **₹210** | Confirmed SES Rate |
| **Payment Gateway** | Razorpay Standard | 2% per successful transaction (deducted directly from ₹99 gross receipts, no monthly fixed charge) | **₹0 fixed** | Confirmed Merchant Contract |
| **Monitoring & Logs** | BetterStack / Grafana Cloud Free | Uptime heartbeat monitoring, error alerting, log ingestion (up to 50 GB) | **₹0** (Free Tier) | Confirmed Free Tier |
| **Reserve Contingency** | Buffer for traffic surges & currency exchange | 10% reserve contingency | **₹1,000** | Financial Reserve |
| **TOTAL** | **Consolidated Monthly Operating Overhead** | | **₹9,230 / month** | **Strictly under ₹10,000/mo cap** |

---

## 2. Technical Justification & Scaling Strategy

1. **Zero Egress Advantage via Cloudflare R2 & CDN**:
   - Examination assets (questions, images, stylesheets, scripts) are aggressively cached on edge nodes across Indian metros (Mumbai, Delhi, Bengaluru, Chennai, Hyderabad).
   - Candidate browsers download static bundles from Cloudflare edge caches, shielding the origin API server from bandwidth spikes during the 5,000-user login rush.
2. **Stateless API Scale-Out**:
   - The Node.js Next.js API instances operate statelessly. Under 10,000 concurrent participants, memory consumption remains under 350 MB per worker process.
   - Bounded connection pooling (`maxPoolSize: 50`) ensures MongoDB Atlas M10 connections never exceed exhaustion limits.
3. **Autosave Debouncing & Asynchronous Writing**:
   - Candidates autosave answers every 15–30 seconds rather than on every single keystroke.
   - For 10,000 simultaneous users with 30s debouncing, peak write throughput is ~333 writes/second, well within MongoDB M10's capacity of 1,500+ IOPS.
4. **Failure Modes & Recovery**:
   - **Primary Failure Mode**: Temporary loss of internet connection on student devices during an examination.
   - **Mitigation**: The examination client preserves an idempotent local recovery journal in browser memory. Upon network restoration, answers synchronize without data loss or score corruption.
   - **Upgrade Path**: If concurrent participants exceed 25,000 simultaneously, scaling the MongoDB Atlas cluster from M10 to M20 (₹9,800/mo) and adding a second compute node provides instantaneous horizontal capacity.
