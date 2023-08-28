import {readFile, writeFile} from 'fs/promises';
import openai from 'openai'; // Assuming these are the correct imports


const cacheFilename = 'responseCache.json';
let cache: Record<string, any> = {};
let cacheLoaded = false;

export async function getChatGPTResponse<T>(
    prompt: string,
    messages: openai.Chat.ChatCompletionMessage[],
    functions: openai.Chat.CompletionCreateParams.Function[],
    callbacks: ((params: any) => any)[]
): Promise<T> {
    if (!cacheLoaded) {
        try {
            cache = JSON.parse(await readFile(cacheFilename, 'utf-8'));
        } catch(e) {
            console.error(`Couldn't read cache`);
            cache = {};
        }
    }
    cacheLoaded = true;
    const cacheKey = `responseCache.${prompt + JSON.stringify(functions) + JSON.stringify(messages)}`;
    const cachedResponse = cache[cacheKey] as T;

    if (cachedResponse) {
        return cachedResponse;
    }

    let response = '';

    const sendUserMessage = async (input: string) => {
        const requestMessage: openai.Chat.CreateChatCompletionRequestMessage = {
            role: 'user',
            content: input,
        };
        const GPTAPIKey = process.env.OPENAI_API_KEY;
        if (!GPTAPIKey){
            console.error("'OPENAI_API_KEY' not found within process.env.");
            return;
        }
        const config = new  openai.OpenAI({
            apiKey: GPTAPIKey,
        });

        try {
            const GPTModel = process.env.GPT_MODEL || "gpt-4-0613";
            const completion = await config.chat.completions.create({
                model: GPTModel,
                messages: messages.concat(requestMessage),
                functions: functions.length ? functions : undefined,
                function_call: functions.length ? 'auto' : undefined
            });

            const responseMessage = completion.choices[0].message;
            let responseContent = responseMessage?.content;
            if (responseMessage?.function_call) {
                const function_name = responseMessage?.function_call?.name;
                const foundFunction = callbacks.find(callback => callback.name === function_name);
                if (!foundFunction) {
                    throw new Error(`what the fuck ChatGPT function ${function_name} not found`);
                }
                responseContent = foundFunction(
                    JSON.parse(responseMessage?.function_call?.arguments || "{}")
                );
                console.log(responseContent)
            }


            if (responseMessage && responseContent) {
                response = responseContent,
                    messages.push({
                        role: responseMessage.role,
                        function_call: responseMessage.function_call,
                        content: responseMessage.content
                    });
            }
        } catch (error) {
            throw error;
        }
    };

    await sendUserMessage(prompt);

    cache[cacheKey] = response;
    // Cache the response
    await writeFile(cacheFilename, JSON.stringify(cache));

    return response as unknown as T;
}

/**
 * This function is used to ask the language model a question and get a response.
 * It takes in a prompt, a return function shape, and a return function.
 * The prompt is the question you want to ask the language model.
 * The return function shape describes the shape of the function that will be used to process the response from the language model.
 * The return function is the actual function that will be used to process the response from the language model.
 * 
 * Example usage:
 * 
 * const verificationResult = await askLanguageModelShape<{ correct: boolean, reason: string }>(
 *     `
 *     The following is a criteria for completion of a request: "${verificationPrompt}".
 *     Does the following response to the request fulfill the criteria?
 *     ${result}
 *     `,
 *     {
 *         "name": "evaluateCorrectness",
 *         "description": "Evaluate the correctness of an operation and provide a reason",
 *         "parameters": {
 *             "type": "object",
 *             "properties": {
 *                 "correct": {
 *                     "type": "boolean",
 *                     "description": "Indicates whether the operation is correct"
 *                 },
 *                 "reason": {
 *                     "type": "string",
 *                     "description": "Explains why the operation is correct or incorrect"
 *                 }
 *             },
 *             "required": ["correct", "reason"]
 *         }
 *     },
 *     evaluateCorrectness
 * );
 */
const askLanguageModelShape = <T>(
    prompt: string,
    returnFunctionShape: openai.Chat.CompletionCreateParams.Function,
    returnFunction: (v: any) => T
): Promise<T> => {
    return getChatGPTResponse<T>(
        prompt,
        [],
        [returnFunctionShape],
        [returnFunction]
    );
}

/**
 * This function generates sub-topics related to a given subject and evaluates them.
 * The function uses askLanguageModelShape to generate an elaboration on the subject and then generate 10 sub-topics linked to the generated text.
 * These sub-topics are evaluated by first using askLanguageModelShape to check if any of the sub-topics are already present in the other nodes,
 * and then also by asking the language model if elaborating on them could possibly get us closer to the goal.
 * For each sub-topic that passes, this function is called recursively.
 * @param maxElaborationWords The maximum number of words the language model can use to generate the elaboration.
 */
const generateAndEvaluateSubTopics = async (
    context: string,
    goal: string,
    subject: string,
    otherNodes: string[],
    depth: number,
    maxDepth: number = 10,
    maxElaborationWords: number
): Promise<string[]> => {
    if (depth >= maxDepth) {
        return otherNodes;
    }

    const elaboration = await askLanguageModelShape<string>(
        `Elaborate on the subject: ${subject} with a maximum of ${maxElaborationWords} words`,
        { "name": "elaborate", "description": "Elaborate on a subject", "parameters": { "type": "string" } },
        (v: any) => v
    );
    console.log(`Language model response (elaboration): ${elaboration}`);

    // Push the elaboration into otherNodes
    otherNodes.push(elaboration);

    const subTopics = await askLanguageModelShape<string[]>(
        `Generate 10 sub-topics linked to the text: ${elaboration}`,
        { "name": "generateSubTopics", "description": "Generate sub-topics linked to a text", "parameters": { "type": "string" } },
        (v: any) => v
    );
    console.log(`Language model response (subTopics): ${subTopics}`);

    for (const subTopic of subTopics) {
        if (otherNodes.includes(subTopic)) continue;

        const couldGetCloserToGoal = await askLanguageModelShape<boolean>(
            `Could elaborating on the sub-topic: ${subTopic} get us closer to the goal: ${goal}?`,
            { "name": "evaluateGoalProximity", "description": "Evaluate if elaborating on a sub-topic could get us closer to a goal", "parameters": { "type": "string" } },
            (v: any) => v
        );
        console.log(`Language model response (couldGetCloserToGoal): ${couldGetCloserToGoal}`);

        if (couldGetCloserToGoal) {
            await generateAndEvaluateSubTopics(context, goal, subTopic, otherNodes.concat(subTopics), depth + 1, maxDepth, maxElaborationWords);
        }
    }
    return otherNodes;
}

generateAndEvaluateSubTopics(
    "Things to bring up at university parties about paid egg donation", // context
    "", // goal
    "paid egg donation", // subject
    [], // otherNodes
    0, // depth
    10, // maxDepth
    100 // maxElaborationWords
).then(n => console.log(n))