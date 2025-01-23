document.addEventListener("DOMContentLoaded", () => {
    let currentQuestionIndex = 0;
    const questions = document.querySelectorAll(".question");
    const nextButton = document.getElementById("nextBtn");
    const backButton = document.getElementById("backBtn");
    const submitButton = document.getElementById("submitBtn");

    // Toggle the Others input field based on selection
const toggleOthersInput = (checkboxGroupName) => {
const checkboxes = document.querySelectorAll(`input[name="${checkboxGroupName}"]`);
const othersOption = document.querySelector(`input[name="${checkboxGroupName}_others"]`);
const othersInput = document.querySelector(`input.others-input[name="${checkboxGroupName}_others"]`);

checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
        if (e.target.classList.contains("others-option")) {
            // If "Others" is selected
            if (e.target.checked) {
                // Uncheck all other checkboxes
                checkboxes.forEach((cb) => {
                    if (!cb.classList.contains("others-option")) cb.checked = false;
                });
                // Show the input field for "Others"
                othersInput.style.display = "block";
                othersInput.required = true;
            } else {
                // Hide the input field for "Others"
                othersInput.style.display = "none";
                othersInput.value = "";
                othersInput.required = false;
            }
        } else {
            // If any other checkbox is clicked
            const othersCheckbox = document.querySelector(`input[name="${checkboxGroupName}"].others-option`);
            othersCheckbox.checked = false;
            othersInput.style.display = "none";
            othersInput.value = "";
            othersInput.required = false;
        }
            });
        });
    };

    // Apply to each question group with "Others" option
    toggleOthersInput("goal");
    toggleOthersInput("audience");

    // Function to enable/disable the Next/Generate button
    function validateInput() {
        const currentQuestion = questions[currentQuestionIndex];
        const inputs = currentQuestion.querySelectorAll("input");
        let isValid = false;
    
        inputs.forEach((input) => {
            if (
                (input.type === "radio" || input.type === "checkbox") &&
                input.checked
            ) {
                isValid = true;
            } else if (
                (input.type === "text" || input.type === "number" || input.type === "date") &&
                input.value.trim() !== ""
            ) {
                isValid = true;
            }
        });
    
        nextButton.disabled = !isValid;
    
        // Update button style based on validation and state
        if (isValid) {
            nextButton.style.backgroundColor =
                nextButton.innerHTML === "Generate" ? "#DC143C" : "#fff";
            nextButton.style.cursor = "pointer";
        } else {
            nextButton.style.backgroundColor = "#cccccc";
            nextButton.style.cursor = "not-allowed";
        }
    }            

    function showQuestion(index) {
        questions.forEach((q, i) => {
            console.log(q);
            // Set display to block for the current question and none for others
            if (i === index) {
                q.style.display = "block";
                console.log(`Question ${i + 1} active: true`);
            } else {
                q.style.display = "none";
                console.log(`Question ${i + 1} active: false`);
            }
        });
    
        // Update the button text and style for the last question
        if (index === questions.length - 1) {
            nextButton.innerHTML = "Generate";
            nextButton.style.backgroundColor = "#DC143C";
        } else {
            nextButton.innerHTML = "Next";
            nextButton.style.backgroundColor = "#fff";
        }
    
        validateInput();
    }     

    function showGif() {
        // Hide the form and buttons
        document.querySelector('h1').style.display = 'none';
        document.querySelector('form').style.display = 'none';
        
        // Create a div for the gif
        const gifContainer = document.createElement('div');
        gifContainer.id = 'gifContainer';
        gifContainer.style.position = 'absolute';
        gifContainer.style.top = '50%';
        gifContainer.style.left = '50%';
        gifContainer.style.transform = 'translate(-50%, -50%)';
        gifContainer.style.zIndex = '1000';  // Ensure it appears on top of other elements
    
        // Create an image element for the gif
        const gif = document.createElement('img');
        gif.src = 'static/images/writing.gif'; // Replace with your gif URL
        gif.alt = 'Loading...';
    
        // Append the gif to the container
        gifContainer.appendChild(gif);
        
        // Append the gif container to the body
        document.body.appendChild(gifContainer);
    }
    
    // Handle "Next" or "Generate" button click
    nextButton.addEventListener("click", () => {
        console.log("Next button clicked");
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            console.log("Current question index:", currentQuestionIndex);
            showQuestion(currentQuestionIndex);
        } else {
            document.querySelector("form").submit();
            showGif();
        }
    });    

    backButton.addEventListener("click", () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    // Toggle the collapsible section
    document.querySelector('.collapsible-btn').addEventListener('click', function () {
        const content = document.querySelector('.description-content');
        content.style.display = content.style.display === 'none' || content.style.display === '' ? 'block' : 'none';
    });

    // Add event listeners to inputs for validation
    questions.forEach((question) => {
        const inputs = question.querySelectorAll("input");

        inputs.forEach((input) => {
            input.addEventListener("input", validateInput);
            input.addEventListener("change", validateInput);
        });
    });

    // Initialize the first question display
    showQuestion(currentQuestionIndex);

    // Get today's date and the date 70 days from now
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 30);

    // Format the date in YYYY-MM-DD format
    const todayFormatted = today.toISOString().split("T")[0];
    const futureDateFormatted = futureDate.toISOString().split("T")[0];

    // Set the min, max, and default values for the date input fields
    const startDateInput = document.getElementById("start_date");
    const endDateInput = document.getElementById("end_date");

    startDateInput.setAttribute("min", todayFormatted);
    startDateInput.setAttribute("max", futureDateFormatted);
    startDateInput.value = todayFormatted; // Set default value

    endDateInput.setAttribute("min", todayFormatted);
    endDateInput.setAttribute("max", futureDateFormatted);
    endDateInput.value = futureDateFormatted; // Set default value

    document.querySelector("[name='frequency']").value = 2;
    document.querySelector("[name='goal'][value='Increase Engagement']").checked = true;
    document.querySelector("[name='audience'][value='Youth']").checked = true;
    document.querySelector("[name='platforms'][value='Instagram']").checked = true;
});