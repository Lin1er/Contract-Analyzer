<div align="center">

# ClearContract

**AI-Powered Contract Analysis for Everyone**

Analyze legal contracts instantly. Identify red flags. Understand risks in plain language.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Demo](#demo) • [Features](#features) • [Getting Started](#getting-started) • [Deployment](#deployment) • [Tech Stack](#tech-stack)

</div>

---

## Overview

ClearContract is a modern legal-tech web application that helps users understand their contracts without needing a law degree. Simply upload a PDF or paste contract text, and our AI will analyze it to identify potential red flags, risky clauses, and important terms—all explained in simple, easy-to-understand language.

Perfect for:
- **Freelancers** reviewing client contracts
- **Small business owners** evaluating vendor agreements
- **Individuals** understanding lease or employment contracts
- **Anyone** who wants to know what they're signing

## Features

### Core Functionality
- **PDF Upload** — Drag & drop or click to upload PDF contracts
- **Text Paste** — Paste contract text directly for quick analysis
- **AI Analysis** — Powered by Google Gemini for intelligent red flag detection
- **Severity Levels** — Issues categorized as High, Medium, or Low risk
- **Plain Language** — Complex legal terms explained simply

### User Experience
- **Bilingual Support** — Full English and Indonesian (Bahasa) translations
- **Dark Mode** — Eye-friendly dark theme with system preference detection
- **Analysis History** — Access previous analyses with local storage persistence
- **Export Options** — Download results as JSON or print/save as PDF
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile

### Technical Features
- **Rate Limiting** — API protection against abuse (10 requests/minute)
- **Error Handling** — Robust retry logic with exponential backoff
- **PWA Ready** — Installable as a Progressive Web App
- **SEO Optimized** — Meta tags and structured data included

## Demo

<div align="center">

| Light Mode | Dark Mode |
|:----------:|:---------:|
| ![Light Mode](https://via.placeholder.com/400x300/f8fafc/1e293b?text=Light+Mode) | ![Dark Mode](https://via.placeholder.com/400x300/0f172a/f8fafc?text=Dark+Mode) |

</div>

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lin1er/Contract-Analyzer.git
   cd Contract-Analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

### Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lin1er/Contract-Analyzer&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20Key%20for%20AI%20analysis&envLink=https://makersuite.google.com/app/apikey)

1. Click the button above or import directly from GitHub
2. Add your `GEMINI_API_KEY` environment variable
3. Deploy!

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI analysis |

## Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** — React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** — Type-safe JavaScript
- **[Tailwind CSS 4](https://tailwindcss.com/)** — Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** — Beautiful, accessible components
- **[Lucide React](https://lucide.dev/)** — Modern icon library

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** — Serverless API endpoints
- **[pdf-parse](https://www.npmjs.com/package/pdf-parse)** — PDF text extraction
- **[Google Gemini](https://ai.google.dev/)** — AI-powered analysis

### Infrastructure
- **[Vercel](https://vercel.com/)** — Deployment platform
- **Rate Limiting** — In-memory request throttling

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/      # AI analysis endpoint
│   │   └── extract/      # PDF extraction endpoint
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main application
├── components/
│   ├── contract/         # Contract-specific components
│   │   ├── FileUploadZone.tsx
│   │   ├── LoadingState.tsx
│   │   └── ResultsDashboard.tsx
│   ├── ui/               # shadcn/ui components
│   ├── HistoryPanel.tsx
│   ├── LanguageSwitcher.tsx
│   ├── Providers.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── i18n/             # Internationalization
│   ├── analytics.ts      # Event tracking
│   ├── errors.ts         # Error handling utilities
│   ├── export.ts         # Export functions
│   ├── history.ts        # History management
│   ├── rateLimit.ts      # Rate limiting
│   └── theme.tsx         # Theme provider
└── types/
    └── index.ts          # TypeScript interfaces
```

## API Reference

### POST `/api/extract`

Extract text from a PDF file.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (PDF file, max 10MB)

**Response:**
```json
{
  "text": "Extracted contract text...",
  "pageCount": 5,
  "wordCount": 1250
}
```

### POST `/api/analyze`

Analyze contract text for red flags.

**Request:**
```json
{
  "text": "Contract text to analyze...",
  "language": "en"
}
```

**Response:**
```json
{
  "summary": "Brief contract overview",
  "redFlags": [
    {
      "id": "rf-1",
      "title": "Unlimited Liability Clause",
      "severity": "high",
      "clause": "Original clause text...",
      "explanation": "Plain language explanation...",
      "recommendation": "Suggested action..."
    }
  ],
  "overallRisk": "medium",
  "recommendations": ["General recommendations..."]
}
```

## Internationalization

ClearContract supports multiple languages:

| Language | Code | Status |
|----------|------|--------|
| English | `en` | ✅ Complete |
| Indonesian | `id` | ✅ Complete |

The app automatically detects browser language preference and allows manual switching via the language selector.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for hosting and deployment

---

<div align="center">

**Built with passion for making legal documents accessible to everyone.**

[Report Bug](https://github.com/Lin1er/Contract-Analyzer/issues) • [Request Feature](https://github.com/Lin1er/Contract-Analyzer/issues)

</div>
