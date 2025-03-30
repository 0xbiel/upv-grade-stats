import { Grade } from "@/lib/types";

export const parseGrades = (input: string): Grade[] => {
  try {
    // Detect if input is HTML or plain text
    if (input.trim().toLowerCase().startsWith("<!doctype html>") || 
        input.trim().startsWith("<html") || 
        input.trim().startsWith("<table")) {
      // This is HTML, use the existing parsing logic
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, "text/html");
      
      // Find all table rows in the body
      const rows = doc.querySelectorAll("tbody tr");
      
      // Extract student name and grade from each row
      const grades: Grade[] = [];
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          const studentName = cells[0].textContent?.trim() || "";
          // Convert the grade from comma format to dot format for proper parsing
          let gradeText = cells[1].textContent?.trim() || "0";
          gradeText = gradeText.replace(",", ".");
          const grade = parseFloat(gradeText) || 0;
          
          grades.push({ studentName, grade });
        }
      });
      
      return grades;
    } else {
      // This is a plain text list (tab-separated)
      const lines = input.split("\n");
      const grades: Grade[] = [];
      
      // Skip the header row (Nom Nota)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue; // Skip empty lines
        
        // Split by tab character
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const studentName = parts[0].trim();
          // Convert the grade from comma format to dot format for proper parsing
          let gradeText = parts[1].trim() || "0";
          gradeText = gradeText.replace(",", ".");
          const grade = parseFloat(gradeText) || 0;
          
          grades.push({ studentName, grade });
        }
      }
      
      return grades;
    }
  } catch (error) {
    console.error("Error parsing grades:", error);
    return [];
  }
};