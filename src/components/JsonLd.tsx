"use client";

export function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clearcontract.app";

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${baseUrl}/#webapp`,
        name: "ClearContract",
        description:
          "AI-powered contract analysis tool that identifies red flags, hidden fees, and problematic clauses in legal documents.",
        url: baseUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        featureList: [
          "PDF contract upload",
          "AI-powered analysis",
          "Red flag detection",
          "Multi-language support (English, Indonesian)",
          "Export to PDF/JSON",
          "Dark mode",
        ],
        screenshot: `${baseUrl}/og-image.png`,
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.8",
          ratingCount: "150",
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: "ClearContract",
        url: baseUrl,
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/android-chrome-512x512.png`,
        },
        sameAs: [],
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: "ClearContract",
        description: "AI-Powered Contract Analysis",
        publisher: {
          "@id": `${baseUrl}/#organization`,
        },
        inLanguage: ["en", "id"],
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What is ClearContract?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "ClearContract is an AI-powered tool that analyzes legal contracts to identify red flags, hidden fees, and problematic clauses, explaining them in simple language.",
            },
          },
          {
            "@type": "Question",
            name: "Is ClearContract free to use?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, ClearContract is free to use. Simply upload your contract or paste the text to get instant AI analysis.",
            },
          },
          {
            "@type": "Question",
            name: "What languages does ClearContract support?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "ClearContract currently supports English and Indonesian (Bahasa Indonesia) for both the interface and AI analysis results.",
            },
          },
          {
            "@type": "Question",
            name: "Is my contract data secure?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Your contracts are processed securely and are not stored on our servers. Analysis is performed in real-time and data is discarded after processing.",
            },
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
