# Lifetrek Marketing Funnel & AI Content Architecture

This document outlines the complete marketing funnel for Lifetrek Medical, leveraging the AI Agents for content creation and lead capture.

## 1. Funnel Overview

The goal is to drive traffic from social media to the website's resource hub, and then convert that traffic into qualified leads via AI-driven interactions.

```mermaid
graph TD
    %% Top of Funnel: Awareness
    subgraph TOF [Top of Funnel: Awareness]
        LI[LinkedIn]
        IG[Instagram]
        WA_Out[WhatsApp Outreach]
    end

    %% Middle of Funnel: Consideration
    subgraph MOF [Middle of Funnel: Consideration]
        WEB[Lifetrek Website]
        RES[Resource Hub]
        BLOG[Blog Posts]
        LM[Lead Magnets]
    end

    %% Bottom of Funnel: Conversion
    subgraph BOF [Bottom of Funnel: Conversion]
        AI_AGENT[AI Sales Agent (Chatbot)]
        WA_IN[WhatsApp Direct]
        EMAIL[Email Nurturing]
        MEETING[Meeting (Rafael/Vanessa)]
    end

    %% Flows
    LI -->|Carousels & Posts| WEB
    IG -->|Visuals & Reels| WEB
    LI -->|Direct Message| WA_IN
    
    WEB -->|Browse| RES
    WEB -->|Read| BLOG
    
    RES -->|Download| LM
    LM -->|Capture Contact| EMAIL
    
    WEB -->|Ask Question| AI_AGENT
    AI_AGENT -->|Qualify Lead| MEETING
    AI_AGENT -->|Answer Query| RES
    
    EMAIL -->|Nurture| MEETING
    WA_IN -->|Sales Conversation| MEETING
```

## 2. Channel Strategy

### A. LinkedIn (Primary B2B)
*   **Asset Type**: Educational Carousels, Technical Articles, Case Studies.
*   **Visual Identity**: Professional, "Glassmorphism" slides, CNC/Medical imagery.
*   **AI Role**:
    *   Generate Carousel Slides (Text + Image).
    *   Auto-reply to comments (e.g., "Comment 'TITANIUM' for the whitepaper").
    *   Fetch Inbox messages to Unified Inbox.

### B. Instagram (Visual Awareness)
*   **Asset Type**: Visual Carousels (4:5 Ratio), Behind-the-Scenes (Stories/Reels).
*   **Visual Identity**: High-fidelity photography of cleanrooms, precision parts, "lifestyle" of manufacturing.
*   **AI Role**:
    *   Generate Visual Posts.
    *   Auto-generate captions with hashtags.
    *   Analyze visual trends.

### C. Website (The Hub)
*   **Destination**: All posts should drive traffic here.
*   **Key Pages**:
    *   `/resources`: Central hub for whitepapers, ISO docs, guides.
    *   `/blog`: SEO-optimized columns about medical manufacturing.
    *   `/chat`: Direct line to the AI Agent.
*   **Lead Capture**:
    *   **Gated Content**: Users exchange email for high-value PDFs.
    *   **AI Chat**: "Concierge" experience that guides users to the right solution.

## 3. Automation & AI Integration

| Step | AI Agent Action | Tool / Table |
| :--- | :--- | :--- |
| **1. Creation** | Generates Carousel/Post based on Topic | `linkedin_carousels`, `instagram_posts` |
| **2. Brand Check** | Validates against Brand Guidelines (Colors, Tone) | `content_approval` |
| **3. Publishing** | Schedules and Publishes to Platforms | (Future Integration) |
| **4. Engagement** | Detects intent in comments/DMs | `unified_inbox` |
| **5. Capture** | AI Chatbot qualifies visitor on Website | `leads` |
| **6. Nurture** | Adds lead to Email Sequence | `email_campaigns` |

## 4. Visual Identity Enforcement
To ensure brand consistency across all AI-generated assets:

1.  **Reference Images**: The AI uses `product_catalog` to access verified photos of Lifetrek's facility and products.
2.  **Prompt Engineering**: All prompts strictly enforce:
    *   **Colors**: Primary Blue `#004F8F`, Energy Orange `#F07818`.
    *   **Style**: Editorial, sophisticated, "medical precision".
    *   **Context**: No generic stock photos; specific medical/CNC context only.

## 5. Next Steps for Implementation
1.  **Finish Instagram Integration**: Ensure Instagram posts generate with the correct 4:5 aspect ratio and visual style.
2.  **Connect Posting API**: Automate the actual publishing to LinkedIn/Instagram.
3.  **Enhance Chatbot**: Train the website chatbot on the `product_catalog` to answer technical questions effectively.
