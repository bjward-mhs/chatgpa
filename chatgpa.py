import os
import openai
from dotenv import load_dotenv

class ChatGPA:
    def __init__(self):
        """
        Initialize the ChatGPA wrapper by loading the OpenAI API key from .env file.
        """
        load_dotenv()  # Load environment variables from .env file
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API Key not found. Please set it in the .env file.")
        openai.api_key = self.api_key

    def send_message(self, message, model="gpt-4", temperature=0.7, max_tokens=200):
        """
        Send a message to ChatGPT API and get the response.

        :param message: The input message to send to ChatGPT.
        :param model: The model to use. Default is "gpt-4".
        :param temperature: The temperature level for the output text. Higher values make output more random.
        :param max_tokens: The maximum number of tokens in the response.
        :return: The response from ChatGPT.
        """
        try:
            response = openai.ChatCompletion.create(
                model=model,
                messages=[{"role": "user", "content": message}],
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response['choices'][0]['message']['content']
        except Exception as e:
            return f"Error: {str(e)}"

# Example CLI usage
if __name__ == "__main__":
    chatgpa = ChatGPA()
    
    print("Welcome to ChatGPA! Type 'exit' to quit.")
    while True:
        user_input = input("You: ")
        if user_input.lower() in ['exit', 'quit']:
            print("Goodbye!")
            break
        response = chatgpa.send_message(user_input)
        print("ChatGPA:", response)