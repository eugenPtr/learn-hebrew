## 1. Apply SQL Migration

- [x] 1.1 Open the Supabase SQL editor for the project
- [x] 1.2 Run the `CREATE TABLE lessons` statement
- [x] 1.3 Run the `CREATE TABLE vocabulary_items` statement
- [x] 1.4 Run the `CREATE TABLE session_results` statement

## 2. Verify Schema

- [x] 2.1 Confirm all three tables appear in the Supabase Table Editor
- [x] 2.2 Verify column names and types for `vocabulary_items` (check all 11 columns)
- [x] 2.3 Verify the `lesson_id` FK constraint references `lessons(id)`

## 3. Smoke Test

- [x] 3.1 Insert a test row into `vocabulary_items` (with `hebrew` and `english` values)
- [x] 3.2 Read back the row and confirm all counter columns default to 0 / NULL
- [x] 3.3 Run an atomic counter increment (`UPDATE ... SET mistakes_reading = mistakes_reading + 1`) and verify the result
- [x] 3.4 Insert a test row into `session_results` with a JSONB `results` array and read it back
- [x] 3.5 Delete the test rows to leave tables clean
