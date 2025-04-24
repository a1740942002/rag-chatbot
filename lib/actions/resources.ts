'use server'

import {
  NewResourceParams,
  insertResourceSchema,
  resources
} from '@/lib/db/schema/resources'
import { db } from '../db'
import { generateEmbeddings } from '../ai/embedding'
import { memoriesTable } from '../db/schema/memories'

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content } = insertResourceSchema.parse(input)
    console.log('content', content)

    const [resource] = await db
      .insert(resources)
      .values({ content })
      .returning()

    const embeddings = await generateEmbeddings(content)
    await db.insert(memoriesTable).values(
      embeddings.map((embedding) => ({
        resourceId: resource.id,
        ...embedding
      }))
    )

    return 'Resource successfully created and embedded.'
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.'
  }
}
