# Banned Words, Phrases, and Openers (English)

Mirrored from [jalaalrd/anti-ai-slop-writing](https://github.com/jalaalrd/anti-ai-slop-writing). These tokens are statistically flagged as AI-generated across multiple studies (Carnegie Mellon 2025, Wikipedia "Signs of AI writing", Buffer 52M post analysis). Never use any of these in Lifetrek English-language output. Replace with concrete alternatives or restructure.

## Banned Vocabulary

delve / delves / delving, tapestry, landscape (figurative), testament (e.g. "a testament to"), vibrant, pivotal, crucial, intricate / intricacies, meticulous / meticulously, bolster / bolstered, garner / garnered, underscore / underscores, interplay, multifaceted, nuanced (as filler), foster / fostering, leverage (as verb), utilize (say "use"), commence (say "start"), facilitate, encompass / encompassing, paramount, groundbreaking, cutting-edge, game-changing / game-changer, transformative, revolutionise / revolutionize, seamless / seamlessly, robust (outside engineering), comprehensive (describing own output), endeavour / endeavor, aforementioned, harnessing, spearheading, navigating (figurative), showcasing, highlighting, emphasizing, enhancing, unprecedented, remarkable, stunning, profound, epic (non-literal), in essence, thought leader / thought leadership, synergy / synergies, pain points, value add / value proposition (casual contexts), moving forward, touch base / circle back, rest assured, it goes without saying

Note: "robust" and "comprehensive" are allowed when describing measurable engineering attributes ("robust traceability across 47 process points"). Banned only as filler.

## Banned Phrases

- "In today's [adjective] [noun]..."
- "It's worth noting that..."
- "It's important to note that..."
- "Let's dive in" / "Let's dive deeper" / "Let's delve into"
- "At its core..."
- "In the realm of..."
- "When it comes to..."
- "A testament to..."
- "Not just X, but Y"
- "It's not just about X — it's about Y"
- "This is where X comes in"
- "Whether you're a [X] or a [Y]..."
- "From X to Y" (range opener)
- "At the end of the day..."
- "The bottom line is..."
- "Here's the thing..."
- "Here's the deal..."
- "Without further ado..."
- "In a nutshell..."
- "Buckle up"
- "Take it to the next level"
- "Unlock the power of..."
- "Empower / empowering"
- "Elevate your..."
- "Streamline your..."
- "Supercharge your..."
- "Bridge the gap"
- "Move the needle"
- "In conclusion"
- "Overall," (paragraph starter)
- "Firstly... Secondly... Thirdly..."
- "I hope this helps"
- "I hope this email finds you well"
- "As per my last email"
- "Please don't hesitate to reach out"

## Banned Sentence/Paragraph Openers

- "Certainly,"
- "Absolutely,"
- "Sure,"
- "Great question!"
- "That's a great point!"
- "I'd be happy to..."
- "As an AI..."
- "As a language model..."
- "However, it's important to..."
- "Moreover,"
- "Furthermore,"
- "Additionally,"
- "Interestingly,"
- "Notably,"
- "Importantly,"
- "Indeed,"

## Model-Specific First-Word Tells

Avoid starting responses with these high-probability first tokens:

- ChatGPT: "as", "yes", "sure", "here", "in", "to", "creating", "certainly", "title", "the"
- Claude: "in", "from", "this", "how", "yes", "title", "according", "the", "based", "here"
- Grok: "step", "introduction", "yes", "creating", "to", "title", "in", "certainly"
- Gemini: "my", "creating", "while", "here", "yes", "this", "the"
- DeepSeek: "based", "yes", "step", "comprehensive", "here", "to", "creating", "title", "certainly"

## Era-Specific Vocabulary

For context — these tokens spiked during specific model generations and remain strong AI signals:

- 2023–mid 2024 (GPT-4 era): additionally, boasts, bolstered, crucial, delve, emphasizing, enduring, garner, intricate, interplay, key, landscape, meticulous, pivotal, underscore, tapestry, testament, valuable, vibrant
- Mid 2024–mid 2025 (GPT-4o era): align with, bolstered, crucial, emphasizing, enhance, enduring, fostering, highlighting, pivotal, showcasing, underscore, vibrant
- Mid 2025 onward (GPT-5 era): emphasizing, enhance, highlighting, showcasing
