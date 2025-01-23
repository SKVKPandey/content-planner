function genImgDesc(element) {
    // Get the parent element's context
    const parentNode = element.parentNode.parentNode.parentNode.parentNode;
    const parentId = parentNode.id;

    fetch(`/generateImageDescription?id=${parentId}`, {
        method: 'GET',
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch image description.');
        }
        return response.json(); // Parse the response as JSON
    })
    .then(data => {
        if (data && data.description) {
            console.log('Image description response:', data);
            const textarea = parentNode.querySelector('textarea[name="imageDescription"]');
            if (textarea) {
                textarea.value = data.description;
            } else {
                console.error('Image description textarea not found.');
            }
        } else {
            console.error('No description received.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}    

function genCapDesc(element) {
    // Get the parent element's context
    const parentNode = element.parentNode.parentNode.parentNode.parentNode;
    const parentId = parentNode.id;

    // Send the ID to the Flask GET function
    fetch(`/generateCaptionDescription?id=${parentId}`, {
        method: 'GET',
    })
    .then(response => {
        if (response.ok) {
            return response.json(); // Parse the response as JSON
        } else {
            console.error('Failed to fetch caption description.');
        }
    })
    .then(data => {
        if (data && data.description) {
            console.log('Caption description response:', data);

            // Find the corresponding text area and set its value
            const textarea = parentNode.querySelector('textarea[name="captionDescription"]');
            if (textarea) {
                textarea.value = data.description;
            } else {
                console.error('Caption description textarea not found.');
            }
        }
    })
    .catch(error => console.error('Error:', error));
}

$(document).ready(function () {
    let checkboxesVisible = false; // Flag to track checkbox visibility

    // Function to update the state of the GenWindow button
    function updateGenWindowButtonState() {
        const anyCheckboxChecked = $('.event-checkbox:checked').length > 0;
        $('#gen-window').prop('disabled', !anyCheckboxChecked);

        // Change button color based on the disabled state
        if (anyCheckboxChecked) {
            $('#gen-window').removeClass('disabled-button');
        } else {
            $('#gen-window').addClass('disabled-button');
        }
    }

    // Show dialog box when GenWindow button is clicked
    $('#gen-window').on('click', function () {
        $('#dialog-box').fadeIn();
    });

    // Close the dialog box when the close button or action button is clicked
    $('#cancel-preferences, #dialog-action').on('click', function () {
        $('#dialog-box').fadeOut();
    });

    // Event handler for closing the nav panel
    $('#close-nav-panel').on('click', function () {
        $('#nav-panel').hide();
    });

    // Update FullCalendar configuration
    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        events: function (start, end, timezone, callback) {
            $.ajax({
                url: '/get_events',
                method: 'GET',
                success: function (data) {
                    callback(data);
                },
                error: function () {
                    alert('Failed to load events.');
                }
            });
        },
        dayClick: function (date, jsEvent, view) {
            if (!checkboxesVisible) {
                const cell = $(jsEvent.target).closest('.fc-day, .fc-day-top');
                if (cell.hasClass('has-event')) {
                    const formattedDate = date.format('YYYY-MM-DD');
                    window.location.href = `/topics_by_day?date=${formattedDate}`;
                }
            }
        },
        eventRender: function (event, element) {
            // Add title tooltip for events
            element.attr('title', event.description);

            // Add a class to the cell containing the event
            const eventDate = moment(event.start).format('YYYY-MM-DD');
            const cell = $(`.fc-day[data-date="${eventDate}"], .fc-day-top[data-date="${eventDate}"]`);
            cell.addClass('has-event').css('background-color', 'violet');
        },
        timeFormat: 'HH:mm',
        droppable: true,

        

        // New eventClick handler
        eventClick: function (event, jsEvent, view) {
            // Populate the nav panel with event details
            console.log(event.imgDesc);
            $('#event-details').html(`
                <div id="${event.uniquePostID}">
                    <div class="desc-col">
                        <div>
                            <p><h4><strong>Title:</strong> ${event.title}</h4></p>
                            <p><h4><strong>Date:</strong> ${event.platform}</h4></p>
                            <p><h4><strong>Date:</strong> ${event.date}</h4></p>
                            <p><h4><strong>Time:</strong> ${event.time}</h4></p>
                        </div>
                        <div style="width: max-content">
                            <h4><strong>Image Description (Optional)</strong></h4>
                            <textarea name="imageDescription" readOnly="true" class="styled-textarea" rows="6" cols="40">${event.imgDesc}</textarea>
                        </div>
                        <div style="width: max-content">
                            <h4><strong>Caption Description (Optional)</strong></h4>
                            <textarea name="captionDescription" readOnly="true" class="styled-textarea" rows="6" cols="40">${event.capDesc}</textarea>
                        </div>
                    </div>
                </div>
            `);

            // Show the nav panel
            $('#nav-panel').show();
        }
    });

    function contentPlanner() {
        $.ajax({
            url: 'contentPlanner',
            type: 'GET',
            success: function(response) {
                // Handle successful response if needed
                window.location.href = 'contentPlanner';
            },
            error: function(error) {
                // Handle error if needed
                console.error('An error occurred:', error);
            }
        });
    }    

    // Function to attach the "Select" button click handler
    function attachSelectButtonHandler() {
        $('#select-toolbar button').off('click').on('click', function () {
            if (!checkboxesVisible) {
                // Show checkboxes and replace button with "Select All" and cross icon
                $('.fc-event').each(function () {
                    if ($(this).find('.event-checkbox').length === 0) {
                        const checkbox = $('<input>', {
                            type: 'checkbox',
                            class: 'event-checkbox',
                            style: 'position: absolute; top: 5px; left: 5px; z-index: 1000;'
                        });
                        $(this).css('position', 'relative').prepend(checkbox);
                    }
                });

                // Replace the "Select" button
                $(this).replaceWith(`
                    <button id="select-all">Select All</button>
                    <i id="close-icon" class="fas fa-times" style="cursor: pointer; margin-left: 10px;"></i>
                `);

                checkboxesVisible = true;

                // Attach handlers for "Select All" and close icon
                $('#select-all').on('click', function () {
                    $('.event-checkbox').prop('checked', true);
                    updateGenWindowButtonState();
                });

                $('#close-icon').on('click', function () {
                    resetToNormalState();
                });

                // Monitor checkbox changes to update the GenWindow button
                $('.event-checkbox').on('change', updateGenWindowButtonState);
            }
        });
    }

    document.getElementById("submit-preferences").addEventListener("submit", (event) => {
        event.preventDefault(); // Prevent the default form submission behavior
    
        // Collect form data
        const tone = document.getElementById("tone").value;
        const language = document.getElementById("language").value;
        const includeEmoji = document.getElementById("include-emoji").checked;
        const includeImage = document.getElementById("include-image").checked;
        const formalityLevel = document.getElementById("formality-level").value;
        let wordCount = document.getElementById("word-count").value;
        const targetAudience = document.getElementById("target-audience").value;
    
        // Validation: Ensure required fields are filled
        if (!tone || !language || !targetAudience) {
            alert("Please fill out all required fields.");
            return;
        }
    
        // Set default value for word count if not provided
        if (!wordCount) {
            wordCount = 200;
        }
    
        // Prepare the data to send
        const formData = {
            tone: tone,
            language: language,
            include_emoji: includeEmoji,
            include_image: includeImage,
            formality_level: formalityLevel,
            word_count: parseInt(wordCount, 10), // Ensure word count is an integer
            target_audience: targetAudience,
        };
    
        // Send data to Flask server using Fetch API
        fetch("/submit_preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData), // Convert data to JSON string
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to submit preferences.");
                }
                return response.json();
            })
            .then((data) => {
                alert("Preferences submitted successfully!");
                console.log(data); // Log server response
                // Optionally close the dialog box
                document.getElementById("dialog-box").style.display = "none";
            })
            .catch((error) => {
                alert("An error occurred: " + error.message);
                console.error(error);
            });
    });    

    // Function to reset the state to normal
    function resetToNormalState() {
        $('.event-checkbox').remove(); // Remove all checkboxes
        checkboxesVisible = false;

        // Replace "Select All" and close icon with the original "Select" button
        $('#select-all, #close-icon').remove();
        $('#select-toolbar').append('<button>Select</button>');

        // Disable the GenWindow button
        $('#gen-window').prop('disabled', true).addClass('disabled-button');

        // Reattach the "Select" button event handler
        attachSelectButtonHandler();
    }

    // Attach the initial "Select" button handler
    attachSelectButtonHandler();

    // Initially disable the GenWindow button and add gray color
    $('#gen-window').prop('disabled', true).addClass('disabled-button');

    // Edit icon click event handler
    $('#edit-icon').on('click', function () {
        const currentView = $('#calendar').fullCalendar('getView');
        const currentYear = currentView.intervalStart.year();
        const currentMonth = currentView.intervalStart.month() + 1;

        window.location.href = `/content_plan_table?year=${currentYear}&month=${currentMonth}`;
    });
});
