import type { NewRepairRequestInput, RepairEstimate } from '../types/repair';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

const schema = {
  name: 'repair_estimate',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['estimateSummary', 'estimatedCost', 'estimatedHours', 'recommendedSteps', 'materialsList'],
    properties: {
      estimateSummary: {
        type: 'string',
        description: 'One sentence overview of the issue and suggested approach.',
      },
      estimatedCost: {
        type: 'string',
        description:
          'Friendly range for labor + parts, include currency symbol. Example: "$40-$60 for parts & 1 hr of labor".',
      },
      estimatedHours: {
        type: 'string',
        description: 'Rough time commitment, e.g. "45 minutes" or "2 visits (3 hrs total)".',
      },
      recommendedSteps: {
        type: 'array',
        description: '3-5 actionable steps for a community fixer.',
        minItems: 3,
        maxItems: 6,
        items: { type: 'string' },
      },
      materialsList: {
        type: 'array',
        description: 'Notable tools or replacement parts a fixer should bring.',
        minItems: 1,
        maxItems: 8,
        items: { type: 'string' },
      },
    },
  },
  strict: true,
};

const buildPrompt = (input: NewRepairRequestInput) => {
  const lines = [
    `Item needing help: ${input.itemName}`,
    `Issue details: ${input.issueDescription}`,
    `Urgency: ${input.urgency}`,
    `Location context: ${input.location}`,
  ];

  if (input.additionalDetails) {
    lines.push(`Owner notes: ${input.additionalDetails}`);
  }

  if (input.referencePhotoUrl) {
    lines.push(`Reference photo URL: ${input.referencePhotoUrl}`);
  }

  return lines.join('\n');
};

export const generateRepairEstimate = async (
  input: NewRepairRequestInput,
): Promise<RepairEstimate> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('Missing OpenAI key. Set VITE_OPENAI_API_KEY before requesting an estimate.');
  }

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a community repair estimator helping neighbors understand effort, cost, and steps before a volunteer arrives.',
        },
        {
          role: 'user',
          content: buildPrompt(input),
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: schema,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenAI response did not include estimate content.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('Unable to parse estimate. Check your OpenAI credentials and try again.');
  }

  const estimate = parsed as Partial<RepairEstimate>;

  if (
    !estimate.estimateSummary ||
    !estimate.estimatedCost ||
    !estimate.estimatedHours ||
    !estimate.recommendedSteps ||
    !estimate.materialsList
  ) {
    throw new Error('Estimate was missing required fields.');
  }

  return {
    estimateSummary: estimate.estimateSummary,
    estimatedCost: estimate.estimatedCost,
    estimatedHours: estimate.estimatedHours,
    recommendedSteps: estimate.recommendedSteps,
    materialsList: estimate.materialsList,
  };
};
