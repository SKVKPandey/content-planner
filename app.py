from flask import Flask, render_template, request, jsonify, session, redirect
from datetime import datetime, timedelta
import os
import sqlite3
from apscheduler.schedulers.background import BackgroundScheduler
import json
from firebase_admin import initialize_app, credentials, auth, storage, db as firebase_db
from notification_system import check_and_send_notifications
from content_planner import generate_content_plan, get_image_description, get_caption_description, promptReply
from emoji import replace_emoji
import hashlib
from ast import literal_eval

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
initialize_app(cred, {
    'databaseURL': 'https://likhlo-ai-default-rtdb.asia-southeast1.firebasedatabase.app/',
    'storageBucket': 'likhlo-ai.appspot.com'  
})

app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

# Set session timeout duration
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

def hash_identity(identity):
    return hashlib.md5(identity.encode()).hexdigest()

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

@app.before_request
def make_session_permanent():
    """
    Make the session permanent so it lasts as configured.
    Refresh the session lifetime on every request.
    """
    session.permanent = True

# Load Firebase Web App Configuration
with open('serviceAccountKey.json') as f:
    firebase_web_config = json.load(f)

# Initialize Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

# Utility function to parse date with different formats
def parse_date(date_str):
    """Parse date string with different formats."""
    for fmt in ["%A, %d-%B-%Y", "%Y-%m-%d"]:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Date {date_str} does not match any expected formats.")

# Schedule the check_and_send_notifications function to run every minute
scheduler.add_job(func=check_and_send_notifications, trigger="interval", seconds=60)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    return render_template('login.html', firebase_web_config=firebase_web_config)

@app.route('/logout', methods=['GET', 'POST'])
def logout():
    # Perform logout logic here
    session.clear()  # Example: clearing session data
    return redirect('/')  # Redirect to login or home page

@app.route('/verify', methods=['POST'])
def verify():
    return jsonify(success=True)
    
@app.route('/google-login', methods=['POST'])
def google_login():
    data = request.json
    uid = data['uid']
    email = data['email']
    profile_image = data.get('profileImage')  # Retrieve profile image

    # Check if the user exists
    try:
        user = auth.get_user(uid)
    except:
        # If user doesn't exist, create a new user
        user = auth.create_user(uid=uid, email=email)

    # Save user info in session
    session['user'] = {
        'uid': user.uid,
        'email': user.email,
        'profileImage': profile_image,  # Save profile image in session
        'login_time': datetime.now().isoformat(),
    }

    return jsonify({'success': True})

@app.route('/imgDescPrompt', methods=['POST'])
def imgDescPrompt():
    data = request.get_json()
    textarea_content = data.get('textarea', '')
    input_content = data.get('input', '')
    topic_content = data.get('topic', '')

    # Process the input and textarea content
    updated_textarea_content = promptReply('Image',textarea_content, input_content, topic_content)

    # Return the updated content
    return jsonify({'textarea': updated_textarea_content})

@app.route('/capDescPrompt', methods=['POST'])
def capDescPrompt():
    data = request.get_json()
    textarea_content = data.get('textarea', '')
    input_content = data.get('input', '')
    topic_content = data.get('topic', '')

    # Process the input and textarea content
    updated_textarea_content = promptReply('Caption',textarea_content, input_content, topic_content)

    # Return the updated content
    return jsonify({'textarea': updated_textarea_content})

@app.route('/contentPlanner', methods=['GET', 'POST'])
def contentPlanner():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in
    
    if request.method == 'POST':
        
        # Gather input from form
        topic = request.form.get('topic')
        description = request.form.get('description') or None
        goal = request.form.get('goal')
        audience = request.form.get('audience')
        platforms = request.form.getlist('platforms')
        frequency = request.form.get('frequency')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        suggestions = request.form.getlist('suggestion')

        if goal == 'on':
            goal = request.form.get('goal_others')
        if audience == 'on':
            audience = request.form.get('audience_others')

        # Check for missing fields
        if not all([goal, audience, platforms, frequency, topic, start_date, end_date, suggestions]):
            return "Please fill out all fields.", 400

        # Generate content plan using OpenAI API
        content_plan = generate_content_plan(topic, description, goal, audience, platforms, frequency, start_date, end_date, suggestions)
        
        return render_template('content_plan.html', content_plan=content_plan)

    return render_template('form.html')

# @app.route('/save_content_plan', methods=['POST'])
# def save_content_plan():
#     # Check if the user is logged in
#     if 'user' not in session:
#         return redirect('/login')  # Redirect to the login page if not logged in
    
#     data = request.json
#     print(data)

#     connection = sqlite3.connect('content_plan.db')
#     cursor = connection.cursor()
    
#     # Create the table if it doesn't exist
#     cursor.execute(''' 
#         CREATE TABLE IF NOT EXISTS content_plan (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             date TEXT,
#             time TEXT,
#             platform TEXT,
#             post_title TEXT
#         )
#     ''')

#     for entry in data:
#         original_date = entry['date']
        
#         try:
#             # Check if the date is already in the correct format (yyyy-mm-dd)
#             if len(original_date.split('-')) == 3 and original_date.count('-') == 2:
#                 formatted_date = original_date  # Already in yyyy-mm-dd
#             else:
#                 # Parse and format the date into 'yyyy-mm-dd'
#                 formatted_date = datetime.strptime(original_date, '%A, %d-%B-%Y').strftime('%Y-%m-%d')
#         except ValueError as e:
#             print(f"Error processing date: {original_date}. Error: {e}")
#             return jsonify({'error': f"Invalid date format for {original_date}"}), 400
        
#         # Insert the data into the database
#         cursor.execute('''
#             INSERT INTO content_plan (date, time, platform, post_title)
#             VALUES (?, ?, ?, ?)
#         ''', (formatted_date, entry['time'], entry['platform'], entry['postTitle']))

#     print("Data inserted successfully")  # Debug print
    
#     connection.commit()
#     connection.close()

#     return jsonify({'message': 'Content plan saved successfully!'})
@app.route('/save_content_plan', methods=['POST'])
def save_content_plan():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in
    
    user_id = session['user']['uid']

    data = request.json

    for entry in data:
        original_date = entry['date']

        try:
            # Normalize the date to 'YYYY-MM-DD' format
            if '-' in original_date and len(original_date.split('-')) == 3:
                try:
                    # Attempt to parse as 'YYYY-MM-DD'
                    formatted_date = datetime.strptime(original_date, '%Y-%m-%d').strftime('%Y-%m-%d')
                except ValueError:
                    # Attempt to parse as 'Thursday, 02-January-2025' if the above fails
                    formatted_date = datetime.strptime(original_date, '%A, %d-%B-%Y').strftime('%Y-%m-%d')
            else:
                # Parse as verbose format
                formatted_date = datetime.strptime(original_date, '%A, %d-%B-%Y').strftime('%Y-%m-%d')
        except ValueError as e:
            print(f"Error processing date: {original_date}. Error: {e}")
            return jsonify({'error': f"Invalid date format for {original_date}"}), 400

        # Prepare the data to be stored
        doc_data = {
            'date': formatted_date,  # Ensure date is saved in 'YYYY-MM-DD'
            'time': entry['time'],
            'platform': entry['platform'],
            'post_title': entry['postTitle'],
            'imgDesc': entry['imgDesc'],
            'capDesc': entry['capDesc']
        }

        # uniquePostID = sanitize_identity(
        #     hash_identity(
        #         str(doc_data['date']) + str(doc_data['time']) + str(doc_data['platform']) + str(doc_data['post_title'])
        #     )
        # )

        uniquePostID = entry['uniquePostID']  # Check if uniquePostID is provided
        if not uniquePostID:  # If not provided, generate it
            uniquePostID = sanitize_identity(
                str(doc_data['date']) + str(doc_data['time']) + str(doc_data['platform'])
            )

        # Add the data to Firestore
        try:
            dataPath = f'/{user_id}/contentPlan/{uniquePostID}'
            ref = firebase_db.reference(dataPath)
            ref.set(doc_data)
        except Exception as e:
            print(f"Error inserting data into Firestore: {e}")
            return jsonify({'error': 'Failed to save content plan'}), 500

    return jsonify({'message': 'Content plan saved successfully!'})

@app.route('/delete_content_plan', methods=['POST'])
def delete_content_plan():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in
    
    user_id = session['user']['uid']

    data = request.json
    postData = data.get('postData')

    if not postData:
        return jsonify({'error': 'Missing uniquePostID'}), 400

    try:
        formatedDate = datetime.strptime(postData[0], '%A, %d-%B-%Y').strftime('%Y-%m-%d')
        uniquePostID = sanitize_identity(formatedDate+postData[1]+postData[2])
        # Delete the entry from Firestore
        dataPath = f'/{user_id}/contentPlan/{uniquePostID}'
        ref = firebase_db.reference(dataPath)
        ref.delete()
    except Exception as e:
        print(f"Error deleting data from Firestore: {e}")
        return jsonify({'error': 'Failed to delete content plan'}), 500

    return jsonify({'message': 'Content plan deleted successfully!'})

@app.route('/content_plan_table')
def content_plan_table():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in

    user_id = session['user']['uid']
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    if year and month:
        # Convert month number to month name
        month_name = datetime(year, month, 1).strftime('%B')

        try:
            # Define the path to the content plans in Firebase
            data_path = f'/{user_id}/contentPlan'
            ref = firebase_db.reference(data_path)
            
            # Fetch all content plan data for the user
            content_plan_data = ref.get()

            if not content_plan_data:
                return render_template('content_plan.html', content_plan=[])  # No data found

            # Helper function to parse time with multiple formats
            def parse_time(time_str):
                for fmt in ("%I:%M %p", "%H:%M"):
                    try:
                        return datetime.strptime(time_str, fmt)
                    except ValueError:
                        continue
                raise ValueError(f"Time data '{time_str}' does not match expected formats.")

            # Filter and format the data for the specified year and month
            table_data = []
            for post_id, post_details in content_plan_data.items():
                post_date = post_details.get('date')
                post_time = post_details.get('time')
                platform = post_details.get('platform')
                post_title = post_details.get('post_title')
                imgDesc = post_details.get('imgDesc')
                capDesc = post_details.get('capDesc')

                uniquePostID = sanitize_identity(str(post_date) + str(post_time) + str(platform))

                # Parse the date and check if it matches the specified month and year
                try:
                    post_date_obj = datetime.strptime(post_date, "%Y-%m-%d")
                    if post_date_obj.year == year and post_date_obj.month == month:
                        try:
                            post_time_obj = parse_time(post_time)
                            table_data.append({
                                "uniquePostID": uniquePostID,
                                "Date": post_date,
                                "Time": post_time_obj.strftime("%I:%M %p"),
                                "Platform": platform,
                                "Post Title": post_title,
                                "imgDesc": imgDesc,
                                "capDesc": capDesc
                            })
                        except ValueError as e:
                            print(f"Error parsing time: {post_time}. Error: {e}")
                except ValueError as e:
                    print(f"Error parsing date: {post_date}. Error: {e}")

            # Sort the table data by Date and Time to display in chronological order
            sorted_table_data = sorted(table_data, key=lambda x: (
                datetime.strptime(x["Date"], "%Y-%m-%d"),  # Sort by date in %Y-%m-%d format
                datetime.strptime(x["Time"], "%I:%M %p")  # Sort by time in %I:%M %p format
            ))

            # Render the content_plan.html template with the sorted data
            return render_template('content_plan.html', content_plan=sorted_table_data)

        except Exception as e:
            print(f"Error fetching data from Firebase: {e}")
            return jsonify({'error': 'Failed to fetch content plan data'}), 500

    else:
        return render_template('content_plan.html')

@app.route('/calendarView')
def calendar_view():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in
    
    return render_template('calendar_view.html')  # Ensure 'calendar.html' exists in the templates folder
@app.route('/generateImageDescription', methods=['GET'])
def generate_image_description():
    # Fetch the ID from query params
    parent_id = request.args.get('id')
    if not parent_id:
        return jsonify({"status": "error", "message": "No ID provided"}), 400

    # Sanitize the parent_id
    parent_id = parent_id.strip()

    # Get the user ID from session
    user_id = session.get('user', {}).get('uid')
    if not user_id:
        return jsonify({"status": "error", "message": "User not authenticated"}), 401

    dataPath = f"{user_id}/contentPlan"
    print(f"Data path: {dataPath}")

    try:
        # Fetch data from Firestore
        ref = firebase_db.reference(dataPath)
        docs = ref.get() or {}  # Fetch data as a dictionary

        # Check if parent_id exists in docs
        if parent_id not in docs:
            return jsonify({"status": "error", "message": f"No such post found for the provided ID: {parent_id}"}), 404

        # Access the post data
        post_data = docs[parent_id]
        post_title = post_data.get('post_title')
        platform = post_data.get('platform')

        if not post_title or not platform:
            return jsonify({"status": "error", "message": "Incomplete content plan data"}), 400

        # Call the function to generate the image description
        image_description = get_image_description(post_title, platform)

        # Return success response with description
        return jsonify({"status": "success", "description": image_description}), 200

    except Exception as e:
        print(f"Error fetching data from Firestore: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch content plan"}), 500


@app.route('/generateCaptionDescription', methods=['GET'])
def generate_caption_description():
    # Fetch the ID from query params
    parent_id = request.args.get('id')
    if not parent_id:
        return jsonify({"status": "error", "message": "No ID provided"}), 400

    # Get the user ID from session
    user_id = session.get('user', {}).get('uid')
    if not user_id:
        return jsonify({"status": "error", "message": "User not authenticated"}), 401

    dataPath = f"{user_id}/contentPlan/{parent_id}"

    try:
        # Fetch data from Firestore
        ref = firebase_db.reference(dataPath)
        docs = ref.get() or {}  # Fetch data as a dictionary

        # Check if required keys exist
        post_title = docs.get('post_title')
        platform = docs.get('platform')

        if not post_title or not platform:
            return jsonify({"status": "error", "message": "Incomplete content plan data"}), 400

        # Call the function to generate the caption description
        caption_description = get_caption_description(post_title, platform)

        # Return success response with description
        return jsonify({"status": "success", "description": caption_description}), 200

    except Exception as e:
        print(f"Error fetching data from Firestore: {e}")
        return jsonify({"status": "error", "message": "Failed to fetch content plan"}), 500
    
@app.route('/submit_preferences', methods=['POST'])
def submit_preferences():
    try:
        # Get JSON data from the request
        data = request.get_json()

        # Extract preferences
        tone = data.get('tone')
        language = data.get('language')
        include_emoji = data.get('include_emoji', False)  # Default to False
        formality_level = data.get('formality_level', 5)  # Default formality level to 5
        word_count = data.get('word_count', 200)  # Default word count to 200
        target_audience = data.get('target_audience')

        # Process preferences as needed (e.g., store in a database, generate content, etc.)
        print("Received preferences:")
        print(f"Tone: {tone}, Language: {language}, Include Emoji: {include_emoji}, "
              f"Formality Level: {formality_level}, Word Count: {word_count}, "
              f"Target Audience: {target_audience}")

        # Respond to the client
        return jsonify({"status": "success", "message": "Preferences received!"}), 200
    except Exception as e:
        print(f"Error processing preferences: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/get_events', methods=['GET'])
def get_events():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in

    # Define platform colors
    platform_colors = {
        "Instagram": {"backgroundColor": "#E4405F", "borderColor": "#C13584"},  # Instagram Pink
        "Facebook": {"backgroundColor": "#3b5998", "borderColor": "#2d4373"},   # Facebook Blue
        "Twitter(X)": {"backgroundColor": "#1DA1F2", "borderColor": "#1A91DA"}, # Twitter Blue
        "Reddit": {"backgroundColor": "#FF4500", "borderColor": "#CC3700"},     # Reddit Orange
        "WhatsApp": {"backgroundColor": "#25D366", "borderColor": "#128C7E"},  # WhatsApp Green
    }
    default_color = {"backgroundColor": "#C0C0C0", "borderColor": "#A9A9A9"}  # Default silver-gray

    user_id = session['user']['uid']
    dataPath = f"{user_id}/contentPlan"

    # Fetch events from Firestore
    try:
        ref = firebase_db.reference(dataPath)
        docs = ref.get() or {}  # Fetch data as a dictionary
    except Exception as e:
        print(f"Error fetching data from Firestore: {e}")
        return jsonify({'error': 'Failed to fetch events'}), 500

    # Prepare events list
    events = []
    for doc_id, data in docs.items():
        try:
            event_date = datetime.strptime(data['date'], "%Y-%m-%d").strftime("%Y-%m-%d")
            event_time_str = data['time']

            # Parse time into 24-hour format
            try:
                event_time = datetime.strptime(event_time_str, "%I:%M %p").strftime("%H:%M")
            except ValueError:
                event_time = datetime.strptime(event_time_str, "%H:%M").strftime("%H:%M")

            platform = data.get('platform', 'Unknown')
            imgDesc = data.get('imgDesc', '')
            capDesc = data.get('capDesc', '')
            color = platform_colors.get(platform, default_color)

            uniquePostID = sanitize_identity(str(event_date) + str(data['time']) + str(platform))

            # Append the event
            events.append({
                "uniquePostID": uniquePostID,
                "title": data.get('post_title', 'No Title'),
                "start": f"{event_date}T{event_time}",
                "date": event_date,
                "time": event_time,
                "description": f"{platform}: {data.get('post_title', 'No Description')}",
                "platform": platform,
                "backgroundColor": color["backgroundColor"],
                "borderColor": color["borderColor"],
                "imgDesc": imgDesc,
                "capDesc": capDesc
            })
        except KeyError as e:
            print(f"Missing key in Firestore document {doc_id}: {e}")
        except Exception as e:
            print(f"Error processing event {doc_id}: {e}")

    return jsonify(events)

@app.route('/topics_by_day', methods=['GET'])
def topics_by_day():
    # Check if the user is logged in
    if 'user' not in session:
        return redirect('/login')  # Redirect to the login page if not logged in
    
    selected_date = request.args.get('date')  # Get the selected date from the query parameter
    if not selected_date:
        return "No date provided.", 400

    # Fetch topics for the selected date from the database
    connection = sqlite3.connect('content_plan.db')
    cursor = connection.cursor()
    cursor.execute('''
        SELECT post_title, platform, time
        FROM content_plan
        WHERE date = ?
    ''', (selected_date,))
    topics = cursor.fetchall()
    connection.close()

    # Render the topics on a new page
    return render_template('topics_by_day.html', date=selected_date, topics=topics)

if __name__ == '__main__':
    app.run(debug=True)
