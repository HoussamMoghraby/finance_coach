---
description: Setup coding rules and guidelines for Python files in the project.
applyTo: **/*.py
# applyTo: 'Describe when these instructions should be loaded by the agent based on task context' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---

<!-- Tip: Use /create-instructions in chat to generate content with agent assistance -->

Follow these coding rules and guidelines for all Python files in the project to ensure consistency, readability, and maintainability:
1. Use snake_case for variable and function names, and PascalCase for class names.
2. Limit lines to a maximum of 79 characters.
3. Use 4 spaces per indentation level.
4. Include docstrings for all public modules, functions, classes, and methods.
5. Avoid using global variables; instead, use function parameters and return values to pass data.
6. Handle exceptions gracefully using try-except blocks and provide informative error messages.
7. Use list comprehensions and generator expressions for concise and efficient code.