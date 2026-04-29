AI App Generator (Compiler-Style System)

___Overview___
This project is a compiler-like system that converts natural language input into a structured application schema. It validates the schema, repairs inconsistencies, and outputs a consistent configuration for application generation.

___Objective___
Natural Language → Structured Config → Validation → Repair → Output

___Features___

Extracts features and entities from user prompts
Generates structured schema (UI, API, Database, Auth)
Validates consistency across layers
Repairs missing components automatically
Evaluates system performance using test cases
Interactive UI to visualize output

___Tech Stack___

Frontend: HTML, CSS, JavaScript
Backend: Node.js, Express
Deployment: Render

___Live Demo___
https://ai-app-l3d7.onrender.com

___API Endpoints___
POST /generate → Generates schema from prompt
GET /evaluate → Returns evaluation metrics

----Future Improvements-------

--->Integrate AI APIs for better natural language understanding
--->Add runtime engine to generate actual UI, APIs, and database
--->Make UI fully dynamic using real-time evaluation data
--->Support more complex and multi-step prompts
--->Add user authentication and project saving
--->Export generated schema as downloadable files

___Limitations___

Rule-based logic (no AI API used)
Limited domain understanding
No runtime execution layer

___Summary___
This system behaves like a compiler front-end by transforming unstructured input into validated, structured output while ensuring consistency and robustness.
