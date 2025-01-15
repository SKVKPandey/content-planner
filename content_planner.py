import random
from datetime import datetime, timedelta
from openai import OpenAI
from re import search, sub
from emoji import replace_emoji

client = OpenAI(
    api_key='REDACTED',
)

# Function to generate a random date within the specified range
def random_date(start_date, end_date):
    start_timestamp = start_date.timestamp()
    end_timestamp = end_date.timestamp()
    random_timestamp = random.randint(start_timestamp, end_timestamp)
    random_date = datetime.fromtimestamp(random_timestamp)
    return random_date.strftime("%Y-%m-%d")  # Change format to 'YYYY-MM-DD'

# Function to generate a random time between 9 AM and 7 PM
def random_time():
    possible_times = ["09:00 AM", "10:00 AM", "12:00 PM", "01:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"]
    return random.choice(possible_times)

# Function to call OpenAI API for post suggestions
def get_openai_post_suggestions(topic, description, goal, audience, platform):

    prompt = (f"Create a social media post suggestion (give only the title for the post in one sentence/phrase) for {platform} targeted at a {audience} audience. "
              f"The goal of the post is {goal} of social media platform, the topic is {topic}. ")
    
    # Add description to the prompt if it's provided
    if description:
        prompt += f"The description for the post is: {description}. "

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.7
    )

    # Debug: Print the response from OpenAI to inspect it
    print("OpenAI Response:", response.choices[0].message.content)

    return response.choices[0].message.content


# Function to call OpenAI API for post suggestions
def get_openai_post_suggestions(topic, description, goal, audience, platform):

    prompt = (f"Create a social media post suggestion (give only the title for the post in one sentence/phrase) for {platform} targeted at a {audience} audience. "
              f"The goal of the post is {goal} of social media platform, the topic is {topic}. ")
    
    # Add description to the prompt if it's provided
    if description:
        prompt += f"The description for the post is: {description}. "

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.7
    )

    # Debug: Print the response from OpenAI to inspect it
    print("OpenAI Response:", response.choices[0].message.content)

    return response.choices[0].message.content

# Function to call OpenAI API for image description
def get_image_description(topic, platform, audience="general", goal="engagement"):
    prompt = (f"A short, catchy description (in a small paragraph) for an image post on {platform} targeting a {audience} audience. "
          f"The goal of this post is to {goal}. The topic of the post is '{topic}'. "
          f"Ensure the description highlights platform-specific visual elements, trends, and style preferences.")
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100,
        temperature=0.7
    )

    # Debug: Print the response from OpenAI to inspect it
    print("OpenAI Image Description Response:", response.choices[0].message.content)

    return response.choices[0].message.content


# Function to call OpenAI API for caption description
def get_caption_description(topic, platform, audience="general", goal="engagement"):
    prompt = (f"Write an engaging caption for a post on {platform} about the topic '{topic}', targeted at a {audience} audience. "
              f"The goal is {goal}. Ensure the caption is aligned with the tone of {platform}, concise, and includes relevant hashtags or emojis.")
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500,
        temperature=0.7
    )

    # Debug: Print the response from OpenAI to inspect it
    print("OpenAI Caption Description Response:", response.choices[0].message.content)

    return response.choices[0].message.content

def sanitize_identity(identity):
    import re
    
    # Replace emojis with a placeholder or remove them
    identity = replace_emoji(identity, replace='')

    # Replace invalid characters with allowed substitutes
    identity = identity.replace(':', '-').replace('.', '-').replace(' ', '').replace('/', '-')

    # Remove special characters not allowed in Firestore paths
    identity = re.sub(r'[~#\[\]*]', '', identity)
    
    # Ensure no leading or trailing spaces (though unlikely after other replacements)
    identity = identity.strip()
    
    return identity

def promptReply(contentType, userContent, userPrompt, topic):
    prompt = (f'''Make changes in this {contentType} description:'{userContent}' in accordance to the given prompt:'{userPrompt}' for the topic:'{topic}' ''')
    

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=150,
        temperature=0.7
    )

    # Debug: Print the response from OpenAI to inspect it
    print("OpenAI Response:", response.choices[0].message.content)

    return response.choices[0].message.content

# Sample function to generate the content plan table
def generate_content_plan(topic, description, goal, audience, platforms, frequency, start_date, end_date, suggestions):
    table_data = []

    # Convert start_date and end_date to datetime objects for date range calculations
    start_date = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime.now() + timedelta(days=1)  # Change format to 'YYYY-MM-DD'
    end_date = datetime.strptime(end_date, "%Y-%m-%d") if end_date else datetime.now() + timedelta(days=70)  # Change format to 'YYYY-MM-DD'

    for i in range(int(frequency)):
        for platform in platforms:
            # Get OpenAI-generated post suggestion, including title, date, and time
            post_title = get_openai_post_suggestions(topic, description, goal, audience, platform).replace("OpenAI Response: ", "").replace('"', '')
            image_description = None
            caption_description = None

            if 'Image' in suggestions:
                image_description = get_image_description(post_title, platform, audience, goal)

            if 'Caption' in suggestions:
                caption_description = get_caption_description(post_title, platform, audience, goal)

            random_post_date = random_date(start_date, end_date)
            random_post_time = random_time()

            uniquePostID = sanitize_identity(str(random_post_date) + str(random_post_time) + str(platform))
            print(uniquePostID)

            table_data.append({
                "uniquePostID": uniquePostID,
                "Date": random_post_date,
                "Time": random_post_time,
                "Platform": platform,
                "Post Title": post_title,
                "Goal": goal,
                "Audience": audience,
                "imgDesc": image_description,
                "capDesc": caption_description
            })
    
    # Sort the table data by Date and Time to display in chronological order
    sorted_table_data = sorted(table_data, key=lambda x: (datetime.strptime(x["Date"], "%Y-%m-%d"), x["Time"]))  # Change format to 'YYYY-MM-DD'
    return sorted_table_data
