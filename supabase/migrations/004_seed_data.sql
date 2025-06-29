-- Seed fields of study
INSERT INTO fields_of_study (name, description, icon, color) VALUES
  ('Computer Science', 'The study of computation, algorithms, and information systems', 'cpu', '#3B82F6'),
  ('Biology', 'The study of life and living organisms', 'dna', '#10B981'),
  ('Physics', 'The study of matter, energy, and the fundamental forces of nature', 'atom', '#8B5CF6'),
  ('Chemistry', 'The study of matter and the changes it undergoes', 'flask', '#F59E0B'),
  ('Mathematics', 'The study of numbers, shapes, and patterns', 'calculator', '#EF4444'),
  ('Medicine', 'The science and practice of diagnosing, treating, and preventing disease', 'heart', '#EC4899'),
  ('Engineering', 'The application of scientific principles to design and build', 'wrench', '#6366F1'),
  ('Psychology', 'The scientific study of mind and behavior', 'brain', '#14B8A6'),
  ('Economics', 'The study of production, distribution, and consumption of goods', 'trending-up', '#F97316'),
  ('Environmental Science', 'The study of the environment and solutions to environmental problems', 'leaf', '#84CC16');

-- Add some subfields
INSERT INTO fields_of_study (name, parent_id, description, color) VALUES
  ('Machine Learning', (SELECT id FROM fields_of_study WHERE name = 'Computer Science'), 'The study of algorithms that improve through experience', '#3B82F6'),
  ('Artificial Intelligence', (SELECT id FROM fields_of_study WHERE name = 'Computer Science'), 'The simulation of human intelligence in machines', '#3B82F6'),
  ('Molecular Biology', (SELECT id FROM fields_of_study WHERE name = 'Biology'), 'The study of biology at a molecular level', '#10B981'),
  ('Quantum Physics', (SELECT id FROM fields_of_study WHERE name = 'Physics'), 'The study of matter and energy at the quantum scale', '#8B5CF6'),
  ('Organic Chemistry', (SELECT id FROM fields_of_study WHERE name = 'Chemistry'), 'The study of carbon-based compounds', '#F59E0B');

-- Create a function to generate submission numbers
CREATE OR REPLACE FUNCTION generate_submission_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  submission_count INTEGER;
  new_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COUNT(*) + 1 INTO submission_count
  FROM manuscripts
  WHERE EXTRACT(YEAR FROM submitted_at) = current_year;
  
  new_number := 'TC-' || current_year || '-' || LPAD(submission_count::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set submission number when manuscript is submitted
CREATE OR REPLACE FUNCTION set_submission_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'submitted' AND OLD.status = 'draft' AND NEW.submission_number IS NULL THEN
    NEW.submission_number := generate_submission_number();
    NEW.submitted_at := TIMEZONE('utc', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_submission_number
  BEFORE UPDATE ON manuscripts
  FOR EACH ROW
  EXECUTE FUNCTION set_submission_number();

-- Create a function to increment manuscript count in fields_of_study
CREATE OR REPLACE FUNCTION update_field_manuscript_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
    UPDATE fields_of_study
    SET manuscript_count = manuscript_count + 1
    WHERE name = NEW.field_of_study;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'published' AND OLD.status != 'published' THEN
    UPDATE fields_of_study
    SET manuscript_count = manuscript_count + 1
    WHERE name = NEW.field_of_study;
  ELSIF TG_OP = 'UPDATE' AND NEW.status != 'published' AND OLD.status = 'published' THEN
    UPDATE fields_of_study
    SET manuscript_count = manuscript_count - 1
    WHERE name = OLD.field_of_study;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manuscript_count
  AFTER INSERT OR UPDATE ON manuscripts
  FOR EACH ROW
  EXECUTE FUNCTION update_field_manuscript_count();