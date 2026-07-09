import fs from 'fs';

const path = 'src/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf-8');

const oldBlock = `      const { data: questions, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .order('unit_number', { ascending: true })
        .range(0, 9999)
        .range(0, 9999)
      
      if (error) throw error

      setSubjectContent({ topics, mindmaps, questions: questions || [] })`;

const newBlock = `      // Old questions live in Supabase, new ones go to Neon - merge both for the admin view
      let questions: any[] = []
      try {
        const res = await fetch('/api/questions?subject_id=' + subjectId)
        const json = await res.json()
        if (json.data) questions = json.data
      } catch (e) {
        console.warn('Combined question fetch failed, falling back to Supabase only:', e)
        const { data: sbData, error } = await supabase
          .from('questions')
          .select('*')
          .eq('subject_id', subjectId)
          .order('unit_number', { ascending: true })
          .range(0, 9999)
        if (error) throw error
        questions = sbData || []
      }

      setSubjectContent({ topics, mindmaps, questions: questions || [] })`;

if (!content.includes(oldBlock)) {
  console.log("ERROR: Could not find the exact block to replace. No changes made.");
  process.exit(1);
} else {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(path, content, 'utf-8');
  console.log("SUCCESS: fetchSubjectDetails now merges Supabase (old) + Neon (new) questions.");
}
