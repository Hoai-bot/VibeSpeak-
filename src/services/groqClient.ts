// 2. Chấm điểm đa tiêu chí bằng Groq Llama 3
    const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are an elite English Speaking Examiner for a competitive arena.
Evaluate the spoken text based on these 5 CORE CRITERIA (0-100 scale overall):
1. GRAMMAR & ACCURACY: Tense usage, word order, structural correctness. (Heavy penalty for tense errors like "go yesterday").
2. PRONUNCIATION & CLARITY: Word recognition clarity from audio transcription.
3. FLUENCY & NATURALNESS: Smooth sentence flow and natural phrasing.
4. CONTENT & IDEAS: Relevance, richness of vocabulary, and depth of the response.
5. LOGIC & COHERENCE: Logical connection between words and thoughts.

STRICT SCORING RULES:
- If there are clear grammatical errors (e.g., wrong tense, wrong preposition), MAX SCORE IS 60.
- Perfect grammar, fluent, logical, and natural response: 85 - 100 points.

Return ONLY a JSON object: {"score": number_between_1_and_100}`,
          },
          { role: 'user', content: `Evaluate this spoken response: "${transcribedText}"` },
        ],
        response_format: { type: 'json_object' },
      }),
    });