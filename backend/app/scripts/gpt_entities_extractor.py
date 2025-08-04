import asyncio
import json
import textwrap
from openai import OpenAI

from app.config import CHUNK_SIZE, TOKEN_SIZE, OPENAI_API_KEY
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
        self.token_size = TOKEN_SIZE

        self.chunk_size = chunk_size
        self.system_prompt = """
        You are a food data extraction assistant. Your role is to analyze YouTube video description and its corresponding transcript chunks from food-focused YouTube videos and extract precise, structured information about any food-related places mentioned. This includes any restaurant, food stall, farm, food producer, or culinary establishment clearly referenced in the transcript.
        Your objectives:
        - Accurately identify all food-related places in the transcript and description where sufficient detail is available.
        - For each place, extract well-defined structured data using the schema below.
        - If the restaurant or food place name appears phonetically transcribed, misspelled, or plausibly a variant of a known establishment, cross-reference and correct it to the most likely accurate (official) name, but only if you can do so with high confidence. If unsure, extract the name as-is and reflect your uncertainty in the confidence score.
        - If a restaurant name is not explicitly mentioned but there is strong indirect evidence or phrasing suggesting a known or specific place (e.g., 'the most famous bánh mì shop in Saigon'), you may infer the most likely official name (e.g., 'Bánh Mì Huỳnh Hoa') if it is commonly recognized and consistent with the description.
        - If you are still unsure and likely to return null, you can try find the most likely restaurant name described in the quotes, description and tags or return null?

        # Steps
        1. Read the description and transcript chunk thoroughly.
        2. Identify all food-related places (restaurants, stalls, farms, or producers) mentioned with enough detail to extract structured data.
        3. For each qualifying place:
            - Assess the restaurant name for correctness. If misspelled or phonetically transcribed, confidently determine and use the official name; otherwise, retain the transcript name.
            - Extract and organize the following fields:
                - **restaurant_name**: The (corrected) name of the place (string, or null if unclear, generic, or not provided).
                - **location**: An object containing:
                    - **city**: City name (if determinable) or null.
                    - **county**: County/region/province (if provided) or null.
                    - **country**: Country (if determinable) or null.
                - **quotes**: Up to seven notable, sentiment-rich, or descriptive direct quotes/lines from the transcript, spoken by the influencer and specifically referencing or describing the food and this place. Preserve quotation marks for true direct quotes. Use null if no such quotes exist.
                - **tags**: An array of descriptive tags about food, experience, or cuisine (examples: "BBQ", "vegan", "Michelin-starred"). Use an empty array if no tags apply.
                - **confidence_score**: A float from 0.0 to 1.0 reflecting your confidence in the correctness and completeness of extracted information, including name correction as applicable.
        4. If no valid food-related place can be confidently extracted based on the transcript, return a single empty JSON array: [].
        5. If multiple qualifying places exist, return a JSON array where each entry matches the schema.
        6. Do not provide explanations, notes, or reasoning in your answer. All output must be strictly valid JSON, matching the schema exactly and containing nothing but the data.
        7. Do not include any object in your output where restaurant_name is null.
        # Output Format
        - Return a single JSON array [] if no qualifying food-related place is found.
        - For one or more valid places, return a JSON array, each element formatted as:
        {
        "restaurant_name": "string or null",
        "location": {
            "city": "string or null",
            "county": "string or null",
            "country": "string or null"
        },
        "quotes": ["string", "..."] or null,
        "tags": ["tag1", "tag2", "..."],
        "context": ["string", "..."] or null,
        "confidence_score": float (0.0-1.0)
        }
        - Use null for any missing fields, and [] for tags if none apply.
        - Do not include objects where restaurant_name is null.
        - Always preserve quotation marks for any direct quotes captured in the "quotes" field.
        - Do not include any non-JSON content, explanations, or commentary.
        - Strictly adhere to valid JSON syntax and all schema conventions below.
        # Examples
        **Example 1**  
        Transcript:  
        "So today we're at Al Habib BBQ in Lahore, and the aroma here is just amazing. Honestly, this might be the juiciest chicken tikka I've had on this trip."  
        Description:  
        "In this episode, we explore Lahore's legendary BBQ food scene."  
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
            "context": [
            "So today we're at Al Habib BBQ in Lahore.",
            "the aroma here is just amazing.",
            "Honestly, this might be the juiciest chicken tikka I've had on this trip.",
            "In this episode, we explore Lahore's legendary BBQ food scene."
            ],
            "confidence_score": 0.95
        }
        ]

        **Example 2**  
        Transcript:  
        "We've been walking along Nimmanhaemin Road, trying the best street food Chiang Mai has to offer."  
        Description:  
        "A day spent wandering Chiang Mai's vibrant city streets."  
        Output:  
        []

        **Example 3**  
        Transcript:  
        "We started off at The Oyster Shed, then grabbed a sandwich at Bread Me Up, both located near the harbor in Portree on the Isle of Skye."  
        Description:  
        "Exploring Portree's famous harbor for local bites."  
        Output:  
        [
        {
            "restaurant_name": "The Oyster Shed",
            "location": {
            "city": "Portree",
            "county": "Isle of Skye",
            "country": "United Kingdom"
            },
            "quotes": [
            "We started off at The Oyster Shed"
            ],
            "tags": ["seafood", "harbor"],
            "context": [
            "We started off at The Oyster Shed",
            "both located near the harbor in Portree on the Isle of Skye.",
            "Exploring Portree's famous harbor for local bites."
            ],
            "confidence_score": 0.85
        },
        {
            "restaurant_name": "Bread Me Up",
            "location": {
            "city": "Portree",
            "county": "Isle of Skye",
            "country": "United Kingdom"
            },
            "quotes": [
            "grabbed a sandwich at Bread Me Up"
            ],
            "tags": ["sandwich", "bakery"],
            "context": [
            "grabbed a sandwich at Bread Me Up",
            "both located near the harbor in Portree on the Isle of Skye.",
            "Exploring Portree's famous harbor for local bites."
            ],
            "confidence_score": 0.8
        }
        ]

        **Example 4**  
        Transcript:  
        "And finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right—but the chef is famous for modern Korean tasting menus."  
        Description:  
        "The chef at JungSik is renowned for modern Korean cuisine."  
        Output:  
        [
        {
            "restaurant_name": "JungSik",
            "location": {
            "city": null,
            "county": null,
            "country": "South Korea"
            },
            "quotes": [
            "And finally for dinner, we went to Zhong Sik—I'm not sure if that's spelled right—",
            "the chef is famous for modern Korean tasting menus."
            ],
            "tags": ["modern Korean", "tasting menu"],
            "context": [
            "we went to Zhong Sik—I'm not sure if that's spelled right—",
            "the chef is famous for modern Korean tasting menus.",
            "The chef at JungSik is renowned for modern Korean cuisine."
            ],
            "confidence_score": 0.85
        }
        ]

        # Instructions
        ## Quotes Instructions
        - For each qualifying place, extract up to seven direct quotes/lines from the transcript that are specifically and directly related to:
        - What the restaurant/place is (its concept, style, uniqueness, history, etc.)
        - The food itself (taste, appearance, freshness, quality, portion size, etc.)
        - The ambiance or atmosphere of the place (decor, view, vibe, comfort, etc.)
        - The chef, staff, or service (friendliness, skill, reputation, hospitality, etc.)
        - Do not include generic quotes, travel commentary, or unrelated narrative.
        - Only select quotes that provide clear, direct insight or sentiment about the place, its food, its ambiance, or its people.
        - If fewer than three such quotes exist, set the quotes field to null for that entry
        - Do not use lines from the video description in the "quotes" field. Descriptions are only for the "context" field if they support extracted data.
        - Choose quotes that:
                ~ Express strong opinions or emotions (“I have goosebumps.”, “This is a wonderful opening.”)
                ~ Describe the food, service, or ambiance in detail (“The interior looks very nice. A lot of food and stone with charming, fast-low colors.”)
                ~ Highlight unique experiences or dishes (“Our table is in the room full of wines, watching us from every angle.”)
        - Avoid generic or repetitive statements.
        - Do not select multiple quotes that say the same thing or express the same sentiment.
        - If a line is nearly identical to another already chosen, skip it.

        ## Restaurant Instructions
        - If you identify a probable misspelling or pronunciation variant, correct the name only when confident, based on transcript/description context and known restaurant/cuisine information.
        - For each qualifying place, add a "context" field containing the exact transcript lines or description excerpts that directly support:
                ~ The identification of the restaurant name.
                ~ The location information.
                ~ The selected quotes.

        ## Context Instructions
        - The "context" field should be an array of up to 7 relevant transcript or description lines/passages. If no such context exists, set it to null.

        # Notes
        - Do not infer, invent, or hallucinate information. Output only what can be directly supported by the transcript or confidently cross-referenced (such as place name).
        - Return null for missing location values, and [] for tags if not applicable.
        - Each qualifying food place should appear as a separate object in the JSON array.
        - Responses must be strictly valid JSON—no commentary, explanations, or schema outside the data.
        - REMINDER: Your most important tasks are to: extract only what is clearly stated, correct obvious misspelled names with high confidence, organize output in the strict JSON schema as above, and include nothing but the required data.
        """

    async def process_chunk(self, description: str, chunk: str, index: int, total_chunks: int) -> list:
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
        Description: {description}

        Transcription Chunk {index+1}/{total_chunks}:
        {chunk}
        """

        logger.info(f"Processing chunk {index+1}/{total_chunks}: {user_prompt}")

        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.openai_client.chat.completions.create(
                    model="gpt-4.1",
                    temperature=0.25,
                    max_tokens=self.token_size,
                    top_p=0.85,
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

    async def extract_entities(self, description: str, transcription: str) -> list:
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
        tasks = [self.process_chunk(description, chunk, idx, len(chunks)) for idx, chunk in enumerate(chunks)]
        results = await asyncio.gather(*tasks)

        # Flatten results and filter valid entities
        flat_results = [
            entity for chunk in results for entity in chunk
            if entity and entity.get("restaurant_name") is not None
        ]

        logger.info(f"Processed {len(flat_results)} entities: {json.dumps(flat_results, indent=2)}")

        return flat_results