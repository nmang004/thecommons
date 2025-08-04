-- Sample Articles for The Commons Academic Publishing Platform
-- Machine Learning and Neurosurgery Articles

-- Insert sample author profiles first
INSERT INTO auth.users (id, email, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'sarah.chen@stanford.edu', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'miguel.rodriguez@mit.edu', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'dr.patel@johnshopkins.edu', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'elena.kim@mayo.edu', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'robert.johnson@harvard.edu', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'dr.williams@ucsf.edu', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding profiles
INSERT INTO profiles (id, full_name, email, affiliation, orcid, role, expertise, bio, h_index, total_publications) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Dr. Sarah Chen', 'sarah.chen@stanford.edu', 'Stanford University - Department of Computer Science', '0000-0001-2345-6789', 'author', 
   ARRAY['Machine Learning', 'Deep Learning', 'Computer Vision', 'Neural Networks'], 
   'Dr. Sarah Chen is a leading researcher in machine learning and computer vision with over 15 years of experience in developing novel algorithms for medical imaging applications.', 
   45, 127),
  
  ('550e8400-e29b-41d4-a716-446655440002', 'Dr. Miguel Rodriguez', 'miguel.rodriguez@mit.edu', 'MIT - Computer Science and Artificial Intelligence Laboratory', '0000-0002-3456-7890', 'author',
   ARRAY['Natural Language Processing', 'Machine Learning', 'AI Ethics', 'Reinforcement Learning'],
   'Dr. Miguel Rodriguez specializes in natural language processing and ethical AI systems, focusing on bias detection and mitigation in large language models.',
   38, 89),
   
  ('550e8400-e29b-41d4-a716-446655440003', 'Dr. Priya Patel', 'dr.patel@johnshopkins.edu', 'Johns Hopkins University - Department of Neurosurgery', '0000-0003-4567-8901', 'author',
   ARRAY['Neurosurgery', 'Brain Tumors', 'Minimally Invasive Surgery', 'Neuro-oncology'],
   'Dr. Priya Patel is a renowned neurosurgeon specializing in brain tumor surgery and minimally invasive neurosurgical techniques with over 20 years of clinical experience.',
   52, 156),
   
  ('550e8400-e29b-41d4-a716-446655440004', 'Dr. Elena Kim', 'elena.kim@mayo.edu', 'Mayo Clinic - Department of Neurological Surgery', '0000-0004-5678-9012', 'author',
   ARRAY['Pediatric Neurosurgery', 'Spinal Surgery', 'Epilepsy Surgery', 'Cerebrovascular Surgery'],
   'Dr. Elena Kim is a leading pediatric neurosurgeon with expertise in complex spinal deformities and epilepsy surgery in children.',
   41, 103),
   
  ('550e8400-e29b-41d4-a716-446655440005', 'Dr. Robert Johnson', 'robert.johnson@harvard.edu', 'Harvard Medical School - Department of Neurosurgery', '0000-0005-6789-0123', 'author',
   ARRAY['Functional Neurosurgery', 'Deep Brain Stimulation', 'Movement Disorders', 'Stereotactic Surgery'],
   'Dr. Robert Johnson is a pioneer in functional neurosurgery and deep brain stimulation techniques for treating movement disorders.',
   47, 134),
   
  ('550e8400-e29b-41d4-a716-446655440006', 'Dr. Amanda Williams', 'dr.williams@ucsf.edu', 'UCSF - Department of Neurological Surgery', '0000-0006-7890-1234', 'author',
   ARRAY['Neuro-oncology', 'Immunotherapy', 'Glioblastoma', 'Clinical Trials'],
   'Dr. Amanda Williams focuses on neuro-oncology research and innovative immunotherapy approaches for treating aggressive brain cancers.',
   39, 98)
ON CONFLICT (id) DO NOTHING;

-- Machine Learning Articles
INSERT INTO manuscripts (
  id, title, abstract, keywords, field_of_study, subfield, author_id, 
  corresponding_author_id, status, submitted_at, published_at, 
  view_count, download_count, citation_count, funding_statement
) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Attention Mechanisms in Transformer Networks: A Comprehensive Analysis of Multi-Head Self-Attention for Natural Language Processing',
    'This paper presents a comprehensive analysis of attention mechanisms in transformer networks, focusing on the mathematical foundations and empirical performance of multi-head self-attention. We investigate how different attention head configurations affect model performance across various NLP tasks including machine translation, text summarization, and question answering. Our experiments on large-scale datasets demonstrate that strategic attention head pruning can reduce computational overhead by 40% while maintaining 98% of original performance. We introduce a novel attention visualization technique that reveals interpretable patterns in learned attention weights, providing insights into how transformers process linguistic structures. The findings suggest that not all attention heads contribute equally to model performance, and our proposed attention head importance scoring method enables more efficient transformer architectures. This work contributes to the growing understanding of transformer interpretability and provides practical guidelines for optimizing attention mechanisms in resource-constrained environments.',
    ARRAY['Transformer Networks', 'Attention Mechanisms', 'Natural Language Processing', 'Multi-Head Attention', 'Model Interpretability', 'Neural Network Optimization'],
    'Computer Science',
    'Machine Learning',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'published',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '15 days',
    1247,
    523,
    12,
    'This research was supported by the National Science Foundation under Grant No. IIS-2023456 and the Stanford Institute for Artificial Intelligence.'
  ),
  
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Federated Learning for Privacy-Preserving Medical Image Analysis: A Multi-Hospital Collaborative Study',
    'Medical image analysis using deep learning has shown remarkable success, but centralized training approaches raise significant privacy concerns when dealing with sensitive patient data. This study presents a comprehensive evaluation of federated learning techniques for medical image analysis across multiple healthcare institutions. We implemented a federated learning framework involving five major hospitals, training convolutional neural networks for chest X-ray pneumonia detection without sharing raw patient data. Our approach achieves 94.2% accuracy, comparable to centralized training (95.1%) while maintaining strict privacy constraints. We introduce a novel aggregation algorithm that accounts for data heterogeneity across institutions and demonstrate its superiority over standard federated averaging. The study also addresses practical challenges including communication efficiency, differential privacy integration, and handling of imbalanced datasets across participating hospitals. Our privacy-preserving framework successfully trained on over 100,000 chest X-rays while ensuring HIPAA compliance and maintaining patient anonymity. This work establishes federated learning as a viable approach for collaborative medical AI research while preserving patient privacy.',
    ARRAY['Federated Learning', 'Medical Image Analysis', 'Privacy-Preserving AI', 'Healthcare AI', 'Chest X-ray', 'Differential Privacy', 'Multi-institutional Collaboration'],
    'Computer Science',
    'Machine Learning',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'published',
    NOW() - INTERVAL '62 days',
    NOW() - INTERVAL '28 days',
    892,
    367,
    8,
    'This work was funded by the NIH National Institute of Biomedical Imaging and Bioengineering under Grant R01EB029847 and the MIT-IBM Watson AI Lab.'
  ),
  
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'Reinforcement Learning for Autonomous Robotic Surgery: Real-time Decision Making in Dynamic Surgical Environments',
    'Autonomous robotic surgery represents a frontier in medical technology, requiring sophisticated decision-making capabilities in dynamic, high-stakes environments. This paper presents a novel reinforcement learning framework for autonomous surgical robots that can adapt to unexpected situations during minimally invasive procedures. Our approach combines deep Q-learning with imitation learning, training on a dataset of 50,000 expert surgical demonstrations and 200,000 simulated procedures. The system achieves human-level performance in suturing tasks with 99.1% accuracy and demonstrates superior consistency compared to human surgeons in repetitive precision tasks. We introduce a safety-constrained reward function that prioritizes patient outcomes while optimizing surgical efficiency. The framework includes real-time tissue deformation modeling and collision avoidance algorithms specifically designed for the constrained workspace of laparoscopic surgery. Extensive validation in both simulation and cadaveric studies shows the system can handle unexpected bleeding, tissue adhesions, and instrument malfunctions. This work represents a significant step toward fully autonomous surgical systems while maintaining the highest safety standards required in medical applications.',
    ARRAY['Reinforcement Learning', 'Robotic Surgery', 'Autonomous Systems', 'Medical Robotics', 'Surgical AI', 'Imitation Learning', 'Safety-Critical Systems'],
    'Computer Science',
    'Machine Learning',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'published',
    NOW() - INTERVAL '38 days',
    NOW() - INTERVAL '12 days',
    1356,
    478,
    15,
    'Supported by the Department of Defense through the Defense Advanced Research Projects Agency (DARPA) under Contract HR001120C0036.'
  );

-- Neurosurgery Articles
INSERT INTO manuscripts (
  id, title, abstract, keywords, field_of_study, subfield, author_id, 
  corresponding_author_id, status, submitted_at, published_at, 
  view_count, download_count, citation_count, funding_statement
) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'Minimally Invasive Endoscopic Approach for Pediatric Craniopharyngioma Resection: A 10-Year Multi-Center Experience',
    'Craniopharyngiomas in pediatric patients present unique surgical challenges due to their proximity to critical structures and the developing brain. This multi-center retrospective study analyzes outcomes from 247 pediatric craniopharyngioma cases treated with minimally invasive endoscopic techniques across 12 major pediatric neurosurgery centers over a 10-year period. Our cohort includes patients aged 2-18 years with both adamantinomatous and papillary subtypes. The endoscopic approach achieved gross total resection in 78% of cases with significantly reduced surgical morbidity compared to traditional transcranial approaches. Visual field defects occurred in only 12% of patients versus 34% in the open surgery control group. Endocrine dysfunction was minimized through careful preservation of the hypothalamic-pituitary axis, with only 23% requiring permanent hormone replacement therapy. We present a novel classification system for craniopharyngioma complexity that correlates with surgical outcomes and helps predict optimal surgical approach. Long-term follow-up (mean 6.2 years) shows recurrence rates of 8% for gross total resection and 31% for subtotal resection. This study establishes endoscopic resection as the preferred approach for appropriately selected pediatric craniopharyngiomas, offering superior functional outcomes while maintaining oncological efficacy.',
    ARRAY['Pediatric Neurosurgery', 'Craniopharyngioma', 'Endoscopic Surgery', 'Minimally Invasive', 'Pituitary Tumors', 'Hypothalamic Preservation', 'Skull Base Surgery'],
    'Medicine',
    'Neurosurgery',
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440004',
    'published',
    NOW() - INTERVAL '72 days',
    NOW() - INTERVAL '35 days',
    1123,
    445,
    22,
    'This research was supported by the Pediatric Brain Tumor Foundation and the National Institute of Neurological Disorders and Stroke (NINDS) under Grant R01NS098347.'
  ),
  
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'Deep Brain Stimulation for Treatment-Resistant Depression: Long-term Outcomes and Optimization of Stimulation Parameters',
    'Treatment-resistant depression affects approximately 30% of patients with major depressive disorder, representing a significant unmet medical need. This prospective clinical trial evaluates the efficacy and safety of deep brain stimulation (DBS) targeting the subcallosal cingulate cortex (SCC) in 64 patients with severe treatment-resistant depression over a 5-year follow-up period. Patients underwent bilateral SCC-DBS implantation using MRI-guided stereotactic techniques with real-time neurophysiological monitoring. Primary outcomes included Hamilton Depression Rating Scale (HDRS-17) scores and response rates defined as ≥50% improvement from baseline. At 5 years, 67% of patients achieved clinical response with mean HDRS-17 score reduction of 58%. We developed a novel adaptive stimulation protocol that adjusts parameters based on real-time mood monitoring and neural feedback, resulting in 23% improvement in efficacy compared to standard continuous stimulation. Serious adverse events occurred in 8% of patients, primarily related to surgical complications. Neuropsychological testing revealed improvements in executive function and working memory correlating with clinical response. This study provides Class I evidence for SCC-DBS efficacy in treatment-resistant depression and establishes adaptive stimulation as a superior approach for optimizing clinical outcomes.',
    ARRAY['Deep Brain Stimulation', 'Treatment-Resistant Depression', 'Subcallosal Cingulate', 'Stereotactic Surgery', 'Adaptive Stimulation', 'Neuropsychiatry', 'Functional Neurosurgery'],
    'Medicine',
    'Neurosurgery',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    'published',
    NOW() - INTERVAL '89 days',
    NOW() - INTERVAL '52 days',
    1789,
    623,
    31,
    'Supported by the National Institute of Mental Health (NIMH) under Grant R01MH123456 and the Brain and Behavior Research Foundation NARSAD Grant.'
  ),
  
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'Immunotherapy for Recurrent Glioblastoma: Phase II Trial of Personalized Neoantigen Vaccines Combined with Checkpoint Inhibition',
    'Glioblastoma multiforme (GBM) remains the most aggressive primary brain tumor with median survival of 15 months despite multimodal therapy. This phase II clinical trial investigates personalized neoantigen vaccination combined with PD-1 checkpoint inhibition in 87 patients with recurrent GBM. Each patient received a personalized vaccine targeting up to 20 tumor-specific neoantigens identified through whole-exome sequencing and HLA typing. The vaccine was administered with pembrolizumab every 3 weeks for 12 cycles, followed by maintenance pembrolizumab. Primary endpoints included overall survival and progression-free survival, with secondary endpoints of safety, immune response, and quality of life measures. Median overall survival was 13.7 months from recurrence (95% CI: 11.2-16.8), representing a significant improvement over historical controls (8.2 months). Progression-free survival at 6 months was 31% compared to 15% in matched controls. The treatment was well-tolerated with grade 3-4 adverse events in 23% of patients, primarily immune-related. Correlative studies demonstrated robust T-cell responses against vaccinated neoantigens in 78% of patients, with response magnitude correlating with survival benefit. This study establishes personalized neoantigen vaccination as a promising therapeutic approach for recurrent GBM and supports advancement to phase III trials.',
    ARRAY['Glioblastoma', 'Immunotherapy', 'Personalized Medicine', 'Neoantigen Vaccine', 'Checkpoint Inhibition', 'Brain Cancer', 'Clinical Trial', 'Neuro-oncology'],
    'Medicine',
    'Neurosurgery',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440006',
    'published',
    NOW() - INTERVAL '56 days',
    NOW() - INTERVAL '21 days',
    2134,
    789,
    18,
    'This trial was funded by the National Cancer Institute under Grant U01CA234567 and the American Brain Tumor Association Research Grant.'
  );

-- Add some co-authors for selected manuscripts
INSERT INTO manuscript_coauthors (manuscript_id, name, email, affiliation, orcid, author_order, is_corresponding, contribution_statement) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Dr. James Liu', 'james.liu@stanford.edu', 'Stanford University - Department of Computer Science', '0000-0007-1234-5678', 2, false, 'Contributed to experimental design and data analysis'),
  ('660e8400-e29b-41d4-a716-446655440001', 'Dr. Maria Garcia', 'maria.garcia@berkeley.edu', 'UC Berkeley - Department of EECS', '0000-0008-2345-6789', 3, false, 'Assisted with transformer model implementation and evaluation'),
  
  ('660e8400-e29b-41d4-a716-446655440002', 'Dr. David Kim', 'david.kim@partners.org', 'Massachusetts General Hospital', '0000-0009-3456-7890', 2, false, 'Provided medical expertise and clinical validation'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Dr. Lisa Wang', 'lisa.wang@mayo.edu', 'Mayo Clinic - Department of Radiology', '0000-0010-4567-8901', 3, false, 'Contributed radiological expertise and image annotation'),
  
  ('660e8400-e29b-41d4-a716-446655440004', 'Dr. Michael Thompson', 'michael.thompson@childrens.harvard.edu', 'Boston Children''s Hospital', '0000-0011-5678-9012', 2, false, 'Contributed surgical cases and outcome analysis'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Dr. Sarah Martinez', 'sarah.martinez@chop.edu', 'Children''s Hospital of Philadelphia', '0000-0012-6789-0123', 3, false, 'Provided endocrinological expertise and follow-up data'),
  
  ('660e8400-e29b-41d4-a716-446655440005', 'Dr. Jennifer Brown', 'jennifer.brown@mgh.harvard.edu', 'Massachusetts General Hospital - Department of Psychiatry', '0000-0013-7890-1234', 2, false, 'Conducted psychiatric evaluations and outcome assessments'),
  
  ('660e8400-e29b-41d4-a716-446655440006', 'Dr. Thomas Anderson', 'thomas.anderson@ucsf.edu', 'UCSF - Department of Pathology', '0000-0014-8901-2345', 2, false, 'Performed tumor sequencing and biomarker analysis'),
  ('660e8400-e29b-41d4-a716-446655440006', 'Dr. Rachel Green', 'rachel.green@stanford.edu', 'Stanford University - Department of Immunology', '0000-0015-9012-3456', 3, false, 'Designed immunological assays and analyzed immune responses');

-- Add some activity logs for engagement
INSERT INTO activity_logs (manuscript_id, user_id, action, details) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'manuscript_submitted', '{"submission_date": "2024-11-15", "initial_review": "pending"}'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'manuscript_published', '{"publication_date": "2024-12-15", "doi_assigned": true}'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'manuscript_submitted', '{"submission_date": "2024-10-29", "initial_review": "pending"}'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'manuscript_published', '{"publication_date": "2024-12-02", "doi_assigned": true}'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'manuscript_submitted', '{"submission_date": "2024-11-22", "initial_review": "pending"}'),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'manuscript_published', '{"publication_date": "2024-12-18", "doi_assigned": true}'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'manuscript_submitted', '{"submission_date": "2024-10-18", "initial_review": "pending"}'),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'manuscript_published', '{"publication_date": "2024-11-25", "doi_assigned": true}'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'manuscript_submitted', '{"submission_date": "2024-10-01", "initial_review": "pending"}'),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'manuscript_published', '{"publication_date": "2024-11-08", "doi_assigned": true}'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'manuscript_submitted', '{"submission_date": "2024-11-04", "initial_review": "pending"}'),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', 'manuscript_published', '{"publication_date": "2024-12-09", "doi_assigned": true}');

-- Add some fields of study for categorization
INSERT INTO fields_of_study (name, parent_id, description, manuscript_count) VALUES 
  ('Computer Science', NULL, 'Computational sciences including AI, machine learning, and software engineering', 3),
  ('Medicine', NULL, 'Medical sciences and clinical research', 3),
  ('Machine Learning', (SELECT id FROM fields_of_study WHERE name = 'Computer Science'), 'Algorithms and systems that learn from data', 3),
  ('Neurosurgery', (SELECT id FROM fields_of_study WHERE name = 'Medicine'), 'Surgical treatment of nervous system disorders', 3),
  ('Artificial Intelligence', (SELECT id FROM fields_of_study WHERE name = 'Computer Science'), 'Systems that simulate human intelligence', 2),
  ('Neuro-oncology', (SELECT id FROM fields_of_study WHERE name = 'Medicine'), 'Treatment of brain and nervous system cancers', 1)
ON CONFLICT (name) DO UPDATE SET manuscript_count = EXCLUDED.manuscript_count;