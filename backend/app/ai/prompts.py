"""
Prompt templates for AI tasks
"""

SYSTEM_PROMPT = """You are a helpful personal finance assistant. You analyze financial data and provide practical, educational insights about budgeting and spending.

Important rules:
- Only discuss facts present in the data provided to you
- Do not make up information or numbers
- Do not provide investment, legal, or tax advice
- Focus on budgeting, spending patterns, and practical money management
- Be concise and helpful
- If asked about something outside your expertise, politely decline
"""


DAILY_SUMMARY_TEMPLATE = """Generate a brief daily financial summary based on the following data:

Date: {date}
Total Income: ${total_income}
Total Expenses: ${total_expenses}
Net: ${net}

Top Expenses:
{top_expenses}

Provide a 2-3 sentence summary of the day's financial activity. Be concise and practical."""


WEEKLY_SUMMARY_TEMPLATE = """Generate a weekly financial summary based on the following data:

Period: {start_date} to {end_date}
Total Income: ${total_income}
Total Expenses: ${total_expenses}
Net: ${net}

Category Breakdown:
{category_breakdown}

Top Merchants:
{top_merchants}

Budget Status: {budget_status}

Provide a helpful 4-5 sentence summary highlighting:
1. Overall spending patterns
2. Notable categories or merchants
3. Budget performance
4. One actionable suggestion"""


MONTHLY_SUMMARY_TEMPLATE = """Generate a comprehensive monthly financial summary based on the following data:

Period: {start_date} to {end_date}
Total Income: ${total_income}
Total Expenses: ${total_expenses}
Net: ${net}
Savings Rate: {savings_rate}%

Category Breakdown:
{category_breakdown}

Top Merchants:
{top_merchants}

Budget Status: {budget_status}

Month-over-Month Comparison:
Previous Month Income: ${prev_income}
Previous Month Expenses: ${prev_expenses}

Provide a detailed summary (6-8 sentences) covering:
1. Overall financial health
2. Spending patterns and trends
3. Budget performance
4. Comparison to previous month
5. 2-3 actionable recommendations for improvement"""


BUDGET_COACHING_TEMPLATE = """Provide budget coaching based on the following information:

Current Budget Status:
{budget_status}

Recent Spending:
{spending_summary}

User Question or Concern: {user_input}

Provide practical budget coaching advice. Focus on:
1. Understanding their current situation
2. Identifying areas for improvement
3. Suggesting realistic adjustments
4. Encouraging positive financial habits

Be supportive and practical. Do not suggest specific investments."""


SPENDING_EXPLANATION_TEMPLATE = """Explain the following spending pattern:

{spending_data}

Provide a clear 2-3 sentence explanation of what this data shows. Focus on patterns, trends, or notable observations."""


CATEGORIZATION_SUGGESTION_TEMPLATE = """Suggest an appropriate category for the following transaction:

Description: {description}
Amount: ${amount}
Merchant: {merchant}

Available categories:
{categories}

Respond with just the category name that best fits this transaction."""


CHAT_QUESTION_TEMPLATE = """Answer the following question about the user's finances:

User Question: {question}

Financial Context:
{financial_context}

Provide a clear, helpful answer based only on the provided financial data. If you don't have enough information, say so. Do not provide investment, legal, or tax advice."""
