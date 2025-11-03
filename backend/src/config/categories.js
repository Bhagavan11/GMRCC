// Store all categories used in the system
export const categories = {
  // Academic Departments
  'cse': 'Computer Science Department',
  'ece': 'Electronics and Communication Department',
  'eee': 'Electrical and Electronics Department',
  'mech': 'Mechanical Engineering Department',
  'it': 'Information Technology Department',
  
  // Administrative
  'admissions': 'Admission Procedures and Requirements',
  'examinations': 'Examination Schedules and Procedures',
  'scholarships': 'Scholarship and Financial Aid',
  'placements': 'Placement Records and Statistics',
  'hostel': 'Hostel Facilities and Rules',
  'library': 'Library Resources and Services',
  'laboratories': 'Laboratory Facilities and Equipment',
  'research': 'Research Programs and Publications',
  'calendar': 'Academic Calendar and Events',
  
  // Student Services
  'transport': 'Transportation Services',
  'cafeteria': 'Cafeteria and Food Services',
  'sports': 'Sports and Recreation',
  'clubs': 'Student Clubs and Organizations',
  'counseling': 'Student Counseling Services',
  'medical': 'Medical and Health Services',
  'alumni': 'Alumni Network and Activities',
  
  // Academic Programs
  'ug': 'Undergraduate Programs',
  'pg': 'Postgraduate Programs',
  'phd': 'Doctoral Programs',
  'certifications': 'Certification Courses',
  
  // Default fallback
  'general': 'General Information'
};

// Generate valid_categories array for intent classification
export const valid_categories = Object.keys(categories);

/**
 * Get a friendly display name for a category
 * @param {string} category - The category key
 * @returns {string} Display name or the original key if not found
 */
export function getCategoryDisplayName(category) {
  return categories[category] || category;
}

/**
 * Save new categories to a JSON file for review
 * @param {Array} newCategories - Array of new category objects with key and name
 */
export async function saveNewCategories(newCategories) {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const filePath = path.join(process.cwd(), 'new_categories.json');
  await fs.writeFile(filePath, JSON.stringify(newCategories, null, 2));
  console.log(`New categories saved to ${filePath} for review.`);
}
