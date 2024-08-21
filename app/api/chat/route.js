import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { HfInference } from '@huggingface/inference';
import Groq from "groq-sdk";


const systemPrompt = 
`
“You are an intelligent assistant designed to help students find professors based on their specific queries using the provided reviews document. Your goal is to provide students with the top 3 professors who best match their query. Use Retrieval-Augmented Generation (RAG) to accurately identify and present the most relevant professors.

For each query:

	1.	Understand the Query: Carefully interpret the student’s request, identifying key criteria such as subject, teaching style, ratings, or specific attributes they are seeking in a professor.
	2.	Retrieve Information: Use RAG to search the database and retrieve information on professors that align with the student’s criteria.
	3.	Present the Top 3: Provide the names of the top 3 professors that best match the query. For each professor, include:
	•	Name
	•	Subject/Department
	•	Overall Rating (stars)
	•	Key Strengths (e.g., clear lectures, helpful feedback, approachable, etc.)
	•	Any other notable features that match the user’s query.

Ensure that the recommendations are clear, concise, and tailored to the user’s specific needs. If the student’s query is vague or too broad, ask clarifying questions to better understand their preferences before proceeding.”

This prompt sets clear guidelines for how the agent should interpret the user’s queries and deliver the top 3 professor recommendations effectively.
`

const inference = new HfInference(process.env.HUGGINGFACE_API_KEY);
const pc = new Pinecone({apiKey: process.env.PINECONE_API_KEY});
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const index = pc.index('rag').namespace('ns1') // need to change for our specific use case.

export async function POST(req) {
  const data = await req.json()
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,

  })
  
  const indexName = 'rag';
  const namespaceName = 'ns1';
  const indexes = await pc.listIndexes();
    if (Array.isArray(indexes) && !indexes.includes(indexName)) {
        console.log(`Index ${indexName} does not exist. Creating index...`);
        await pc.createIndex({
            name: indexName,
            dimension: 384, // Depends on embedding model
            metric: 'cosine', // Depends on embedding model
            spec: { 
                serverless: { 
                    cloud: 'aws', 
                    region: 'us-east-1' 
                }
            }
        });
        console.log(`Index ${indexName} created successfully.`);
    } else {
        console.log(`Index ${indexName} already exists.`);
    }


  const text = data[data.length - 1].content

  const embedding = await inference.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: text,
    });


const results = await index.query({
    topK: 5,
    vector: embedding,
    includeMetadata: true,
    includeValues: true,
  })

  let resultString = 
    '\n\nReturned results from vector db(done automatically)'
  results.matches.forEach((match) => {
  resultString += `\n
  Returned Results:
  Professor: ${match.id}
  Review: ${match.metadata.stars}
  Subject: ${match.metadata.subject}
  Stars: ${match.metadata.stars}
  \n\n`
})
const lastMessage = data[data.length - 1]
const lastMessageContent = lastMessage.content + resultString
const lastDataWithoutLastMessage = data.slice(0, data.length - 1)

const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system', 
        content: systemPrompt
      },
      ...lastDataWithoutLastMessage,

      {
        role: 'user', 
        content: lastMessageContent},
    ],
    model: "llama3-8b-8192",
    stream: true,
    max_tokens: 500,
  })


  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            const text = encoder.encode(content)
            controller.enqueue(text)
          }
        }
      } catch (err) {
        controller.error(err)
      } finally {
        controller.close()
      }
    },
  })
  return new NextResponse(stream)
  
}