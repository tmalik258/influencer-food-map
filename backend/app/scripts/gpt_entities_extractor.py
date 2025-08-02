import asyncio
import json
import textwrap
from openai import OpenAI

from app.config import CHUNK_SIZE, OPENAI_API_KEY
from app.utils.logging import setup_logger

logger = setup_logger(__name__)

class GPTEntityExtractor:
    """A class to extract food-related entities from transcriptions using GPT-4.1."""
    
    def __init__(self, chunk_size=CHUNK_SIZE):
        """
        Initialize the EntityExtractor.
        
        Args:
            openai_client: The OpenAI client instance for API calls
            chunk_size: Maximum size of each transcript chunk (default: 1000)
        """
        # Initialize clients with custom HTTP settings
        openai_client = OpenAI(api_key=OPENAI_API_KEY)
        self.openai_client = openai_client

        self.chunk_size = chunk_size
        self.system_prompt = """
        You are a food data extraction assistant. Your role is to analyze a transcript chunk from a food-focused YouTube video and extract precise, structured information about any food-related places mentioned. This includes any restaurant, food stall, farm, food producer, or culinary establishment clearly referenced in the transcript.

        Your objectives:
        - Accurately identify all food-related places in the transcript where sufficient detail is available.
        - For each place, extract well-defined structured data as per the schema provided.
        - If the restaurant or food place name appears to be phonetically transcribed, misspelled, or plausibly a variant of a known establishment, research or cross-reference and correct to the most likely accurate (official) name, provided you can do so with high confidence. Only perform this correction if you are reasonably certain of the true name; otherwise, extract the name as-is and reflect any uncertainty with an appropriate confidence score.

        # Steps

        1. Read the transcript chunk thoroughly.
        2. Identify all food-related places (such as restaurants, stalls, farms, or producers) that are mentioned with enough context to extract structured data.
        3. For each qualifying place:
            - Evaluate if the name appears misspelled, inaccurately transcribed, or phonetically approximated. Where possible, confidently determine and use the accurate, official name; otherwise, retain the transcript name.
            - Extract and organize the following fields:
                - **restaurant_name**: The (corrected) name of the place (string, or null if unclear, generic, or not provided).
                - **location**: An object containing:
                    - **city**: City name (if determinable) or null.
                    - **county**: County/region/province (if provided) or null.
                    - **country**: Country (if determinable) or null.
                - **context**: Up to 4 notable or sentiment-rich direct quotes/lines from the transcript mentioning this place; preserve quotation marks for direct quotes. Use null if no such context exists.
                - **tags**: An array of descriptive tags about food, experience, or cuisine (examples: "BBQ", "vegan", "Michelin-starred"). Use an empty array if no tags apply.
                - **confidence_score**: A float from 0.0 to 1.0 reflecting your confidence in the correctness and completeness of extracted information, including name correction where applicable.
        4. If no valid food-related place can be extracted confidently based on the transcript, return a single empty JSON object: {}.
        5. If there are multiple qualifying places, return a JSON array where each entry matches the schema.
        6. Do not provide explanations, notes, or reasoning in your answer. All output must be strictly valid JSON, matching the schema exactly and containing nothing but the data.

        # Output Format

        - Return a single JSON array [] if no qualifying food-related place is found.
        - Don't include objects that don't match the schema or have null restaurant names.
        - For one or more valid places, return a JSON array, each element formatted as:

        {
        "restaurant_name": "string or null",
        "location": {
            "city": "string or null",
            "county": "string or null",
            "country": "string or null"
        },
        "context": ["string", "..."] or null,
        "tags": ["tag1", "tag2", "..."],
        "confidence_score": float (0.0–1.0)
        }

        - Use null for missing fields, and [] for tags if none apply.
        - Always preserve quotation marks in context if the original line is a direct quote.
        - Do not include any non-JSON content, explanations, or commentary.
        - Strictly adhere to JSON syntax and schema.

        # Examples

        **Example 1**  
        Transcript:  
        "So today we're at Al Habib BBQ in Lahore, and the aroma here is just amazing. Honestly, this might be the juiciest chicken tikka I've had on this trip."

        Output:
        [
        {
            "restaurant_name": "Al Habib BBQ",
            "location": {
                "city": "Lahore",
                "county": null,
                "country": "Pakistan"
            },
            "quotes": [
                "So today we're at Al Habib BBQ in Lahore.",
                "Honestly, this might be the juiciest chicken tikka I've had on this trip."
            ],
            "tags": ["BBQ", "chicken tikka", "Pakistani"],
            "confidence_score": 0.95
        }
        ]

        **Example 2**  
        Transcript:  
        "We've been walking along Nimmanhaemin Road, trying the best street food Chiang Mai has to offer."

        Output:
        []

        **Example 3**  
        Transcript:  
        "We started off at The Oyster Shed, then grabbed a sandwich at Bread Me Up, both located near the harbor in Portree on the Isle of Skye."

        Output:
        [
        {
            "restaurant_name": "The Oyster Shed",
            "location": {
                "city": "Portree",
                "county": "Isle of Skye",
                "country": "United Kingdom"
            },
            "context": [
                "We started off at The Oyster Shed"
            ],
            "tags": ["seafood", "harbor"],
            "confidence_score": 0.85
        },
        {
            "restaurant_name": "Bread Me Up",
            "location": {
                "city": "Portree",
                "county": "Isle of Skye",
                "country": "United Kingdom"
            },
            "context": [
                "Grabbed a sandwich at Bread Me Up"
            ],
            "tags": ["sandwich", "bakery"],
            "confidence_score": 0.8
        }
        ]

        **Example 4**  
        Transcript:  
        "And finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right—but the chef is famous for modern Korean tasting menus."

        Output:
        [
        {
            "restaurant_name": "JungSik",
            "location": {
                "city": null,
                "county": null,
                "country": "South Korea"
            },
            "context": [
                "Finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right.",
                "The chef is famous for modern Korean tasting menus."
            ],
            "tags": ["modern Korean", "tasting menu"],
            "confidence_score": 0.85
        }
        ]

        # Notes
        - If you identify a probable misspelling or pronunciation variant, correct the name to its standard form only when confident, based on context and known restaurant/cuisine information.
        - Do not infer or hallucinate information. Output only what is supported by the transcript and, in the case of name corrections, is supported by clear evidence or external verification.
        - Return null for missing values and [] for tags if not applicable.
        - Do not included objects with null restaurant_name or no context.
        - If multiple food places are present, return each as a separate object in the JSON array.
        - Responses must be strictly valid JSON, with no commentary or formatting outside the data schema.

        REMINDER: Your most important tasks are to: extract only what is clearly stated, correct obvious misspelled or phonetically transcribed names with high confidence, organize output in a strictly valid JSON schema as shown above, and include no commentary—return only the data.
        """

    async def process_chunk(self, chunk: str, index: int, total_chunks: int) -> list:
        """
        Process a single chunk of transcription text using GPT-4.
        
        Args:
            chunk: The text chunk to process
            index: The index of the chunk
            total_chunks: Total number of chunks
            
        Returns:
            List of extracted entities for this chunk
        """
        user_prompt = f"""
        Chunk {index+1}/{total_chunks}:
        {chunk}
        """

        logger.info(f"Processing chunk {index+1}/{total_chunks}: {user_prompt}")

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.openai_client.chat.completions.create(
                    model="gpt-4.1",
                    temperature=1,
                    max_tokens=self.chunk_size,
                    messages=[
                        {"role": "system", "content": self.system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                ),
            )
            content = response.choices[0].message.content.strip()
            try:
                parsed = json.loads(content)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict):
                    return [parsed]
                else:
                    logger.warning(f"Unexpected format in chunk {index+1}: {content}")
                    return []
            except json.JSONDecodeError as je:
                logger.error(f"JSON decode failed for chunk {index+1}: {je} | Content: {content}")
                return []
        except Exception as e:
            logger.error(f"Chunk {index+1} processing failed: {e}")
            return []

    async def extract_entities(self, transcription: str) -> list:
        """
        Extract food-related entities from a transcription.
        
        Args:
            transcription: The full transcription text to process
            
        Returns:
            List of extracted entities in JSON format
        """
        # Split into manageable chunks
        chunks = textwrap.wrap(
            transcription,
            self.chunk_size,
            break_long_words=False,
            break_on_hyphens=False
        )
        
        # Process chunks concurrently
        tasks = [self.process_chunk(chunk, idx, len(chunks)) for idx, chunk in enumerate(chunks)]
        results = await asyncio.gather(*tasks)

        # Flatten results and filter valid entities
        flat_results = [
            entity for chunk in results for entity in chunk
            if entity and entity.get("restaurant_name") is not None
        ]

        logger.info(f"Processed {len(flat_results)} entities: {json.dumps(flat_results, indent=2)}")

        return flat_results