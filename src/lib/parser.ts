import { Grade } from "@/lib/types";

// Helper function to normalize and clean student names
const normalizeStudentName = (name: string): string => {
  if (!name || typeof name !== 'string') return '';

  // Trim whitespace and normalize internal spaces
  let cleaned = name.trim().replace(/\s+/g, ' ');

  const parts = cleaned.split(/\s+/);

  if (parts.length >= 3) {
    cleaned = parts.map(part =>
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  } else if (parts.length === 2) {
    cleaned = parts.map(part =>
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  } else if (parts.length === 1) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }

  return cleaned;
};

// Helper function to detect if a line looks like a header row
const isHeaderRow = (line: string): boolean => {
  const trimmed = line.trim().toLowerCase();

  // Common header patterns
  const headerPatterns = [
    /^nom\s+nota/i,      // Catalan/Spanish: "Nom Nota"
    /^name\s+grade/i,    // English
    /^student\s+grade/i, // English
    /^alumno\s+nota/i,   // Spanish: "Alumno Nota"
    /^nombre\s+calificación/i, // Spanish
    /^apellido\s+nota/i, // Spanish
    /^student\s+score/i, // English
    /^name\s+score/i,    // English
  ];

  // Check if line matches header patterns
  if (headerPatterns.some(pattern => pattern.test(trimmed))) {
    return true;
  }

  // Check if first part looks like header text (not a proper name)
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const firstPart = parts[0];
    // Headers often contain non-name words
    const nonNameWords = ['nom', 'name', 'student', 'alumno', 'apellido', 'nota', 'grade', 'score', 'calificación'];
    if (nonNameWords.some(word => firstPart.includes(word))) {
      return true;
    }
  }

  return false;
};

// Helper function to detect if a line looks like student data
const isStudentDataRow = (line: string): boolean => {
  const parts = line.trim().split(/\t/);
  if (parts.length < 2) return false;

  const namePart = parts[0].trim();
  const gradePart = parts[1].trim();

  // Name should be non-empty and contain at least some letters
  const nameLooksValid = namePart.length >= 2 && /[a-zA-Z]/.test(namePart);

  // Grade should be a number (possibly with comma)
  const gradeLooksValid = /^[\d.,]+$/.test(gradePart) && !isNaN(parseFloat(gradePart.replace(',', '.')));

  return nameLooksValid && gradeLooksValid;
};

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
          const rawStudentName = cells[0].textContent?.trim() || "";
          const studentName = normalizeStudentName(rawStudentName);

          // Convert the grade from comma format to dot format for proper parsing
          let gradeText = cells[1].textContent?.trim() || "0";
          gradeText = gradeText.replace(",", ".");
          const grade = parseFloat(gradeText) || 0;

          if (studentName && !isNaN(grade)) {
            grades.push({ studentName, grade });
          }
        }
      });

      return grades;
    } else {
      // This is a plain text list (tab-separated)
      const lines = input.split("\n").filter(line => line.trim().length > 0);
      const grades: Grade[] = [];

      if (lines.length === 0) return grades;

      // Intelligent header detection
      let startIndex = 0;
      const firstLine = lines[0];

      // Check if first line is clearly a header
      if (isHeaderRow(firstLine)) {
        startIndex = 1; // Skip header
      } else if (isStudentDataRow(firstLine)) {
        // First line looks like valid student data - include it
        startIndex = 0;
      } else {
        // First line doesn't look like valid data or header - skip it as garbage
        startIndex = 1;
      }

      // Parse the data rows
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length === 0) continue; // Skip empty lines

        // Split by tab character
        const parts = line.split("\t");
        if (parts.length >= 2) {
          const rawStudentName = parts[0].trim();
          const studentName = normalizeStudentName(rawStudentName);

          // Convert the grade from comma format to dot format for proper parsing
          let gradeText = parts[1].trim() || "0";
          gradeText = gradeText.replace(",", ".");
          const grade = parseFloat(gradeText) || 0;

          if (studentName && !isNaN(grade)) {
            grades.push({ studentName, grade });
          }
        }
      }

      return grades;
    }
  } catch (error) {
    console.error("Error parsing grades:", error);
    return [];
  }
};