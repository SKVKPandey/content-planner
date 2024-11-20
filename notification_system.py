import sqlite3
from datetime import datetime

# Check and send notifications
def check_and_send_notifications():
    print("Scheduler running check_and_send_notifications")  # Debugging line
    connection = sqlite3.connect('content_plan.db')
    cursor = connection.cursor()

    # Get the current date and time
    now = datetime.now()
    
    # Format the date as 'YYYY-MM-DD' and time as 'HH:MM'
    formatted_date = now.strftime("%Y-%m-%d")
    formatted_time = now.strftime("%H:%M")
    
    print(f"Checking for posts scheduled at {formatted_date} {formatted_time}")  # Debugging line
    
    # Query database for posts scheduled within the current minute
    cursor.execute('''
        SELECT post_title, platform FROM content_plan
        WHERE date = ? AND time = ?
    ''', (formatted_date, formatted_time))

    posts = cursor.fetchall()
    print(f"Found posts to notify: {posts}")  # Debugging line
    connection.close()

    # Send notifications for each scheduled post
    for post in posts:
        post_title, platform = post
        send_notification(post_title, platform)

# Function to send notification
def send_notification(post_title, platform):
    print(f"Notification: Scheduled Post '{post_title}' for {platform} is live now!")