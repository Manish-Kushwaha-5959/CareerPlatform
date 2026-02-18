"""
Career Mentor AI Agent with Tools
==================================
A professional, evidence-based Career Mentor AI Agent built with LangChain and Groq.
Now with tools: recall_memory, save_memory, and web_search.
"""

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_classic.agents import AgentExecutor, create_tool_calling_agent
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv

from .tools import get_tools, recall_memory, save_memory, web_search

# Load environment variables
load_dotenv()

# Career Mentor System Prompt
CAREER_MENTOR_SYSTEM_PROMPT = """SYSTEM MESSAGE — CAREER MENTOR AGENT (STRICT TOOL-USAGE PROTOCOL)

You are a professional, evidence-based Career Mentor AI Agent.  
You provide clear, structured, personalized guidance for students, job seekers, and working professionals.

Your reasoning, questioning, and decisions must reflect how a real, experienced mentor operates.

----------------------------------------------------------------------
CORE MENTOR OBJECTIVES:
1. Understand the user's goals, background, constraints, and preferences through structured questions.
2. Provide accurate, practical, personalized advice, learning paths, and career strategies.
3. Use tools ONLY when required and never by default.

----------------------------------------------------------------------  
MEMORY USAGE LOGIC  
----------------------------------------------------------------------

Use recall_memory ONLY when:
• previous information is relevant to the current question, OR  
• recalling past goals, skills, or constraints improves your guidance.

Do NOT fetch memory automatically at the start of a conversation.

Use save_memory ONLY when:
• the user provides stable, important personal data (career goals, background, strengths, interests), AND  
• the user explicitly agrees to save it or says "remember this".

Always ask for permission before saving new memory unless they directly command you to remember.

Never save temporary, speculative, or sensitive information.

----------------------------------------------------------------------  
WEB SEARCH LOGIC (MULTIPLE SEARCH ITERATIONS)  
----------------------------------------------------------------------

You must treat web_search as a research tool.  
You should use it **multiple times** whenever a question requires:
• accurate market data  
• updated salary ranges  
• job trends  
• certification value  
• industry changes  
• hiring conditions  
• economic conditions  
• technology trends  
• role-specific or country-specific information  

RULE:  
If you are NOT highly confident in your knowledge for a career-impacting question,  
you MUST run web_search repeatedly until you obtain sufficiently reliable information.

Research process:
1. Run an initial web_search with a general query.  
2. Evaluate the relevance and clarity of results.  
3. If results are insufficient, refine the query and run web_search again.  
4. Continue refining the query and calling web_search until:
   – results converge, OR  
   – you reach high confidence, OR  
   – maximum of 4 iterations is reached.

You MUST NOT provide final advice based on uncertain or outdated knowledge.  
If data remains conflicting, state the uncertainty clearly and provide balanced options.

----------------------------------------------------------------------  
MENTOR COMMUNICATION STYLE  
----------------------------------------------------------------------

• Be structured, calm, analytical, and supportive.  
• Ask clarifying questions when the user's intent is unclear.  
• Offer 2–3 options with pros, cons, and recommended choice.  
• Provide actionable plans (Next Steps, 30-Day, 90-Day, and Long-Term).  
• Offer checkpoints and follow-up questions.  
• End with a clear summary and ask if they want to save the plan.

----------------------------------------------------------------------  
LIMITATIONS AND SAFETY  
----------------------------------------------------------------------

• Do not provide legal, medical, or psychological diagnoses.  
• Do not save sensitive data.  
• If asked for harmful or unethical advice, decline and redirect.

----------------------------------------------------------------------  
END OF SYSTEM MESSAGE  
----------------------------------------------------------------------
"""


class CareerMentorAgent:
    """
    Career Mentor AI Agent using LangChain and Groq with tool support.
    
    This agent provides personalized career guidance using the Llama3 70B model
    through Groq's API, with access to memory and web search tools.
    """
    
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        user_id: str = "default_user",
        verbose: bool = False,
    ):
        """
        Initialize the Career Mentor Agent with tools.
        
        Args:
            groq_api_key: Groq API key. If not provided, will look for GROQ_API_KEY env variable.
            model_name: The Groq model to use. If not provided, uses LLM_MODEL env var or defaults to llama-3.3-70b-versatile.
            temperature: Temperature for response generation. Default is 0.7.
            max_tokens: Maximum tokens for response. Default is 4096.
            user_id: User identifier for memory operations. Default is "default_user".
            verbose: Whether to print detailed agent execution logs. Default is False.
        """
        # Get API key from parameter or environment
        self.api_key = groq_api_key or os.getenv("GROQ_API_KEY")
        
        # Get model name from parameter or environment
        self.model_name = model_name or os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
        
        if not self.api_key:
            raise ValueError(
                "Groq API key is required. Either pass it as a parameter or "
                "set the GROQ_API_KEY environment variable."
            )
        
        # Store configuration
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.user_id = user_id
        self.verbose = verbose
        
        # Initialize the Groq LLM
        self.llm = ChatGroq(
            groq_api_key=self.api_key,
            model_name=self.model_name,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        
        # Get tools
        self.tools = get_tools()
        
        # Conversation history for multi-turn conversations
        self.conversation_history: List[Dict[str, str]] = []
        
        # Create the prompt template for agent
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", CAREER_MENTOR_SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Create the agent
        self.agent = create_tool_calling_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=self.prompt,
        )
        
        # Create the agent executor
        self.agent_executor = AgentExecutor(
            agent=self.agent,
            tools=self.tools,
            verbose=verbose,
            handle_parsing_errors=True,
            max_iterations=10,  # Allow multiple tool calls
        )
        
        print(f"[OK] Career Mentor Agent initialized with model: {self.model_name}")
        print(f"[OK] Tools loaded: {[t.name for t in self.tools]}")
    
    def _format_chat_history(self) -> List:
        """
        Format the conversation history for the prompt.
        
        Returns:
            List of formatted messages for the chat history.
        """
        formatted_messages = []
        for message in self.conversation_history:
            if message["role"] == "user":
                formatted_messages.append(HumanMessage(content=message["content"]))
            elif message["role"] == "assistant":
                formatted_messages.append(AIMessage(content=message["content"]))
        return formatted_messages
    
    def chat(self, user_input: str) -> str:
        """
        Send a message to the Career Mentor and get a response.
        The agent will automatically use tools when appropriate.
        
        Args:
            user_input: The user's message/question.
            
        Returns:
            The agent's response as a string.
        """
        try:
            # Inject user_id into the input for memory tools
            # This allows the agent to use the correct user context
            enhanced_input = f"[User ID: {self.user_id}]\n\n{user_input}"
            
            # Get the formatted chat history
            chat_history = self._format_chat_history()
            
            # Invoke the agent executor
            response = self.agent_executor.invoke({
                "chat_history": chat_history,
                "input": enhanced_input,
            })
            
            # Extract the response content
            response_content = response.get("output", "")
            
            # Add to conversation history (without the user_id prefix)
            self.conversation_history.append({
                "role": "user",
                "content": user_input
            })
            self.conversation_history.append({
                "role": "assistant",
                "content": response_content
            })
            
            return response_content
            
        except Exception as e:
            error_message = f"Error generating response: {str(e)}"
            print(f"[ERROR] {error_message}")
            return error_message
    
    def clear_history(self):
        """Clear the conversation history."""
        self.conversation_history = []
        print("[OK] Conversation history cleared.")
    
    def get_history(self) -> List[Dict[str, str]]:
        """
        Get the current conversation history.
        
        Returns:
            List of conversation messages.
        """
        return self.conversation_history.copy()
    
    def set_user_id(self, user_id: str):
        """
        Set the user ID for memory operations.
        
        Args:
            user_id: The new user identifier.
        """
        self.user_id = user_id
        print(f"[OK] User ID set to: {user_id}")
    
    def set_temperature(self, temperature: float):
        """
        Update the temperature setting.
        
        Args:
            temperature: New temperature value (0.0 to 1.0).
        """
        self.temperature = temperature
        self.llm.temperature = temperature
        print(f"[OK] Temperature updated to: {temperature}")


def create_agent(
    groq_api_key: Optional[str] = None,
    model_name: Optional[str] = None,
    temperature: float = 0.7,
    user_id: str = "default_user",
    verbose: bool = False,
) -> CareerMentorAgent:
    """
    Factory function to create a Career Mentor Agent with tools.
    
    Args:
        groq_api_key: Optional Groq API key.
        model_name: The model to use.
        temperature: Temperature for responses.
        user_id: User identifier for memory operations.
        verbose: Whether to print detailed execution logs.
        
    Returns:
        Configured CareerMentorAgent instance.
    """
    return CareerMentorAgent(
        groq_api_key=groq_api_key,
        model_name=model_name,
        temperature=temperature,
        user_id=user_id,
        verbose=verbose,
    )


# Example usage and testing
if __name__ == "__main__":
    # Create the agent
    try:
        agent = create_agent(verbose=True)
        
        print("\n" + "="*60)
        print("CAREER MENTOR AI AGENT (with Tools)")
        print("="*60)
        print("Type 'quit' to exit, 'clear' to clear history")
        print("="*60 + "\n")
        
        while True:
            # Get user input
            user_input = input("You: ").strip()
            
            # Check for exit commands
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("\n[GOODBYE] Best of luck with your career journey!")
                break
            
            # Check for clear command
            if user_input.lower() == 'clear':
                agent.clear_history()
                continue
            
            # Skip empty inputs
            if not user_input:
                continue
            
            # Get response from the agent
            print("\n[Career Mentor]: ", end="")
            response = agent.chat(user_input)
            print(response)
            print()
            
    except ValueError as e:
        print(f"\n[ERROR]: {e}")
        print("Please set your GROQ_API_KEY environment variable or pass it as a parameter.")
