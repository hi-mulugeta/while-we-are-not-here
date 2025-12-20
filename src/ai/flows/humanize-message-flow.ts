'use server';
/**
 * @fileOverview A flow to humanize a message slip.
 *
 * - humanizeMessage - A function that takes message details and returns a more natural summary.
 * - HumanizeMessageInput - The input type for the humanizeMessage function.
 * - HumanizeMessageOutput - The return type for the humanizeMessage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HumanizeMessageInputSchema = z.object({
    senderName: z.string().describe("The name of the person who left the message."),
    recipient: z.string().describe("The name of the person the message is for."),
    message: z.string().describe("The raw message content."),
});
export type HumanizeMessageInput = z.infer<typeof HumanizeMessageInputSchema>;

const HumanizeMessageOutputSchema = z.object({
  humanizedMessage: z.string().describe("The rewritten, humanized version of the message."),
});
export type HumanizeMessageOutput = z.infer<typeof HumanizeMessageOutputSchema>;


const humanizeMessageFlow = ai.defineFlow(
  {
    name: 'humanizeMessageFlow',
    inputSchema: HumanizeMessageInputSchema,
    outputSchema: HumanizeMessageOutputSchema,
  },
  async (input) => {
    
    const prompt = ai.definePrompt({
        name: 'humanizeMessagePrompt',
        input: { schema: HumanizeMessageInputSchema },
        output: { schema: HumanizeMessageOutputSchema },
        prompt: `You are a helpful office assistant. Your task is to rewrite a short, formal message into a more natural, human-friendly summary.
        The message is for {{{recipient}}} from {{{senderName}}}.

        Original Message:
        "{{{message}}}"

        Rewrite this message as a brief, friendly summary as if you were telling {{{recipient}}} about it in person.
        Start with a phrase like "Just a heads up..." or "Quick note...".
        Keep it concise and clear.
        Do not add any information that is not in the original message.

        Example:
        Original: "Please call Mr. Smith at 555-1234 regarding the quarterly report. It is urgent."
        Summary: "Quick note - Mr. Smith called about the quarterly report. He said it's urgent and would like you to call him back at 555-1234."
        `,
    });

    const { output } = await prompt(input);
    return output!;
  }
);

export async function humanizeMessage(input: HumanizeMessageInput): Promise<HumanizeMessageOutput> {
  return humanizeMessageFlow(input);
}
