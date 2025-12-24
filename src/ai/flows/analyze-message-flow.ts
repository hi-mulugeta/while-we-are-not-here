
'use server';
/**
 * @fileOverview A flow to analyze the tone and style of a message.
 *
 * - analyzeMessage - A function that takes a message and returns an analysis.
 * - AnalyzeMessageInput - The input type for the analyzeMessage function.
 * - AnalyzeMessageOutput - The return type for the analyzeMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMessageInputSchema = z.object({
  message: z.string().describe('The message content to analyze.'),
  language: z.string().optional().describe('The language for the analysis, e.g., "en" or "am".'),
});
export type AnalyzeMessageInput = z.infer<typeof AnalyzeMessageInputSchema>;

const AnalyzeMessageOutputSchema = z.object({
  tone: z
    .string()
    .describe(
      'The overall tone of the message (e.g., Formal, Casual, Urgent, Friendly).'
    ),
  clarityScore: z
    .number()
    .min(1)
    .max(10)
    .describe(
      'A score from 1 to 10 indicating the clarity and conciseness of the message.'
    ),
  suggestions: z
    .array(z.string())
    .describe(
      'Actionable suggestions to improve the message effectiveness and clarity.'
    ),
});
export type AnalyzeMessageOutput = z.infer<typeof AnalyzeMessageOutputSchema>;

const analyzeMessageFlow = ai.defineFlow(
  {
    name: 'analyzeMessageFlow',
    inputSchema: AnalyzeMessageInputSchema,
    outputSchema: AnalyzeMessageOutputSchema,
  },
  async (input) => {
    const prompt = ai.definePrompt({
      name: 'analyzeMessagePrompt',
      input: { schema: AnalyzeMessageInputSchema },
      output: { schema: AnalyzeMessageOutputSchema },
      prompt: `You are an expert communication assistant. Your task is to analyze the following message for its tone, clarity, and effectiveness.
        
        Provide the analysis in the following language: {{#if (eq language "am")}}Amharic{{else}}English{{/if}}.

        Message to Analyze:
        "{{{message}}}"
        
        Provide the following analysis:
        1.  **Tone**: Identify the primary tone of the message. Examples: Formal, Casual, Urgent, Anxious, Friendly, Neutral.
        2.  **Clarity Score**: Rate the message on a scale of 1 to 10, where 1 is "very confusing" and 10 is "perfectly clear and concise."
        3.  **Suggestions**: Offer a few brief, actionable suggestions for how to improve the message. If the message is already excellent, you can provide fewer suggestions or simply state that it's well-written. Focus on clarity, impact, and professionalism.
        
        Return the analysis in the specified JSON format, with all text translated to the requested language.`,
    });

    const { output } = await prompt(input);
    return output!;
  }
);

export async function analyzeMessage(
  input: AnalyzeMessageInput
): Promise<AnalyzeMessageOutput> {
  return analyzeMessageFlow(input);
}
