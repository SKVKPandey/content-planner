        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 70);
        document.getElementById("datePicker").setAttribute("min", today.toISOString().split('T')[0]);
        document.getElementById("datePicker").setAttribute("max", futureDate.toISOString().split('T')[0]);

        var currentElement;

        function formatDateString(date) {
            // Ensure the input is a valid Date object
            if (!(date instanceof Date) || isNaN(date)) {
                throw new Error('Invalid date provided');
            }
        
            // Extract year, month, and day
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(date.getDate()).padStart(2, '0');
        
            // Format as YYYY-MM-DD
            return `${year}-${month}-${day}`;
        }                
        
        // Format fetched dates on page load
        function formatFetchedDates() {
            const dateElements = document.querySelectorAll('[data-date]');
            dateElements.forEach((element) => {
                const rawDate = element.getAttribute('data-date');
                if (rawDate) {
                    const dateObject = new Date(rawDate);
                    const formattedDate = formatDateString(dateObject);
                    element.innerHTML = formattedDate; // Update the displayed format
                }
            });
        }

        async function handleImgPromptButtonClick() {
            // Get the textarea and input elements
            const textareaElement = document.getElementById('nav-imgDesc'); // Replace with your textarea ID
            const inputElement = document.getElementById('imgDescPrompt'); // Replace with your input ID
            const topicElement = document.getElementById('nav-postTitle'); // Replace with your input ID
        
            // Extract their current values
            const textareaContent = textareaElement.value;
            const inputContent = inputElement.value;
            const topicContent = topicElement.value;
        
            // Prepare data to send to the backend
            const requestData = {
                textarea: textareaContent,
                input: inputContent,
                topic: topicContent
            };
        
            try {
                // Send data to the Flask backend using fetch
                const response = await fetch('/imgDescPrompt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
        
                // Check if the response is successful
                if (response.ok) {
                    const responseData = await response.json(); // Parse JSON response
                    const newTextareaContent = responseData.textarea; // Assuming the Flask function returns the updated content for the textarea
        
                    // Update the textarea with the response
                    textareaElement.value = newTextareaContent;
                } else {
                    console.error('Error: Failed to fetch data from the backend');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        async function handleCapPromptButtonClick() {
            // Get the textarea and input elements
            const textareaElement = document.getElementById('nav-capDesc'); // Replace with your textarea ID
            const inputElement = document.getElementById('capDescPrompt'); // Replace with your input ID
            const topicElement = document.getElementById('nav-postTitle'); // Replace with your input ID
        
            // Extract their current values
            const textareaContent = textareaElement.value;
            const inputContent = inputElement.value;
            const topicContent = topicElement.value;
        
            // Prepare data to send to the backend
            const requestData = {
                textarea: textareaContent,
                input: inputContent,
                topic: topicContent
            };
        
            try {
                // Send data to the Flask backend using fetch
                const response = await fetch('/capDescPrompt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });
        
                // Check if the response is successful
                if (response.ok) {
                    const responseData = await response.json(); // Parse JSON response
                    const newTextareaContent = responseData.textarea; // Assuming the Flask function returns the updated content for the textarea
        
                    // Update the textarea with the response
                    textareaElement.value = newTextareaContent;
                } else {
                    console.error('Error: Failed to fetch data from the backend');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }        

        function openNav(iconElement) {
            const navPanel = document.getElementById('nav-panel');
            const eventDetails = document.getElementById('event-details');
        
            row = iconElement.closest('tr');
        
            // Get the action button in the row
            const actionButton = row.querySelector('.action-btn');
        
            // Fetch data attributes or fallback to table cell values
            const postTitle = actionButton?.dataset.posttitle || row.cells[3].textContent.trim();
            const postPlatform = actionButton?.dataset.postplatform || row.cells[2].textContent.trim();
            const postDate = actionButton?.dataset.postdate || row.querySelector('[data-date]').textContent.trim();
            let postTime = actionButton?.dataset.posttime || row.querySelector('[data-time]').textContent.trim();
            const imgDesc = actionButton?.dataset.imgdesc || ''; // Fetch imgDesc
            const capDesc = actionButton?.dataset.capdesc || ''; // Fetch capDesc
        
            // Convert time from 12-hour to 24-hour format
            if (postTime) {
                const timeParts = postTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
                if (timeParts) {
                    let hours = parseInt(timeParts[1], 10);
                    const minutes = timeParts[2];
                    const period = timeParts[3].toUpperCase();
        
                    if (period === 'PM' && hours < 12) {
                        hours += 12;
                    } else if (period === 'AM' && hours === 12) {
                        hours = 0;
                    }
        
                    postTime = `${String(hours).padStart(2, '0')}:${minutes}`;
                }
            }
        
            // Image Description Section
            const imgDescSection = `
                <div style="width: max-content">
                    <h4><strong>Image Description (Optional)</strong></h4>
                    <textarea id="nav-imgDesc" name="imageDescription" class="styled-textarea" placeholder="Add an optional description here..." rows="6" cols="45">${imgDesc}</textarea>
                    <div class="nav-panel-prompt-div"><input id="imgDescPrompt" class="nav-panel-prompt"></input><i id="promptBtn" onclick="handleImgPromptButtonClick()" class="fas fa-sync"></i></div>
                </div>
            `;
        
            // Caption Description Section
            const capDescSection = `
                <div style="width: max-content">
                    <h4><strong>Caption Description (Optional)</strong></h4>
                    <textarea id="nav-capDesc" name="captionDescription" class="styled-textarea" placeholder="Add an optional description here..." rows="6" cols="45">${capDesc}</textarea>
                    <div class="nav-panel-prompt-div"><input id="capDescPrompt" class="nav-panel-prompt"></input><i id="promptBtn" onclick="handleCapPromptButtonClick()" class="fas fa-sync"></i></div>
                </div>
            `;
        
            // Populate the event details with the fetched data
            eventDetails.innerHTML = `
                <div class="desc-col">
                    <div>
                        <label><strong>Title:</strong></label>
                        <input type="text" id="nav-postTitle" class="styled-input" value="${postTitle}" />
                        <input type="text" id="nav-postPlatform" class="styled-input" value="${postPlatform}" />
                        <input type="date" id="nav-postDate" class="styled-input" value="${postDate}" />
                        <input type="time" id="nav-postTime" class="styled-input" value="${postTime}" />
                    </div>
                    ${imgDescSection}
                    ${capDescSection}
                    <div class="nav-update-btn" onclick="saveEventDetails(row)">
                        <h4>Update</h4>
                    </div>
                </div>
            `;
        
            // Display the navigation panel
            navPanel.style.display = 'block';
        }                                       

        function saveEventDetails(row) {
            // Get updated values from the navigation panel
            const updatedTitle = document.getElementById('nav-postTitle').value.trim();
            const updatedPlatform = document.getElementById('nav-postPlatform').value.trim();
            const updatedDate = document.getElementById('nav-postDate').value;
            const updatedTime = document.getElementById('nav-postTime').value;
            const updatedImgDesc = document.getElementById('nav-imgDesc').value.trim();
            const updatedCapDesc = document.getElementById('nav-capDesc').value.trim();
        
            // Convert time to 12-hour format with AM/PM
            const formattedTime = convertTo12HourFormat(updatedTime);
        
            // Update data attributes in the action button
            const actionButton = row.querySelector('.action-btn');
            if (actionButton) {
                actionButton.dataset.posttitle = updatedTitle;
                actionButton.dataset.postplatform = updatedPlatform;
                actionButton.dataset.postdate = updatedDate;
                actionButton.dataset.posttime = formattedTime;
                actionButton.dataset.imgdesc = updatedImgDesc;
                actionButton.dataset.capdesc = updatedCapDesc;
        
                console.log('Updated Dataset:', {
                    postTitle: actionButton.dataset.posttitle,
                    postPlatform: actionButton.dataset.postplatform,
                    postDate: actionButton.dataset.postdate,
                    postTime: actionButton.dataset.posttime,
                    imgDesc: actionButton.dataset.imgdesc,
                    capDesc: actionButton.dataset.capdesc,
                });
            } else {
                console.error('Action button not found!');
            }
        
            // Update visible table cells
            row.querySelector('[data-date]').textContent = updatedDate;
            row.querySelector('[data-time]').textContent = formattedTime;
            row.cells[2].textContent = updatedPlatform;
            row.cells[3].textContent = updatedTitle;
        
            // Close the navigation panel
            document.getElementById('nav-panel').style.display = 'none';
        }
        
        // Helper function to convert 24-hour time to 12-hour format with AM/PM
        function convertTo12HourFormat(time) {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours, 10);
            const isPM = hour >= 12;
            const formattedHour = isPM ? (hour > 12 ? hour - 12 : hour) : (hour === 0 ? 12 : hour);
            const period = isPM ? 'PM' : 'AM';
            return `${formattedHour}:${minutes} ${period}`;
        }                
        
        // Close the nav panel when the close button is clicked
        document.getElementById('close-nav-panel').onclick = function () {
            document.getElementById('nav-panel').style.display = 'none';
        };        
        
        // Confirm date selection and update the table
        // function confirmDate() {
        //     const selectedDate = document.getElementById('datePicker').value;
        //     if (selectedDate) {
        //         const dateObject = new Date(selectedDate);
        //         const formattedDate = formatDateString(dateObject);
        //         currentElement.innerHTML = formattedDate; // Display the formatted date
        //         currentElement.setAttribute('data-date', selectedDate); // Keep ISO format for server processing
        //     }
        //     closePopup();
        // }
        
        // Initialize the formatting when the page loads
        document.addEventListener('DOMContentLoaded', formatFetchedDates);                     

        function formatTimeString(time) {
            const [hours, minutes] = time.split(':');
            let hour = parseInt(hours, 10);
            const isPM = hour >= 12;
            hour = hour % 12 || 12;
            return `${hour.toString().padStart(2, '0')}:${minutes} ${isPM ? 'PM' : 'AM'}`;
        }

        function showDatePopup(element) {
            // Store the clicked element in currentElement
            currentElement = element;
        
            // Show the popup and overlay
            document.getElementById('overlay').style.display = 'block';
            document.getElementById('datePopup').style.display = 'block';
        }
               
        
        function showTimePopup(element) {
            // Store the clicked element in currentElement
            currentElement = element;

            // Show the popup and overlay
            document.getElementById('overlay').style.display = 'block';
            document.getElementById('timePopup').style.display = 'block';
        }        

        function closePopup() {
            document.getElementById('overlay').style.display = 'none';
            document.getElementById('datePopup').style.display = 'none';
            document.getElementById('timePopup').style.display = 'none';
        }

        function confirmDate() {
            const row = currentElement.parentNode.parentNode;
            const selectedDate = document.getElementById('datePicker').value;
            if (selectedDate && currentElement) {
                const dateObject = new Date(selectedDate);
                currentElement.innerHTML = formatDateString(dateObject);  // Update with new format
                currentElement.setAttribute('data-date', selectedDate);  // Keep ISO format for server processing
            }
        
            const date = row.querySelector('td:nth-child(1) span').getAttribute('data-date');
            const time = row.querySelector('td:nth-child(2) span').getAttribute('data-time');
            const platform = row.querySelector('td:nth-child(3)').innerText.trim();
            const postData = [date, time, platform];

            console.log(postData);
            closePopup();
        }        
            
        
        function confirmTime() {
            const selectedTime = document.getElementById('timePicker').value;
            if (selectedTime) {
                currentElement.innerHTML = formatTimeString(selectedTime);  // Update the clicked <span>
                currentElement.setAttribute('data-time', selectedTime);  // Update the 'data-time' attribute
            }
            closePopup();
        }        

        function addRow() {
            const table = document.getElementById("contentTable").getElementsByTagName("tbody")[0];
            const newRow = table.insertRow();
            const todayFormatted = formatDateString(today);
            newRow.innerHTML = `<td><span data-date="${today.toISOString().split('T')[0]}">${todayFormatted}</span></td>
                                <td><span data-time="12:00">12:00 PM</span></td>
                                <td></td>
                                <td></td>
                                <td>
                                <span class="action-btn" onclick="openNav(this)"
                                data-postTitle="" 
                                data-postPlatform="" 
                                data-postDate="" 
                                data-postTime="" 
                                data-imgDesc="" 
                                data-capDesc=""
                                ><i class="fas fa-edit"></i></span>
                                <span class="action-btn" onclick="deleteRow(this)"><i class="fas fa-trash-alt"></i></span></td>`;
        }

        function sanitizeIdentity(identity) {
            // Function to replace emojis
            function replaceEmoji(str, replace = '') {
                // Regex pattern for matching emojis
                const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
                return str.replace(emojiRegex, replace);
            }
        
            // Replace emojis with an empty string or a placeholder
            identity = replaceEmoji(identity, '');
        
            // Replace invalid characters with allowed substitutes
            identity = identity.replace(/:/g, '-')
                               .replace(/\./g, '-')
                               .replace(/ /g, '')
                               .replace(/\//g, '-');
        
            // Remove special characters not allowed in Firestore paths
            identity = identity.replace(/[~#\[\]*]/g, '');
        
            // Remove leading or trailing spaces
            identity = identity.trim();
        
            return identity;
        }        

        function deleteRow(btn) {
            const row = btn.parentNode.parentNode;
            row.parentNode.removeChild(row);
        
            const date = row.querySelector('td:nth-child(1) span').getAttribute('data-date');
            const time = row.querySelector('td:nth-child(2) span').getAttribute('data-time');
            const platform = row.querySelector('td:nth-child(3)').innerText.trim();
            const postData = [date, time, platform];

            console.log(postData);
        
            // Send the delete request to the backend
            fetch('/delete_content_plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postData: postData
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    console.log(data.message);  // Success message
                } else {
                    console.error(data.error);  // Error message
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }        

        function saveContentPlan() {
            const rows = document.querySelectorAll('#contentTable tbody tr');
            const data = [];
            let isValid = true;
        
            rows.forEach(row => {
                const uniquePostID = row.getAttribute('id');
                const date = row.querySelector('td:nth-child(1) span').getAttribute('data-date');
                const time = row.querySelector('td:nth-child(2) span').getAttribute('data-time');
                const platform = row.querySelector('td:nth-child(3)').innerText.trim();
                const postTitle = row.querySelector('td:nth-child(4)').innerText.trim();
                const imgDesc = row.querySelector('td:nth-child(5) span').getAttribute('data-imgdesc');
                const capDesc = row.querySelector('td:nth-child(5) span').getAttribute('data-capdesc');

                console.log(row.querySelector('td:nth-child(5) span'));
                console.log(imgDesc);
        
                // Check if any cell is empty
                if (!date || !time || !platform || !postTitle) {
                    isValid = false;
                    row.style.backgroundColor = "#f8d7da"; // Highlight invalid rows
                } else {
                    row.style.backgroundColor = ""; // Reset background color for valid rows
                    data.push({ uniquePostID, date, time, platform, postTitle, imgDesc, capDesc });
                }
            });
        
            if (isValid) {
                // Send the data to the backend
                fetch('/save_content_plan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                })
                .then(response => response.json())
                .then(result => {
                    if (result.message) {
                        console.log(result.message);
        
                        // Display the success message
                        let saveButton = document.querySelector('.action-buttons button:first-child');
                        let successMessage = document.getElementById('successMessage');
                        
                        if (!successMessage) {
                            successMessage = document.createElement('span');
                            successMessage.id = 'successMessage';
                            successMessage.style.marginLeft = '10px';
                            successMessage.style.color = 'green';
                            successMessage.textContent = 'Saved to calendar!';
                            saveButton.parentNode.appendChild(successMessage);
                        }
        
                        // Show the message briefly
                        successMessage.style.display = 'inline';
                        setTimeout(() => {
                            successMessage.style.display = 'none';
                        }, 3000);
                    } else if (result.error) {
                        console.error(result.error);
                        alert(`Error: ${result.error}`);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to save content plan.');
                });
            } else {
                console.log('Invalid data, please fix highlighted rows.');
            }
        }                
        

        // Function to redirect to the calendar view
        function showCalendar() {
            window.location.href = '/calendarView';
        }