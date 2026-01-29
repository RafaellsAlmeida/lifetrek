-- Deleting duplicate resource "Checklist DFM para Implantes e Instrumentais"
-- Original ID: b3937b08-70bb-4472-9d20-0a0592c1c4d3 (Keep)
-- Duplicate ID: 9378403e-d808-4ac8-98af-957fce072f7f (Delete)

DELETE FROM resources 
WHERE id = '9378403e-d808-4ac8-98af-957fce072f7f';
