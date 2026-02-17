from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from config.setting import Settings
from dotenv import load_dotenv
import os

load_dotenv()

class GeminiChatService:
    def __init__(self):
        # Load .env config
        settings = Settings.from_env()

        self.llm = ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key = os.getenv("GEMINI_API_KEY_2"),
            temperature=0
        )

    def generate(self, system_prompt, user_prompt, temperature=0):
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", user_prompt)
        ])

        chain = prompt | self.llm
        response = chain.invoke({})
        return response.content

    def generate_roadmap(self, user_profile, career_choice):
        prompt = f"""
        You are an expert career coach.
        Create a roadmap for {career_choice}.
        Profile: {user_profile}
        """
        return self.generate(system_prompt="You are a helpful assistant.", user_prompt=prompt)
