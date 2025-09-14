import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

/**
 * This is a simplified function for testing purposes.
 * It attempts to retrieve the entire database object.
 */
export async function getTemplate(id: number): Promise<any | null> {
  console.log('Attempting to retrieve Notion database object...');
  try {
    const response = await notion.databases.retrieve({ database_id: DATABASE_ID });

    console.log('\n--- SUCCESS! --- ');
    console.log('Successfully retrieved database object from Notion. The structure is below:');
    console.log(JSON.stringify(response, null, 2));

    return response;

  } catch (error) {
    console.error('\n--- ERROR during Notion API call (using .retrieve) ---');
    console.error(error);
    return null;
  }
}
