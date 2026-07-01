import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function fetchQuestions(subjectId: string) {
  const rows = await sql`
    SELECT * FROM questions 
    WHERE subject_id = ${subjectId}
    ORDER BY unit_number ASC, created_at ASC
  `
  return rows
}

export async function insertQuestions(questions: any[]) {
  for (const q of questions) {
    await sql`
      INSERT INTO questions (subject_id, unit_title, unit_number, topic_title, question_text, option1, option2, option3, option4, correct_answer_index, explanation)
      VALUES (${q.subject_id}, ${q.unit_title}, ${q.unit_number}, ${q.topic_title}, ${q.question_text}, ${q.option1}, ${q.option2}, ${q.option3}, ${q.option4}, ${q.correct_answer_index}, ${q.explanation})
    `
  }
}

export { sql }
